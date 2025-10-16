import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Question } from '../types';
import { QuizManagementService } from '../services/quizManagementService';
import { supabase } from '../services/supabaseClient';

export interface QuizCreationData {
  title: string;
  maxAttempts: number;
  questions: Question[];
  description?: string;
  timeLimit?: number;
  shuffleQuestions?: boolean;
  showResults?: boolean;
  allowReview?: boolean;
  passingScore?: number;
}

export interface QuizCreationOptions {
  useSupabase?: boolean;
  redirectOnSuccess?: boolean;
  showSuccessMessage?: boolean;
  validateQuestions?: boolean;
}

export interface QuizCreationState {
  isCreating: boolean;
  error: string | null;
  success: boolean;
  createdQuiz: any | null;
  validationErrors: string[];
}

export const useQuizCreateFlow = (options: QuizCreationOptions = {}) => {
  const navigate = useNavigate();
  const {
    useSupabase = true,
    redirectOnSuccess = true,
    showSuccessMessage = true,
    validateQuestions = true
  } = options;

  const [state, setState] = useState<QuizCreationState>({
    isCreating: false,
    error: null,
    success: false,
    createdQuiz: null,
    validationErrors: []
  });

  /**
   * Validate quiz data before creation
   */
  const validateQuizData = useCallback((data: QuizCreationData): string[] => {
    const errors: string[] = [];

    // Title validation
    if (!data.title || data.title.trim().length < 3) {
      errors.push('Tiêu đề quiz phải có ít nhất 3 ký tự');
    }

    if (data.title && data.title.length > 200) {
      errors.push('Tiêu đề quiz không được vượt quá 200 ký tự');
    }

    // Questions validation
    if (!data.questions || data.questions.length === 0) {
      errors.push('Quiz phải có ít nhất 1 câu hỏi');
    }

    if (data.questions && data.questions.length > 500) {
      errors.push('Quiz không được có quá 500 câu hỏi');
    }

    // Max attempts validation
    if (data.maxAttempts < 1 || data.maxAttempts > 10) {
      errors.push('Số lần thử phải từ 1 đến 10');
    }

    // Time limit validation
    if (data.timeLimit && (data.timeLimit < 1 || data.timeLimit > 300)) {
      errors.push('Thời gian làm bài phải từ 1 đến 300 phút');
    }

    // Passing score validation
    if (data.passingScore && (data.passingScore < 0 || data.passingScore > 100)) {
      errors.push('Điểm đạt phải từ 0 đến 100');
    }

    // Individual question validation
    if (validateQuestions && data.questions) {
      data.questions.forEach((question, index) => {
        if (!question.question || question.question.trim().length < 5) {
          errors.push(`Câu hỏi ${index + 1}: Nội dung câu hỏi quá ngắn`);
        }

        if (question.type === 'mcq' || question.type === 'msq') {
          const options = [question.option_a, question.option_b, question.option_c, question.option_d];
          const validOptions = options.filter(opt => opt && opt.trim().length > 0);
          
          if (validOptions.length < 2) {
            errors.push(`Câu hỏi ${index + 1}: Phải có ít nhất 2 lựa chọn`);
          }
        }

        if (!question.correct_option || question.correct_option.trim().length === 0) {
          errors.push(`Câu hỏi ${index + 1}: Thiếu đáp án đúng`);
        }
      });
    }

    return errors;
  }, [validateQuestions]);

  /**
   * Create quiz with validation and error handling
   */
  const createQuiz = useCallback(async (data: QuizCreationData): Promise<boolean> => {
    setState(prev => ({
      ...prev,
      isCreating: true,
      error: null,
      success: false,
      validationErrors: []
    }));

    try {
      // Validate quiz data
      const validationErrors = validateQuizData(data);
      if (validationErrors.length > 0) {
        setState(prev => ({
          ...prev,
          isCreating: false,
          validationErrors,
          error: 'Dữ liệu quiz không hợp lệ'
        }));
        return false;
      }

      let result;
      let userId = '';

      if (useSupabase) {
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        if (!user) {
          setState(prev => ({
            ...prev,
            isCreating: false,
            error: 'Bạn cần đăng nhập để tạo quiz'
          }));
          return false;
        }

        userId = user.id;

        // Create quiz in Supabase
        result = await QuizManagementService.saveQuiz({
          title: data.title,
          questions: data.questions,
          max_attempts: data.maxAttempts,
          created_by: userId
        }, { useSupabase: true, userId });
      } else {
        // Create quiz in local storage
        result = await QuizManagementService.saveQuiz({
          title: data.title,
          questions: data.questions,
          max_attempts: data.maxAttempts,
          created_by: 'local'
        }, { useSupabase: false });
      }

      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          isCreating: false,
          success: true,
          createdQuiz: result.data,
          error: null
        }));

        if (showSuccessMessage) {
          // You can integrate with a toast notification system here
          console.log('Quiz đã được tạo thành công!');
        }

        if (redirectOnSuccess) {
          // Navigate to the created quiz
          if (useSupabase && result.data.slug) {
            navigate(`/exam/${result.data.slug}`);
          } else if (result.data.id) {
            navigate(`/online-exam?quizId=${result.data.id}&title=${encodeURIComponent(data.title)}&maxAttempts=${data.maxAttempts}`);
          }
        }

        return true;
      } else {
        setState(prev => ({
          ...prev,
          isCreating: false,
          error: result.error || 'Có lỗi xảy ra khi tạo quiz'
        }));
        return false;
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      setState(prev => ({
        ...prev,
        isCreating: false,
        error: error instanceof Error ? error.message : 'Có lỗi không xác định xảy ra'
      }));
      return false;
    }
  }, [useSupabase, validateQuizData, showSuccessMessage, redirectOnSuccess, navigate]);

  /**
   * Create quiz with custom redirect
   */
  const createQuizWithRedirect = useCallback(async (
    data: QuizCreationData, 
    redirectPath?: string
  ): Promise<boolean> => {
    const success = await createQuiz(data);
    
    if (success && redirectPath) {
      navigate(redirectPath);
    }
    
    return success;
  }, [createQuiz, navigate]);

  /**
   * Create multiple quizzes (batch creation)
   */
  const createMultipleQuizzes = useCallback(async (
    quizzesData: QuizCreationData[]
  ): Promise<{ success: boolean; results: any[]; errors: string[] }> => {
    setState(prev => ({
      ...prev,
      isCreating: true,
      error: null
    }));

    const results: any[] = [];
    const errors: string[] = [];

    try {
      for (let i = 0; i < quizzesData.length; i++) {
        const data = quizzesData[i];
        
        // Validate each quiz
        const validationErrors = validateQuizData(data);
        if (validationErrors.length > 0) {
          errors.push(`Quiz ${i + 1}: ${validationErrors.join(', ')}`);
          continue;
        }

        // Create quiz
        const success = await createQuiz(data);
        if (success && state.createdQuiz) {
          results.push(state.createdQuiz);
        } else {
          errors.push(`Quiz ${i + 1}: ${state.error || 'Không thể tạo quiz'}`);
        }

        // Add delay between creations to avoid overwhelming the system
        if (i < quizzesData.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setState(prev => ({
        ...prev,
        isCreating: false,
        success: results.length > 0,
        error: errors.length > 0 ? `${errors.length} quiz không thể tạo` : null
      }));

      return {
        success: results.length > 0,
        results,
        errors
      };
    } catch (error) {
      setState(prev => ({
        ...prev,
        isCreating: false,
        error: 'Có lỗi xảy ra khi tạo nhiều quiz'
      }));

      return {
        success: false,
        results,
        errors: [...errors, 'Có lỗi không xác định xảy ra']
      };
    }
  }, [createQuiz, validateQuizData, state.createdQuiz, state.error]);

  /**
   * Reset state
   */
  const resetState = useCallback(() => {
    setState({
      isCreating: false,
      error: null,
      success: false,
      createdQuiz: null,
      validationErrors: []
    });
  }, []);

  /**
   * Check if title already exists
   */
  const checkTitleExists = useCallback(async (title: string): Promise<boolean> => {
    try {
      if (useSupabase) {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        
        if (!user) return false;

        const result = await QuizManagementService.checkTitleExists(
          title, 
          user.id, 
          undefined, 
          { useSupabase: true }
        );
        return result.exists;
      } else {
        const result = await QuizManagementService.checkTitleExists(
          title, 
          'local', 
          undefined, 
          { useSupabase: false }
        );
        return result.exists;
      }
    } catch (error) {
      console.error('Error checking title:', error);
      return false;
    }
  }, [useSupabase]);

  /**
   * Get quiz creation statistics
   */
  const getCreationStats = useCallback((questions: Question[]) => {
    const mcqCount = questions.filter(q => q.type === 'mcq').length;
    const msqCount = questions.filter(q => q.type === 'msq').length;
    const saCount = questions.filter(q => q.type === 'sa').length;
    
    // Estimate completion time (rough calculation)
    const avgTimePerMcq = 1.5; // minutes
    const avgTimePerMsq = 2; // minutes
    const avgTimePerSa = 3; // minutes
    
    const estimatedTime = Math.ceil(
      mcqCount * avgTimePerMcq + 
      msqCount * avgTimePerMsq + 
      saCount * avgTimePerSa
    );

    return {
      totalQuestions: questions.length,
      questionTypes: { mcq: mcqCount, msq: msqCount, sa: saCount },
      estimatedCompletionTime: estimatedTime,
      difficulty: questions.length > 50 ? 'high' : questions.length > 20 ? 'medium' : 'low'
    };
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    createQuiz,
    createQuizWithRedirect,
    createMultipleQuizzes,
    resetState,
    
    // Utilities
    validateQuizData,
    checkTitleExists,
    getCreationStats
  };
};