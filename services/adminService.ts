import { supabase } from './supabaseClient';
import type { Subject, Chapter, Lesson, QuestionType, DatabaseQuestion } from './questionBankService';

export interface CreateSubjectData {
  name: string;
  code: string;
  description?: string;
}

export interface CreateChapterData {
  subject_id: string;
  name: string;
  code: string;
  order_index: number;
  description?: string;
}

export interface CreateLessonData {
  chapter_id: string;
  name: string;
  code: string;
  order_index: number;
  description?: string;
}

export interface CreateQuestionTypeData {
  lesson_id: string;
  name: string;
  code: string;
  order_index: number;
  description?: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
}

export interface CreateQuestionData {
  question_type_id: string;
  type: 'mcq' | 'msq' | 'sa';
  question_text: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_option: string;
  explanation?: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  tags?: string[];
}

export class AdminService {
  /**
   * Thêm môn học mới
   */
  static async createSubject(data: CreateSubjectData): Promise<Subject> {
    try {
      const { data: result, error } = await supabase
        .from('subjects')
        .insert({
          ...data,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Error creating subject:', error);
      throw error;
    }
  }

  /**
   * Thêm chương mới
   */
  static async createChapter(data: CreateChapterData): Promise<Chapter> {
    try {
      const { data: result, error } = await supabase
        .from('chapters')
        .insert({
          ...data,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Error creating chapter:', error);
      throw error;
    }
  }

  /**
   * Thêm bài học mới
   */
  static async createLesson(data: CreateLessonData): Promise<Lesson> {
    try {
      const { data: result, error } = await supabase
        .from('lessons')
        .insert({
          ...data,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Error creating lesson:', error);
      throw error;
    }
  }

  /**
   * Thêm dạng bài mới
   */
  static async createQuestionType(data: CreateQuestionTypeData): Promise<QuestionType> {
    try {
      const { data: result, error } = await supabase
        .from('question_types')
        .insert({
          ...data,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Error creating question type:', error);
      throw error;
    }
  }

  /**
   * Thêm câu hỏi mới
   */
  static async createQuestion(data: CreateQuestionData): Promise<DatabaseQuestion> {
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: result, error } = await supabase
        .from('questions')
        .insert({
          ...data,
          created_by: user.id,
          approved_by: user.id, // Auto-approve
          approval_status: 'approved',
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Error creating question:', error);
      throw error;
    }
  }

  /**
   * Bulk insert questions. Each item should follow CreateQuestionData shape.
   * This helper will set created_by/approved_by from current session and auto-approve.
   */
  static async createQuestionsBulk(items: CreateQuestionData[]): Promise<void> {
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Map items and ensure required fields exist
      const payload = items.map((it) => ({
        ...it,
        created_by: user.id,
        approved_by: user.id,
        approval_status: 'approved',
        is_active: true
      }));

      const { error } = await supabase
        .from('questions')
        .insert(payload);

      if (error) throw error;
    } catch (error) {
      console.error('Error bulk creating questions:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách môn học
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
   * Lấy danh sách chương theo môn học
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
   * Lấy danh sách bài học theo chương
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
   * Lấy danh sách dạng bài theo bài học
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

  /**
   * Tạo dữ liệu mẫu hoàn chỉnh
   */
  static async createSampleData(): Promise<void> {
    try {
      // 1. Tạo môn học
      const subject = await this.createSubject({
        name: 'Toán học',
        code: 'TOAN',
        description: 'Môn Toán học phổ thông'
      });

      // 2. Tạo chương
      const chapter = await this.createChapter({
        subject_id: subject.id,
        name: 'Đại số',
        code: 'DAI-SO',
        order_index: 1,
        description: 'Chương về đại số'
      });

      // 3. Tạo bài học
      const lesson = await this.createLesson({
        chapter_id: chapter.id,
        name: 'Phương trình bậc nhất',
        code: 'BAI1',
        order_index: 1,
        description: 'Bài về phương trình bậc nhất'
      });

      // 4. Tạo dạng bài
      const questionType = await this.createQuestionType({
        lesson_id: lesson.id,
        name: 'Giải phương trình cơ bản',
        code: 'DANG1',
        order_index: 1,
        description: 'Dạng giải phương trình cơ bản',
        difficulty_level: 'easy'
      });

      // 5. Tạo câu hỏi mẫu
      const sampleQuestions = [
        {
          question_type_id: questionType.id,
          type: 'mcq' as const,
          question_text: 'Giải phương trình: 2x + 3 = 7',
          option_a: 'x = 1',
          option_b: 'x = 2',
          option_c: 'x = 3',
          option_d: 'x = 4',
          correct_option: 'B',
          explanation: 'Ta có: 2x + 3 = 7 ⟹ 2x = 4 ⟹ x = 2',
          difficulty_level: 'easy' as const
        },
        {
          question_type_id: questionType.id,
          type: 'mcq' as const,
          question_text: 'Giải phương trình: 3x - 5 = 10',
          option_a: 'x = 3',
          option_b: 'x = 4',
          option_c: 'x = 5',
          option_d: 'x = 6',
          correct_option: 'C',
          explanation: 'Ta có: 3x - 5 = 10 ⟹ 3x = 15 ⟹ x = 5',
          difficulty_level: 'easy' as const
        },
        {
          question_type_id: questionType.id,
          type: 'sa' as const,
          question_text: 'Tìm nghiệm của phương trình: 4x + 8 = 0',
          correct_option: 'x = -2',
          explanation: 'Ta có: 4x + 8 = 0 ⟹ 4x = -8 ⟹ x = -2',
          difficulty_level: 'easy' as const
        }
      ];

      for (const questionData of sampleQuestions) {
        await this.createQuestion(questionData);
      }

      console.log('Sample data created successfully!');
    } catch (error) {
      console.error('Error creating sample data:', error);
      throw error;
    }
  }

  /**
   * Xóa môn học (soft delete)
   */
  static async deleteSubject(subjectId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('subjects')
        .update({ is_active: false })
        .eq('id', subjectId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting subject:', error);
      throw error;
    }
  }

  /**
   * Xóa chương (soft delete)
   */
  static async deleteChapter(chapterId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chapters')
        .update({ is_active: false })
        .eq('id', chapterId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting chapter:', error);
      throw error;
    }
  }

  /**
   * Xóa bài học (soft delete)
   */
  static async deleteLesson(lessonId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ is_active: false })
        .eq('id', lessonId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting lesson:', error);
      throw error;
    }
  }

  /**
   * Xóa dạng bài (soft delete)
   */
  static async deleteQuestionType(questionTypeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('question_types')
        .update({ is_active: false })
        .eq('id', questionTypeId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting question type:', error);
      throw error;
    }
  }

  /**
   * Xóa câu hỏi (soft delete)
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
}