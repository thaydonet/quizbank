import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { QuizService, type SavedQuiz } from '../services/quizService';
import BookOpenIcon from '../components/icons/BookOpenIcon';
import SparklesIcon from '../components/icons/SparklesIcon';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';
import PlayCircleIcon from '../components/icons/PlayCircleIcon';

const TeacherDashboard: React.FC = () => {
  const { profile, signOut } = useAuth();
  const [quizzes, setQuizzes] = useState<SavedQuiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const data = await QuizService.getAllQuizzes();
      setQuizzes(data);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
      // Force reload to clear any stuck state
      window.location.href = '/';
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đề thi này?')) {
      const success = await QuizService.deleteQuiz(quizId);
      if (success) {
        setQuizzes(prev => prev.filter(q => q.id !== quizId));
      }
    }
  };

  const copyQuizLink = async (slug: string) => {
    const url = `${window.location.origin}/quiz/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('✅ Link đã được copy vào clipboard!');
    } catch (err) {
      alert(`Link đề thi: ${url}`);
    }
  };

  const features = [
    {
      title: "Tạo Quiz từ Ngân hàng",
      description: "Chọn câu hỏi từ kho đề phong phú để tạo bài kiểm tra",
      icon: <BookOpenIcon className="w-8 h-8" />,
      link: "/quiz-bank",
      color: "from-blue-500 to-indigo-600"
    },
    {
      title: "Tạo câu hỏi bằng AI",
      description: "Sử dụng AI để tạo câu hỏi toán học chất lượng cao",
      icon: <SparklesIcon className="w-8 h-8" />,
      link: "/create",
      color: "from-purple-500 to-violet-600"
    },
    {
      title: "Quản lý lớp học",
      description: "Tạo nhóm, mời học sinh và theo dõi kết quả",
      icon: <CheckCircleIcon className="w-8 h-8" />,
      link: "/teacher/groups",
      color: "from-green-500 to-emerald-600"
    },
    {
      title: "Thi đấu Realtime",
      description: "Tạo phòng thi đấu để học sinh cạnh tranh trực tiếp",
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>,
      link: "/teacher/battle/create",
      color: "from-red-500 to-pink-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-indigo-600">
              Math<span className="text-gray-800">Bank AI</span>
            </h1>
            <p className="text-sm text-gray-600">Dashboard Giáo viên</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold text-gray-900">{profile?.full_name}</p>
              <p className="text-sm text-gray-600">{profile?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Chào mừng, {profile?.full_name}!
          </h2>
          <p className="text-xl text-gray-600">
            Bắt đầu tạo bài kiểm tra và quản lý lớp học của bạn
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.link}
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 hover:border-indigo-200"
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-r ${feature.color} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                {feature.description}
              </p>
              <div className="flex items-center text-indigo-600 font-semibold group-hover:text-indigo-700">
                <span>Bắt đầu</span>
                <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Thống kê nhanh</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
              <div className="text-sm text-gray-600">Quiz đã tạo</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-3xl font-bold text-green-600 mb-2">0</div>
              <div className="text-sm text-gray-600">Lớp học</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="text-3xl font-bold text-purple-600 mb-2">0</div>
              <div className="text-sm text-gray-600">Học sinh</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <div className="text-3xl font-bold text-orange-600 mb-2">0</div>
              <div className="text-sm text-gray-600">Bài thi hoàn thành</div>
            </div>
          </div>
        </div>

        {/* Quiz List Section */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Đề thi của tôi ({quizzes.length})
            </h2>
            <Link
              to="/quiz-bank"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              + Tạo đề thi mới
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải đề thi...</p>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <BookOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có đề thi nào</h3>
              <p className="text-gray-600 mb-6">Tạo đề thi đầu tiên từ ngân hàng câu hỏi</p>
              <Link
                to="/quiz-bank"
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                <BookOpenIcon className="w-5 h-5 mr-2" />
                Tạo đề thi
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                        {quiz.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">
                        {new Date(quiz.created_at).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteQuiz(quiz.id)}
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

                  <div className="space-y-2">
                    <button
                      onClick={() => copyQuizLink(quiz.slug)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Link
                    </button>

                    <div className="text-xs text-gray-500 text-center">
                      Link: /quiz/{quiz.slug}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;