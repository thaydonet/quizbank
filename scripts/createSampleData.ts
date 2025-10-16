import { supabase } from '../services/supabaseClient';

export interface CreateSampleDataResult {
  success: boolean;
  message: string;
  details?: string[];
  summary?: {
    subjects: number;
    chapters: number;
    lessons: number;
    questionTypes: number;
  };
}

export const createSampleData = async (): Promise<CreateSampleDataResult> => {
  try {
    console.log('🚀 Creating sample data...');
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated');
    }

    const details: string[] = [];
    let summary = {
      subjects: 0,
      chapters: 0,
      lessons: 0,
      questionTypes: 0
    };

    // 1. Create subjects
    const subjects = [
      { name: 'Toán 10', code: 'toan-10', description: 'Toán học lớp 10' },
      { name: 'Toán 11', code: 'toan-11', description: 'Toán học lớp 11' },
      { name: 'Toán 12', code: 'toan-12', description: 'Toán học lớp 12' }
    ];

    for (const subjectData of subjects) {
      const { data: existing } = await supabase
        .from('subjects')
        .select('id')
        .eq('code', subjectData.code)
        .single();

      if (!existing) {
        const { error } = await supabase
          .from('subjects')
          .insert(subjectData);
        
        if (error) throw error;
        summary.subjects++;
        details.push(`✅ Created subject: ${subjectData.name}`);
      } else {
        details.push(`ℹ️ Subject already exists: ${subjectData.name}`);
      }
    }

    // 2. Create chapters for Toán 12
    const { data: toan12 } = await supabase
      .from('subjects')
      .select('id')
      .eq('code', 'toan-12')
      .single();

    if (toan12) {
      const chapters = [
        { 
          subject_id: toan12.id, 
          name: 'Chương 1: Ứng dụng đạo hàm', 
          code: 'chuong-1', 
          order_index: 1,
          description: 'Ứng dụng đạo hàm để khảo sát hàm số'
        },
        { 
          subject_id: toan12.id, 
          name: 'Chương 2: Nguyên hàm và tích phân', 
          code: 'chuong-2', 
          order_index: 2,
          description: 'Nguyên hàm, tích phân và ứng dụng'
        }
      ];

      for (const chapterData of chapters) {
        const { data: existing } = await supabase
          .from('chapters')
          .select('id')
          .eq('subject_id', chapterData.subject_id)
          .eq('code', chapterData.code)
          .single();

        if (!existing) {
          const { error } = await supabase
            .from('chapters')
            .insert(chapterData);
          
          if (error) throw error;
          summary.chapters++;
          details.push(`✅ Created chapter: ${chapterData.name}`);
        } else {
          details.push(`ℹ️ Chapter already exists: ${chapterData.name}`);
        }
      }

      // 3. Create lessons for Chapter 1
      const { data: chapter1 } = await supabase
        .from('chapters')
        .select('id')
        .eq('subject_id', toan12.id)
        .eq('code', 'chuong-1')
        .single();

      if (chapter1) {
        const lessons = [
          {
            chapter_id: chapter1.id,
            name: 'Bài 1: Sự đồng biến, nghịch biến',
            code: 'bai-1',
            order_index: 1,
            description: 'Xét tính đơn điệu của hàm số'
          },
          {
            chapter_id: chapter1.id,
            name: 'Bài 2: Cực trị của hàm số',
            code: 'bai-2',
            order_index: 2,
            description: 'Tìm cực đại, cực tiểu của hàm số'
          },
          {
            chapter_id: chapter1.id,
            name: 'Bài 3: GTLN, GTNN',
            code: 'bai-3',
            order_index: 3,
            description: 'Giá trị lớn nhất, nhỏ nhất của hàm số'
          }
        ];

        for (const lessonData of lessons) {
          const { data: existing } = await supabase
            .from('lessons')
            .select('id')
            .eq('chapter_id', lessonData.chapter_id)
            .eq('code', lessonData.code)
            .single();

          if (!existing) {
            const { error } = await supabase
              .from('lessons')
              .insert(lessonData);
            
            if (error) throw error;
            summary.lessons++;
            details.push(`✅ Created lesson: ${lessonData.name}`);
          } else {
            details.push(`ℹ️ Lesson already exists: ${lessonData.name}`);
          }
        }

        // 4. Create question types for Bài 1
        const { data: lesson1 } = await supabase
          .from('lessons')
          .select('id')
          .eq('chapter_id', chapter1.id)
          .eq('code', 'bai-1')
          .single();

        if (lesson1) {
          const questionTypes = [
            {
              lesson_id: lesson1.id,
              name: 'Dạng 1: Xét tính đơn điệu',
              code: 'dang-1',
              order_index: 1,
              description: 'Xét tính đồng biến, nghịch biến của hàm số',
              difficulty_level: 'medium'
            },
            {
              lesson_id: lesson1.id,
              name: 'Dạng 2: Tìm khoảng đơn điệu',
              code: 'dang-2',
              order_index: 2,
              description: 'Tìm khoảng đồng biến, nghịch biến',
              difficulty_level: 'medium'
            },
            {
              lesson_id: lesson1.id,
              name: 'Dạng 3: Tham số m',
              code: 'dang-3',
              order_index: 3,
              description: 'Bài toán có tham số về tính đơn điệu',
              difficulty_level: 'hard'
            }
          ];

          for (const questionTypeData of questionTypes) {
            const { data: existing } = await supabase
              .from('question_types')
              .select('id')
              .eq('lesson_id', questionTypeData.lesson_id)
              .eq('code', questionTypeData.code)
              .single();

            if (!existing) {
              const { error } = await supabase
                .from('question_types')
                .insert(questionTypeData);
              
              if (error) throw error;
              summary.questionTypes++;
              details.push(`✅ Created question type: ${questionTypeData.name}`);
            } else {
              details.push(`ℹ️ Question type already exists: ${questionTypeData.name}`);
            }
          }
        }
      }
    }

    console.log('✅ Sample data creation completed!');
    console.log('📊 Summary:', summary);

    return {
      success: true,
      message: `Tạo dữ liệu mẫu thành công! Đã tạo ${summary.subjects} môn học, ${summary.chapters} chương, ${summary.lessons} bài học, ${summary.questionTypes} dạng câu hỏi.`,
      details,
      summary
    };

  } catch (error) {
    console.error('❌ Sample data creation failed:', error);
    return {
      success: false,
      message: `Tạo dữ liệu mẫu thất bại: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
};

// For browser console usage
if (typeof window !== 'undefined') {
  (window as any).createSampleData = createSampleData;
}