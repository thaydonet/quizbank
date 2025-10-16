import React, { useState, useEffect } from 'react';
import { QuestionBankService, Subject, Chapter, Lesson, QuestionType, DatabaseQuestion } from '../services/questionBankService';
import QuestionCard from './QuestionCard';
import type { Question } from '../types';

interface DatabaseQuestionBrowserProps {
  onQuestionsSelected: (questions: Question[]) => void;
  selectedQuestionIds: string[];
  onToggleQuestion: (questionId: string) => void;
}

const DatabaseQuestionBrowser: React.FC<DatabaseQuestionBrowserProps> = ({
  onQuestionsSelected,
  selectedQuestionIds,
  onToggleQuestion
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
  const [selectedQuestionType, setSelectedQuestionType] = useState<string>('');
  const [questions, setQuestions] = useState<DatabaseQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load subjects on mount
  useEffect(() => {
    loadSubjects();
  }, []);

  // Load chapters when subject changes
  useEffect(() => {
    if (selectedSubject) {
      loadChapters(selectedSubject);
    } else {
      setChapters([]);
      setSelectedChapter('');
    }
  }, [selectedSubject]);

  // Load lessons when chapter changes
  useEffect(() => {
    if (selectedChapter) {
      loadLessons(selectedChapter);
    } else {
      setLessons([]);
      setSelectedLesson('');
    }
  }, [selectedChapter]);

  // Load question types when lesson changes
  useEffect(() => {
    if (selectedLesson) {
      loadQuestionTypes(selectedLesson);
    } else {
      setQuestionTypes([]);
      setSelectedQuestionType('');
    }
  }, [selectedLesson]);

  // Load questions when question type changes
  useEffect(() => {
    if (selectedQuestionType) {
      loadQuestions(selectedQuestionType);
    } else {
      setQuestions([]);
    }
  }, [selectedQuestionType]);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await QuestionBankService.getSubjects();
      setSubjects(data);
    } catch (err) {
      console.error('Error loading subjects:', err);
      setError('Không thể tải danh sách môn học');
    } finally {
      setLoading(false);
    }
  };

  const loadChapters = async (subjectId: string) => {
    try {
      setError(null);
      const data = await QuestionBankService.getChaptersBySubject(subjectId);
      setChapters(data);
    } catch (err) {
      console.error('Error loading chapters:', err);
      setError('Không thể tải danh sách chương');
    }
  };

  const loadLessons = async (chapterId: string) => {
    try {
      setError(null);
      const data = await QuestionBankService.getLessonsByChapter(chapterId);
      setLessons(data);
    } catch (err) {
      console.error('Error loading lessons:', err);
      setError('Không thể tải danh sách bài học');
    }
  };

  const loadQuestionTypes = async (lessonId: string) => {
    try {
      setError(null);
      const data = await QuestionBankService.getQuestionTypesByLesson(lessonId);
      setQuestionTypes(data);
    } catch (err) {
      console.error('Error loading question types:', err);
      setError('Không thể tải danh sách dạng câu hỏi');
    }
  };

  const loadQuestions = async (questionTypeId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await QuestionBankService.getQuestionsByType(questionTypeId, { approvedOnly: true });
      setQuestions(data);
    } catch (err) {
      console.error('Error loading questions:', err);
      setError('Không thể tải danh sách câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  // Convert database question to app question format
  const convertToAppQuestion = (dbQuestion: DatabaseQuestion): Question => {
    return QuestionBankService.convertToAppQuestion(dbQuestion);
  };

  // Get converted questions for display
  const appQuestions = questions.map(convertToAppQuestion);

  // Handle select all questions in current type
  const handleSelectAll = () => {
    const currentQuestionIds = questions.map(q => q.id);
    const allSelected = currentQuestionIds.every(id => selectedQuestionIds.includes(id));
    
    if (allSelected) {
      // Deselect all current questions
      currentQuestionIds.forEach(id => {
        if (selectedQuestionIds.includes(id)) {
          onToggleQuestion(id);
        }
      });
    } else {
      // Select all current questions
      currentQuestionIds.forEach(id => {
        if (!selectedQuestionIds.includes(id)) {
          onToggleQuestion(id);
        }
      });
    }
  };

  const selectedCount = questions.filter(q => selectedQuestionIds.includes(q.id)).length;
  const totalCount = questions.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">📚 Ngân hàng Câu hỏi Database</h2>
        <div className="text-sm text-gray-600">
          Đã chọn: <span className="font-semibold text-indigo-600">{selectedQuestionIds.length}</span> câu hỏi
        </div>
      </div>

      {/* Hierarchy Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Chọn nguồn câu hỏi</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Môn học</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Chọn môn học</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chương</label>
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              disabled={!selectedSubject}
              className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Chọn chương</option>
              {chapters.map(chapter => (
                <option key={chapter.id} value={chapter.id}>{chapter.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bài học</label>
            <select
              value={selectedLesson}
              onChange={(e) => setSelectedLesson(e.target.value)}
              disabled={!selectedChapter}
              className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Chọn bài học</option>
              {lessons.map(lesson => (
                <option key={lesson.id} value={lesson.id}>{lesson.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dạng câu hỏi</label>
            <select
              value={selectedQuestionType}
              onChange={(e) => setSelectedQuestionType(e.target.value)}
              disabled={!selectedLesson}
              className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Chọn dạng</option>
              {questionTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Questions Display */}
      {selectedQuestionType && (
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Questions Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Danh sách câu hỏi ({totalCount})
            </h3>
            {totalCount > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Đã chọn: {selectedCount}/{totalCount}
                </span>
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                >
                  {selectedCount === totalCount ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              </div>
            )}
          </div>

          {/* Questions List */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải câu hỏi...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có câu hỏi</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedQuestionType ? 'Dạng câu hỏi này chưa có câu hỏi nào.' : 'Vui lòng chọn dạng câu hỏi để xem danh sách.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {appQuestions.map((question, index) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    index={index}
                    onSelect={onToggleQuestion}
                    isSelected={selectedQuestionIds.includes(question.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      {!selectedQuestionType && !loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">📋 Hướng dẫn sử dụng</h3>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Chọn môn học, chương, bài học và dạng câu hỏi từ các dropdown trên</li>
            <li>Xem danh sách câu hỏi và chọn những câu muốn sử dụng</li>
            <li>Sử dụng nút "Chọn tất cả" để chọn/bỏ chọn toàn bộ câu hỏi trong dạng</li>
            <li>Câu hỏi đã chọn sẽ được thêm vào quiz của bạn</li>
            <li>Có thể chọn câu hỏi từ nhiều dạng khác nhau</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default DatabaseQuestionBrowser;