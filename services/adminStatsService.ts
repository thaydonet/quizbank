import { supabase } from './supabaseClient';

export interface AdminStats {
  userStats: {
    totalUsers: number;
    teachers: number;
    students: number;
  };
  quizStats: {
    totalQuizzes: number;
    activeQuizzes: number;
    totalQuestions: number;
    mcqQuestions: number;
    msqQuestions: number;
    saQuestions: number;
  };
  activityStats: {
    totalAttempts: number;
    uniqueStudentsAttempted: number;
    averageScore: number;
    recentAttempts: Array<{
      studentName: string;
      quizTitle: string;
      score: number;
      submittedAt: string;
    }>;
  };
}

export class AdminStatsService {
  /**
   * Get comprehensive admin statistics
   */
  static async getAdminStats(): Promise<AdminStats> {
    try {
      // Fetch user statistics
      const userStats = await this.getUserStats();
      
      // Fetch quiz statistics
      const quizStats = await this.getQuizStats();
      
      // Fetch activity statistics
      const activityStats = await this.getActivityStats();

      return {
        userStats,
        quizStats,
        activityStats
      };
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      throw new Error('Failed to fetch admin statistics');
    }
  }

  /**
   * Get user statistics (teachers vs students)
   */
  private static async getUserStats() {
    const { data, error } = await supabase
      .from('users')
      .select('role');

    if (error) throw error;

    const users = data || [];
    const teachers = users.filter(user => user.role === 'teacher').length;
    const students = users.filter(user => user.role === 'student').length;

    return {
      totalUsers: users.length,
      teachers,
      students
    };
  }

  /**
   * Get quiz and question statistics
   */
  private static async getQuizStats() {
    const { data, error } = await supabase
      .from('quizzes')
      .select('question_count, mcq_count, msq_count, sa_count, is_active');

    if (error) throw error;

    const quizzes = data || [];
    const activeQuizzes = quizzes.filter(quiz => quiz.is_active !== false).length;
    
    const totalQuestions = quizzes.reduce((sum, quiz) => sum + (quiz.question_count || 0), 0);
    const mcqQuestions = quizzes.reduce((sum, quiz) => sum + (quiz.mcq_count || 0), 0);
    const msqQuestions = quizzes.reduce((sum, quiz) => sum + (quiz.msq_count || 0), 0);
    const saQuestions = quizzes.reduce((sum, quiz) => sum + (quiz.sa_count || 0), 0);

    return {
      totalQuizzes: quizzes.length,
      activeQuizzes,
      totalQuestions,
      mcqQuestions,
      msqQuestions,
      saQuestions
    };
  }

  /**
   * Get student activity and attempt statistics
   */
  private static async getActivityStats() {
    // Get all scores with user and quiz information
    const { data: scoresData, error: scoresError } = await supabase
      .from('scores')
      .select(`
        score,
        submitted_at,
        user_id,
        quiz_id,
        users!inner(student_name, email, role),
        quizzes!inner(title)
      `)
      .eq('users.role', 'student')
      .order('submitted_at', { ascending: false });

    if (scoresError) throw scoresError;

    const scores = scoresData || [];
    const totalAttempts = scores.length;
    const uniqueStudents = new Set(scores.map(score => score.user_id)).size;
    
    const averageScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score.score, 0) / scores.length 
      : 0;

    // Get recent attempts (last 10)
    const recentAttempts = scores.slice(0, 10).map(score => ({
      studentName: score.users.student_name || score.users.email,
      quizTitle: score.quizzes.title,
      score: score.score,
      submittedAt: score.submitted_at
    }));

    return {
      totalAttempts,
      uniqueStudentsAttempted: uniqueStudents,
      averageScore: Math.round(averageScore * 100) / 100,
      recentAttempts
    };
  }

  /**
   * Get detailed user list for admin management
   */
  static async getUserList() {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, student_name, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get quiz performance statistics
   */
  static async getQuizPerformanceStats() {
    const { data, error } = await supabase
      .from('quizzes')
      .select(`
        id,
        title,
        question_count,
        scores(score, submitted_at)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(quiz => {
      const attempts = quiz.scores?.length || 0;
      const averageScore = attempts > 0
        ? quiz.scores.reduce((sum: number, score: any) => sum + score.score, 0) / attempts
        : 0;

      return {
        id: quiz.id,
        title: quiz.title,
        questionCount: quiz.question_count || 0,
        attempts,
        averageScore: Math.round(averageScore * 100) / 100
      };
    });
  }
}