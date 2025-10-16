export interface Question {
  id: string;
  type: 'mcq' | 'msq' | 'sa';
  question: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_option: string;
  explanation: string;
  isDynamic?: boolean;
  variables?: Record<string, string | number>;
  // Add missing fields for better type safety
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  // For dynamic questions
  dynamic_variables?: Record<string, any>;
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  createdAt: string;
  maxAttempts?: number;
  createdBy?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  student_name?: string;
  created_at?: string;
}

export interface Score {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  submitted_at: string;
  answers: any[];
}