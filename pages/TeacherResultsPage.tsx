import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QuizSubmissionService, QuizSubmissionStats } from '../services/quizSubmissionService';
import { SupabaseQuizService, SupabaseQuiz } from '../services/supabaseQuizService';
import { supabase } from '../services/supabaseClient';

interface User {
  id: string;
  email: string;
  role: string;
}

const TeacherResultsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<QuizSubmissionStats[]>([]);
  const [teacherQuizzes, setTeacherQuizzes] = useState<SupabaseQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'quiz-list' | 'all-submissions'>('quiz-list');
  const [stats, setStats] = useState<any>(null);

  // Check authentication and role
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (userData) {
            setUser(userData);
            if (userData.role !== 'teacher') {
              setError('Bạn không có quyền truy cập trang này.');
              return;
            }
          }
        } else {
          setError('Vui lòng đăng nhập để xem kết quả.');
          return;
        }
      } catch (err) {
        console.error('Error checking auth:', err);
        setError('Có lỗi xảy ra khi kiểm tra quyền truy cập.');
      }
    };

    checkAuth();
  }, []);

  // Load submissions and stats
  useEffect(() => {
    const loadData = async () => {
      if (!user || user.role !== 'teacher') return;
      
      setLoading(true);
      try {
        // Load teacher's quizzes
        const teacherQuizzesData = await SupabaseQuizService.getQuizzesByUser(user.id);
        setTeacherQuizzes(teacherQuizzesData);
        
        // Load teacher-specific submissions
        const submissionsResult = await QuizSubmissionService.getTeacherQuizSubmissions(user.id, 500);
        if (submissionsResult.success && submissionsResult.data) {
          setSubmissions(submissionsResult.data);
        } else {
          setError(submissionsResult.error || 'Không thể tải dữ liệu.');
        }

        // Load teacher-specific stats
        const teacherSubmissions = submissionsResult.data || [];
        const teacherStats = {
          totalSubmissions: teacherSubmissions.length,
          averageScore: teacherSubmissions.length ? 
            Math.round((teacherSubmissions.reduce((sum, s) => sum + s.percentage, 0) / teacherSubmissions.length)) : 0,
          uniqueQuizzes: teacherQuizzesData.length,
          totalQuizzes: teacherQuizzesData.length,
          recentSubmissions: teacherSubmissions.slice(0, 10)
        };
        setStats(teacherStats);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Có lỗi xảy ra khi tải dữ liệu.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Get unique quiz titles for filter (from actual submissions)
  const uniqueQuizzes = [...new Set(submissions.map(s => s.quiz_title))];
  
  // Group submissions by quiz
  const submissionsByQuiz = teacherQuizzes.map(quiz => {
    const quizSubmissions = submissions.filter(s => s.quiz_title === quiz.title);
    return {
      quiz,
      submissions: quizSubmissions,
      studentCount: new Set(quizSubmissions.map(s => s.student_email)).size,
      averageScore: quizSubmissions.length ? 
        Math.round(quizSubmissions.reduce((sum, s) => sum + s.percentage, 0) / quizSubmissions.length) : 0,
      totalAttempts: quizSubmissions.length
    };
  });

  // Filter submissions
  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.student_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.quiz_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (submission.student_class && submission.student_class.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesQuiz = selectedQuiz === 'all' || submission.quiz_title === selectedQuiz;
    
    return matchesSearch && matchesQuiz;
  });

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <Link to="/" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
            Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Kết quả học sinh</h1>
                <p className="text-gray-600 mt-1">Quản lý đề thi và xem kết quả của học sinh</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setViewMode('quiz-list')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    viewMode === 'quiz-list' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Theo đề thi
                </button>
                <button
                  onClick={() => setViewMode('all-submissions')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    viewMode === 'all-submissions' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Tất cả bài nộp
                </button>
                <Link 
                  to="/" 
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Trang chủ
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tổng bài nộp</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Điểm trung bình</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Số đề thi tạo</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalQuizzes}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Bài nộp gần đây</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.recentSubmissions.length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content based on view mode */}
          {viewMode === 'quiz-list' ? (
            /* Quiz List View */
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Đề thi của bạn ({teacherQuizzes.length} đề)
                </h3>
                
                {teacherQuizzes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Bạn chưa tạo đề thi nào.</p>
                    <Link 
                      to="/quiz-bank" 
                      className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Tạo đề thi mới
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {submissionsByQuiz.map(({ quiz, submissions, studentCount, averageScore, totalAttempts }) => (
                      <div key={quiz.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="text-lg font-medium text-gray-900 mb-1">{quiz.title}</h4>
                            <p className="text-sm text-gray-500">
                              Tạo ngày: {new Date(quiz.created_at).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">
                              {quiz.question_count} câu hỏi
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-blue-50 rounded-lg p-3">
                            <div className="text-sm font-medium text-blue-600">Học sinh tham gia</div>
                            <div className="text-xl font-bold text-blue-900">{studentCount}</div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3">
                            <div className="text-sm font-medium text-green-600">Tổng lượt thi</div>
                            <div className="text-xl font-bold text-green-900">{totalAttempts}</div>
                          </div>
                          <div className="bg-yellow-50 rounded-lg p-3">
                            <div className="text-sm font-medium text-yellow-600">Điểm TB</div>
                            <div className="text-xl font-bold text-yellow-900">{averageScore}%</div>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-3">
                            <div className="text-sm font-medium text-purple-600">Trạng thái</div>
                            <div className="text-sm font-semibold text-purple-900">
                              {submissions.length > 0 ? 'Có bài nộp' : 'Chưa có bài nộp'}
                            </div>
                          </div>
                        </div>
                        
                        {submissions.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Bài nộp gần đây:</h5>
                            <div className="space-y-2">
                              {submissions.slice(0, 3).map((submission) => (
                                <div key={submission.id} className="flex justify-between items-center bg-gray-50 rounded p-2">
                                  <div>
                                    <span className="font-medium text-sm">{submission.student_name}</span>
                                    <span className="text-gray-500 text-xs ml-2">({submission.student_class || 'Chưa rõ lớp'})</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                      submission.percentage >= 80 ? 'bg-green-100 text-green-800' :
                                      submission.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {submission.percentage}%
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(submission.submitted_at).toLocaleDateString('vi-VN')}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {submissions.length > 3 && (
                                <div className="text-center">
                                  <button 
                                    onClick={() => setViewMode('all-submissions')}
                                    className="text-sm text-indigo-600 hover:text-indigo-800"
                                  >
                                    Xem thêm {submissions.length - 3} bài nộp khác
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* All Submissions View */
            <div>
              {/* Filters */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Tìm theo tên, email, lớp hoặc tên đề thi..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lọc theo đề thi</label>
                    <select
                      value={selectedQuiz}
                      onChange={(e) => setSelectedQuiz(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="all">Tất cả đề thi</option>
                      {uniqueQuizzes.map(quiz => (
                        <option key={quiz} value={quiz}>{quiz}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Results Table */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Kết quả bài thi ({filteredSubmissions.length} kết quả)
                  </h3>
                </div>
                
                {filteredSubmissions.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>Không tìm thấy kết quả nào.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Học sinh
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Lớp
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Đề thi
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Điểm số
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Lần thi
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Thời gian nộp
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredSubmissions.map((submission, index) => (
                          <tr key={submission.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{submission.student_name}</div>
                                <div className="text-sm text-gray-500">{submission.student_email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {submission.student_class || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {submission.quiz_title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  submission.percentage >= 80 ? 'bg-green-100 text-green-800' :
                                  submission.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {submission.percentage}%
                                </div>
                                <span className="ml-2 text-sm text-gray-600">
                                  ({submission.score}/{submission.total_questions})
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              Lần {submission.attempt_number || 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(submission.submitted_at).toLocaleString('vi-VN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherResultsPage;