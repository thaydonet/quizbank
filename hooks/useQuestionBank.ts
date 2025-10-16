import { useState, useEffect, useCallback } from 'react';
import { QuestionBankService, Subject, Chapter, Lesson, QuestionType, DatabaseQuestion } from '../services/questionBankService';
import type { Question } from '../types';

export interface UseQuestionBankReturn {
  // Hierarchy data
  subjects: Subject[];
  chapters: Chapter[];
  lessons: Lesson[];
  questionTypes: QuestionType[];
  questions: DatabaseQuestion[];
  
  // Selection state
  selectedSubject: string;
  selectedChapter: string;
  selectedLesson: string;
  selectedQuestionType: string;
  
  // Loading states
  loading: boolean;
  loadingQuestions: boolean;
  
  // Actions
  setSelectedSubject: (id: string) => void;
  setSelectedChapter: (id: string) => void;
  setSelectedLesson: (id: string) => void;
  setSelectedQuestionType: (id: string) => void;
  
  // Question operations
  searchQuestions: (term: string, filters?: any) => Promise<DatabaseQuestion[]>;
  getQuestionsForQuiz: (questionTypeId: string, count?: number) => Promise<Question[]>;
  createQuestion: (questionData: any) => Promise<DatabaseQuestion>;
  
  // Utility functions
  convertToAppQuestions: (dbQuestions: DatabaseQuestion[]) => Question[];
  getQuestionPath: (questionTypeId: string) => Promise<string>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

export const useQuestionBank = (): UseQuestionBankReturn => {
  // State
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
  const [questions, setQuestions] = useState<DatabaseQuestion[]>([]);
  
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [selectedQuestionType, setSelectedQuestionType] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
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

  // Load functions
  const loadSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await QuestionBankService.getSubjects();
      setSubjects(data);
    } catch (err) {
      setError('Không thể tải danh sách môn học');
      console.error('Error loading subjects:', err);
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
      setError('Không thể tải danh sách chương');
      console.error('Error loading chapters:', err);
    }
  };

  const loadLessons = async (chapterId: string) => {
    try {
      setError(null);
      const data = await QuestionBankService.getLessonsByChapter(chapterId);
      setLessons(data);
    } catch (err) {
      setError('Không thể tải danh sách bài học');
      console.error('Error loading lessons:', err);
    }
  };

  const loadQuestionTypes = async (lessonId: string) => {
    try {
      setError(null);
      const data = await QuestionBankService.getQuestionTypesByLesson(lessonId);
      setQuestionTypes(data);
    } catch (err) {
      setError('Không thể tải danh sách dạng câu hỏi');
      console.error('Error loading question types:', err);
    }
  };

  const loadQuestions = async (questionTypeId: string) => {
    try {
      setLoadingQuestions(true);
      setError(null);
      const data = await QuestionBankService.getQuestionsByType(questionTypeId, { approvedOnly: true });
      setQuestions(data);
    } catch (err) {
      setError('Không thể tải danh sách câu hỏi');
      console.error('Error loading questions:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Search questions
  const searchQuestions = useCallback(async (term: string, filters: any = {}) => {
    try {
      setError(null);
      // Pass the search term to the service layer for server-side filtering
      const data = await QuestionBankService.searchQuestions(term, filters);
      return data;
    } catch (err) {
      setError('Không thể tìm kiếm câu hỏi');
      console.error('Error searching questions:', err);
      return [];
    }
  }, []);

  // Get questions for quiz (compatible with existing QuizBankPage)
  const getQuestionsForQuiz = useCallback(async (questionTypeId: string, count: number = 10): Promise<Question[]> => {
    try {
      setError(null);
      const dbQuestions = await QuestionBankService.getQuestionsByType(questionTypeId, { 
        approvedOnly: true, 
        limit: count 
      });
      
      // Convert to app format
      return dbQuestions.map(q => QuestionBankService.convertToAppQuestion(q));
    } catch (err) {
      setError('Không thể tải câu hỏi cho quiz');
      console.error('Error getting questions for quiz:', err);
      return [];
    }
  }, []);

  // Create question
  const createQuestion = useCallback(async (questionData: any): Promise<DatabaseQuestion> => {
    try {
      setError(null);
      const newQuestion = await QuestionBankService.createQuestion(questionData);
      
      // Reload questions if we're viewing the same question type
      if (selectedQuestionType === questionData.question_type_id) {
        loadQuestions(selectedQuestionType);
      }
      
      return newQuestion;
    } catch (err) {
      setError('Không thể tạo câu hỏi');
      console.error('Error creating question:', err);
      throw err;
    }
  }, [selectedQuestionType]);

  // Convert database questions to app format
  const convertToAppQuestions = useCallback((dbQuestions: DatabaseQuestion[]): Question[] => {
    return dbQuestions.map(q => QuestionBankService.convertToAppQuestion(q));
  }, []);

  // Get question path (for breadcrumb or navigation)
  const getQuestionPath = useCallback(async (questionTypeId: string): Promise<string> => {
    try {
      // This would require a more complex query to get the full path
      // For now, return a simple path
      const questionType = questionTypes.find(qt => qt.id === questionTypeId);
      if (questionType) {
        const lesson = lessons.find(l => l.id === questionType.lesson_id);
        if (lesson) {
          const chapter = chapters.find(c => c.id === lesson.chapter_id);
          if (chapter) {
            const subject = subjects.find(s => s.id === chapter.subject_id);
            if (subject) {
              return `${subject.name} > ${chapter.name} > ${lesson.name} > ${questionType.name}`;
            }
          }
        }
      }
      return 'Không xác định';
    } catch (err) {
      console.error('Error getting question path:', err);
      return 'Lỗi';
    }
  }, [subjects, chapters, lessons, questionTypes]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Custom setters that also clear dependent data
  const handleSetSelectedSubject = useCallback((id: string) => {
    setSelectedSubject(id);
    setSelectedChapter('');
    setSelectedLesson('');
    setSelectedQuestionType('');
    setChapters([]);
    setLessons([]);
    setQuestionTypes([]);
    setQuestions([]);
  }, []);

  const handleSetSelectedChapter = useCallback((id: string) => {
    setSelectedChapter(id);
    setSelectedLesson('');
    setSelectedQuestionType('');
    setLessons([]);
    setQuestionTypes([]);
    setQuestions([]);
  }, []);

  const handleSetSelectedLesson = useCallback((id: string) => {
    setSelectedLesson(id);
    setSelectedQuestionType('');
    setQuestionTypes([]);
    setQuestions([]);
  }, []);

  const handleSetSelectedQuestionType = useCallback((id: string) => {
    setSelectedQuestionType(id);
    setQuestions([]);
  }, []);

  return {
    // Data
    subjects,
    chapters,
    lessons,
    questionTypes,
    questions,
    
    // Selection
    selectedSubject,
    selectedChapter,
    selectedLesson,
    selectedQuestionType,
    
    // Loading
    loading,
    loadingQuestions,
    
    // Actions
    setSelectedSubject: handleSetSelectedSubject,
    setSelectedChapter: handleSetSelectedChapter,
    setSelectedLesson: handleSetSelectedLesson,
    setSelectedQuestionType: handleSetSelectedQuestionType,
    
    // Operations
    searchQuestions,
    getQuestionsForQuiz,
    createQuestion,
    
    // Utilities
    convertToAppQuestions,
    getQuestionPath,
    
    // Error handling
    error,
    clearError
  };
};