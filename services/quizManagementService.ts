import { supabase } from './supabaseClient';
import { generateSlug, generateUniqueSlug, SlugPresets } from '../utils/slug';
import type { Question } from '../types';

export interface QuizMetadata {
  id?: string;
  title: string;
  slug?: string;
  max_attempts: number;
  created_by: string;
  created_at?: string;
  questions?: Question[];
  question_count?: number;
  mcq_count?: number;
  msq_count?: number;
  sa_count?: number;
  is_active?: boolean;
  creator_name?: string;
}

export interface QuizCreationData {
  title: string;
  max_attempts: number;
  questions: Question[];
  created_by: string;
}

export interface LocalQuiz {
  id: string;
  title: string;
  slug: string;
  questions: Question[];
  createdAt: string;
  questionCount: number;
  mcqCount: number;
  msqCount: number;
  saCount: number;
}

export interface QuizServiceOptions {
  useSupabase?: boolean;
  userId?: string;
}

export class QuizManagementService {
  private static readonly STORAGE_KEY = 'saved_quizzes';

  /**
   * Save quiz - automatically chooses between local storage and Supabase
   */
  static async saveQuiz(
    quizData: QuizCreationData, 
    options: QuizServiceOptions = {}
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    const { useSupabase = true, userId } = options;

    if (useSupabase && userId) {
      return this.saveQuizToSupabase(quizData);
    } else {
      return this.saveQuizToLocal(quizData);
    }
  }

  /**
   * Save quiz with metadata to Supabase
   */
  private static async saveQuizToSupabase(quizData: QuizCreationData): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const { title, max_attempts, questions, created_by } = quizData;
      
      // Calculate question statistics
      const questionCount = questions.length;
      const mcqCount = questions.filter(q => q.type === 'mcq').length;
      const msqCount = questions.filter(q => q.type === 'msq').length;
      const saCount = questions.filter(q => q.type === 'sa').length;
      
      // Generate unique slug from title using shared utility
      const slug = await generateUniqueSlug(
        title,
        async (slug: string) => await this.slugExistsInSupabase(slug),
        SlugPresets.url
      );
      
      const quizRecord = {
        title,
        slug,
        max_attempts,
        created_by,
        questions: questions,
        question_count: questionCount,
        mcq_count: mcqCount,
        msq_count: msqCount,
        sa_count: saCount,
        is_active: true
      };

      const { data, error } = await supabase
        .from('quizzes')
        .insert([quizRecord])
        .select()
        .single();

      if (error) {
        console.error('Error saving quiz:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Exception saving quiz:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Save quiz to local storage
   */
  private static async saveQuizToLocal(quizData: QuizCreationData): Promise<{ success: boolean; error?: string; data?: LocalQuiz }> {
    try {
      const { title, questions } = quizData;
      const quizzes = this.getAllLocalQuizzes();
      
      // Generate unique slug for local storage
      const slug = await generateUniqueSlug(
        title,
        async (slug: string) => quizzes.some(q => q.slug === slug),
        SlugPresets.url
      );
      
      // Count questions by type
      const mcqCount = questions.filter(q => q.type === 'mcq').length;
      const msqCount = questions.filter(q => q.type === 'msq').length;
      const saCount = questions.filter(q => q.type === 'sa').length;
      
      const newQuiz: LocalQuiz = {
        id: this.generateId(),
        title,
        slug,
        questions,
        createdAt: new Date().toISOString(),
        questionCount: questions.length,
        mcqCount,
        msqCount,
        saCount
      };
      
      quizzes.unshift(newQuiz);
      
      // Limit storage to 50 quizzes
      if (quizzes.length > 50) {
        quizzes.splice(50);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(quizzes));
      return { success: true, data: newQuiz };
    } catch (error: any) {
      console.error('Error saving quiz to local storage:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Get all quizzes - automatically chooses between local storage and Supabase
   */
  static async getAllQuizzes(options: QuizServiceOptions = {}): Promise<{ success: boolean; data?: (QuizMetadata | LocalQuiz)[]; error?: string }> {
    const { useSupabase = true, userId } = options;

    if (useSupabase) {
      return this.getAllSupabaseQuizzes();
    } else {
      return { success: true, data: this.getAllLocalQuizzes() };
    }
  }

  /**
   * Get all quizzes from Supabase
   */
  private static async getAllSupabaseQuizzes(): Promise<{ success: boolean; data?: QuizMetadata[]; error?: string }> {
    try {
      const { data: quizzes, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          creator:users!created_by(student_name, email)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching quizzes:', error);
        return { success: false, error: error.message };
      }

      // Process quizzes to include creator_name
      const processedQuizzes = (quizzes || []).map(quiz => {
        const creatorName = quiz.creator?.student_name || 
                          quiz.creator?.email?.split('@')[0] || 
                          quiz.creator_name || 
                          'Giáo viên';
        
        return {
          ...quiz,
          creator_name: creatorName
        };
      });

      return { success: true, data: processedQuizzes };
    } catch (error: any) {
      console.error('Exception fetching quizzes:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Get all quizzes from local storage
   */
  private static getAllLocalQuizzes(): LocalQuiz[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get quizzes created by a specific teacher
   */
  static async getTeacherQuizzes(teacherId: string, options: QuizServiceOptions = {}): Promise<{ success: boolean; data?: QuizMetadata[]; error?: string }> {
    const { useSupabase = true } = options;

    if (useSupabase) {
      return this.getSupabaseTeacherQuizzes(teacherId);
    } else {
      // For local storage, return all quizzes since there's no user concept
      return { success: true, data: this.getAllLocalQuizzes() };
    }
  }

  /**
   * Get quizzes created by a specific teacher from Supabase
   */
  private static async getSupabaseTeacherQuizzes(teacherId: string): Promise<{ success: boolean; data?: QuizMetadata[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select(`
          id,
          title,
          max_attempts,
          created_by,
          created_at,
          question_count
        `)
        .eq('created_by', teacherId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching teacher quizzes:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Exception fetching teacher quizzes:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Get quiz by ID - automatically chooses between local storage and Supabase
   */
  static async getQuizById(quizId: string, options: QuizServiceOptions = {}): Promise<{ success: boolean; data?: QuizMetadata | LocalQuiz; error?: string }> {
    const { useSupabase = true } = options;

    if (useSupabase) {
      return this.getSupabaseQuizById(quizId);
    } else {
      return this.getLocalQuizById(quizId);
    }
  }

  /**
   * Get quiz by ID from Supabase
   */
  private static async getSupabaseQuizById(quizId: string): Promise<{ success: boolean; data?: QuizMetadata; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching quiz:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Exception fetching quiz:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Get quiz by ID from local storage
   */
  private static getLocalQuizById(quizId: string): { success: boolean; data?: LocalQuiz; error?: string } {
    try {
      const quizzes = this.getAllLocalQuizzes();
      const quiz = quizzes.find(q => q.id === quizId);
      
      if (!quiz) {
        return { success: false, error: 'Quiz not found' };
      }
      
      return { success: true, data: quiz };
    } catch (error: any) {
      console.error('Error getting local quiz:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Get quiz by slug - works for both local and Supabase
   */
  static async getQuizBySlug(slug: string, options: QuizServiceOptions = {}): Promise<{ success: boolean; data?: QuizMetadata | LocalQuiz; error?: string }> {
    const { useSupabase = true } = options;

    if (useSupabase) {
      return this.getSupabaseQuizBySlug(slug);
    } else {
      return this.getLocalQuizBySlug(slug);
    }
  }

  /**
   * Get quiz by slug from Supabase
   */
  private static async getSupabaseQuizBySlug(slug: string): Promise<{ success: boolean; data?: QuizMetadata; error?: string }> {
    try {
      const { data: quiz, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          creator:users!created_by(student_name, email)
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching quiz by slug:', error);
        return { success: false, error: error.message };
      }

      if (quiz) {
        const creatorName = quiz.creator?.student_name || 
                          quiz.creator?.email?.split('@')[0] || 
                          quiz.creator_name || 
                          'Giáo viên';
        
        return {
          success: true,
          data: {
            ...quiz,
            creator_name: creatorName
          }
        };
      }

      return { success: false, error: 'Quiz not found' };
    } catch (error: any) {
      console.error('Exception fetching quiz by slug:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Get quiz by slug from local storage
   */
  private static getLocalQuizBySlug(slug: string): { success: boolean; data?: LocalQuiz; error?: string } {
    try {
      const quizzes = this.getAllLocalQuizzes();
      const quiz = quizzes.find(q => q.slug === slug);
      
      if (!quiz) {
        return { success: false, error: 'Quiz not found' };
      }
      
      return { success: true, data: quiz };
    } catch (error: any) {
      console.error('Error getting local quiz by slug:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Update quiz metadata - automatically chooses between local storage and Supabase
   */
  static async updateQuiz(quizId: string, updates: Partial<QuizMetadata>, options: QuizServiceOptions = {}): Promise<{ success: boolean; error?: string; data?: any }> {
    const { useSupabase = true } = options;

    if (useSupabase) {
      return this.updateSupabaseQuiz(quizId, updates);
    } else {
      return this.updateLocalQuiz(quizId, updates);
    }
  }

  /**
   * Update quiz metadata in Supabase
   */
  private static async updateSupabaseQuiz(quizId: string, updates: Partial<QuizMetadata>): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .update(updates)
        .eq('id', quizId)
        .select()
        .single();

      if (error) {
        console.error('Error updating quiz:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Exception updating quiz:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Update quiz in local storage
   */
  private static updateLocalQuiz(quizId: string, updates: Partial<QuizMetadata>): { success: boolean; error?: string; data?: LocalQuiz } {
    try {
      const quizzes = this.getAllLocalQuizzes();
      const index = quizzes.findIndex(q => q.id === quizId);
      
      if (index === -1) {
        return { success: false, error: 'Quiz not found' };
      }
      
      // Update the quiz
      quizzes[index] = { ...quizzes[index], ...updates };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(quizzes));
      return { success: true, data: quizzes[index] };
    } catch (error: any) {
      console.error('Error updating local quiz:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Delete quiz - automatically chooses between local storage and Supabase
   */
  static async deleteQuiz(quizId: string, options: QuizServiceOptions = {}): Promise<{ success: boolean; error?: string }> {
    const { useSupabase = true, userId } = options;

    if (useSupabase) {
      return this.deleteSupabaseQuiz(quizId, userId);
    } else {
      return this.deleteLocalQuiz(quizId);
    }
  }

  /**
   * Delete quiz from Supabase (soft delete by setting is_active to false)
   */
  private static async deleteSupabaseQuiz(quizId: string, userId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      let query = supabase
        .from('quizzes')
        .update({ is_active: false })
        .eq('id', quizId);

      // Add user filter if provided for security
      if (userId) {
        query = query.eq('created_by', userId);
      }

      const { error } = await query;

      if (error) {
        console.error('Error deleting quiz:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Exception deleting quiz:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Delete quiz from local storage
   */
  private static deleteLocalQuiz(quizId: string): { success: boolean; error?: string } {
    try {
      const quizzes = this.getAllLocalQuizzes();
      const index = quizzes.findIndex(q => q.id === quizId);
      
      if (index === -1) {
        return { success: false, error: 'Quiz not found' };
      }
      
      quizzes.splice(index, 1);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(quizzes));
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting local quiz:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Clear all local quizzes
   */
  static clearAllLocalQuizzes(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Check if slug exists in Supabase
   */
  private static async slugExistsInSupabase(slug: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('id')
        .eq('slug', slug)
        .eq('is_active', true)
        .limit(1);

      if (error) {
        console.error('Error checking slug:', error);
        return false;
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Error in slugExists:', error);
      return false;
    }
  }

  /**
   * Generate unique ID for local storage
   */
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Check if quiz title already exists for this teacher - works for both local and Supabase
   */
  static async checkTitleExists(title: string, teacherId: string, excludeId?: string, options: QuizServiceOptions = {}): Promise<{ exists: boolean; error?: string }> {
    const { useSupabase = true } = options;

    if (useSupabase) {
      return this.checkSupabaseTitleExists(title, teacherId, excludeId);
    } else {
      return this.checkLocalTitleExists(title, excludeId);
    }
  }

  /**
   * Check if quiz title already exists for this teacher in Supabase
   */
  private static async checkSupabaseTitleExists(title: string, teacherId: string, excludeId?: string): Promise<{ exists: boolean; error?: string }> {
    try {
      let query = supabase
        .from('quizzes')
        .select('id')
        .eq('title', title)
        .eq('created_by', teacherId)
        .eq('is_active', true);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error checking title:', error);
        return { exists: false, error: error.message };
      }

      return { exists: (data?.length || 0) > 0 };
    } catch (error: any) {
      console.error('Exception checking title:', error);
      return { exists: false, error: error.message };
    }
  }

  /**
   * Check if quiz title already exists in local storage
   */
  private static checkLocalTitleExists(title: string, excludeId?: string): { exists: boolean; error?: string } {
    try {
      const quizzes = this.getAllLocalQuizzes();
      const exists = quizzes.some(quiz => 
        quiz.title === title && (!excludeId || quiz.id !== excludeId)
      );
      
      return { exists };
    } catch (error: any) {
      console.error('Error checking local title:', error);
      return { exists: false, error: error.message };
    }
  }

  /**
   * Check if table schema is properly migrated (Supabase only)
   */
  static async checkTableSchema(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, title, slug, questions, question_count, mcq_count, msq_count, sa_count, is_active')
        .limit(1);

      if (error) {
        console.warn('Table migration incomplete:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking table schema:', error);
      return false;
    }
  }

  /**
   * Get quiz statistics
   */
  static getQuizStats(quiz: QuizMetadata | LocalQuiz): {
    totalQuestions: number;
    mcqCount: number;
    msqCount: number;
    saCount: number;
  } {
    if ('questionCount' in quiz) {
      // LocalQuiz
      return {
        totalQuestions: quiz.questionCount,
        mcqCount: quiz.mcqCount,
        msqCount: quiz.msqCount,
        saCount: quiz.saCount
      };
    } else {
      // QuizMetadata
      return {
        totalQuestions: quiz.question_count || 0,
        mcqCount: quiz.mcq_count || 0,
        msqCount: quiz.msq_count || 0,
        saCount: quiz.sa_count || 0
      };
    }
  }
}