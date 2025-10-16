/**
 * Script to run RLS fix for quiz_submissions table
 * This should be run by admin when encountering RLS policy errors
 */

import { supabase } from '../services/supabaseClient';

export async function runRLSFix(): Promise<{
  success: boolean;
  message: string;
  details?: string[];
}> {
  try {
    console.log('🔧 Starting RLS fix for quiz_submissions table...');

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        message: 'Bạn cần đăng nhập để chạy script này'
      };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('email, role')
      .eq('id', user.id)
      .single();

    if (!userData || userData.email !== 'lvdoqt@gmail.com') {
      return {
        success: false,
        message: 'Chỉ admin (lvdoqt@gmail.com) mới có thể chạy script này'
      };
    }

    console.log('✅ Admin access confirmed');

    // Test current access
    console.log('🧪 Testing current access...');
    
    const testSubmission = {
      student_id: null,
      student_name: 'RLS Test User',
      student_email: 'test@rlsfix.com',
      quiz_title: 'RLS Fix Test Quiz',
      score: 1,
      total_questions: 1,
      answers: { test: 'A' },
      attempt_number: 1
    };

    const { data: testData, error: testError } = await supabase
      .from('quiz_submissions')
      .insert([testSubmission])
      .select()
      .single();

    if (testError) {
      console.log('❌ Current RLS configuration has issues:', testError.message);
      
      return {
        success: false,
        message: 'RLS policies cần được sửa thủ công trong Supabase Dashboard',
        details: [
          '1. Mở Supabase Dashboard → SQL Editor',
          '2. Chạy nội dung file supabase/fix_quiz_submissions_rls.sql',
          '3. Kiểm tra lại bằng cách test submit quiz',
          '',
          `Lỗi hiện tại: ${testError.message}`
        ]
      };
    } else {
      console.log('✅ RLS policies đang hoạt động bình thường');
      
      // Clean up test record
      if (testData?.id) {
        await supabase
          .from('quiz_submissions')
          .delete()
          .eq('id', testData.id);
      }

      return {
        success: true,
        message: 'RLS policies đã được cấu hình đúng, không cần sửa',
        details: [
          'Hệ thống có thể insert quiz submissions bình thường',
          'Nếu vẫn gặp lỗi, hãy kiểm tra lại dữ liệu đầu vào'
        ]
      };
    }

  } catch (error: any) {
    console.error('💥 Error running RLS fix:', error);
    
    return {
      success: false,
      message: `Lỗi khi chạy RLS fix: ${error.message}`,
      details: [
        'Vui lòng kiểm tra console để xem chi tiết lỗi',
        'Liên hệ developer nếu vấn đề tiếp tục'
      ]
    };
  }
}

/**
 * Generate SQL script content for manual execution
 */
export function generateRLSFixSQL(): string {
  return `
-- RLS Fix Script for quiz_submissions table
-- Copy and paste this into Supabase SQL Editor

-- Disable RLS temporarily
ALTER TABLE quiz_submissions DISABLE ROW LEVEL SECURITY;

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add attempt_number column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quiz_submissions' AND column_name = 'attempt_number'
    ) THEN
        ALTER TABLE quiz_submissions ADD COLUMN attempt_number integer DEFAULT 1;
    END IF;
    
    -- Add quiz_creator_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quiz_submissions' AND column_name = 'quiz_creator_id'
    ) THEN
        ALTER TABLE quiz_submissions ADD COLUMN quiz_creator_id uuid REFERENCES users(id);
    END IF;
    
    -- Allow NULL for student_id (anonymous users)
    ALTER TABLE quiz_submissions ALTER COLUMN student_id DROP NOT NULL;
END $$;

-- Re-enable RLS
ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can insert quiz submissions" ON quiz_submissions;
DROP POLICY IF EXISTS "Users can view their own submissions" ON quiz_submissions;
DROP POLICY IF EXISTS "Teachers can view their quiz submissions" ON quiz_submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON quiz_submissions;

-- Create new policies
CREATE POLICY "Anyone can insert quiz submissions" ON quiz_submissions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own submissions" ON quiz_submissions
    FOR SELECT USING (
        student_id = auth.uid() OR 
        student_id IS NULL
    );

CREATE POLICY "Teachers can view their quiz submissions" ON quiz_submissions
    FOR SELECT USING (
        quiz_creator_id = auth.uid() AND
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'teacher')
    );

CREATE POLICY "Admins can view all submissions" ON quiz_submissions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND email = 'lvdoqt@gmail.com')
    );

-- Grant permissions
GRANT ALL ON quiz_submissions TO authenticated;
GRANT ALL ON quiz_submissions TO anon;

-- Test the fix
INSERT INTO quiz_submissions (
    student_id, student_name, student_email, quiz_title, 
    score, total_questions, answers, attempt_number
) VALUES (
    NULL, 'Test User', 'test@example.com', 'RLS Test Quiz',
    1, 1, '{"test": "A"}', 1
) RETURNING id;

-- Clean up test record (replace with actual ID from above)
-- DELETE FROM quiz_submissions WHERE quiz_title = 'RLS Test Quiz';

SELECT 'RLS fix completed successfully!' as result;
  `.trim();
}

// Export for console usage
if (typeof window !== 'undefined') {
  (window as any).runRLSFix = runRLSFix;
  (window as any).generateRLSFixSQL = generateRLSFixSQL;
  (window as any).copyRLSFixSQL = () => {
    const sql = generateRLSFixSQL();
    navigator.clipboard.writeText(sql);
    console.log('✅ RLS Fix SQL copied to clipboard!');
    console.log('📋 Paste this into Supabase Dashboard → SQL Editor');
  };
}