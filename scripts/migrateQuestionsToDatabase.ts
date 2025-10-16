/**
 * Migration script to import questions from JSON files to Supabase database
 * Run this script to migrate existing question data to the new database structure
 */

import { supabase } from '../services/supabaseClient';
import { QuestionBankService } from '../services/questionBankService';
import { MENU_DATA } from '../constants';
import type { Question } from '../types';

interface MigrationResult {
  success: boolean;
  imported: number;
  errors: string[];
  summary: {
    subjects: number;
    chapters: number;
    lessons: number;
    questionTypes: number;
    questions: number;
  };
}

class QuestionMigrator {
  private errors: string[] = [];
  private imported = 0;
  private summary = {
    subjects: 0,
    chapters: 0,
    lessons: 0,
    questionTypes: 0,
    questions: 0
  };

  /**
   * Main migration function
   */
  async migrate(): Promise<MigrationResult> {
    try {
      console.log('🚀 Starting question migration...');
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User must be authenticated to run migration');
      }

      // Migrate hierarchy structure
      await this.migrateHierarchy();
      
      // Migrate questions from JSON files (if they exist)
      await this.migrateQuestionsFromJSON();
      
      console.log('✅ Migration completed successfully!');
      console.log(`📊 Summary:`, this.summary);
      
      return {
        success: true,
        imported: this.imported,
        errors: this.errors,
        summary: this.summary
      };
    } catch (error) {
      console.error('❌ Migration failed:', error);
      this.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        success: false,
        imported: this.imported,
        errors: this.errors,
        summary: this.summary
      };
    }
  }

  /**
   * Migrate the hierarchy structure from constants.ts
   */
  private async migrateHierarchy(): Promise<void> {
    console.log('📚 Migrating hierarchy structure...');

    for (const grade of MENU_DATA) {
      try {
        // Create or get subject
        const subject = await this.createOrGetSubject(grade.name, this.generateCode(grade.name));
        this.summary.subjects++;

        for (const chapter of grade.chapters) {
          try {
            // Create or get chapter
            const chapterRecord = await this.createOrGetChapter(
              subject.id,
              chapter.name,
              this.generateCode(chapter.name)
            );
            this.summary.chapters++;

            for (const lesson of chapter.lessons) {
              try {
                // Create or get lesson
                const lessonRecord = await this.createOrGetLesson(
                  chapterRecord.id,
                  lesson.name,
                  this.generateCode(lesson.name)
                );
                this.summary.lessons++;

                for (const questionType of lesson.types) {
                  try {
                    // Create or get question type
                    await this.createOrGetQuestionType(
                      lessonRecord.id,
                      questionType.name,
                      this.generateCode(questionType.name)
                    );
                    this.summary.questionTypes++;
                  } catch (error) {
                    this.errors.push(`Failed to create question type ${questionType.name}: ${error}`);
                  }
                }
              } catch (error) {
                this.errors.push(`Failed to create lesson ${lesson.name}: ${error}`);
              }
            }
          } catch (error) {
            this.errors.push(`Failed to create chapter ${chapter.name}: ${error}`);
          }
        }
      } catch (error) {
        this.errors.push(`Failed to create subject ${grade.name}: ${error}`);
      }
    }

    console.log(`✅ Hierarchy migration completed. Created ${this.summary.subjects} subjects, ${this.summary.chapters} chapters, ${this.summary.lessons} lessons, ${this.summary.questionTypes} question types`);
  }

  /**
   * Migrate questions from JSON files (placeholder - implement based on your JSON structure)
   */
  private async migrateQuestionsFromJSON(): Promise<void> {
    console.log('📝 Migrating questions from JSON files...');
    
    // This is a placeholder implementation
    // You would need to implement this based on your actual JSON file structure
    
    try {
      // Example: Load questions from a JSON file
      // const questionsData = await this.loadQuestionsFromFile('path/to/questions.json');
      
      // For now, we'll create some sample questions
      await this.createSampleQuestions();
      
    } catch (error) {
      this.errors.push(`Failed to migrate questions from JSON: ${error}`);
    }
  }

  /**
   * Create sample questions for testing
   */
  private async createSampleQuestions(): Promise<void> {
    console.log('📝 Creating sample questions...');

    // Get a question type to add sample questions to
    const { data: questionTypes } = await supabase
      .from('question_types')
      .select('id')
      .limit(1);

    if (!questionTypes || questionTypes.length === 0) {
      console.log('⚠️ No question types found, skipping sample questions');
      return;
    }

    const questionTypeId = questionTypes[0].id;

    const sampleQuestions = [
      {
        question_type_id: questionTypeId,
        type: 'mcq' as const,
        question_text: 'Tìm đạo hàm của hàm số $f(x) = x^2 + 2x + 1$',
        option_a: '$f\'(x) = 2x + 2$',
        option_b: '$f\'(x) = x^2 + 2$',
        option_c: '$f\'(x) = 2x + 1$',
        option_d: '$f\'(x) = x + 2$',
        correct_option: 'A',
        explanation: 'Áp dụng quy tắc đạo hàm: $(x^n)\' = nx^{n-1}$ và $(c)\' = 0$. Ta có $f\'(x) = 2x + 2$.',
        difficulty_level: 'easy' as const,
        is_dynamic: false,
        tags: ['đạo hàm', 'cơ bản']
      },
      {
        question_type_id: questionTypeId,
        type: 'sa' as const,
        question_text: 'Tính giá trị của biểu thức $2^3 + 3^2$',
        correct_option: '17',
        explanation: 'Ta có $2^3 = 8$ và $3^2 = 9$. Vậy $2^3 + 3^2 = 8 + 9 = 17$.',
        difficulty_level: 'easy' as const,
        is_dynamic: false,
        tags: ['tính toán', 'cơ bản']
      },
      {
        question_type_id: questionTypeId,
        type: 'mcq' as const,
        question_text: 'Cho hàm số $f(x) = !a!x^2 + !b!x + !c!$. Tìm đạo hàm của hàm số.',
        option_a: '$f\'(x) = {tinh: 2*!a!}x + !b!$',
        option_b: '$f\'(x) = !a!x + !b!$',
        option_c: '$f\'(x) = {tinh: 2*!a!}x + {tinh: 2*!b!}$',
        option_d: '$f\'(x) = !a!x^2 + !b!$',
        correct_option: 'A',
        explanation: 'Áp dụng quy tắc đạo hàm: $(ax^2)\' = 2ax$, $(bx)\' = b$, $(c)\' = 0$. Vậy $f\'(x) = {tinh: 2*!a!}x + !b!$.',
        difficulty_level: 'medium' as const,
        is_dynamic: true,
        dynamic_variables: {
          a: { min: 1, max: 5, type: 'integer' },
          b: { min: -5, max: 5, type: 'integer', excludeZero: true },
          c: { min: -10, max: 10, type: 'integer' }
        },
        tags: ['đạo hàm', 'động', 'tham số']
      }
    ];

    for (const questionData of sampleQuestions) {
      try {
        await QuestionBankService.createQuestion(questionData);
        this.summary.questions++;
        this.imported++;
      } catch (error) {
        this.errors.push(`Failed to create sample question: ${error}`);
      }
    }

    console.log(`✅ Created ${this.summary.questions} sample questions`);
  }

  /**
   * Create or get subject
   */
  private async createOrGetSubject(name: string, code: string) {
    const { data: existing } = await supabase
      .from('subjects')
      .select('*')
      .eq('code', code)
      .single();

    if (existing) {
      return existing;
    }

    const { data, error } = await supabase
      .from('subjects')
      .insert({ name, code, description: `Môn học ${name}` })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create or get chapter
   */
  private async createOrGetChapter(subjectId: string, name: string, code: string) {
    const { data: existing } = await supabase
      .from('chapters')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('code', code)
      .single();

    if (existing) {
      return existing;
    }

    const { data, error } = await supabase
      .from('chapters')
      .insert({ 
        subject_id: subjectId, 
        name, 
        code, 
        order_index: 1,
        description: `Chương ${name}` 
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create or get lesson
   */
  private async createOrGetLesson(chapterId: string, name: string, code: string) {
    const { data: existing } = await supabase
      .from('lessons')
      .select('*')
      .eq('chapter_id', chapterId)
      .eq('code', code)
      .single();

    if (existing) {
      return existing;
    }

    const { data, error } = await supabase
      .from('lessons')
      .insert({ 
        chapter_id: chapterId, 
        name, 
        code, 
        order_index: 1,
        description: `Bài học ${name}` 
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create or get question type
   */
  private async createOrGetQuestionType(lessonId: string, name: string, code: string) {
    const { data: existing } = await supabase
      .from('question_types')
      .select('*')
      .eq('lesson_id', lessonId)
      .eq('code', code)
      .single();

    if (existing) {
      return existing;
    }

    const { data, error } = await supabase
      .from('question_types')
      .insert({ 
        lesson_id: lessonId, 
        name, 
        code, 
        order_index: 1,
        description: `Dạng câu hỏi ${name}`,
        difficulty_level: 'medium'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Generate code from name
   */
  private generateCode(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove Vietnamese diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Keep only letters, numbers, spaces, hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Remove consecutive hyphens
      .trim()
      .substring(0, 50); // Limit length
  }

  /**
   * Load questions from JSON file (implement based on your structure)
   */
  private async loadQuestionsFromFile(filePath: string): Promise<Question[]> {
    // This is a placeholder - implement based on your JSON file structure
    // You might need to use fetch() or import the JSON directly
    
    try {
      // Example implementation:
      // const response = await fetch(filePath);
      // const data = await response.json();
      // return data.questions || [];
      
      return [];
    } catch (error) {
      console.error(`Failed to load questions from ${filePath}:`, error);
      return [];
    }
  }
}

/**
 * Run migration
 */
export const runMigration = async (): Promise<MigrationResult> => {
  const migrator = new QuestionMigrator();
  return await migrator.migrate();
};

/**
 * Migration utility for manual execution
 */
export const migrateQuestions = async () => {
  console.log('🔄 Starting question migration...');
  
  const result = await runMigration();
  
  if (result.success) {
    console.log('✅ Migration completed successfully!');
    console.log(`📊 Imported ${result.imported} items`);
    console.log('📈 Summary:', result.summary);
  } else {
    console.error('❌ Migration failed!');
    console.error('🚨 Errors:', result.errors);
  }
  
  return result;
};

// For browser console usage
if (typeof window !== 'undefined') {
  (window as any).migrateQuestions = migrateQuestions;
}