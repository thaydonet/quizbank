import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { CacheManager } from '../services/cacheManager';
import { NavigationService, type User } from '../services/navigationService';
import AuthForm from './AuthForm';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // Which roles can access this route
  requireAuth?: boolean; // Whether authentication is required
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles = ['teacher', 'student'], 
  requireAuth = true 
}: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    let authCheckTimeout: NodeJS.Timeout;
    let initializationTimeout: NodeJS.Timeout;

    const checkAuth = async () => {
      try {
        // Clear any previous auth state first
        setUser(null);
        setAccessDenied(false);
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          if (requireAuth) {
            setShowAuthModal(true);
          }
          setLoading(false);
          setInitialized(true);
          return;
        }

        if (!session?.user) {
          if (requireAuth) {
            setShowAuthModal(true);
          }
          setLoading(false);
          setInitialized(true);
          return;
        }

        // Get user data including role with retry mechanism
        let userData = null;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts && !userData && isMounted) {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (error) {
            console.error(`User data fetch error (attempt ${attempts + 1}):`, error);
            attempts++;
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
            }
          } else {
            userData = data;
            break;
          }
        }

        if (!isMounted) return;

        if (userData) {
          setUser(userData);
          
          // Use NavigationService to check permissions
          if (!NavigationService.hasRoutePermission(userData, location.pathname)) {
            setAccessDenied(true);
            authCheckTimeout = setTimeout(() => {
              if (isMounted) {
                NavigationService.handlePostLoginNavigation(
                  userData, 
                  navigate, 
                  location.pathname, 
                  allowedRoles
                );
              }
            }, 3000);
            setLoading(false);
            setInitialized(true);
            return;
          }
        } else {
          // If we couldn't get user data after retries, show auth modal
          if (requireAuth) {
            setShowAuthModal(true);
          }
        }

        setLoading(false);
        setInitialized(true);
      } catch (error) {
        console.error('Auth check error:', error);
        if (isMounted) {
          setLoading(false);
          setInitialized(true);
          if (requireAuth) {
            setShowAuthModal(true);
          }
        }
      }
    };

    // Chỉ gọi checkAuth nếu chưa initialized để tránh vòng lặp
    const initTimeout = setTimeout(() => {
      if (isMounted && !initialized) {
        checkAuth();
      }
    }, 100);

    // Add a maximum timeout to prevent infinite loading
    initializationTimeout = setTimeout(() => {
      if (isMounted && !initialized) {
        console.warn('Authentication check timed out, performing cache cleanup');
        
        // Mark as stuck and clear cache
        sessionStorage.setItem('auth_stuck', 'true');
        CacheManager.clearSupabaseCache();
        
        setLoading(false);
        setInitialized(true);
        if (requireAuth) {
          setShowAuthModal(true);
        }
      }
    }, 10000); // 10 second timeout

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log('Auth state change:', event, session?.user?.id);

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userData && isMounted) {
            setUser(userData);
            setShowAuthModal(false);
            setAccessDenied(false);
            setLoading(false);
            setInitialized(true);
            
            // Use NavigationService to handle smart post-login navigation
            if (NavigationService.hasRoutePermission(userData, location.pathname)) {
              // User has permission for current route, stay here
              console.log(`User ${userData.role} authorized for ${location.pathname}`);
            } else {
              // User doesn't have permission, show access denied or redirect
              setAccessDenied(true);
              authCheckTimeout = setTimeout(() => {
                if (isMounted) {
                  NavigationService.handlePostLoginNavigation(
                    userData, 
                    navigate, 
                    location.pathname, 
                    allowedRoles
                  );
                }
              }, 3000);
            }
          }
        } catch (error) {
          console.error('Error fetching user data on sign in:', error);
          if (isMounted) {
            setShowAuthModal(true); // Show auth modal again if there's an error
          }
        }
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null);
          setAccessDenied(false);
          setInitialized(true);
          if (requireAuth) {
            setShowAuthModal(true);
          }
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // Token was refreshed, but we don't need to do anything special
        console.log('Token refreshed successfully');
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(initTimeout);
      clearTimeout(initializationTimeout);
      if (authCheckTimeout) {
        clearTimeout(authCheckTimeout);
      }
      subscription.unsubscribe();
    };
  }, [allowedRoles, requireAuth, navigate, initialized]);

  if (loading && !initialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">Đang kiểm tra quyền truy cập...</p>
          {/* Show retry button after 5 seconds */}
          <button 
            onClick={() => {
              // Clear cache and retry
              CacheManager.clearSupabaseCache();
              sessionStorage.removeItem('auth_stuck');
              setLoading(false);
              setInitialized(true);
              if (requireAuth) {
                setShowAuthModal(true);
              }
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-sm mr-2"
          >
            Thử lại
          </button>
          <button 
            onClick={() => {
              CacheManager.forceRefresh();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Truy cập bị từ chối!</strong>
            <p className="block sm:inline mt-2">
              Bạn không có quyền truy cập trang này với vai trò hiện tại.
            </p>
          </div>
          <p className="text-gray-600 text-sm">
            Bạn sẽ được chuyển hướng về trang chủ trong 3 giây...
          </p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Về trang chủ ngay
          </button>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {showAuthModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-center">Yêu cầu đăng nhập</h3>
                <p className="text-sm text-gray-600 text-center mt-1">
                  Bạn cần đăng nhập để truy cập trang này
                </p>
              </div>
              <AuthForm 
                mode="login" 
                onClose={() => {
                  setShowAuthModal(false);
                  // Don't navigate away - let the user stay on their intended route
                  // The auth state change will handle showing the protected content
                }} 
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}