import { supabase } from './supabaseClient';

export interface QuizSubmission {
  id?: string;
  student_id: string | null; // Allow null for anonymous users
  student_name: string;
  student_email: string;
  student_class?: string;
  quiz_title: string;
  quiz_id?: string;
  quiz_creator_id?: string; // ID of teacher who created the quiz
  score: number;
  total_questions: number;
  attempt_number?: number; // Track which attempt this is
  answers: any; // Student answers object
  submitted_at?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface QuizSubmissionStats {
  id: string;
  student_name: string;
  student_email: string;
  student_class?: string;
  quiz_title: string;
  score: number;
  total_questions: number;
  attempt_number: number;
  submitted_at: string;
  percentage: number;
}

export class QuizSubmissionService {
  
  /**
   * Submit a quiz result to Supabase with attempt tracking
   */
  static async submitQuizResult(submission: Omit<QuizSubmission, 'id' | 'submitted_at'>): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      // Get current attempt number for this student and quiz
      const attemptNumber = await this.getNextAttemptNumber(submission.student_id, submission.quiz_title);
      
      // Get additional metadata
      const ip_address = await this.getClientIP();
      const user_agent = navigator.userAgent;

      // Prepare submission data with proper handling for anonymous users
      const submissionData = {
        student_id: submission.student_id, // Can be null for anonymous users
        student_name: submission.student_name || 'Anonymous',
        student_email: submission.student_email || 'anonymous@example.com',
        student_class: submission.student_class || null,
        quiz_title: submission.quiz_title,
        quiz_id: submission.quiz_id || null,
        quiz_creator_id: submission.quiz_creator_id || null,
        score: Number(submission.score),
        total_questions: Number(submission.total_questions),
        attempt_number: attemptNumber,
        answers: submission.answers || {},
        ip_address,
        user_agent,
        submitted_at: new Date().toISOString()
      };

      console.log('Submitting quiz data:', submissionData);

      const { data, error } = await supabase
        .from('quiz_submissions')
        .insert([submissionData])
        .select()
        .single();

      if (error) {
        console.error('Error submitting quiz:', error);
        console.error('Submission data that failed:', submissionData);
        
        // Provide more helpful error messages
        if (error.message.includes('row-level security policy')) {
          return { 
            success: false, 
            error: 'Không thể nộp bài. Vui lòng thử lại hoặc liên hệ admin nếu vấn đề tiếp tục xảy ra.' 
          };
        }
        
        return { success: false, error: error.message };
      }

      console.log('Quiz submitted successfully:', data);
      return { success: true, data };
    } catch (error: any) {
      console.error('Exception submitting quiz:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Get quiz submissions for a specific quiz
   */
  static async getQuizSubmissions(quizTitle: string): Promise<{ success: boolean; data?: QuizSubmissionStats[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('quiz_submissions')
        .select(`
          id,
          student_name,
          student_email,
          student_class,
          quiz_title,
          score,
          total_questions,
          attempt_number,
          submitted_at
        `)
        .eq('quiz_title', quizTitle)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching submissions:', error);
        return { success: false, error: error.message };
      }

      // Calculate percentages
      const submissions: QuizSubmissionStats[] = (data || []).map(submission => ({
        ...submission,
        quiz_title: submission.quiz_title || quizTitle,
        attempt_number: submission.attempt_number || 1,
        percentage: Math.round((submission.score / submission.total_questions) * 100)
      }));

      return { success: true, data: submissions };
    } catch (error: any) {
      console.error('Exception fetching submissions:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Get quiz submissions for a specific student (student view)
   */
  static async getStudentQuizSubmissions(studentId: string | null, limit: number = 50): Promise<{ success: boolean; data?: QuizSubmissionStats[]; error?: string }> {
    try {
      // For anonymous users, return empty array
      if (studentId === null) {
        return { success: true, data: [] };
      }

      const { data, error } = await supabase
        .from('quiz_submissions')
        .select(`
          id,
          student_name,
          student_email,
          student_class,
          quiz_title,
          score,
          total_questions,
          attempt_number,
          submitted_at
        `)
        .eq('student_id', studentId)
        .order('submitted_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching student submissions:', error);
        return { success: false, error: error.message };
      }

      // Calculate percentages
      const submissions: QuizSubmissionStats[] = (data || []).map(submission => ({
        ...submission,
        percentage: Math.round((submission.score / submission.total_questions) * 100)
      }));

      return { success: true, data: submissions };
    } catch (error: any) {
      console.error('Exception fetching student submissions:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Get quiz submissions for teacher dashboard (only their quizzes)
   */
  static async getTeacherQuizSubmissions(teacherId: string, limit: number = 100): Promise<{ success: boolean; data?: QuizSubmissionStats[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('quiz_submissions')
        .select(`
          id,
          student_name,
          student_email,
          student_class,
          quiz_title,
          score,
          total_questions,
          attempt_number,
          submitted_at
        `)
        .eq('quiz_creator_id', teacherId)
        .order('submitted_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching teacher submissions:', error);
        return { success: false, error: error.message };
      }

      // Calculate percentages
      const submissions: QuizSubmissionStats[] = (data || []).map(submission => ({
        ...submission,
        percentage: Math.round((submission.score / submission.total_questions) * 100)
      }));

      return { success: true, data: submissions };
    } catch (error: any) {
      console.error('Exception fetching teacher submissions:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Get all quiz submissions for admin dashboard
   */
  static async getAllQuizSubmissions(limit: number = 100): Promise<{ success: boolean; data?: QuizSubmissionStats[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('quiz_submissions')
        .select(`
          id,
          student_name,
          student_email,
          student_class,
          quiz_title,
          score,
          total_questions,
          attempt_number,
          submitted_at
        `)
        .order('submitted_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching all submissions:', error);
        return { success: false, error: error.message };
      }

      // Calculate percentages
      const submissions: QuizSubmissionStats[] = (data || []).map(submission => ({
        ...submission,
        percentage: Math.round((submission.score / submission.total_questions) * 100)
      }));

      return { success: true, data: submissions };
    } catch (error: any) {
      console.error('Exception fetching all submissions:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Get submission statistics
   */
  static async getSubmissionStats(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('quiz_submissions')
        .select(`
          id,
          score,
          total_questions,
          quiz_title,
          submitted_at
        `);

      if (error) {
        console.error('Error fetching submission stats:', error);
        return { success: false, error: error.message };
      }

      const stats = {
        totalSubmissions: data?.length || 0,
        averageScore: data?.length ? 
          Math.round((data.reduce((sum, s) => sum + (s.score / s.total_questions), 0) / data.length) * 100) : 0,
        uniqueQuizzes: [...new Set(data?.map(s => s.quiz_title) || [])].length,
        recentSubmissions: data?.slice(0, 10) || []
      };

      return { success: true, data: stats };
    } catch (error: any) {
      console.error('Exception fetching submission stats:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Delete a quiz submission (admin only)
   */
  static async deleteSubmission(submissionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('quiz_submissions')
        .delete()
        .eq('id', submissionId);

      if (error) {
        console.error('Error deleting submission:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Exception deleting submission:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Get next attempt number for a student and quiz
   */
  static async getNextAttemptNumber(studentId: string | null, quizTitle: string): Promise<number> {
    try {
      // For anonymous users (studentId is null), always start from attempt 1
      if (studentId === null) {
        return 1;
      }

      const { data, error } = await supabase
        .from('quiz_submissions')
        .select('attempt_number')
        .eq('student_id', studentId)
        .eq('quiz_title', quizTitle)
        .order('attempt_number', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error getting attempt number:', error);
        return 1;
      }

      return data && data.length > 0 ? (data[0].attempt_number || 0) + 1 : 1;
    } catch (error) {
      console.error('Exception getting attempt number:', error);
      return 1;
    }
  }

  /**
   * Check if student can take the quiz (now allows unlimited attempts)
   */
  static async canStudentTakeQuiz(studentId: string | null, quizTitle: string, maxAttempts: number = 1): Promise<{ canTake: boolean; currentAttempts: number; error?: string }> {
    try {
      // For anonymous users (studentId is null), always allow unlimited attempts
      if (studentId === null) {
        return { canTake: true, currentAttempts: 0 };
      }

      const { data, error } = await supabase
        .from('quiz_submissions')
        .select('id')
        .eq('student_id', studentId)
        .eq('quiz_title', quizTitle);

      if (error) {
        console.error('Error checking attempt limit:', error);
        return { canTake: false, currentAttempts: 0, error: error.message };
      }

      const currentAttempts = data?.length || 0;
      // Allow unlimited attempts - always return canTake: true
      return {
        canTake: true, // Always allow taking the quiz
        currentAttempts
      };
    } catch (error: any) {
      console.error('Exception checking attempt limit:', error);
      return { canTake: false, currentAttempts: 0, error: error.message };
    }
  }

  /**
   * Get student's quiz attempts
   */
  static async getStudentAttempts(studentId: string | null, quizTitle: string): Promise<{ success: boolean; data?: QuizSubmissionStats[]; error?: string }> {
    try {
      // For anonymous users, return empty array
      if (studentId === null) {
        return { success: true, data: [] };
      }

      const { data, error } = await supabase
        .from('quiz_submissions')
        .select(`
          id,
          student_name,
          student_email,
          student_class,
          quiz_title,
          score,
          total_questions,
          attempt_number,
          submitted_at
        `)
        .eq('student_id', studentId)
        .eq('quiz_title', quizTitle)
        .order('attempt_number', { ascending: false });

      if (error) {
        console.error('Error fetching student attempts:', error);
        return { success: false, error: error.message };
      }

      // Calculate percentages
      const submissions: QuizSubmissionStats[] = (data || []).map(submission => ({
        ...submission,
        percentage: Math.round((submission.score / submission.total_questions) * 100)
      }));

      return { success: true, data: submissions };
    } catch (error: any) {
      console.error('Exception fetching student attempts:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Get client IP address (for tracking purposes)
   */
  private static async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch (error) {
      console.warn('Could not get client IP:', error);
      return 'unknown';
    }
  }

  /**
   * Check if student has already submitted this quiz
   */
  static async hasStudentSubmitted(studentId: string | null, quizTitle: string): Promise<{ hasSubmitted: boolean; submissionData?: any }> {
    try {
      // For anonymous users, they haven't submitted before
      if (studentId === null) {
        return { hasSubmitted: false };
      }

      const { data, error } = await supabase
        .from('quiz_submissions')
        .select('*')
        .eq('student_id', studentId)
        .eq('quiz_title', quizTitle)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking submission:', error);
        return { hasSubmitted: false };
      }

      return { 
        hasSubmitted: !!data, 
        submissionData: data 
      };
    } catch (error) {
      console.error('Exception checking submission:', error);
      return { hasSubmitted: false };
    }
  }
}