import React, { useState } from 'react';
import { Question } from '../types';

interface CreateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (title: string, description: string, isPublic: boolean) => void;
  questions: Question[];
  loading?: boolean;
}

const CreateQuizModal: React.FC<CreateQuizModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  questions,
  loading = false
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onConfirm(title.trim(), description.trim(), isPublic);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setIsPublic(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Tạo đề thi mới</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Tên đề thi *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Nhập tên đề thi..."
              required
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              Tên này sẽ hiển thị cho học sinh khi làm bài
            </p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả (tùy chọn)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Mô tả về đề thi..."
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="flex items-center">
            <input
              id="isPublic"
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
              Công khai (học sinh có thể tìm thấy và làm bài)
            </label>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Thông tin đề thi:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Tổng số câu:</span>
                <span className="font-semibold ml-2">{questions.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Trắc nghiệm:</span>
                <span className="font-semibold ml-2">
                  {questions.filter(q => q.type === 'mcq').length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Đúng/Sai:</span>
                <span className="font-semibold ml-2">
                  {questions.filter(q => q.type === 'msq').length}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Tự luận:</span>
                <span className="font-semibold ml-2">
                  {questions.filter(q => q.type === 'sa').length}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!title.trim() || loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Đang tạo...' : 'Tạo đề thi'}
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            💡 <strong>Lưu ý:</strong> Sau khi tạo, bạn sẽ nhận được link để chia sẻ với học sinh. 
            Link này có dạng: <code className="bg-blue-100 px-1 rounded">domain.com/quiz/ten-de-thi</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateQuizModal;
