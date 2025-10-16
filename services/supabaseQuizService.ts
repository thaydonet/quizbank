import { supabase } from './supabaseClient';
import type { Question } from '../types';

export interface SupabaseQuiz {
  id: string;
  title: string;
  slug: string;
  questions: Question[];
  question_count: number;
  mcq_count: number;
  msq_count: number;
  sa_count: number;
  created_by: string;
  creator_name?: string; // Teacher name for display
  created_at: string;
  is_active: boolean;
  max_attempts?: number;
}

export interface CreateQuizData {
  title: string;
  questions: Question[];
}

export class SupabaseQuizService {
  /**
   * Create a new quiz in Supabase
   */
  static async createQuiz(data: CreateQuizData, userId: string): Promise<SupabaseQuiz | null> {
    try {
      // Get user info for creator_name
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('student_name, email, role')
        .eq('id', userId)
        .single();
      
      let creatorName = 'Giáo viên';
      if (userData) {
        creatorName = userData.student_name || userData.email?.split('@')[0] || 'Giáo viên';
      }
      
      // Generate unique slug from title
      const slug = await this.generateUniqueSlug(data.title);
      
      // Count questions by type
      const mcqCount = data.questions.filter(q => q.type === 'mcq').length;
      const msqCount = data.questions.filter(q => q.type === 'msq').length;
      const saCount = data.questions.filter(q => q.type === 'sa').length;
      
      const quizData = {
        title: data.title,
        slug,
        questions: data.questions,
        question_count: data.questions.length,
        mcq_count: mcqCount,
        msq_count: msqCount,
        sa_count: saCount,
        created_by: userId,
        creator_name: creatorName,
        is_active: true,
        max_attempts: 1
      };

      const { data: quiz, error } = await supabase
        .from('quizzes')
        .insert(quizData)
        .select('*')
        .single();

      if (error) {
        console.error('Error creating quiz:', error);
        
        // If error is due to missing columns, try with minimal data
        if (error.message?.includes('column') && error.message?.includes('does not exist')) {
          console.warn('Some columns missing, trying with basic quiz data');
          const basicQuizData = {
            title: data.title,
            created_by: userId
          };
          
          const { data: basicQuiz, error: basicError } = await supabase
            .from('quizzes')
            .insert(basicQuizData)
            .select('*')
            .single();
            
          if (basicError) {
            console.error('Error creating basic quiz:', basicError);
            return null;
          }
          
          // Return with default values for missing fields
          return {
            ...basicQuiz,
            slug: this.generateSlug(data.title),
            questions: data.questions,
            question_count: data.questions.length,
            mcq_count: mcqCount,
            msq_count: msqCount,
            sa_count: saCount,
            is_active: true
          };
        }
        
        return null;
      }

      return quiz;
    } catch (error) {
      console.error('Error in createQuiz:', error);
      return null;
    }
  }

  /**
   * Get all active quizzes with teacher information
   */
  static async getAllQuizzes(): Promise<SupabaseQuiz[]> {
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
        return [];
      }

      // Process quizzes to include creator_name
      return (quizzes || []).map(quiz => {
        const creatorName = quiz.creator?.student_name || 
                          quiz.creator?.email?.split('@')[0] || 
                          quiz.creator_name || 
                          'Giáo viên';
        
        return {
          ...quiz,
          creator_name: creatorName
        };
      });
    } catch (error) {
      console.error('Error in getAllQuizzes:', error);
      return [];
    }
  }

  /**
   * Get quiz by ID with teacher information
   */
  static async getQuizById(id: string): Promise<SupabaseQuiz | null> {
    try {
      const { data: quiz, error } = await supabase
        .from('quizzes')
        .select(`
          *,
          creator:users!created_by(student_name, email)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching quiz:', error);
        return null;
      }

      if (quiz) {
        const creatorName = quiz.creator?.student_name || 
                          quiz.creator?.email?.split('@')[0] || 
                          quiz.creator_name || 
                          'Giáo viên';
        
        return {
          ...quiz,
          creator_name: creatorName
        };
      }

      return quiz;
    } catch (error) {
      console.error('Error in getQuizById:', error);
      return null;
    }
  }

  /**
   * Get quiz by slug with teacher information
   */
  static async getQuizBySlug(slug: string): Promise<SupabaseQuiz | null> {
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
        return null;
      }

      if (quiz) {
        const creatorName = quiz.creator?.student_name || 
                          quiz.creator?.email?.split('@')[0] || 
                          quiz.creator_name || 
                          'Giáo viên';
        
        return {
          ...quiz,
          creator_name: creatorName
        };
      }

      return quiz;
    } catch (error) {
      console.error('Error in getQuizBySlug:', error);
      return null;
    }
  }

  /**
   * Delete quiz (soft delete by setting is_active to false)
   */
  static async deleteQuiz(id: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ is_active: false })
        .eq('id', id)
        .eq('created_by', userId);

      if (error) {
        console.error('Error deleting quiz:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteQuiz:', error);
      return false;
    }
  }

  /**
   * Get quizzes created by a specific user
   */
  static async getQuizzesByUser(userId: string): Promise<SupabaseQuiz[]> {
    try {
      const { data: quizzes, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('created_by', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user quizzes:', error);
        return [];
      }

      return quizzes || [];
    } catch (error) {
      console.error('Error in getQuizzesByUser:', error);
      return [];
    }
  }

  /**
   * Generate URL-friendly slug from title with better Vietnamese support
   */
  private static generateSlug(title: string): string {
    // Enhanced Vietnamese character mapping
    const vietnameseMap: { [key: string]: string } = {
      'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a', 'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
      'À': 'A', 'Á': 'A', 'Ạ': 'A', 'Ả': 'A', 'Ã': 'A', 'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ậ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ặ': 'A', 'Ẳ': 'A', 'Ẵ': 'A',
      'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
      'È': 'E', 'É': 'E', 'Ẹ': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ệ': 'E', 'Ể': 'E', 'Ễ': 'E',
      'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
      'Ì': 'I', 'Í': 'I', 'Ị': 'I', 'Ỉ': 'I', 'Ĩ': 'I',
      'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o', 'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
      'Ò': 'O', 'Ó': 'O', 'Ọ': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ộ': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ợ': 'O', 'Ở': 'O', 'Ỡ': 'O',
      'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u', 'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
      'Ù': 'U', 'Ú': 'U', 'Ụ': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ự': 'U', 'Ử': 'U', 'Ữ': 'U',
      'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
      'Ỳ': 'Y', 'Ý': 'Y', 'Ỵ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y',
      'đ': 'd', 'Đ': 'D'
    };
    
    return title
      .trim()
      // Replace Vietnamese characters first
      .split('')
      .map(char => vietnameseMap[char] || char)
      .join('')
      .toLowerCase()
      // Remove special characters except spaces and hyphens
      .replace(/[^a-z0-9\s-]/g, '')
      // Replace multiple spaces with single space
      .replace(/\s+/g, ' ')
      // Replace spaces with hyphens
      .replace(/\s/g, '-')
      // Remove consecutive hyphens
      .replace(/-+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, '')
      // Limit length to 50 characters
      .substring(0, 50)
      // Remove trailing hyphen if any
      .replace(/-+$/, '');
  }

  /**
   * Check if slug exists
   */
  static async slugExists(slug: string): Promise<boolean> {
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

      return data.length > 0;
    } catch (error) {
      console.error('Error in slugExists:', error);
      return false;
    }
  }

  /**
   * Check if the quizzes table has been properly migrated
   */
  static async checkTableSchema(): Promise<boolean> {
    try {
      // Try to query with new columns to check if migration is complete
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
   * Generate unique slug
   */
  static async generateUniqueSlug(title: string): Promise<string> {
    let baseSlug = this.generateSlug(title);
    let slug = baseSlug;
    let counter = 1;

    while (await this.slugExists(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }
}