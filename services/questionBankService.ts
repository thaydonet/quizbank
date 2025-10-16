import { supabase } from './supabaseClient';
import type { Question } from '../types';

// Database interfaces
export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface Chapter {
  id: string;
  subject_id: string;
  name: string;
  code: string;
  order_index: number;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface Lesson {
  id: string;
  chapter_id: string;
  name: string;
  code: string;
  order_index: number;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface QuestionType {
  id: string;
  lesson_id: string;
  name: string;
  code: string;
  order_index: number;
  description?: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  is_active: boolean;
  created_at: string;
}

export interface DatabaseQuestion {
  id: string;
  question_type_id: string;
  type: 'mcq' | 'msq' | 'sa';
  question_text: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_option: string;
  explanation: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  is_dynamic: boolean;
  dynamic_variables?: any;
  tags?: string[];
  created_by?: string;
  approved_by?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Add missing fields for better type safety
  question_types?: QuestionType & {
    lessons?: Lesson & {
      chapters?: Chapter & {
        subjects?: Subject;
      };
    };
  };
}

export interface QuestionCollection {
  id: string;
  name: string;
  description?: string;
  created_by?: string;
  is_public: boolean;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface QuestionUsageStats {
  id: string;
  question_id: string;
  total_attempts: number;
  correct_attempts: number;
  difficulty_rating?: number;
  last_used_at?: string;
}

// Hierarchical structure for UI
export interface QuestionHierarchy {
  subjects: (Subject & {
    chapters: (Chapter & {
      lessons: (Lesson & {
        question_types: (QuestionType & {
          questions: DatabaseQuestion[];
        })[];
      })[];
    })[];
  })[];
}

export class QuestionBankService {

  // ==================== HIERARCHY MANAGEMENT ====================

  /**
   * Get complete question hierarchy
   */
  static async getQuestionHierarchy(): Promise<QuestionHierarchy> {
    try {
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select(`
          *,
          chapters (
            *,
            lessons (
              *,
              question_types (
                *,
                questions (*)
              )
            )
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (subjectsError) throw subjectsError;

      return { subjects: subjects || [] };
    } catch (error) {
      console.error('Error fetching question hierarchy:', error);
      throw error;
    }
  }

  /**
   * Get subjects only
   */
  static async getSubjects(): Promise<Subject[]> {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching subjects:', error);
      throw error;
    }
  }

  /**
   * Get chapters by subject
   */
  static async getChaptersBySubject(subjectId: string): Promise<Chapter[]> {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching chapters:', error);
      throw error;
    }
  }

  /**
   * Get lessons by chapter
   */
  static async getLessonsByChapter(chapterId: string): Promise<Lesson[]> {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('chapter_id', chapterId)
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching lessons:', error);
      throw error;
    }
  }

  /**
   * Get question types by lesson
   */
  static async getQuestionTypesByLesson(lessonId: string): Promise<QuestionType[]> {
    try {
      const { data, error } = await supabase
        .from('question_types')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching question types:', error);
      throw error;
    }
  }

  // ==================== QUESTION MANAGEMENT ====================

  /**
   * Get questions by question type
   */
  static async getQuestionsByType(
    questionTypeId: string,
    options: {
      approvedOnly?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<DatabaseQuestion[]> {
    try {
      let query = supabase
        .from('questions')
        .select('*')
        .eq('question_type_id', questionTypeId)
        .eq('is_active', true);

      if (options.approvedOnly !== false) {
        query = query.eq('approval_status', 'approved');
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  }

  /**
   * Search questions
   */
  static async searchQuestions(
    searchTerm: string,
    filters: {
      subjectId?: string;
      chapterId?: string;
      lessonId?: string;
      questionTypeId?: string;
      type?: 'mcq' | 'msq' | 'sa';
      difficulty?: 'easy' | 'medium' | 'hard';
      isDynamic?: boolean;
      tags?: string[];
      approvalStatus?: 'pending' | 'approved' | 'rejected';
    } = {}
  ): Promise<DatabaseQuestion[]> {
    try {
      let query = supabase
        .from('questions')
        .select(`
          *,
          question_types (
            *,
            lessons (
              *,
              chapters (
                *,
                subjects (*)
              )
            )
          )
        `)
        .eq('is_active', true);

      // Apply approval status filter
      if (filters.approvalStatus) {
        query = query.eq('approval_status', filters.approvalStatus);
      } else {
        // Default to approved only if no specific status requested
        query = query.eq('approval_status', 'approved');
      }

      // Text search - improved with better matching
      if (searchTerm) {
        query = query.or(`question_text.ilike.%${searchTerm}%,explanation.ilike.%${searchTerm}%`);
      }

      // Filters
      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.difficulty) {
        query = query.eq('difficulty_level', filters.difficulty);
      }

      if (filters.isDynamic !== undefined) {
        query = query.eq('is_dynamic', filters.isDynamic);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      if (filters.questionTypeId) {
        query = query.eq('question_type_id', filters.questionTypeId);
      } else if (filters.lessonId) {
        query = query.eq('question_types.lesson_id', filters.lessonId);
      } else if (filters.chapterId) {
        query = query.eq('question_types.lessons.chapter_id', filters.chapterId);
      } else if (filters.subjectId) {
        query = query.eq('question_types.lessons.chapters.subject_id', filters.subjectId);
      }

      const { data, error } = await query.limit(100); // Increased limit for better search results

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching questions:', error);
      throw error;
    }
  }

  /**
   * Create new question
   */
  static async createQuestion(questionData: {
    question_type_id: string;
    type: 'mcq' | 'msq' | 'sa';
    question_text: string;
    option_a?: string;
    option_b?: string;
    option_c?: string;
    option_d?: string;
    correct_option: string;
    explanation: string;
    difficulty_level?: 'easy' | 'medium' | 'hard';
    is_dynamic?: boolean;
    dynamic_variables?: any;
    tags?: string[];
  }): Promise<DatabaseQuestion> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('questions')
        .insert({
          ...questionData,
          created_by: user.id,
          approved_by: user.id, // Auto-approve
          approval_status: 'approved' // All questions are auto-approved
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating question:', error);
      throw error;
    }
  }

  /**
   * Update question
   */
  static async updateQuestion(
    questionId: string,
    updates: Partial<DatabaseQuestion>
  ): Promise<DatabaseQuestion> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', questionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  }

  /**
   * Delete question (soft delete)
   */
  static async deleteQuestion(questionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ is_active: false })
        .eq('id', questionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  }

  /**
   * Approve/reject question (admin only)
   */
  static async approveQuestion(
    questionId: string,
    status: 'approved' | 'rejected'
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('questions')
        .update({
          approval_status: status,
          approved_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', questionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error approving question:', error);
      throw error;
    }
  }

  // ==================== COLLECTIONS MANAGEMENT ====================

  /**
   * Create question collection
   */
  static async createCollection(collectionData: {
    name: string;
    description?: string;
    is_public?: boolean;
    tags?: string[];
  }): Promise<QuestionCollection> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('question_collections')
        .insert({
          ...collectionData,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  }

  /**
   * Add questions to collection
   */
  static async addQuestionsToCollection(
    collectionId: string,
    questionIds: string[]
  ): Promise<void> {
    try {
      const collectionQuestions = questionIds.map((questionId, index) => ({
        collection_id: collectionId,
        question_id: questionId,
        order_index: index + 1
      }));

      const { error } = await supabase
        .from('collection_questions')
        .insert(collectionQuestions);

      if (error) throw error;
    } catch (error) {
      console.error('Error adding questions to collection:', error);
      throw error;
    }
  }

  /**
   * Get user's collections
   */
  static async getUserCollections(): Promise<QuestionCollection[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('question_collections')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user collections:', error);
      throw error;
    }
  }

  /**
   * Get collection with questions
   */
  static async getCollectionWithQuestions(collectionId: string): Promise<QuestionCollection & { questions: DatabaseQuestion[] }> {
    try {
      const { data, error } = await supabase
        .from('question_collections')
        .select(`
          *,
          collection_questions (
            order_index,
            questions (*)
          )
        `)
        .eq('id', collectionId)
        .single();

      if (error) throw error;

      // Transform the data structure
      const questions = data.collection_questions
        ?.sort((a: any, b: any) => a.order_index - b.order_index)
        .map((cq: any) => cq.questions) || [];

      return {
        ...data,
        questions
      };
    } catch (error) {
      console.error('Error fetching collection with questions:', error);
      throw error;
    }
  }

  // ==================== STATISTICS ====================

  /**
   * Update question usage statistics
   */
  static async updateQuestionStats(
    questionId: string,
    isCorrect: boolean
  ): Promise<void> {
    try {
      // Get or create stats record
      const { data: existingStats } = await supabase
        .from('question_usage_stats')
        .select('*')
        .eq('question_id', questionId)
        .single();

      if (existingStats) {
        // Update existing stats
        const { error } = await supabase
          .from('question_usage_stats')
          .update({
            total_attempts: existingStats.total_attempts + 1,
            correct_attempts: existingStats.correct_attempts + (isCorrect ? 1 : 0),
            difficulty_rating: (existingStats.correct_attempts + (isCorrect ? 1 : 0)) / (existingStats.total_attempts + 1),
            last_used_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('question_id', questionId);

        if (error) throw error;
      } else {
        // Create new stats record
        const { error } = await supabase
          .from('question_usage_stats')
          .insert({
            question_id: questionId,
            total_attempts: 1,
            correct_attempts: isCorrect ? 1 : 0,
            difficulty_rating: isCorrect ? 1.0 : 0.0,
            last_used_at: new Date().toISOString()
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating question stats:', error);
      // Don't throw error for stats updates
    }
  }

  /**
   * Get question statistics
   */
  static async getQuestionStats(questionId: string): Promise<QuestionUsageStats | null> {
    try {
      const { data, error } = await supabase
        .from('question_usage_stats')
        .select('*')
        .eq('question_id', questionId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data;
    } catch (error) {
      console.error('Error fetching question stats:', error);
      return null;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Convert database question to app question format
   */
  static convertToAppQuestion(dbQuestion: DatabaseQuestion): Question {
    return {
      id: dbQuestion.id,
      type: dbQuestion.type,
      question: dbQuestion.question_text,
      option_a: dbQuestion.option_a,
      option_b: dbQuestion.option_b,
      option_c: dbQuestion.option_c,
      option_d: dbQuestion.option_d,
      correct_option: dbQuestion.correct_option,
      explanation: dbQuestion.explanation,
      isDynamic: dbQuestion.is_dynamic,
      variables: dbQuestion.dynamic_variables
    };
  }

  /**
   * Convert app question to database format
   */
  static convertToDatabaseQuestion(
    appQuestion: Question,
    questionTypeId: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): Omit<DatabaseQuestion, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'approved_by'> {
    return {
      question_type_id: questionTypeId,
      type: appQuestion.type,
      question_text: appQuestion.question,
      option_a: appQuestion.option_a,
      option_b: appQuestion.option_b,
      option_c: appQuestion.option_c,
      option_d: appQuestion.option_d,
      correct_option: appQuestion.correct_option,
      explanation: appQuestion.explanation,
      difficulty_level: difficulty,
      is_dynamic: appQuestion.isDynamic || false,
      dynamic_variables: appQuestion.variables,
      tags: [],
      approval_status: 'approved', // Auto-approve all questions
      is_active: true
    };
  }

  /**
   * Batch import questions from JSON
   */
  static async batchImportQuestions(
    questions: Question[],
    questionTypeId: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): Promise<DatabaseQuestion[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const dbQuestions = questions.map(q => ({
        ...this.convertToDatabaseQuestion(q, questionTypeId, difficulty),
        created_by: user.id,
        approved_by: user.id, // Auto-approve imported questions
        approval_status: 'approved' // All imported questions are auto-approved
      }));

      const { data, error } = await supabase
        .from('questions')
        .insert(dbQuestions)
        .select();

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error batch importing questions:', error);
      throw error;
    }
  }

  /**
   * Get questions by subject ID
   */
  static async getQuestionsBySubject(
    subjectId: string,
    options: { approvedOnly?: boolean } = { approvedOnly: true }
  ): Promise<DatabaseQuestion[]> {
    try {
      let query = supabase
        .from('questions')
        .select(`
          *,
          question_types (
            *,
            lessons (
              *,
              chapters (
                *,
                subjects (*)
              )
            )
          )
        `)
        .eq('is_active', true);

      // Filter by approval status
      if (options.approvedOnly) {
        query = query.eq('approval_status', 'approved');
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by subject ID on the client side since we need to traverse the relationship
      const filteredData = (data || []).filter(question => {
        const subject = question.question_types?.lessons?.chapters?.subjects;
        return subject?.id === subjectId;
      });

      return filteredData;
    } catch (error) {
      console.error('Error getting questions by subject:', error);
      throw error;
    }
  }
}