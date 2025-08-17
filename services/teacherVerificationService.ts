import { supabase } from '../lib/supabase';

export interface TeacherVerificationCode {
  id: string;
  code: string;
  school: string;
  description?: string;
  is_active: boolean;
  max_uses: number;
  current_uses: number;
  expires_at?: string;
  created_at: string;
}

export interface PendingTeacher {
  id: string;
  email: string;
  full_name: string;
  school?: string;
  teacher_code?: string;
  verification_requested_at: string;
}

export class TeacherVerificationService {
  // Xác thực giáo viên bằng mã
  static async verifyTeacherWithCode(verificationCode: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'Bạn cần đăng nhập để xác thực' };
      }

      const { data, error } = await supabase.rpc('verify_teacher_with_code', {
        user_id: user.id,
        verification_code: verificationCode.toUpperCase()
      });

      if (error) {
        console.error('Verification error:', error);
        return { success: false, message: 'Có lỗi xảy ra khi xác thực' };
      }

      if (data) {
        return { success: true, message: 'Xác thực thành công! Bạn đã trở thành giáo viên.' };
      } else {
        return { success: false, message: 'Mã xác thực không hợp lệ hoặc đã hết hạn' };
      }
    } catch (error) {
      console.error('Verification error:', error);
      return { success: false, message: 'Có lỗi xảy ra khi xác thực' };
    }
  }

  // Kiểm tra trạng thái xác thực của user
  static async checkVerificationStatus(): Promise<{
    needsVerification: boolean;
    isPendingTeacher: boolean;
    isVerifiedTeacher: boolean;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { needsVerification: false, isPendingTeacher: false, isVerifiedTeacher: false };
      }

      const { data: profile } = await supabase
        .from('users')
        .select('role, is_verified')
        .eq('id', user.id)
        .single();

      if (!profile) {
        return { needsVerification: false, isPendingTeacher: false, isVerifiedTeacher: false };
      }

      return {
        needsVerification: profile.role === 'pending_teacher' && !profile.is_verified,
        isPendingTeacher: profile.role === 'pending_teacher',
        isVerifiedTeacher: profile.role === 'teacher' && profile.is_verified
      };
    } catch (error) {
      console.error('Error checking verification status:', error);
      return { needsVerification: false, isPendingTeacher: false, isVerifiedTeacher: false };
    }
  }

  // Gửi lại yêu cầu xác thực (nếu cần)
  static async requestVerification(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('users')
        .update({ 
          verification_requested_at: new Date().toISOString(),
          role: 'pending_teacher'
        })
        .eq('id', user.id);

      return !error;
    } catch (error) {
      console.error('Error requesting verification:', error);
      return false;
    }
  }

  // Admin functions (sẽ implement sau)
  
  // Tạo mã xác thực mới (chỉ admin)
  static async createVerificationCode(
    code: string,
    school: string,
    description?: string,
    maxUses: number = 1,
    expiresAt?: Date
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.rpc('create_teacher_verification_code', {
        code_text: code,
        school_name: school,
        description_text: description,
        max_uses_count: maxUses,
        expires_date: expiresAt?.toISOString()
      });

      if (error) {
        console.error('Error creating verification code:', error);
        return { success: false, message: 'Có lỗi xảy ra khi tạo mã xác thực' };
      }

      return { success: true, message: 'Tạo mã xác thực thành công' };
    } catch (error) {
      console.error('Error creating verification code:', error);
      return { success: false, message: 'Có lỗi xảy ra khi tạo mã xác thực' };
    }
  }

  // Lấy danh sách mã xác thực (chỉ admin)
  static async getVerificationCodes(): Promise<TeacherVerificationCode[]> {
    try {
      const { data, error } = await supabase
        .from('teacher_verification_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching verification codes:', error);
      return [];
    }
  }

  // Lấy danh sách giáo viên chờ xác thực (chỉ admin)
  static async getPendingTeachers(): Promise<PendingTeacher[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, school, teacher_code, verification_requested_at')
        .eq('role', 'pending_teacher')
        .eq('is_verified', false)
        .order('verification_requested_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending teachers:', error);
      return [];
    }
  }

  // Xóa/vô hiệu hóa mã xác thực (chỉ admin)
  static async deactivateVerificationCode(codeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('teacher_verification_codes')
        .update({ is_active: false })
        .eq('id', codeId);

      return !error;
    } catch (error) {
      console.error('Error deactivating verification code:', error);
      return false;
    }
  }
}