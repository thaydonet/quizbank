import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

interface QuizCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (title: string, maxAttempts: number) => void;
  questionCount: number;
}

const QuizCreationModal: React.FC<QuizCreationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  questionCount
}) => {
  const [title, setTitle] = useState('');
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Load current user
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (userData) {
            setCurrentUser(userData);
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };

    if (isOpen) {
      getCurrentUser();
      // Generate default title
      const now = new Date();
      const dateStr = now.toLocaleDateString('vi-VN');
      const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      setTitle(`Đề thi ${questionCount} câu - ${dateStr} ${timeStr}`);
      setMaxAttempts(1);
      setError('');
    }
  }, [isOpen, questionCount]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề đề thi.');
      return;
    }

    if (maxAttempts < 1 || maxAttempts > 10) {
      setError('Số lần thi phải từ 1 đến 10.');
      return;
    }

    // Check if title already exists for this teacher
    if (currentUser) {
      setLoading(true);
      try {
        const { data, error: checkError } = await supabase
          .from('quizzes')
          .select('id')
          .eq('title', title.trim())
          .eq('created_by', currentUser.id)
          .eq('is_active', true);

        if (checkError) {
          console.error('Error checking title:', checkError);
        } else if (data && data.length > 0) {
          setError('Tiêu đề này đã tồn tại. Vui lòng chọn tiêu đề khác.');
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error checking title:', error);
      }
      setLoading(false);
    }

    onConfirm(title.trim(), maxAttempts);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Tạo đề thi mới</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">Thông tin đề thi</span>
            </div>
            <p className="text-blue-600 text-sm mt-1">
              Số câu hỏi đã chọn: <strong>{questionCount}</strong>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề đề thi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Nhập tiêu đề cho đề thi"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">Tối đa 100 ký tự</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số lần thi cho phép <span className="text-red-500">*</span>
            </label>
            <select
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(parseInt(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num}>
                  {num} lần {num === 1 ? '(mặc định)' : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Học sinh có thể làm bài thi này tối đa {maxAttempts} lần
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            {loading ? 'Đang tạo...' : 'Tạo đề thi'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizCreationModal;