import React, { useState, useEffect } from 'react';
import { TeacherVerificationService, type TeacherVerificationCode, type PendingTeacher } from '../services/teacherVerificationService';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'codes' | 'pending'>('codes');
  const [verificationCodes, setVerificationCodes] = useState<TeacherVerificationCode[]>([]);
  const [pendingTeachers, setPendingTeachers] = useState<PendingTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create code form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCode, setNewCode] = useState({
    code: '',
    school: '',
    description: '',
    maxUses: 1,
    expiresAt: ''
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    if (activeTab === 'codes') {
      const codes = await TeacherVerificationService.getVerificationCodes();
      setVerificationCodes(codes);
    } else {
      const pending = await TeacherVerificationService.getPendingTeachers();
      setPendingTeachers(pending);
    }
    setLoading(false);
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await TeacherVerificationService.createVerificationCode(
      newCode.code,
      newCode.school,
      newCode.description || undefined,
      newCode.maxUses,
      newCode.expiresAt ? new Date(newCode.expiresAt) : undefined
    );

    if (result.success) {
      alert('Tạo mã xác thực thành công!');
      setShowCreateForm(false);
      setNewCode({ code: '', school: '', description: '', maxUses: 1, expiresAt: '' });
      loadData();
    } else {
      alert(result.message);
    }
  };

  const handleDeactivateCode = async (codeId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn vô hiệu hóa mã này?')) {
      const success = await TeacherVerificationService.deactivateVerificationCode(codeId);
      if (success) {
        alert('Đã vô hiệu hóa mã thành công');
        loadData();
      }
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode(prev => ({ ...prev, code: result }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel - Quản lý Giáo viên</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('codes')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'codes'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Mã xác thực ({verificationCodes.length})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Giáo viên chờ xác thực ({pendingTeachers.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Verification Codes Tab */}
        {activeTab === 'codes' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Mã xác thực giáo viên</h2>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Tạo mã mới
              </button>
            </div>

            {/* Create Code Modal */}
            {showCreateForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-md">
                  <h3 className="text-lg font-bold mb-4">Tạo mã xác thực mới</h3>
                  <form onSubmit={handleCreateCode} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mã xác thực
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCode.code}
                          onChange={(e) => setNewCode(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Nhập mã hoặc tạo ngẫu nhiên"
                          required
                        />
                        <button
                          type="button"
                          onClick={generateRandomCode}
                          className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          Tạo
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Trường học
                      </label>
                      <input
                        type="text"
                        value={newCode.school}
                        onChange={(e) => setNewCode(prev => ({ ...prev, school: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Tên trường học"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mô tả (tùy chọn)
                      </label>
                      <input
                        type="text"
                        value={newCode.description}
                        onChange={(e) => setNewCode(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Mô tả thêm về mã này"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số lần sử dụng tối đa
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newCode.maxUses}
                        onChange={(e) => setNewCode(prev => ({ ...prev, maxUses: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày hết hạn (tùy chọn)
                      </label>
                      <input
                        type="datetime-local"
                        value={newCode.expiresAt}
                        onChange={(e) => setNewCode(prev => ({ ...prev, expiresAt: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        Tạo mã
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Codes List */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mã
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trường học
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sử dụng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {verificationCodes.map((code) => (
                      <tr key={code.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-mono text-sm font-medium text-gray-900">
                            {code.code}
                          </div>
                          {code.description && (
                            <div className="text-xs text-gray-500">{code.description}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {code.school}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {code.current_uses} / {code.max_uses}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            code.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {code.is_active ? 'Hoạt động' : 'Vô hiệu'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {code.is_active && (
                            <button
                              onClick={() => handleDeactivateCode(code.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Vô hiệu hóa
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
        )}

        {/* Pending Teachers Tab */}
        {activeTab === 'pending' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Giáo viên chờ xác thực</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Họ tên
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trường học
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày yêu cầu
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingTeachers.map((teacher) => (
                      <tr key={teacher.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {teacher.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {teacher.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {teacher.school || 'Chưa cung cấp'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(teacher.verification_requested_at).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;