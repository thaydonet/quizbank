import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import AdminStatsDashboard from './AdminStatsDashboard';
import QuestionBankAdmin from './admin/QuestionBankAdmin';
import QuestionBankOverview from './admin/QuestionBankOverview';


interface InviteCode {
  id: string;
  code: string;
  used: boolean;
  created_at: string;
  used_at?: string;
  used_by?: string;
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'stats' | 'invites' | 'questions'>('stats');
  const [showQuestionBankAdmin, setShowQuestionBankAdmin] = useState(false);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newCodeCount, setNewCodeCount] = useState(1);

  // Generate random invite code
  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  // Load existing invite codes
  const loadInviteCodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invite_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInviteCodes(data || []);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  // Generate new invite codes
  const generateNewCodes = async () => {
    setLoading(true);
    setError('');

    try {
      const newCodes = Array.from({ length: newCodeCount }, () => ({
        code: generateInviteCode(),
        used: false
      }));

      const { error } = await supabase
        .from('invite_codes')
        .insert(newCodes);

      if (error) throw error;

      alert(`Đã tạo thành công ${newCodeCount} mã mời!`);
      loadInviteCodes();
      setNewCodeCount(1);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  // Delete an invite code
  const deleteInviteCode = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa mã mời này?')) return;

    try {
      const { error } = await supabase
        .from('invite_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadInviteCodes();
    } catch (err: any) {
      setError(err.message);
    }
  };



  useEffect(() => {
    loadInviteCodes();
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Tab Navigation */}
      <div className="bg-white rounded-t-lg shadow border-b">
        <nav className="flex space-x-8 px-6 pt-4">
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'stats'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            📊 Thống kê tổng quan
          </button>
          <button
            onClick={() => setActiveTab('invites')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'invites'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            🎫 Quản lý mã mời
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'questions'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            📚 Ngân hàng câu hỏi
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'stats' && (
        <div className="bg-gray-50 rounded-b-lg">
          <AdminStatsDashboard />
        </div>
      )}

      {activeTab === 'questions' && (
        <div className="p-6 bg-white rounded-b-lg shadow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Quản lý Ngân hàng Câu hỏi</h2>
            <button
              onClick={() => setShowQuestionBankAdmin(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
            >
              📝 Mở giao diện quản lý
            </button>
          </div>

          <QuestionBankOverview />

          {/* Question Bank Admin Modal */}
          {showQuestionBankAdmin && (
            <QuestionBankAdmin onClose={() => setShowQuestionBankAdmin(false)} />
          )}
        </div>
      )}

      {activeTab === 'invites' && (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-b-lg shadow">
          <h2 className="text-2xl font-bold mb-6 text-center">Quản lý mã mời giáo viên</h2>

          {/* Generate new codes section */}
          <div className="mb-8 p-4 bg-gray-50 rounded">
            <h3 className="text-lg font-semibold mb-4">Tạo mã mời mới</h3>
            <div className="flex items-center gap-4">
              <label className="font-medium">Số lượng:</label>
              <input
                type="number"
                min="1"
                max="50"
                value={newCodeCount}
                onChange={(e) => setNewCodeCount(parseInt(e.target.value) || 1)}
                className="w-20 p-2 border rounded"
              />
              <button
                onClick={generateNewCodes}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Đang tạo...' : 'Tạo mã mời'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Invite codes list */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Danh sách mã mời ({inviteCodes.length})</h3>

            {loading ? (
              <div className="text-center py-4">Đang tải...</div>
            ) : inviteCodes.length === 0 ? (
              <div className="text-center py-4 text-gray-500">Chưa có mã mời nào</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">Mã mời</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Trạng thái</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Ngày tạo</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Ngày sử dụng</th>
                      <th className="border border-gray-300 px-4 py-2 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inviteCodes.map((code) => (
                      <tr key={code.id} className={code.used ? 'bg-gray-50' : ''}>
                        <td className="border border-gray-300 px-4 py-2 font-mono">
                          {code.code}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <span className={`px-2 py-1 rounded text-sm ${code.used
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                            }`}>
                            {code.used ? 'Đã sử dụng' : 'Chưa sử dụng'}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {new Date(code.created_at).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {code.used_at
                            ? new Date(code.used_at).toLocaleDateString('vi-VN')
                            : '-'
                          }
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {!code.used && (
                            <button
                              onClick={() => deleteInviteCode(code.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                            >
                              Xóa
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Usage instructions */}
          <div className="mt-8 p-4 bg-blue-50 rounded">
            <h3 className="text-lg font-semibold mb-2">Hướng dẫn sử dụng:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Tạo mã mời mới bằng cách nhập số lượng và nhấn "Tạo mã mời"</li>
              <li>Sao chép mã mời từ bảng và gửi cho giáo viên</li>
              <li>Giáo viên sử dụng mã mời khi đăng ký tài khoản</li>
              <li>Mã mời sẽ được đánh dấu "Đã sử dụng" sau khi đăng ký thành công</li>
              <li>Có thể xóa các mã mời chưa sử dụng nếu cần</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}