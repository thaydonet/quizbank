import React, { useState } from 'react';
import { useQuestionBank } from '../hooks/useQuestionBank';
import type { Question } from '../types';
import QuestionCard from './QuestionCard';

interface QuestionBankBrowserProps {
  onQuestionsSelected?: (questions: Question[]) => void;
  maxSelection?: number;
  showSelectionControls?: boolean;
}

const QuestionBankBrowser: React.FC<QuestionBankBrowserProps> = ({
  onQuestionsSelected,
  maxSelection = 50,
  showSelectionControls = true
}) => {
  const {
    subjects,
    chapters,
    lessons,
    questionTypes,
    questions,
    selectedSubject,
    selectedChapter,
    selectedLesson,
    selectedQuestionType,
    loading,
    loadingQuestions,
    error,
    setSelectedSubject,
    setSelectedChapter,
    setSelectedLesson,
    setSelectedQuestionType,
    convertToAppQuestions,
    clearError
  } = useQuestionBank();

  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Convert database questions to app format for display
  const appQuestions = convertToAppQuestions(questions);

  // Filter questions by search term
  const filteredQuestions = appQuestions.filter(q => 
    searchTerm === '' || 
    q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.explanation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleQuestionSelect = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else if (newSelected.size < maxSelection) {
      newSelected.add(questionId);
    } else {
      alert(`Chỉ có thể chọn tối đa ${maxSelection} câu hỏi`);
      return;
    }
    
    setSelectedQuestions(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedQuestions.size === filteredQuestions.length) {
      // Deselect all
      setSelectedQuestions(new Set());
    } else {
      // Select all (up to max)
      const questionsToSelect = filteredQuestions.slice(0, maxSelection);
      setSelectedQuestions(new Set(questionsToSelect.map(q => q.id)));
    }
  };

  const handleUseSelected = () => {
    const selectedQuestionsList = filteredQuestions.filter(q => selectedQuestions.has(q.id));
    if (onQuestionsSelected) {
      onQuestionsSelected(selectedQuestionsList);
    }
  };

  const getSelectionSummary = () => {
    const selected = filteredQuestions.filter(q => selectedQuestions.has(q.id));
    const mcqCount = selected.filter(q => q.type === 'mcq').length;
    const msqCount = selected.filter(q => q.type === 'msq').length;
    const saCount = selected.filter(q => q.type === 'sa').length;
    
    return { total: selected.length, mcqCount, msqCount, saCount };
  };

  const selectionSummary = getSelectionSummary();

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <p className="text-red-800" role="alert">{error}</p>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
              aria-label="Đóng thông báo lỗi"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Hierarchy Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Chọn nguồn câu hỏi</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="subject-select">
              Môn học
            </label>
            <select
              id="subject-select"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
              aria-describedby={loading ? "loading-message" : undefined}
            >
              <option value="">Chọn môn học</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="chapter-select">
              Chương
            </label>
            <select
              id="chapter-select"
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              disabled={!selectedSubject || loading}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              aria-describedby={loading ? "loading-message" : undefined}
            >
              <option value="">Chọn chương</option>
              {chapters.map(chapter => (
                <option key={chapter.id} value={chapter.id}>{chapter.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="lesson-select">
              Bài học
            </label>
            <select
              id="lesson-select"
              value={selectedLesson}
              onChange={(e) => setSelectedLesson(e.target.value)}
              disabled={!selectedChapter || loading}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              aria-describedby={loading ? "loading-message" : undefined}
            >
              <option value="">Chọn bài học</option>
              {lessons.map(lesson => (
                <option key={lesson.id} value={lesson.id}>{lesson.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="question-type-select">
              Dạng câu hỏi
            </label>
            <select
              id="question-type-select"
              value={selectedQuestionType}
              onChange={(e) => setSelectedQuestionType(e.target.value)}
              disabled={!selectedLesson || loading}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
              aria-describedby={loading ? "loading-message" : undefined}
            >
              <option value="">Chọn dạng</option>
              {questionTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Questions Section */}
      {selectedQuestionType && (
        <div className="space-y-4">
          {/* Search and Controls */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex-1">
                <label htmlFor="question-search" className="sr-only">Tìm kiếm câu hỏi</label>
                <input
                  id="question-search"
                  type="text"
                  placeholder="Tìm kiếm câu hỏi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  aria-label="Tìm kiếm câu hỏi"
                />
              </div>
              
              {showSelectionControls && (
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200"
                    disabled={filteredQuestions.length === 0}
                    aria-label={selectedQuestions.size === filteredQuestions.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  >
                    {selectedQuestions.size === filteredQuestions.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                  
                  {selectionSummary.total > 0 && (
                    <button
                      onClick={handleUseSelected}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                      aria-label={`Sử dụng ${selectionSummary.total} câu hỏi đã chọn`}
                    >
                      Sử dụng ({selectionSummary.total})
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Selection Summary */}
            {showSelectionControls && selectionSummary.total > 0 && (
              <div className="mt-3 p-3 bg-indigo-50 rounded-md">
                <p className="text-sm text-indigo-800">
                  Đã chọn: <strong>{selectionSummary.total}</strong> câu hỏi
                  {selectionSummary.mcqCount > 0 && ` (${selectionSummary.mcqCount} trắc nghiệm)`}
                  {selectionSummary.msqCount > 0 && ` (${selectionSummary.msqCount} đúng/sai)`}
                  {selectionSummary.saCount > 0 && ` (${selectionSummary.saCount} trả lời ngắn)`}
                </p>
              </div>
            )}
          </div>

          {/* Questions List */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Danh sách câu hỏi ({filteredQuestions.length})
              </h3>
              
              {loadingQuestions && (
                <div className="flex items-center gap-2 text-gray-600" id="loading-message">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  <span className="text-sm">Đang tải...</span>
                </div>
              )}
            </div>

            {loadingQuestions ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải câu hỏi...</p>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">
                  {searchTerm ? 'Không tìm thấy câu hỏi phù hợp' : 'Chưa có câu hỏi nào trong dạng này'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((question, index) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    index={index}
                    onSelect={showSelectionControls ? handleQuestionSelect : () => {}}
                    isSelected={selectedQuestions.has(question.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      )}
    </div>
  );
};

export default QuestionBankBrowser;