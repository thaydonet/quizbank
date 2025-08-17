import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { QuizService, type SavedQuiz } from '../services/quizService';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface QuizStats {
  totalQuizzes: number;
  totalQuestions: number;
  publicQuizzes: number;
  privateQuizzes: number;
  mcqCount: number;
  msqCount: number;
  saCount: number;
  recentQuizzes: SavedQuiz[];
}

const TeacherStatsPage: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<QuizStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const quizzes = await QuizService.getAllQuizzes();
      
      const stats: QuizStats = {
        totalQuizzes: quizzes.length,
        totalQuestions: quizzes.reduce((sum, quiz) => sum + quiz.questionCount, 0),
        publicQuizzes: quizzes.filter(q => q.is_public).length,
        privateQuizzes: quizzes.filter(q => !q.is_public).length,
        mcqCount: quizzes.reduce((sum, quiz) => sum + quiz.mcqCount, 0),
        msqCount: quizzes.reduce((sum, quiz) => sum + quiz.msqCount, 0),
        saCount: quizzes.reduce((sum, quiz) => sum + quiz.saCount, 0),
        recentQuizzes: quizzes.slice(0, 5)
      };
      
      setStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thống kê...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Thống kê giáo viên</h1>
            <p className="text-gray-600">Tổng quan về hoạt động tạo đề thi của bạn</p>
          </div>

          {stats && (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-full">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Tổng đề thi</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalQuizzes}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-full">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Tổng câu hỏi</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalQuestions}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Đề công khai</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.publicQuizzes}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-orange-100 rounded-full">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Đề riêng tư</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.privateQuizzes}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Types Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Phân loại câu hỏi</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Trắc nghiệm (MCQ)</span>
                      <span className="font-semibold text-blue-600">{stats.mcqCount}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(stats.mcqCount / stats.totalQuestions) * 100}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Đúng/Sai (MSQ)</span>
                      <span className="font-semibold text-purple-600">{stats.msqCount}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${(stats.msqCount / stats.totalQuestions) * 100}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Tự luận (SA)</span>
                      <span className="font-semibold text-amber-600">{stats.saCount}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-amber-600 h-2 rounded-full" 
                        style={{ width: `${(stats.saCount / stats.totalQuestions) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Đề thi gần đây</h3>
                  <div className="space-y-3">
                    {stats.recentQuizzes.map((quiz) => (
                      <div key={quiz.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 truncate">{quiz.title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(quiz.created_at).toLocaleDateString('vi-VN')} • {quiz.questionCount} câu
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {quiz.is_public ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Công khai</span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Riêng tư</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-3">💡 Mẹo tối ưu</h3>
                <ul className="space-y-2 text-blue-800">
                  <li>• Tạo đề thi công khai để học sinh dễ dàng tìm thấy và luyện tập</li>
                  <li>• Kết hợp các loại câu hỏi để đánh giá toàn diện kiến thức học sinh</li>
                  <li>• Sử dụng tính năng thi đấu realtime để tăng tính tương tác</li>
                  <li>• Thường xuyên cập nhật và bổ sung câu hỏi mới</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TeacherStatsPage;
