import React, { useState, useEffect } from 'react';
import { QuestionBankService } from '../../services/questionBankService';
import { AdminService } from '../../services/adminService';
import type { DatabaseQuestion, QuestionType, Lesson, Chapter, Subject } from '../../services/questionBankService';

interface QuestionWithHierarchy extends DatabaseQuestion {
  subject?: Subject;
  chapter?: Chapter;
  lesson?: Lesson;
  questionType?: QuestionType;
}

const QuestionList: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionWithHierarchy[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionWithHierarchy[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<DatabaseQuestion | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 20;
  
  // Filter state
  const [filters, setFilters] = useState({
    subjectId: '',
    chapterId: '',
    lessonId: '',
    questionTypeId: ''
  });
  
  // Available options for filters
  const [availableChapters, setAvailableChapters] = useState<Chapter[]>([]);
  const [availableLessons, setAvailableLessons] = useState<Lesson[]>([]);
  const [availableQuestionTypes, setAvailableQuestionTypes] = useState<QuestionType[]>([]);

  useEffect(() => {
    loadQuestions();
    loadHierarchy();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [questions, filters]);

  useEffect(() => {
    // When subject changes, reset dependent filters and load chapters
    if (filters.subjectId) {
      const filteredChapters = chapters.filter(chapter => chapter.subject_id === filters.subjectId);
      setAvailableChapters(filteredChapters);
      setFilters(prev => ({
        ...prev,
        chapterId: '',
        lessonId: '',
        questionTypeId: ''
      }));
      setAvailableLessons([]);
      setAvailableQuestionTypes([]);
    } else {
      setAvailableChapters(chapters);
      setAvailableLessons(lessons);
      setAvailableQuestionTypes(questionTypes);
    }
  }, [filters.subjectId, chapters, lessons, questionTypes]);

  useEffect(() => {
    // When chapter changes, reset dependent filters and load lessons
    if (filters.chapterId) {
      const filteredLessons = lessons.filter(lesson => lesson.chapter_id === filters.chapterId);
      setAvailableLessons(filteredLessons);
      setFilters(prev => ({
        ...prev,
        lessonId: '',
        questionTypeId: ''
      }));
      setAvailableQuestionTypes([]);
    } else if (filters.subjectId) {
      // If only subject is selected, show all lessons for that subject
      const subjectChapters = chapters.filter(chapter => chapter.subject_id === filters.subjectId);
      const chapterIds = subjectChapters.map(chapter => chapter.id);
      const filteredLessons = lessons.filter(lesson => chapterIds.includes(lesson.chapter_id));
      setAvailableLessons(filteredLessons);
    } else {
      setAvailableLessons(lessons);
    }
  }, [filters.chapterId, filters.subjectId, chapters, lessons]);

  useEffect(() => {
    // When lesson changes, reset dependent filter and load question types
    if (filters.lessonId) {
      const filteredQuestionTypes = questionTypes.filter(qt => qt.lesson_id === filters.lessonId);
      setAvailableQuestionTypes(filteredQuestionTypes);
      setFilters(prev => ({
        ...prev,
        questionTypeId: ''
      }));
    } else if (filters.chapterId) {
      // If only chapter is selected, show all question types for that chapter
      const filteredQuestionTypes = questionTypes.filter(qt => qt.lesson_id === filters.lessonId);
      setAvailableQuestionTypes(filteredQuestionTypes);
    } else if (filters.subjectId) {
      // If only subject is selected, show all question types for that subject
      const subjectChapters = chapters.filter(chapter => chapter.subject_id === filters.subjectId);
      const chapterIds = subjectChapters.map(chapter => chapter.id);
      const subjectLessons = lessons.filter(lesson => chapterIds.includes(lesson.chapter_id));
      const lessonIds = subjectLessons.map(lesson => lesson.id);
      const filteredQuestionTypes = questionTypes.filter(qt => lessonIds.includes(qt.lesson_id));
      setAvailableQuestionTypes(filteredQuestionTypes);
    } else {
      setAvailableQuestionTypes(questionTypes);
    }
  }, [filters.lessonId, filters.chapterId, filters.subjectId, chapters, lessons, questionTypes]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      // Get all questions with their hierarchy
      const hierarchy = await QuestionBankService.getQuestionHierarchy();
      
      // Flatten the hierarchy to get all questions with their context
      const allQuestions: QuestionWithHierarchy[] = [];
      
      hierarchy.subjects.forEach(subject => {
        subject.chapters.forEach(chapter => {
          chapter.lessons.forEach(lesson => {
            lesson.question_types.forEach(questionType => {
              questionType.questions.forEach(question => {
                allQuestions.push({
                  ...question,
                  subject,
                  chapter,
                  lesson,
                  questionType
                });
              });
            });
          });
        });
      });
      
      setQuestions(allQuestions);
    } catch (error) {
      console.error('Error loading questions:', error);
      alert('Có lỗi xảy ra khi tải danh sách câu hỏi: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const loadHierarchy = async () => {
    try {
      const subjectsData = await AdminService.getSubjects();
      setSubjects(subjectsData);
      
      // Load all chapters, lessons, and question types
      const allChapters: Chapter[] = [];
      const allLessons: Lesson[] = [];
      const allQuestionTypes: QuestionType[] = [];
      
      for (const subject of subjectsData) {
        const chaptersData = await AdminService.getChaptersBySubject(subject.id);
        allChapters.push(...chaptersData);
        
        for (const chapter of chaptersData) {
          const lessonsData = await AdminService.getLessonsByChapter(chapter.id);
          allLessons.push(...lessonsData);
          
          for (const lesson of lessonsData) {
            const questionTypesData = await AdminService.getQuestionTypesByLesson(lesson.id);
            allQuestionTypes.push(...questionTypesData);
          }
        }
      }
      
      setChapters(allChapters);
      setLessons(allLessons);
      setQuestionTypes(allQuestionTypes);
      
      // Set initial available options
      setAvailableChapters(allChapters);
      setAvailableLessons(allLessons);
      setAvailableQuestionTypes(allQuestionTypes);
    } catch (error) {
      console.error('Error loading hierarchy:', error);
    }
  };

  const applyFilters = () => {
    let result = [...questions];
    
    if (filters.subjectId) {
      result = result.filter(q => q.subject?.id === filters.subjectId);
    }
    
    if (filters.chapterId) {
      result = result.filter(q => q.chapter?.id === filters.chapterId);
    }
    
    if (filters.lessonId) {
      result = result.filter(q => q.lesson?.id === filters.lessonId);
    }
    
    if (filters.questionTypeId) {
      result = result.filter(q => q.questionType?.id === filters.questionTypeId);
    }
    
    setFilteredQuestions(result);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleEdit = (question: DatabaseQuestion) => {
    setEditingQuestion(question);
    setEditForm({
      question_type_id: question.question_type_id || '',
      type: question.type || 'mcq',
      question_text: question.question_text || '',
      option_a: question.option_a || '',
      option_b: question.option_b || '',
      option_c: question.option_c || '',
      option_d: question.option_d || '',
      correct_option: question.correct_option || '',
      explanation: question.explanation || '',
      difficulty_level: question.difficulty_level || 'medium',
      tags: question.tags ? question.tags.join(', ') : '',
      is_dynamic: question.is_dynamic || false
    });
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    if (!editingQuestion) return;
    
    try {
      // Prepare the update data, only including fields that should be updated
      // Exclude read-only fields like id, created_at, etc.
      const updatedQuestion = {
        question_type_id: editForm.question_type_id,
        type: editForm.type,
        question_text: editForm.question_text,
        option_a: editForm.option_a || undefined,
        option_b: editForm.option_b || undefined,
        option_c: editForm.option_c || undefined,
        option_d: editForm.option_d || undefined,
        correct_option: editForm.correct_option,
        explanation: editForm.explanation,
        difficulty_level: editForm.difficulty_level,
        tags: editForm.tags ? editForm.tags.split(',').map((tag: string) => tag.trim()) : [],
        is_dynamic: editForm.is_dynamic
      };
      
      console.log('Updating question with data:', updatedQuestion);
      
      await QuestionBankService.updateQuestion(editingQuestion.id, updatedQuestion);
      alert('Cập nhật câu hỏi thành công!');
      
      // Reload questions
      await loadQuestions();
      handleCancelEdit();
    } catch (error) {
      console.error('Error updating question:', error);
      // Better error handling to display meaningful error messages
      let errorMessage = 'Có lỗi xảy ra khi cập nhật câu hỏi';
      if (error instanceof Error) {
        errorMessage += ': ' + error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Try to extract error details from Supabase error objects
        const supabaseError = error as any;
        if (supabaseError.message) {
          errorMessage += ': ' + supabaseError.message;
        } else if (supabaseError.error) {
          errorMessage += ': ' + supabaseError.error;
        } else {
          errorMessage += ': ' + JSON.stringify(error);
        }
      } else {
        errorMessage += ': ' + String(error);
      }
      alert(errorMessage);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) return;
    
    try {
      await AdminService.deleteQuestion(questionId);
      alert('Xóa câu hỏi thành công!');
      
      // Reload questions
      await loadQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Có lỗi xảy ra khi xóa câu hỏi: ' + error);
    }
  };

  // Pagination logic
  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = filteredQuestions.slice(indexOfFirstQuestion, indexOfLastQuestion);
  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return (
      <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Trước
          </button>
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Sau
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Hiển thị <span className="font-medium">{indexOfFirstQuestion + 1}</span> đến{' '}
              <span className="font-medium">{Math.min(indexOfLastQuestion, filteredQuestions.length)}</span> trong{' '}
              <span className="font-medium">{filteredQuestions.length}</span> kết quả
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
              </button>
              
              {pageNumbers.map(number => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    currentPage === number
                      ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {number}
                </button>
              ))}
              
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  const renderQuestionForm = () => {
    if (!editingQuestion) return null;
    
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Sửa câu hỏi</h3>
        
        <div className="space-y-4">
          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dạng bài
            </label>
            <select
              value={editForm.question_type_id || ''}
              onChange={(e) => setEditForm({...editForm, question_type_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Chọn dạng bài</option>
              {questionTypes.map(qt => (
                <option key={qt.id} value={qt.id}>
                  {qt.name} ({qt.code})
                </option>
              ))}
            </select>
          </div>
          
          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại câu hỏi
            </label>
            <select
              value={editForm.type}
              onChange={(e) => setEditForm({...editForm, type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="mcq">Trắc nghiệm (MCQ)</option>
              <option value="msq">Đúng/Sai (MSQ)</option>
              <option value="sa">Trả lời ngắn (SA)</option>
            </select>
          </div>
          
          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nội dung câu hỏi
            </label>
            <textarea
              value={editForm.question_text}
              onChange={(e) => setEditForm({...editForm, question_text: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          {/* Options (for MCQ and MSQ) */}
          {(editForm.type === 'mcq' || editForm.type === 'msq') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lựa chọn A
                </label>
                <input
                  type="text"
                  value={editForm.option_a || ''}
                  onChange={(e) => setEditForm({...editForm, option_a: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lựa chọn B
                </label>
                <input
                  type="text"
                  value={editForm.option_b || ''}
                  onChange={(e) => setEditForm({...editForm, option_b: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lựa chọn C
                </label>
                <input
                  type="text"
                  value={editForm.option_c || ''}
                  onChange={(e) => setEditForm({...editForm, option_c: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lựa chọn D
                </label>
                <input
                  type="text"
                  value={editForm.option_d || ''}
                  onChange={(e) => setEditForm({...editForm, option_d: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          )}
          
          {/* Correct Answer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đáp án đúng
            </label>
            <input
              type="text"
              value={editForm.correct_option}
              onChange={(e) => setEditForm({...editForm, correct_option: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lời giải
            </label>
            <textarea
              value={editForm.explanation}
              onChange={(e) => setEditForm({...editForm, explanation: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Độ khó
            </label>
            <select
              value={editForm.difficulty_level}
              onChange={(e) => setEditForm({...editForm, difficulty_level: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          </div>
          
          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (cách nhau bởi dấu phẩy)
            </label>
            <input
              type="text"
              value={editForm.tags || ''}
              onChange={(e) => setEditForm({...editForm, tags: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ví dụ: phương trình, đại số, cơ bản"
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Lưu
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      {renderQuestionForm()}
      
      {/* Filter Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Bộ lọc</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lớp</label>
            <select
              value={filters.subjectId}
              onChange={(e) => handleFilterChange('subjectId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Tất cả các lớp</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chương</label>
            <select
              value={filters.chapterId}
              onChange={(e) => handleFilterChange('chapterId', e.target.value)}
              disabled={!filters.subjectId}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
            >
              <option value="">Tất cả các chương</option>
              {availableChapters.map(chapter => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.name} ({chapter.code})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bài</label>
            <select
              value={filters.lessonId}
              onChange={(e) => handleFilterChange('lessonId', e.target.value)}
              disabled={!filters.chapterId && !filters.subjectId}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
            >
              <option value="">Tất cả các bài</option>
              {availableLessons.map(lesson => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.name} ({lesson.code})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dạng toán</label>
            <select
              value={filters.questionTypeId}
              onChange={(e) => handleFilterChange('questionTypeId', e.target.value)}
              disabled={!filters.lessonId && !filters.chapterId && !filters.subjectId}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
            >
              <option value="">Tất cả các dạng toán</option>
              {availableQuestionTypes.map(qt => (
                <option key={qt.id} value={qt.id}>
                  {qt.name} ({qt.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Questions Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Danh sách câu hỏi ({filteredQuestions.length})</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Câu hỏi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dạng bài
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Độ khó
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentQuestions.map((question) => (
                <tr key={question.id}>
                  <td className="px-6 py-4 whitespace-normal max-w-xs">
                    <div className="text-sm text-gray-900 line-clamp-2">
                      {question.question_text}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {question.questionType?.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {question.subject?.code} → {question.chapter?.code} → {question.lesson?.code}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {question.type === 'mcq' ? 'Trắc nghiệm' : 
                       question.type === 'msq' ? 'Đúng/Sai' : 'Trả lời ngắn'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      question.difficulty_level === 'easy' ? 'bg-green-100 text-green-800' :
                      question.difficulty_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {question.difficulty_level === 'easy' ? 'Dễ' :
                       question.difficulty_level === 'medium' ? 'Trung bình' : 'Khó'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(question)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(question.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredQuestions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">Không tìm thấy câu hỏi nào phù hợp với bộ lọc</div>
          </div>
        )}
        
        {renderPagination()}
      </div>
    </div>
  );
};

export default QuestionList;