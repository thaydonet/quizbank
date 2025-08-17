import { supabase } from '../lib/supabase';
import type { Question } from '../types';

export interface SavedQuiz {
  id: string;
  title: string;
  slug: string;
  description?: string;
  questions: Question[];
  created_by: string;
  is_public: boolean;
  created_at: string;
  questionCount: number;
  mcqCount: number;
  msqCount: number;
  saCount: number;
}

export class QuizService {
  // Lấy tất cả quiz của user hiện tại
  static async getAllQuizzes(): Promise<SavedQuiz[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(quiz => ({
        ...quiz,
        questionCount: quiz.questions?.length || 0,
        mcqCount: quiz.questions?.filter((q: Question) => q.type === 'mcq').length || 0,
        msqCount: quiz.questions?.filter((q: Question) => q.type === 'msq').length || 0,
        saCount: quiz.questions?.filter((q: Question) => q.type === 'sa').length || 0,
      }));
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      return [];
    }
  }

  // Lấy quiz public (cho học sinh)
  static async getPublicQuizzes(): Promise<SavedQuiz[]> {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          users!quizzes_created_by_fkey(full_name)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(quiz => ({
        ...quiz,
        questionCount: quiz.questions?.length || 0,
        mcqCount: quiz.questions?.filter((q: Question) => q.type === 'mcq').length || 0,
        msqCount: quiz.questions?.filter((q: Question) => q.type === 'msq').length || 0,
        saCount: quiz.questions?.filter((q: Question) => q.type === 'sa').length || 0,
      }));
    } catch (error) {
      console.error('Error fetching public quizzes:', error);
      return [];
    }
  }

  // Tạo slug từ title
  static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now();
  }

  // Lưu quiz mới với custom title và slug
  static async saveQuizWithCustomTitle(
    customTitle: string,
    questions: Question[],
    isPublic: boolean = false,
    description?: string
  ): Promise<SavedQuiz | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const slug = this.generateSlug(customTitle);

      const { data, error } = await supabase
        .from('quizzes')
        .insert({
          title: customTitle,
          slug,
          description,
          questions,
          created_by: user.id,
          is_public: isPublic
        })
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        questionCount: questions.length,
        mcqCount: questions.filter(q => q.type === 'mcq').length,
        msqCount: questions.filter(q => q.type === 'msq').length,
        saCount: questions.filter(q => q.type === 'sa').length,
      };
    } catch (error) {
      console.error('Error saving quiz:', error);
      return null;
    }
  }

  // Lưu quiz mới (backward compatibility)
  static async saveQuiz(title: string, questions: Question[], isPublic: boolean = false): Promise<SavedQuiz | null> {
    return this.saveQuizWithCustomTitle(title, questions, isPublic);
  }

  // Lấy quiz theo slug
  static async getQuizBySlug(slug: string): Promise<SavedQuiz | null> {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        questionCount: data.questions.length,
        mcqCount: data.questions.filter((q: Question) => q.type === 'mcq').length,
        msqCount: data.questions.filter((q: Question) => q.type === 'msq').length,
        saCount: data.questions.filter((q: Question) => q.type === 'sa').length,
      };
    } catch (error) {
      console.error('Error getting quiz by slug:', error);
      return null;
    }
  }

  // Lấy quiz theo ID
  static async getQuizById(id: string): Promise<SavedQuiz | null> {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        ...data,
        questionCount: data.questions?.length || 0,
        mcqCount: data.questions?.filter((q: Question) => q.type === 'mcq').length || 0,
        msqCount: data.questions?.filter((q: Question) => q.type === 'msq').length || 0,
        saCount: data.questions?.filter((q: Question) => q.type === 'sa').length || 0,
      };
    } catch (error) {
      console.error('Error fetching quiz:', error);
      return null;
    }
  }

  // Cập nhật quiz
  static async updateQuiz(id: string, updates: Partial<SavedQuiz>): Promise<SavedQuiz | null> {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        questionCount: data.questions?.length || 0,
        mcqCount: data.questions?.filter((q: Question) => q.type === 'mcq').length || 0,
        msqCount: data.questions?.filter((q: Question) => q.type === 'msq').length || 0,
        saCount: data.questions?.filter((q: Question) => q.type === 'sa').length || 0,
      };
    } catch (error) {
      console.error('Error updating quiz:', error);
      return null;
    }
  }

  // Xóa quiz
  static async deleteQuiz(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting quiz:', error);
      return false;
    }
  }

  // Xóa tất cả quiz của user
  static async clearAllQuizzes(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('created_by', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error clearing quizzes:', error);
      return false;
    }
  }

  // Lưu kết quả thi
  static async saveQuizAttempt(
    quizId: string, 
    answers: any, 
    score: number
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quizId,
          user_id: user.id,
          answers,
          score,
          completed_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
      return false;
    }
  }

  // Lấy lịch sử thi của user
  static async getUserAttempts(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          quizzes(title, created_at)
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user attempts:', error);
      return [];
    }
  }

  // Lấy thống kê quiz cho giáo viên
  static async getQuizStats(quizId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          users(full_name, email)
        `)
        .eq('quiz_id', quizId)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      const attempts = data || [];
      const totalAttempts = attempts.length;
      const averageScore = totalAttempts > 0 
        ? attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / totalAttempts 
        : 0;

      return {
        totalAttempts,
        averageScore,
        attempts
      };
    } catch (error) {
      console.error('Error fetching quiz stats:', error);
      return { totalAttempts: 0, averageScore: 0, attempts: [] };
    }
  }
}