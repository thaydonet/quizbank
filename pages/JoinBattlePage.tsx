import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BattleService } from '../services/battleService';
import { useAuth } from '../contexts/AuthContext';

const JoinBattlePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [roomCode, setRoomCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const handleJoinBattle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim() || !displayName.trim()) return;

    setJoining(true);
    setError('');

    try {
      const result = await BattleService.joinBattleRoom(
        roomCode.trim(),
        displayName.trim(),
        user?.id
      );

      if (result.success) {
        navigate(`/battle/room/${roomCode.trim()}`);
      } else {
        setError(result.message || 'Có lỗi xảy ra khi tham gia phòng');
      }
    } catch (error) {
      console.error('Error joining battle:', error);
      setError('Có lỗi xảy ra khi tham gia phòng');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏆 Tham Gia Thi Đấu
          </h1>
          <p className="text-gray-600">
            Nhập mã phòng để tham gia cuộc thi đấu
          </p>
        </div>

        <form onSubmit={handleJoinBattle} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-2">
              Mã phòng *
            </label>
            <input
              id="roomCode"
              type="number"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-center text-2xl font-mono tracking-wider"
              placeholder="1234"
              required
              min="1000"
              max="9999"
            />
            <p className="text-xs text-gray-500 mt-2">
              Nhập mã 4 số mà giáo viên cung cấp
            </p>
          </div>

          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
              Tên hiển thị *
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="VD: Nguyễn Văn A"
              required
              maxLength={30}
            />
            <p className="text-xs text-gray-500 mt-2">
              Tên này sẽ hiển thị trên bảng xếp hạng • Không cần đăng nhập
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">📋 Lưu ý quan trọng:</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Mỗi câu hỏi có thời gian giới hạn</li>
              <li>• Trả lời nhanh và đúng để được điểm cao</li>
              <li>• Theo dõi bảng xếp hạng realtime</li>
              <li>• Không thể thay đổi đáp án sau khi gửi</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={!roomCode.trim() || !displayName.trim() || joining}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-lg"
          >
            {joining ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                Đang tham gia...
              </div>
            ) : (
              '🚀 Tham gia ngay!'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Về trang chủ
          </button>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-yellow-800 mb-1">💡 Mẹo để đạt điểm cao:</p>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Đọc kỹ đề trước khi chọn đáp án</li>
                <li>• Trả lời càng nhanh càng được nhiều điểm</li>
                <li>• Giữ streak (chuỗi đúng) để có bonus</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinBattlePage;
