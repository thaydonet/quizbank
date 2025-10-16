import React, { useState, useEffect } from 'react';
import { QuestionBankService, Subject, DatabaseQuestion } from '../../services/questionBankService';

interface QuestionStats {
  totalQuestions: number;
  approvedQuestions: number;
  pendingQuestions: number;
  subjectStats: Array<{
    subject: Subject;
    questionCount: number;
    approvedCount: number;
  }>;
}

const QuestionBankOverview: React.FC = () => {
  const [stats, setStats] = useState<QuestionStats>({
    totalQuestions: 0,
    approvedQuestions: 0,
    pendingQuestions: 0,
    subjectStats: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestionStats();
  }, []);

  const loadQuestionStats = async () => {
    try {
      setLoading(true);
      
      // Load subjects
      const subjects = await QuestionBankService.getSubjects();
      
      // Load all questions to calculate stats
      const allQuestions = await QuestionBankService.searchQuestions('', {});
      
      const totalQuestions = allQuestions.length;
      const approvedQuestions = allQuestions.filter(q => q.approval_status === 'approved').length;
      const pendingQuestions = totalQuestions - approvedQuestions;

      // Calculate stats by subject
      const subjectStats = await Promise.all(
        subjects.map(async (subject) => {
          try {
            const subjectQuestions = await QuestionBankService.getQuestionsBySubject(subject.id, { approvedOnly: false });
            const approvedCount = subjectQuestions.filter(q => q.approval_status === 'approved').length;
            
            return {
              subject,
              questionCount: subjectQuestions.length,
              approvedCount
            };
          } catch (error) {
            console.error(`Error loading questions for subject ${subject.name}:`, error);
            return {
              subject,
              questionCount: 0,
              approvedCount: 0
            };
          }
        })
      );

      setStats({
        totalQuestions,
        approvedQuestions,
        pendingQuestions,
        subjectStats
      });
    } catch (error) {
      console.error('Error loading question stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Tổng số câu hỏi</p>
              <p className="text-3xl font-bold">{stats.totalQuestions.toLocaleString()}</p>
            </div>
            <div className="text-4xl opacity-80">📚</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Đã duyệt</p>
              <p className="text-3xl font-bold">{stats.approvedQuestions.toLocaleString()}</p>
              <p className="text-green-100 text-xs">
                {stats.totalQuestions > 0 ? Math.round((stats.approvedQuestions / stats.totalQuestions) * 100) : 0}% tổng số
              </p>
            </div>
            <div className="text-4xl opacity-80">✅</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Chờ duyệt</p>
              <p className="text-3xl font-bold">{stats.pendingQuestions.toLocaleString()}</p>
              <p className="text-yellow-100 text-xs">
                {stats.totalQuestions > 0 ? Math.round((stats.pendingQuestions / stats.totalQuestions) * 100) : 0}% tổng số
              </p>
            </div>
            <div className="text-4xl opacity-80">⏳</div>
          </div>
        </div>
      </div>

      {/* Subject Stats */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Thống kê theo môn học</h3>
        </div>
        <div className="p-6">
          {stats.subjectStats.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📚</div>
              <p>Chưa có dữ liệu môn học</p>
              <p className="text-sm">Hãy tạo môn học và thêm câu hỏi để xem thống kê</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.subjectStats.map(({ subject, questionCount, approvedCount }) => (
                <div key={subject.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{subject.name}</h4>
                    <span className="text-2xl">📖</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tổng câu hỏi:</span>
                      <span className="font-medium">{questionCount}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Đã duyệt:</span>
                      <span className="font-medium text-green-600">{approvedCount}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Chờ duyệt:</span>
                      <span className="font-medium text-yellow-600">{questionCount - approvedCount}</span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Tiến độ duyệt</span>
                        <span>{questionCount > 0 ? Math.round((approvedCount / questionCount) * 100) : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${questionCount > 0 ? (approvedCount / questionCount) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-indigo-800 mb-4">🚀 Thao tác nhanh</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">👀</div>
            <h4 className="font-semibold text-gray-900 mb-2">Duyệt câu hỏi</h4>
            <p className="text-sm text-gray-600 mb-3">Xem và duyệt câu hỏi theo cấu trúc phân cấp</p>
            <div className="text-xs text-indigo-600 font-medium">Tab "Duyệt câu hỏi"</div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">✏️</div>
            <h4 className="font-semibold text-gray-900 mb-2">Tạo câu hỏi</h4>
            <p className="text-sm text-gray-600 mb-3">Tạo câu hỏi mới với hỗ trợ LaTeX và câu hỏi động</p>
            <div className="text-xs text-indigo-600 font-medium">Tab "Tạo câu hỏi"</div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">📥</div>
            <h4 className="font-semibold text-gray-900 mb-2">Import hàng loạt</h4>
            <p className="text-sm text-gray-600 mb-3">Import nhiều câu hỏi từ Text hoặc JSON</p>
            <div className="text-xs text-indigo-600 font-medium">Tab "Import câu hỏi"</div>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">ℹ️</div>
            <div>
              <h4 className="font-semibold text-gray-900">Hệ thống Ngân hàng Câu hỏi</h4>
              <p className="text-sm text-gray-600">
                Quản lý câu hỏi trắc nghiệm với hỗ trợ LaTeX, câu hỏi động và phân quyền duyệt
              </p>
            </div>
          </div>
          <button
            onClick={loadQuestionStats}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            🔄 Làm mới
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionBankOverview;