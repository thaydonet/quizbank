import React, { useState, useEffect } from 'react';
import { GroupService, type Group } from '../services/groupService';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

const StudentGroupsPage: React.FC = () => {
  const { profile } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    const data = await GroupService.getStudentGroups();
    setGroups(data);
    setLoading(false);
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setJoining(true);
    const result = await GroupService.joinGroup(inviteCode.trim());
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setInviteCode('');
      setShowJoinForm(false);
      loadGroups(); // Reload groups
    } else {
      setMessage({ type: 'error', text: result.message });
    }
    
    setJoining(false);
    
    // Clear message after 5 seconds
    setTimeout(() => setMessage(null), 5000);
  };

  const handleLeaveGroup = async (groupId: string, groupName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn rời khỏi nhóm "${groupName}"?`)) {
      return;
    }

    const success = await GroupService.leaveGroup(groupId);
    if (success) {
      setGroups(prev => prev.filter(g => g.id !== groupId));
      setMessage({ type: 'success', text: 'Đã rời khỏi nhóm thành công' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lớp học của tôi</h1>
              <p className="text-gray-600 mt-2">Tham gia và quản lý các lớp học bạn đã tham gia</p>
            </div>
            <button
              onClick={() => setShowJoinForm(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Tham gia lớp
            </button>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          {/* Join Group Modal */}
          {showJoinForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Tham gia lớp học</h2>
                <form onSubmit={handleJoinGroup}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mã mời từ giáo viên
                    </label>
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-center text-lg"
                      placeholder="Nhập mã mời"
                      maxLength={8}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Mã mời gồm 8 ký tự do giáo viên cung cấp
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowJoinForm(false);
                        setInviteCode('');
                      }}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={joining}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {joining ? 'Đang tham gia...' : 'Tham gia'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Groups Grid */}
          {groups.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa tham gia lớp nào</h3>
              <p className="text-gray-600 mb-6">Nhận mã mời từ giáo viên để tham gia lớp học</p>
              <button
                onClick={() => setShowJoinForm(true)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Tham gia lớp đầu tiên
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <div key={group.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{group.name}</h3>
                      <p className="text-sm text-gray-600 mb-1">
                        Giáo viên: {group.teacher?.full_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Tham gia: {new Date(group.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleLeaveGroup(group.id, group.name)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Rời khỏi lớp"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600 mb-1">0</div>
                        <div className="text-xs text-gray-600">Bài thi đã làm</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 bg-indigo-600 text-white text-center py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                      Xem bài thi
                    </button>
                    <button className="flex-1 bg-gray-100 text-gray-700 text-center py-2 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                      Thống kê
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StudentGroupsPage;