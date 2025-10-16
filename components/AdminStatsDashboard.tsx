import React, { useState, useEffect } from 'react';
import { AdminStatsService, type AdminStats } from '../services/adminStatsService';

export default function AdminStatsDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    setError('');
    try {
      const adminStats = await AdminStatsService.getAdminStats();
      setStats(adminStats);
    } catch (err: any) {
      setError('Không thể tải thống kê: ' + err.message);
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = () => {
    loadStats();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-8">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p><strong>Lỗi:</strong> {error}</p>
          <button 
            onClick={refreshStats}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Thống kê tổng quan</h2>
        <button
          onClick={refreshStats}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          🔄 Làm mới
        </button>
      </div>

      {/* User Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">👥 Thống kê người dùng</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Tổng người dùng</p>
                <p className="text-2xl font-bold text-blue-900">{stats.userStats.totalUsers}</p>
              </div>
              <div className="text-blue-500">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Giáo viên</p>
                <p className="text-2xl font-bold text-green-900">{stats.userStats.teachers}</p>
              </div>
              <div className="text-green-500">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Học sinh</p>
                <p className="text-2xl font-bold text-purple-900">{stats.userStats.students}</p>
              </div>
              <div className="text-purple-500">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">📝 Thống kê đề thi</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600">Tổng số đề thi</p>
                <p className="text-2xl font-bold text-indigo-900">{stats.quizStats.totalQuizzes}</p>
              </div>
              <div className="text-indigo-500">📊</div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Đề thi đang hoạt động</p>
                <p className="text-2xl font-bold text-green-900">{stats.quizStats.activeQuizzes}</p>
              </div>
              <div className="text-green-500">✅</div>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Tổng số câu hỏi</p>
                <p className="text-2xl font-bold text-orange-900">{stats.quizStats.totalQuestions}</p>
              </div>
              <div className="text-orange-500">❓</div>
            </div>
          </div>
        </div>

        {/* Question Type Breakdown */}
        <div className="border-t pt-4">
          <h4 className="text-lg font-medium text-gray-700 mb-3">Phân loại câu hỏi</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <p className="text-sm text-blue-600 font-medium">Trắc nghiệm (MCQ)</p>
              <p className="text-xl font-bold text-blue-900">{stats.quizStats.mcqQuestions}</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
              <p className="text-sm text-yellow-600 font-medium">Đúng - Sai (MSQ)</p>
              <p className="text-xl font-bold text-yellow-900">{stats.quizStats.msqQuestions}</p>
            </div>
            <div className="bg-pink-50 p-3 rounded border border-pink-200">
              <p className="text-sm text-pink-600 font-medium">Trả lời ngắn (SA)</p>
              <p className="text-xl font-bold text-pink-900">{stats.quizStats.saQuestions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">🎯 Hoạt động học tập</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Tổng lượt làm bài</p>
                <p className="text-2xl font-bold text-red-900">{stats.activityStats.totalAttempts}</p>
              </div>
              <div className="text-red-500">📈</div>
            </div>
          </div>

          <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-teal-600">Học sinh đã thi</p>
                <p className="text-2xl font-bold text-teal-900">{stats.activityStats.uniqueStudentsAttempted}</p>
              </div>
              <div className="text-teal-500">👨‍🎓</div>
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Điểm trung bình</p>
                <p className="text-2xl font-bold text-amber-900">{stats.activityStats.averageScore}%</p>
              </div>
              <div className="text-amber-500">⭐</div>
            </div>
          </div>
        </div>

        {/* Recent Attempts */}
        {stats.activityStats.recentAttempts.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-lg font-medium text-gray-700 mb-3">Lượt thi gần đây</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-3 border border-gray-200">Học sinh</th>
                    <th className="text-left p-3 border border-gray-200">Đề thi</th>
                    <th className="text-left p-3 border border-gray-200">Điểm</th>
                    <th className="text-left p-3 border border-gray-200">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.activityStats.recentAttempts.map((attempt, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="p-3 border border-gray-200">{attempt.studentName}</td>
                      <td className="p-3 border border-gray-200">{attempt.quizTitle}</td>
                      <td className="p-3 border border-gray-200">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          attempt.score >= 80 ? 'bg-green-100 text-green-800' :
                          attempt.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {attempt.score}%
                        </span>
                      </td>
                      <td className="p-3 border border-gray-200">
                        {new Date(attempt.submittedAt).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}