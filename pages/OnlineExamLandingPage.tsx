import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PlayCircleIcon from '../components/icons/PlayCircleIcon';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';
import BookOpenIcon from '../components/icons/BookOpenIcon';
import { QuizService, type SavedQuiz } from '../services/quizService';
import { SupabaseQuizService, type SupabaseQuiz } from '../services/supabaseQuizService';
import { QuizSubmissionService, type QuizSubmissionStats } from '../services/quizSubmissionService';
import { supabase } from '../services/supabaseClient';

const OnlineExamLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>([]);
  const [supabaseQuizzes, setSupabaseQuizzes] = useState<SupabaseQuiz[]>([]);
  const [studentResults, setStudentResults] = useState<QuizSubmissionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadQuizzes = async () => {
      if (initialized) return; // Prevent multiple initializations
      
      try {
        setError(null);
        
        // Load localStorage quizzes first (synchronous)
        const localQuizzes = QuizService.getAllQuizzes();
        if (isMounted) {
          setSavedQuizzes(localQuizzes);
        }
        
        // Get current user with timeout
        const userPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Auth timeout')), 5000);
        });
        
        const { data: { user } } = await Promise.race([userPromise, timeoutPromise]) as any;
        
        if (isMounted) {
          setCurrentUser(user);
          
          // Load data regardless of authentication status
          // If user exists, load their personal results
          if (user) {
            // Load student's previous results if they are a student
            const { data: userData } = await supabase
              .from('users')
              .select('role')
              .eq('id', user.id)
              .single();
            
            if (userData?.role === 'student') {
              const resultsResponse = await QuizSubmissionService.getStudentQuizSubmissions(user.id);
              if (resultsResponse.success && isMounted) {
                setStudentResults(resultsResponse.data || []);
              }
            }
          }
          
          // Always try to load Supabase quizzes for everyone (authenticated or not)
          try {
            // Check if Supabase table is properly migrated
            const isMigrated = await SupabaseQuizService.checkTableSchema();
            
            if (isMigrated) {
              // Load Supabase quizzes with timeout
              const quizzesPromise = SupabaseQuizService.getAllQuizzes();
              const quizTimeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Quiz load timeout')), 8000);
              });
              
              try {
                const supabaseQuizList = await Promise.race([quizzesPromise, quizTimeoutPromise]) as SupabaseQuiz[];
                if (isMounted) {
                  setSupabaseQuizzes(supabaseQuizList);
                }
              } catch (quizError) {
                console.warn('Failed to load Supabase quizzes:', quizError);
                if (isMounted) {
                  setSupabaseQuizzes([]);
                }
              }
            } else {
              console.warn('Supabase quizzes table not fully migrated yet.');
              if (isMounted) {
                setSupabaseQuizzes([]);
              }
            }
          } catch (supabaseError) {
            console.warn('Supabase operation failed:', supabaseError);
            if (isMounted) {
              setSupabaseQuizzes([]);
            }
          }
        }
      } catch (error) {
        console.error('Error loading quizzes:', error);
        if (isMounted) {
          setError('Có lỗi khi tải dữ liệu. Vui lòng thử lại.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };
    
    // Add a small delay to prevent initial flash
    const initDelay = setTimeout(() => {
      if (isMounted) {
        loadQuizzes();
      }
    }, 50);

    return () => {
      isMounted = false;
      clearTimeout(initDelay);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []); // Empty dependency array to run only once

  const handleStartQuiz = (quiz: SavedQuiz) => {
    navigate('/exam', { 
      state: { 
        questions: quiz.questions, 
        title: quiz.title,
        quizId: quiz.id
      } 
    });
  };

  const handleStartSupabaseQuiz = (quiz: SupabaseQuiz) => {
    // Use slug for SEO-friendly URLs
    navigate(`/exam/${quiz.slug}`, { 
      state: { 
        questions: quiz.questions, 
        title: quiz.title,
        quizId: quiz.id,
        supabaseQuizId: quiz.id,
        teacherName: quiz.creator_name
      } 
    });
  };

  const handleDeleteQuiz = (quizId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa đề thi này?')) {
      QuizService.deleteQuiz(quizId);
      setSavedQuizzes(QuizService.getAllQuizzes());
    }
  };

  const handleDeleteSupabaseQuiz = async (quizId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa đề thi này?')) {
      if (currentUser) {
        const success = await SupabaseQuizService.deleteQuiz(quizId, currentUser.id);
        if (success) {
          // Reload Supabase quizzes
          const updatedQuizzes = await SupabaseQuizService.getAllQuizzes();
          setSupabaseQuizzes(updatedQuizzes);
        }
      }
    }
  };

  const examTypes = [
    {
      title: "Thi từ Ngân hàng câu hỏi",
      description: "Chọn câu hỏi từ kho đề sẵn có và thi ngay",
      icon: <BookOpenIcon className="w-8 h-8" />,
      link: "/quiz-bank",
      color: "from-blue-500 to-indigo-600"
    }
  ];

  const features = [
    "Giao diện thân thiện, dễ sử dụng",
    "Chấm điểm tự động và chính xác",
    "Kết quả chi tiết với lời giải",
    "Hỗ trợ LaTeX cho công thức toán",
    "Lưu lịch sử bài thi",
    "Thống kê tiến độ học tập"
  ];

  const retryLoading = () => {
    setLoading(true);
    setError(null);
    setInitialized(false);
    // Force re-run of the effect
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">Đang tải dữ liệu...</p>
          {/* Show retry button after 3 seconds */}
          <button 
            onClick={retryLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-sm"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Lỗi!</strong>
            <p className="block sm:inline mt-2">{error}</p>
          </div>
          <button 
            onClick={retryLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100">
     <section className="py-10">
  <div className="container mx-auto px-4 text-center">
    <div className="max-w-4xl mx-auto">
      <div className="mb-4">
        <PlayCircleIcon className="w-16 h-16 text-green-600 mx-auto mb-4" />
      </div>
      <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
        Thi Online <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600"> Toán THPT </span>
      </h2>
      <p className="text-lg text-gray-500 mb-5 leading-relaxed">
        Hệ thống thi trực tuyến hiện đại với công nghệ chấm điểm tự động
        <br />
        <span className="text-green-500 font-semibold">Nhanh chóng • Chính xác • Tiện lợi</span>
      </p>
    </div>
  </div>
</section>


      {/* Supabase Quizzes */}
      {supabaseQuizzes.length > 0 && (
        <section className="py-16 bg-white/30 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900">
                  Đề thi cộng đồng ({supabaseQuizzes.length})
                </h2>
                <span className="text-sm text-gray-500">Quản lý bởi giáo viên</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {supabaseQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer group"
                    onClick={() => handleStartSupabaseQuiz(quiz)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                          {quiz.title}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-blue-600 font-medium">
                            👨‍🏫 {quiz.creator_name || 'Giáo viên'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">
                          {new Date(quiz.created_at).toLocaleString('vi-VN')}
                        </p>
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Cộng đồng
                        </span>
                      </div>
                      {currentUser && quiz.created_by === currentUser.id && (
                        <button
                          onClick={(e) => handleDeleteSupabaseQuiz(quiz.id, e)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          title="Xóa đề thi"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Tổng số câu:</span>
                        <span className="font-semibold text-gray-900">{quiz.question_count}</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {quiz.mcq_count > 0 && (
                          <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-center">
                            TN: {quiz.mcq_count}
                          </div>
                        )}
                        {quiz.msq_count > 0 && (
                          <div className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-center">
                            Đ-S: {quiz.msq_count}
                          </div>
                        )}
                        {quiz.sa_count > 0 && (
                          <div className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-center">
                            TLN: {quiz.sa_count}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center pt-4 border-t border-gray-100">
                      <div className="flex items-center text-indigo-600 font-semibold group-hover:text-indigo-700">
                        <PlayCircleIcon className="w-5 h-5 mr-2" />
                        <span>Bắt đầu thi</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Saved Quizzes */}
      {savedQuizzes.length > 0 && (
        <section className="py-16 bg-white/30 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900">
                  Đề thi cá nhân ({savedQuizzes.length})
                </h2>
                <button
                  onClick={() => {
                    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả đề thi đã lưu?')) {
                      QuizService.clearAllQuizzes();
                      setSavedQuizzes([]);
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Xóa tất cả
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer group"
                    onClick={() => handleStartQuiz(quiz)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                          {quiz.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-3">
                          {new Date(quiz.createdAt).toLocaleString('vi-VN')}
                        </p>
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Cá nhân
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteQuiz(quiz.id, e)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Xóa đề thi"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Tổng số câu:</span>
                        <span className="font-semibold text-gray-900">{quiz.questionCount}</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {quiz.mcqCount > 0 && (
                          <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-center">
                            TN: {quiz.mcqCount}
                          </div>
                        )}
                        {quiz.msqCount > 0 && (
                          <div className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-center">
                            Đ-S: {quiz.msqCount}
                          </div>
                        )}
                        {quiz.saCount > 0 && (
                          <div className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-center">
                            TLN: {quiz.saCount}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center pt-4 border-t border-gray-100">
                      <div className="flex items-center text-indigo-600 font-semibold group-hover:text-indigo-700">
                        <PlayCircleIcon className="w-5 h-5 mr-2" />
                        <span>Bắt đầu thi</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Student Results Section */}
      {currentUser && studentResults.length > 0 && (
        <section className="py-16 bg-white/40 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900">
                  Kết quả của tôi ({studentResults.length})
                </h2>
                <button
                  onClick={() => setShowResults(!showResults)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {showResults ? 'Thu gọn' : 'Xem tất cả'}
                </button>
              </div>
              
              {showResults && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tên đề thi
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Điểm số
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Phần trăm
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Lần thi
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ngày thi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {studentResults.slice(0, showResults ? undefined : 5).map((result) => (
                          <tr key={result.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {result.quiz_title}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {result.score}/{result.total_questions}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                result.percentage >= 80 ? 'bg-green-100 text-green-800' :
                                result.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {result.percentage}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              Lần {result.attempt_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(result.submitted_at).toLocaleString('vi-VN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {!showResults && studentResults.length > 5 && (
                    <div className="px-6 py-3 bg-gray-50 text-center">
                      <button
                        onClick={() => setShowResults(true)}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                      >
                        Xem thêm {studentResults.length - 5} kết quả khác
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Summary stats */}
              {!showResults && studentResults.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <div className="bg-white rounded-lg p-6 shadow-lg">
                    <div className="flex items-center">
                      <CheckCircleIcon className="w-8 h-8 text-green-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tổng số bài thi</p>
                        <p className="text-2xl font-bold text-gray-900">{studentResults.length}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-6 shadow-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-bold">%</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Điểm trung bình</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {Math.round(studentResults.reduce((acc, r) => acc + r.percentage, 0) / studentResults.length)}%
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-6 shadow-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-yellow-600 font-bold">★</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Điểm cao nhất</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {Math.max(...studentResults.map(r => r.percentage))}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

    </div>
  );
};

export default OnlineExamLandingPage;