import React, { useState, useEffect } from 'react';
import { AdminService } from '../../services/adminService';
import type { Subject, Chapter, Lesson, QuestionType } from '../../services/questionBankService';
import QuickAddForm from './QuickAddForm';
import QuestionForm from './QuestionForm';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'subjects' | 'chapters' | 'lessons' | 'question-types' | 'questions'>('subjects');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
  const [loading, setLoading] = useState(false);

  // Load data
  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getSubjects();
      setSubjects(data);
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChapters = async (subjectId: string) => {
    try {
      const data = await AdminService.getChaptersBySubject(subjectId);
      setChapters(data);
    } catch (error) {
      console.error('Error loading chapters:', error);
    }
  };

  const loadLessons = async (chapterId: string) => {
    try {
      const data = await AdminService.getLessonsByChapter(chapterId);
      setLessons(data);
    } catch (error) {
      console.error('Error loading lessons:', error);
    }
  };

  const loadQuestionTypes = async (lessonId: string) => {
    try {
      const data = await AdminService.getQuestionTypesByLesson(lessonId);
      setQuestionTypes(data);
    } catch (error) {
      console.error('Error loading question types:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <button
              onClick={async () => {
                if (confirm('Tạo dữ liệu mẫu? (Môn Toán - Đại số - Phương trình bậc nhất)')) {
                  try {
                    await AdminService.createSampleData();
                    alert('Tạo dữ liệu mẫu thành công!');
                    loadSubjects();
                  } catch (error) {
                    alert('Có lỗi xảy ra: ' + error);
                  }
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              🚀 Tạo dữ liệu mẫu
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'subjects', label: 'Môn học', count: subjects.length },
              { key: 'chapters', label: 'Chương', count: chapters.length },
              { key: 'lessons', label: 'Bài học', count: lessons.length },
              { key: 'question-types', label: 'Dạng bài', count: questionTypes.length },
              { key: 'questions', label: 'Câu hỏi', count: 0 }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        ) : (
          <div>
            {activeTab === 'subjects' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Tạo nhanh cấu trúc</h2>
                <QuickAddForm />
              </div>
            )}
            {activeTab === 'chapters' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Quản lý Chương</h2>
                <p className="text-gray-600">Chức năng này sẽ được phát triển trong phiên bản tiếp theo.</p>
              </div>
            )}
            {activeTab === 'lessons' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Quản lý Bài học</h2>
                <p className="text-gray-600">Chức năng này sẽ được phát triển trong phiên bản tiếp theo.</p>
              </div>
            )}
            {activeTab === 'question-types' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Quản lý Dạng bài</h2>
                <p className="text-gray-600">Chức năng này sẽ được phát triển trong phiên bản tiếp theo.</p>
              </div>
            )}
            {activeTab === 'questions' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Thêm câu hỏi</h2>
                <QuestionForm 
                  questionTypes={questionTypes}
                  onQuestionAdded={loadSubjects}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;