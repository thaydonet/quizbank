/**
 * Utility functions to diagnose and fix RLS policy issues
 */

import { supabase } from '../services/supabaseClient';

export class RLSPolicyFixer {
  
  /**
   * Test if quiz_submissions table is accessible
   */
  static async testQuizSubmissionsAccess(): Promise<{
    canRead: boolean;
    canInsert: boolean;
    error?: string;
  }> {
    try {
      // Test read access
      const { data: readData, error: readError } = await supabase
        .from('quiz_submissions')
        .select('id')
        .limit(1);

      const canRead = !readError;

      // Test insert access with a dummy record (will be rolled back)
      const testSubmission = {
        student_id: null, // Anonymous user
        student_name: 'Test User',
        student_email: 'test@example.com',
        quiz_title: 'RLS Test Quiz',
        score: 0,
        total_questions: 1,
        answers: {},
        attempt_number: 1
      };

      const { data: insertData, error: insertError } = await supabase
        .from('quiz_submissions')
        .insert([testSubmission])
        .select()
        .single();

      const canInsert = !insertError;

      // Clean up test record if it was inserted
      if (insertData?.id) {
        await supabase
          .from('quiz_submissions')
          .delete()
          .eq('id', insertData.id);
      }

      return {
        canRead,
        canInsert,
        error: insertError?.message || readError?.message
      };

    } catch (error: any) {
      return {
        canRead: false,
        canInsert: false,
        error: error.message
      };
    }
  }

  /**
   * Get current user info for debugging
   */
  static async getCurrentUserInfo(): Promise<{
    isAuthenticated: boolean;
    userId?: string;
    email?: string;
    role?: string;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { isAuthenticated: false };
      }

      // Get user role from users table
      const { data: userData } = await supabase
        .from('users')
        .select('role, email')
        .eq('id', user.id)
        .single();

      return {
        isAuthenticated: true,
        userId: user.id,
        email: user.email,
        role: userData?.role
      };
    } catch (error) {
      return { isAuthenticated: false };
    }
  }

  /**
   * Check if RLS is properly configured
   */
  static async checkRLSConfiguration(): Promise<{
    isConfigured: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Test access
      const accessTest = await this.testQuizSubmissionsAccess();
      const userInfo = await this.getCurrentUserInfo();

      if (!accessTest.canInsert) {
        issues.push('Không thể insert vào quiz_submissions table');
        recommendations.push('Chạy migration fix_quiz_submissions_rls.sql');
      }

      if (!accessTest.canRead && userInfo.isAuthenticated) {
        issues.push('User đã đăng nhập nhưng không thể đọc submissions');
        recommendations.push('Kiểm tra RLS policies cho SELECT operations');
      }

      if (accessTest.error?.includes('row-level security policy')) {
        issues.push('RLS policy đang chặn operations');
        recommendations.push('Cập nhật RLS policies để cho phép anonymous submissions');
      }

      return {
        isConfigured: issues.length === 0,
        issues,
        recommendations
      };

    } catch (error: any) {
      return {
        isConfigured: false,
        issues: [`Lỗi kiểm tra RLS: ${error.message}`],
        recommendations: ['Liên hệ admin để kiểm tra database configuration']
      };
    }
  }

  /**
   * Attempt to fix common RLS issues (admin only)
   */
  static async attemptAutoFix(): Promise<{
    success: boolean;
    message: string;
    details?: string[];
  }> {
    try {
      const userInfo = await this.getCurrentUserInfo();
      
      if (!userInfo.isAuthenticated || userInfo.email !== 'lvdoqt@gmail.com') {
        return {
          success: false,
          message: 'Chỉ admin mới có thể chạy auto-fix'
        };
      }

      // Try to run the RLS fix SQL
      const fixSQL = `
        -- Temporarily disable RLS
        ALTER TABLE quiz_submissions DISABLE ROW LEVEL SECURITY;
        
        -- Re-enable with proper policies
        ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;
        
        -- Ensure anyone can insert
        DROP POLICY IF EXISTS "Anyone can insert quiz submissions" ON quiz_submissions;
        CREATE POLICY "Anyone can insert quiz submissions" ON quiz_submissions
          FOR INSERT WITH CHECK (true);
      `;

      // Note: This would require admin privileges to execute
      // In practice, this should be run manually in Supabase SQL editor
      
      return {
        success: false,
        message: 'Auto-fix cần được chạy thủ công trong Supabase SQL Editor',
        details: [
          '1. Mở Supabase Dashboard > SQL Editor',
          '2. Chạy file supabase/fix_quiz_submissions_rls.sql',
          '3. Kiểm tra lại bằng cách test submit quiz'
        ]
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Lỗi auto-fix: ${error.message}`
      };
    }
  }

  /**
   * Generate diagnostic report
   */
  static async generateDiagnosticReport(): Promise<string> {
    const userInfo = await this.getCurrentUserInfo();
    const accessTest = await this.testQuizSubmissionsAccess();
    const rlsCheck = await this.checkRLSConfiguration();

    const report = `
=== QUIZ SUBMISSIONS RLS DIAGNOSTIC REPORT ===

User Information:
- Authenticated: ${userInfo.isAuthenticated}
- User ID: ${userInfo.userId || 'N/A'}
- Email: ${userInfo.email || 'N/A'}
- Role: ${userInfo.role || 'N/A'}

Access Test Results:
- Can Read: ${accessTest.canRead}
- Can Insert: ${accessTest.canInsert}
- Error: ${accessTest.error || 'None'}

RLS Configuration:
- Is Configured: ${rlsCheck.isConfigured}
- Issues Found: ${rlsCheck.issues.length}

Issues:
${rlsCheck.issues.map(issue => `- ${issue}`).join('\n')}

Recommendations:
${rlsCheck.recommendations.map(rec => `- ${rec}`).join('\n')}

=== END REPORT ===
    `.trim();

    return report;
  }
}

// Export for console debugging
if (typeof window !== 'undefined') {
  (window as any).RLSPolicyFixer = RLSPolicyFixer;
  (window as any).testRLS = () => RLSPolicyFixer.generateDiagnosticReport().then(console.log);
}