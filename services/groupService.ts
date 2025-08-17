import { supabase } from '../lib/supabase';

export interface Group {
  id: string;
  name: string;
  teacher_id: string;
  invite_code: string;
  created_at: string;
  teacher?: {
    full_name: string;
    email: string;
  };
  member_count?: number;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  joined_at: string;
  user: {
    full_name: string;
    email: string;
    school?: string;
  };
}

export class GroupService {
  // Tạo nhóm mới (chỉ giáo viên)
  static async createGroup(name: string): Promise<Group | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate invite code
      const inviteCode = await this.generateInviteCode();

      const { data, error } = await supabase
        .from('groups')
        .insert({
          name,
          teacher_id: user.id,
          invite_code: inviteCode
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating group:', error);
      return null;
    }
  }

  // Lấy tất cả nhóm của giáo viên
  static async getTeacherGroups(): Promise<Group[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_members(count)
        `)
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(group => ({
        ...group,
        member_count: group.group_members?.[0]?.count || 0
      }));
    } catch (error) {
      console.error('Error fetching teacher groups:', error);
      return [];
    }
  }

  // Lấy nhóm mà học sinh tham gia
  static async getStudentGroups(): Promise<Group[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          groups(
            *,
            users!groups_teacher_id_fkey(full_name, email)
          )
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      return data.map(member => ({
        ...member.groups,
        teacher: member.groups.users
      }));
    } catch (error) {
      console.error('Error fetching student groups:', error);
      return [];
    }
  }

  // Tham gia nhóm bằng invite code
  static async joinGroup(inviteCode: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Tìm nhóm bằng invite code
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id, name')
        .eq('invite_code', inviteCode.toUpperCase())
        .single();

      if (groupError || !group) {
        return { success: false, message: 'Mã mời không hợp lệ' };
      }

      // Kiểm tra đã tham gia chưa
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        return { success: false, message: 'Bạn đã tham gia nhóm này rồi' };
      }

      // Tham gia nhóm
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id
        });

      if (error) throw error;

      return { success: true, message: `Đã tham gia nhóm "${group.name}" thành công!` };
    } catch (error) {
      console.error('Error joining group:', error);
      return { success: false, message: 'Có lỗi xảy ra khi tham gia nhóm' };
    }
  }

  // Lấy thành viên của nhóm
  static async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          users(full_name, email, school)
        `)
        .eq('group_id', groupId)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      return data.map(member => ({
        ...member,
        user: member.users
      }));
    } catch (error) {
      console.error('Error fetching group members:', error);
      return [];
    }
  }

  // Xóa thành viên khỏi nhóm
  static async removeMember(groupId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing member:', error);
      return false;
    }
  }

  // Rời khỏi nhóm (học sinh)
  static async leaveGroup(groupId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error leaving group:', error);
      return false;
    }
  }

  // Xóa nhóm (chỉ giáo viên)
  static async deleteGroup(groupId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting group:', error);
      return false;
    }
  }

  // Cập nhật thông tin nhóm
  static async updateGroup(groupId: string, updates: { name?: string }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('groups')
        .update(updates)
        .eq('id', groupId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating group:', error);
      return false;
    }
  }

  // Generate invite code
  private static async generateInviteCode(): Promise<string> {
    const { data, error } = await supabase.rpc('generate_invite_code');
    if (error) {
      // Fallback nếu function không hoạt động
      return Math.random().toString(36).substring(2, 10).toUpperCase();
    }
    return data;
  }

  // Lấy thống kê nhóm
  static async getGroupStats(groupId: string): Promise<any> {
    try {
      // Lấy số thành viên
      const { count: memberCount } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);

      // Lấy quiz attempts của các thành viên trong nhóm
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          users(full_name),
          quizzes(title)
        `)
        .in('user_id', 
          await supabase
            .from('group_members')
            .select('user_id')
            .eq('group_id', groupId)
            .then(({ data }) => data?.map(m => m.user_id) || [])
        );

      const totalAttempts = attempts?.length || 0;
      const averageScore = totalAttempts > 0 
        ? attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / totalAttempts 
        : 0;

      return {
        memberCount: memberCount || 0,
        totalAttempts,
        averageScore,
        recentAttempts: attempts?.slice(0, 10) || []
      };
    } catch (error) {
      console.error('Error fetching group stats:', error);
      return {
        memberCount: 0,
        totalAttempts: 0,
        averageScore: 0,
        recentAttempts: []
      };
    }
  }
}