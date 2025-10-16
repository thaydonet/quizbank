import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import BookOpenIcon from '../components/icons/BookOpenIcon';
import SparklesIcon from '../components/icons/SparklesIcon';
import PlayCircleIcon from '../components/icons/PlayCircleIcon';
import AuthForm from '../components/AuthForm';

interface User {
  id: string;
  email: string;
  role: string;
}

interface Feature {
  icon: React.ReactElement;
  title: string;
  description: string;
  link: string;
  color: string;
  adminOnly?: boolean;
}

const HomePage: React.FC = () => {
  const [showAuth, setShowAuth] = useState<'login' | 'register' | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Memoize the redirect function to prevent infinite loops
  const redirectStudent = useCallback((role: string) => {
    if (role === 'student') {
      navigate('/online-exam');
    }
  }, [navigate]);

  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts
    
    // Check current session
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (session?.user) {
          // Get user role from users table
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (!isMounted) return;
          
          if (userData) {
            setUser(userData);
            // Redirect students to online exam page
            redirectStudent(userData.role);
          }
        }
        
        if (isMounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking user session:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (!isMounted) return;
          
          if (userData) {
            setUser(userData);
            // Redirect students to online exam page
            redirectStudent(userData.role);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [redirectStudent]); // Only depend on redirectStudent, not navigate directly
  // Teacher features (only for teachers)
  const teacherFeatures: Feature[] = [
    {
      icon: <BookOpenIcon className="w-12 h-12 text-indigo-600" />,
      title: "Ngân hàng Quiz Toán",
      description: "Quản lý và tạo bài thi từ kho câu hỏi phong phú",
      link: "/quiz-bank",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: <SparklesIcon className="w-12 h-12 text-purple-600" />,
      title: "Tạo câu hỏi từ AI",
      description: "Sử dụng AI để tạo câu hỏi chất lượng cao",
      link: "/create",
      color: "from-purple-500 to-violet-600"
    },
    {
      icon: (
        <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "Kết quả học sinh",
      description: "Xem và quản lý kết quả thi của học sinh",
      link: "/teacher-results",
      color: "from-emerald-500 to-green-600"
    },
    {
      icon: <PlayCircleIcon className="w-12 h-12 text-green-600" />,
      title: "Quản lý Admin",
      description: "Tạo mã mời cho giáo viên mới",
      link: "/admin",
      color: "from-green-500 to-emerald-600",
      adminOnly: true
    }
  ];

  // Public features (for non-authenticated users)
  const publicFeatures: Feature[] = [
    {
      icon: <BookOpenIcon className="w-12 h-12 text-indigo-600" />,
      title: "Ngân hàng Quiz Toán",
      description: "Kho tàng câu hỏi toán học phong phú từ lớp 10-12, được phân loại theo chủ đề và độ khó",
      link: "/quiz-bank",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: <PlayCircleIcon className="w-12 h-12 text-green-600" />,
      title: "Thi Online",
      description: "Hệ thống thi trực tuyến với giao diện thân thiện, chấm điểm tự động và kết quả chi tiết",
      link: "/online-exam",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: <SparklesIcon className="w-12 h-12 text-purple-600" />,
      title: "Tạo câu hỏi từ AI",
      description: "Công nghệ AI tiên tiến giúp tạo câu hỏi toán học chất lượng cao theo yêu cầu",
      link: "/create",
      color: "from-purple-500 to-violet-600"
    }
  ];

  const features = user?.role === 'teacher' ? teacherFeatures : publicFeatures;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-500" onClick={() => setShowAuth(null)}>&times;</button>
            <AuthForm mode={showAuth} onClose={() => setShowAuth(null)} />
          </div>
        </div>
      )}
      {/* Nút đăng nhập/đăng ký - chỉ hiện khi chưa đăng nhập */}
      {!user && (
        <div className="flex justify-end gap-4 p-4">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded font-semibold hover:bg-indigo-700" onClick={() => setShowAuth('login')}>Đăng nhập</button>
          <button className="px-4 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700" onClick={() => setShowAuth('register')}>Đăng ký</button>
        </div>
      )}
      
      {/* Teacher Welcome Banner */}
      {user?.role === 'teacher' && (
        <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-6">
          <div className="container mx-auto px-6">
            <div className="text-center">
              <h2 className="text-2xl lg:text-3xl font-bold mb-2">
                Chào mừng Giáo viên {user.email.split('@')[0]}!
              </h2>
              <p className="text-indigo-100 text-lg">
                Bạn đang sử dụng hệ thống với quyền Giáo viên. Hãy khám phá các tính năng dành riêng cho bạn.
              </p>
              <div className="mt-4 flex justify-center gap-4">
                <Link 
                  to="/create" 
                  className="px-6 py-2 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Tạo câu hỏi AI
                </Link>
                <Link 
                  to="/teacher-results" 
                  className="px-6 py-2 bg-purple-700 text-white rounded-lg font-semibold hover:bg-purple-800 transition-colors"
                >
                  Kết quả học sinh
                </Link>
                {user.email === 'lvdoqt@gmail.com' && (
                  <Link 
                    to="/admin" 
                    className="px-6 py-2 bg-purple-700 text-white rounded-lg font-semibold hover:bg-purple-800 transition-colors"
                  >
                    Quản lý Admin
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10"></div>
        <div className="relative container mx-auto px-6 py-8 lg:py-12">
          <div className="text-center max-w-5xl mx-auto">
            {user ? (
              <>
                <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                  {user.role === 'teacher' ? 'Bảng Điều Khiển Giáo Viên' : 'Hệ Thống Học Tập'}
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                    Toán AI
                  </span>
                </h1>
                <p className="text-md lg:text-lg text-gray-600 mb-6 leading-relaxed max-w-3xl mx-auto">
                  {user.role === 'teacher' 
                    ? 'Quản lý, tạo và phân phối câu hỏi toán học với công nghệ AI tiên tiến'
                    : 'Nền tảng học tập toán học thông minh dành cho học sinh THPT'
                  }
                  <br />
                  <span className="text-indigo-600 font-semibold">
                    {user.role === 'teacher' 
                      ? 'Tạo câu hỏi • Quản lý thi cử • Phân tích kết quả'
                      : 'Học tập hiệu quả • Thi cử thuận tiện • Công nghệ AI'
                    }
                  </span>
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                  Ngân Hàng Câu Hỏi
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                    Toán AI
                  </span>
                </h1>
                <p className="text-md lg:text-lg text-gray-600 mb-6 leading-relaxed max-w-3xl mx-auto">
                  Nền tảng học tập toán học thông minh dành cho học sinh THPT
                  <br />
                  <span className="text-indigo-600 font-semibold">Học tập hiệu quả • Thi cử thuận tiện • Công nghệ AI</span>
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 lg:py-10 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="text-center mb-8 lg:mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              {user?.role === 'teacher' ? 'Công cụ dành cho Giáo viên' : 'Tính năng nổi bật'}
            </h2>
            <p className="text-md lg:text-lg text-gray-600 max-w-3xl mx-auto">
              {user?.role === 'teacher' 
                ? 'Các công cụ mạnh mẽ hỗ trợ việc giảng dạy và quản lý câu hỏi'
                : 'Hệ thống toàn diện hỗ trợ việc học và giảng dạy toán học một cách hiệu quả nhất'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features
              .filter(feature => {
                // Filter admin-only features
                if (feature.adminOnly && user?.email !== 'lvdoqt@gmail.com') {
                  return false;
                }
                return true;
              })
              .map((feature, index) => (
              <Link
                key={index}
                to={feature.link}
                className="group relative bg-white rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 hover:border-indigo-200"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
                <div className="relative text-center">
                  <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300 flex justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    {feature.description}
                  </p>
                  <div className="flex items-center justify-center text-indigo-600 font-semibold text-sm group-hover:text-indigo-700">
                    <span>Trải nghiệm ngay</span>
                    <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;