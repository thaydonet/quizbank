import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import AuthForm from './AuthForm';
import ApiKeyIndicator from './ApiKeyIndicator';
import SparklesIcon from './icons/SparklesIcon';

interface User {
  id: string;
  email: string;
  role: string;
  student_name?: string;
}

const Header: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Get user role from users table
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (userData) {
          setUser(userData);
        }
      }
      setLoading(false);
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (userData) {
          setUser(userData);
        }
        setShowAuthForm(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const openAuthForm = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthForm(true);
  };

  return (
    <>
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-indigo-600">
                Math Quiz <span className="text-gray-800">Bank AI</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              ) : user ? (
                <>
                  {/* Role-based navigation menu */}
                  <div className="hidden md:flex items-center space-x-3">
                    {user.role === 'teacher' && (
                      <>
                        <Link
                          to="/quiz-bank"
                          className="px-3 py-1 text-sm text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        >
                          Ngân hàng đề
                        </Link>
                        <Link
                          to="/create"
                          className="px-3 py-1 text-sm text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        >
                          Tạo câu hỏi AI
                        </Link>
                        {/* API Key Indicator removed as per requirements */}
                      </>
                    )}
                    <Link
                      to="/online-exam"
                      className="px-3 py-1 text-sm text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    >
                      Thi online
                    </Link>
                  </div>
                  
                  <div className="text-sm text-gray-600 text-right">
                    <div className="font-medium">
                      {user.role === 'student' && user.student_name 
                        ? user.student_name 
                        : user.email
                      }
                    </div>
                    <div className={`text-xs px-2 py-1 rounded inline-block mt-1 ${
                      user.role === 'teacher' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                    </div>
                  </div>
                  {user.role === 'teacher' && user.email === 'lvdoqt@gmail.com' && (
                    <Link 
                      to="/admin" 
                      className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                    >
                      Quản lý Admin
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => openAuthForm('login')}
                    className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => openAuthForm('register')}
                    className="px-3 py-1 border border-indigo-600 text-indigo-600 rounded text-sm hover:bg-indigo-50"
                  >
                    Đăng ký
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      {showAuthForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <AuthForm 
              mode={authMode} 
              onClose={() => setShowAuthForm(false)} 
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Header;