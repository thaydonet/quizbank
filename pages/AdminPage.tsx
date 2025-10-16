import React, { useState, useEffect } from 'react';
import { AdminService } from '../services/adminService';
import QuestionForm from '../components/admin/QuestionForm';
import type { QuestionType } from '../services/questionBankService';
import BulkImportWrapper from '../components/admin/BulkImportWrapper';
import QuestionList from '../components/admin/QuestionList';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'question-list' | 'add-question' | 'import'>('question-list');
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
  const [loading, setLoading] = useState(false);

  // Load question types for question form
  const loadQuestionTypes = async () => {
    try {
      setLoading(true);
      // Get all subjects first, then load their question types
      const subjects = await AdminService.getSubjects();
      let allQuestionTypes: QuestionType[] = [];
      
      for (const subject of subjects) {
        const chapters = await AdminService.getChaptersBySubject(subject.id);
        for (const chapter of chapters) {
          const lessons = await AdminService.getLessonsByChapter(chapter.id);
          for (const lesson of lessons) {
            const questionTypes = await AdminService.getQuestionTypesByLesson(lesson.id);
            allQuestionTypes = [...allQuestionTypes, ...questionTypes];
          }
        }
      }
      
      setQuestionTypes(allQuestionTypes);
    } catch (error) {
      console.error('Error loading question types:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'add-question') {
      loadQuestionTypes();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🛠️ Admin Panel</h1>
              <p className="text-gray-600 mt-1">Quản lý dạng bài và câu hỏi</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.open('/quiz-bank', '_blank')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Xem Quiz Bank
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'question-list', label: '📋 Danh sách câu hỏi', desc: 'Xem và chỉnh sửa câu hỏi' },
              { key: 'add-question', label: '➕ Thêm câu hỏi', desc: 'Thêm câu hỏi vào dạng bài có sẵn' }
            ].map(({ key, label, desc }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div>
                  <div>{label}</div>
                  <div className="text-xs text-gray-400 mt-1">{desc}</div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'question-list' && (
            <div>
              <QuestionList />
            </div>
          )}

          {activeTab === 'add-question' && (
            <div>
              {questionTypes.length > 0 ? (
                <QuestionForm 
                  questionTypes={questionTypes}
                  onQuestionAdded={loadQuestionTypes}
                />
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold text-yellow-900 mb-2">Chưa có dạng bài nào</h3>
                  <p className="text-yellow-800 mb-4">
                    Bạn cần tạo cấu trúc (môn học → chương → bài → dạng bài) trước khi thêm câu hỏi
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'import' && (
            <div>
              {/* Lazy load the BulkImport component */}
              <React.Suspense fallback={<div>Loading import...</div>}>
                {/* @ts-ignore dynamic import */}
                <BulkImportWrapper />
              </React.Suspense>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;