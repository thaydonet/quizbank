import { supabase } from '../lib/supabase';
import type { Question } from '../types';

export interface BattleRoom {
  id: string;
  room_code: string;
  title: string;
  description?: string;
  quiz_id: string;
  created_by: string;
  status: 'waiting' | 'active' | 'finished';
  max_participants: number;
  current_question_index: number;
  question_time_limit: number;
  started_at?: string;
  finished_at?: string;
  created_at: string;
  quiz?: {
    title: string;
    questions: Question[];
  };
}

export interface BattleParticipant {
  id: string;
  room_id: string;
  user_id?: string;
  display_name: string;
  total_score: number;
  current_streak: number;
  max_streak: number;
  questions_answered: number;
  correct_answers: number;
  joined_at: string;
  last_activity: string;
}

export interface BattleAnswer {
  id: string;
  room_id: string;
  participant_id: string;
  question_index: number;
  question_id: string;
  answer: string;
  is_correct: boolean;
  points_earned: number;
  time_taken?: number;
  answered_at: string;
}

export class BattleService {
  // Tạo phòng thi đấu mới
  static async createBattleRoom(
    title: string,
    quizId: string,
    description?: string,
    maxParticipants: number = 50,
    questionTimeLimit: number = 30
  ): Promise<BattleRoom | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate unique 4-digit room code
      let roomCode: string;
      let isUnique = false;
      do {
        roomCode = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit number
        const { data: existing } = await supabase
          .from('battle_rooms')
          .select('id')
          .eq('room_code', roomCode)
          .single();
        isUnique = !existing;
      } while (!isUnique);

      const { data, error } = await supabase
        .from('battle_rooms')
        .insert({
          room_code: roomCode,
          title,
          description,
          quiz_id: quizId,
          created_by: user.id,
          max_participants: maxParticipants,
          question_time_limit: questionTimeLimit
        })
        .select(`
          *,
          quiz:quizzes(title, questions)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating battle room:', error);
      return null;
    }
  }

  // Tham gia phòng thi đấu
  static async joinBattleRoom(
    roomCode: string,
    displayName: string,
    userId?: string
  ): Promise<{ success: boolean; participant?: BattleParticipant; message?: string }> {
    try {
      // Tìm phòng
      const { data: room, error: roomError } = await supabase
        .from('battle_rooms')
        .select('*')
        .eq('room_code', roomCode.trim())
        .eq('status', 'waiting')
        .single();

      if (roomError || !room) {
        return { success: false, message: 'Không tìm thấy phòng thi đấu hoặc phòng đã bắt đầu' };
      }

      // Kiểm tra số lượng tham gia
      const { count } = await supabase
        .from('battle_participants')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', room.id);

      if (count && count >= room.max_participants) {
        return { success: false, message: 'Phòng đã đầy' };
      }

      // Tham gia phòng
      const { data: participant, error: joinError } = await supabase
        .from('battle_participants')
        .insert({
          room_id: room.id,
          user_id: userId,
          display_name: displayName
        })
        .select()
        .single();

      if (joinError) {
        if (joinError.code === '23505') { // Unique constraint violation
          return { success: false, message: 'Tên hiển thị đã được sử dụng trong phòng này' };
        }
        throw joinError;
      }

      return { success: true, participant };
    } catch (error) {
      console.error('Error joining battle room:', error);
      return { success: false, message: 'Có lỗi xảy ra khi tham gia phòng' };
    }
  }

  // Lấy thông tin phòng và leaderboard
  static async getBattleRoomInfo(roomCode: string): Promise<{
    room: BattleRoom | null;
    participants: BattleParticipant[];
  }> {
    try {
      const { data: room, error: roomError } = await supabase
        .from('battle_rooms')
        .select(`
          *,
          quiz:quizzes(title, questions)
        `)
        .eq('room_code', roomCode.trim())
        .single();

      if (roomError) throw roomError;

      const { data: participants, error: participantsError } = await supabase
        .from('battle_participants')
        .select('*')
        .eq('room_id', room.id)
        .order('total_score', { ascending: false });

      if (participantsError) throw participantsError;

      return { room, participants: participants || [] };
    } catch (error) {
      console.error('Error getting battle room info:', error);
      return { room: null, participants: [] };
    }
  }

  // Bắt đầu thi đấu
  static async startBattle(roomId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('battle_rooms')
        .update({
          status: 'active',
          started_at: new Date().toISOString()
        })
        .eq('id', roomId);

      return !error;
    } catch (error) {
      console.error('Error starting battle:', error);
      return false;
    }
  }

  // Gửi câu trả lời
  static async submitAnswer(
    roomId: string,
    participantId: string,
    questionIndex: number,
    questionId: string,
    answer: string,
    timeTaken: number,
    correctAnswer: string
  ): Promise<{ success: boolean; isCorrect: boolean; points: number }> {
    try {
      // Kiểm tra đáp án (so sánh chính xác)
      const isCorrect = answer && answer.toUpperCase().trim() === correctAnswer.toUpperCase().trim();

      // Tính điểm
      const { data: room } = await supabase
        .from('battle_rooms')
        .select('question_time_limit')
        .eq('id', roomId)
        .single();

      const timeLimit = room?.question_time_limit || 30;
      const points = isCorrect ? this.calculatePoints(timeTaken, timeLimit) : 0;

      // Lưu câu trả lời
      const { error: answerError } = await supabase
        .from('battle_answers')
        .insert({
          room_id: roomId,
          participant_id: participantId,
          question_index: questionIndex,
          question_id: questionId,
          answer,
          is_correct: isCorrect,
          points_earned: points,
          time_taken: timeTaken
        });

      if (answerError) throw answerError;

      // Cập nhật thống kê participant
      await supabase.rpc('update_participant_stats', {
        p_participant_id: participantId,
        p_is_correct: isCorrect,
        p_points: points
      });

      return { success: true, isCorrect, points };
    } catch (error) {
      console.error('Error submitting answer:', error);
      return { success: false, isCorrect: false, points: 0 };
    }
  }

  // Tính điểm dựa trên thời gian
  private static calculatePoints(timeTaken: number, timeLimit: number): number {
    const basePoints = 100;
    const timeLimitMs = timeLimit * 1000;
    
    if (timeTaken >= timeLimitMs) return basePoints;
    
    // Bonus points for speed (max 50 bonus points)
    const timeBonus = Math.round((timeLimitMs - timeTaken) / (timeLimitMs / 50));
    return basePoints + timeBonus;
  }

  // Subscribe to real-time updates
  static subscribeToRoom(roomCode: string, callback: (payload: any) => void) {
    return supabase
      .channel(`battle_room_${roomCode}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'battle_participants' },
        callback
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'battle_rooms' },
        callback
      )
      .subscribe();
  }

  // Lấy danh sách phòng của giáo viên
  static async getTeacherBattleRooms(): Promise<BattleRoom[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('battle_rooms')
        .select(`
          *,
          quiz:quizzes(title, questions)
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting teacher battle rooms:', error);
      return [];
    }
  }
}
