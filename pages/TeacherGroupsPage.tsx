import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GroupService, type Group } from '../services/groupService';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';

const TeacherGroupsPage: React.FC = () => {
  const { profile } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    const data = await GroupService.getTeacherGroups();
    setGroups(data);
    setLoading(false);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setCreating(true);
    const newGroup = await GroupService.createGroup(newGroupName.trim());
    
    if (newGroup) {
      setGroups(prev => [newGroup, ...prev]);
      setNewGroupName('');
      setShowCreateForm(false);
    }
    
    setCreating(false);
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhóm này? Tất cả thành viên sẽ bị xóa khỏi nhóm.')) {
      return;
    }

    const success = await GroupService.deleteGroup(groupId);
    if (success) {
      setGroups(prev => prev.filter(g => g.id !== groupId));
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
              <h1 className="text-3xl font-bold text-gray-900">Quản lý lớp học</h1>
              <p className="text-gray-600 mt-2">Tạo và quản lý các nhóm học sinh của bạn</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Tạo lớp mới
            </button>
          </div>

          {/* Create Group Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Tạo lớp học mới</h2>
                <form onSubmit={handleCreateGroup}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên lớp học
                    </label>
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Ví dụ: Toán 12A1"
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewGroupName('');
                      }}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {creating ? 'Đang tạo...' : 'Tạo lớp'}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có lớp học nào</h3>
              <p className="text-gray-600 mb-6">Tạo lớp học đầu tiên để bắt đầu quản lý học sinh</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Tạo lớp đầu tiên
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <div key={group.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{group.name}</h3>
                      <p className="text-sm text-gray-600">
                        Tạo ngày: {new Date(group.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Xóa lớp"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Số học sinh:</span>
                      <span className="font-semibold text-gray-900">{group.member_count || 0}</span>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Mã mời:</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(group.invite_code)}
                          className="text-xs text-indigo-600 hover:text-indigo-700"
                        >
                          Sao chép
                        </button>
                      </div>
                      <div className="font-mono text-lg font-bold text-center bg-white p-2 rounded border-2 border-dashed border-gray-300">
                        {group.invite_code}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/teacher/groups/${group.id}`}
                      className="flex-1 bg-indigo-600 text-white text-center py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                    >
                      Quản lý
                    </Link>
                    <Link
                      to={`/teacher/groups/${group.id}/stats`}
                      className="flex-1 bg-gray-100 text-gray-700 text-center py-2 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Thống kê
                    </Link>
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

export default TeacherGroupsPage;