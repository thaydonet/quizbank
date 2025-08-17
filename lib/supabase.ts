import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'teacher' | 'student' | 'pending_teacher'
          full_name: string | null
          school: string | null
          teacher_code: string | null
          is_verified: boolean
          verification_requested_at: string | null
          verified_at: string | null
          verified_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          role: 'teacher' | 'student' | 'pending_teacher'
          full_name?: string | null
          school?: string | null
          teacher_code?: string | null
          is_verified?: boolean
          verification_requested_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'teacher' | 'student' | 'pending_teacher'
          full_name?: string | null
          school?: string | null
          teacher_code?: string | null
          is_verified?: boolean
          verification_requested_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          created_at?: string
        }
      }
      quizzes: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          questions: any
          created_by: string
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string | null
          questions: any
          created_by: string
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string | null
          questions?: any
          created_by?: string
          is_public?: boolean
          created_at?: string
        }
      }
      quiz_attempts: {
        Row: {
          id: string
          quiz_id: string
          user_id: string
          answers: any
          score: number | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          user_id: string
          answers: any
          score?: number | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          user_id?: string
          answers?: any
          score?: number | null
          completed_at?: string | null
          created_at?: string
        }
      }
      teacher_verification_codes: {
        Row: {
          id: string
          code: string
          school: string
          description: string | null
          created_by: string | null
          is_active: boolean
          max_uses: number
          current_uses: number
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          school: string
          description?: string | null
          created_by?: string | null
          is_active?: boolean
          max_uses?: number
          current_uses?: number
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          school?: string
          description?: string | null
          created_by?: string | null
          is_active?: boolean
          max_uses?: number
          current_uses?: number
          expires_at?: string | null
          created_at?: string
        }
      }
      battle_rooms: {
        Row: {
          id: string
          room_code: string
          title: string
          description: string | null
          quiz_id: string
          created_by: string
          status: 'waiting' | 'active' | 'finished'
          max_participants: number
          current_question_index: number
          question_time_limit: number
          started_at: string | null
          finished_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          room_code: string
          title: string
          description?: string | null
          quiz_id: string
          created_by: string
          status?: 'waiting' | 'active' | 'finished'
          max_participants?: number
          current_question_index?: number
          question_time_limit?: number
          started_at?: string | null
          finished_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          room_code?: string
          title?: string
          description?: string | null
          quiz_id?: string
          created_by?: string
          status?: 'waiting' | 'active' | 'finished'
          max_participants?: number
          current_question_index?: number
          question_time_limit?: number
          started_at?: string | null
          finished_at?: string | null
          created_at?: string
        }
      }
      battle_participants: {
        Row: {
          id: string
          room_id: string
          user_id: string | null
          display_name: string
          total_score: number
          current_streak: number
          max_streak: number
          questions_answered: number
          correct_answers: number
          joined_at: string
          last_activity: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id?: string | null
          display_name: string
          total_score?: number
          current_streak?: number
          max_streak?: number
          questions_answered?: number
          correct_answers?: number
          joined_at?: string
          last_activity?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string | null
          display_name?: string
          total_score?: number
          current_streak?: number
          max_streak?: number
          questions_answered?: number
          correct_answers?: number
          joined_at?: string
          last_activity?: string
        }
      }
      battle_answers: {
        Row: {
          id: string
          room_id: string
          participant_id: string
          question_index: number
          question_id: string
          answer: string
          is_correct: boolean
          points_earned: number
          time_taken: number | null
          answered_at: string
        }
        Insert: {
          id?: string
          room_id: string
          participant_id: string
          question_index: number
          question_id: string
          answer: string
          is_correct: boolean
          points_earned?: number
          time_taken?: number | null
          answered_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          participant_id?: string
          question_index?: number
          question_id?: string
          answer?: string
          is_correct?: boolean
          points_earned?: number
          time_taken?: number | null
          answered_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          teacher_id: string
          invite_code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          teacher_id: string
          invite_code: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          teacher_id?: string
          invite_code?: string
          created_at?: string
        }
      }
      group_members: {
        Row: {
          group_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          group_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          group_id?: string
          user_id?: string
          joined_at?: string
        }
      }
    }
  }
}