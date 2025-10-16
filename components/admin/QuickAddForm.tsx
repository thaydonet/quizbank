import React, { useState } from 'react';
import { AdminService } from '../../services/adminService';

const QuickAddForm: React.FC = () => {
  const [formData, setFormData] = useState({
    subjectName: '',
    subjectCode: '',
    chapterName: '',
    chapterCode: '',
    lessonName: '',
    lessonCode: '',
    questionTypeName: '',
    questionTypeCode: '',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Tạo môn học
      const subject = await AdminService.createSubject({
        name: formData.subjectName,
        code: formData.subjectCode,
        description: `Môn ${formData.subjectName}`
      });

      // 2. Tạo chương
      const chapter = await AdminService.createChapter({
        subject_id: subject.id,
        name: formData.chapterName,
        code: formData.chapterCode,
        order_index: 1,
        description: `Chương ${formData.chapterName}`
      });

      // 3. Tạo bài học
      const lesson = await AdminService.createLesson({
        chapter_id: chapter.id,
        name: formData.lessonName,
        code: formData.lessonCode,
        order_index: 1,
        description: `Bài ${formData.lessonName}`
      });

      // 4. Tạo dạng bài
      const questionType = await AdminService.createQuestionType({
        lesson_id: lesson.id,
        name: formData.questionTypeName,
        code: formData.questionTypeCode,
        order_index: 1,
        description: `Dạng ${formData.questionTypeName}`,
        difficulty_level: formData.difficulty
      });

      alert(`Tạo thành công!\nPath: ${formData.subjectCode}-${formData.chapterCode}-${formData.lessonCode}-${formData.questionTypeCode}`);
      
      // Reset form
      setFormData({
        subjectName: '',
        subjectCode: '',
        chapterName: '',
        chapterCode: '',
        lessonName: '',
        lessonCode: '',
        questionTypeName: '',
        questionTypeCode: '',
        difficulty: 'easy'
      });

    } catch (error) {
      console.error('Error creating structure:', error);
      alert('Có lỗi xảy ra: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">🚀 Tạo nhanh cấu trúc hoàn chỉnh</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Môn học */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên môn học
            </label>
            <input
              type="text"
              value={formData.subjectName}
              onChange={(e) => setFormData(prev => ({ ...prev, subjectName: e.target.value }))}
              placeholder="Ví dụ: Toán học"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã môn học
            </label>
            <input
              type="text"
              value={formData.subjectCode}
              onChange={(e) => setFormData(prev => ({ ...prev, subjectCode: e.target.value.toUpperCase() }))}
              placeholder="Ví dụ: TOAN"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
        </div>

        {/* Chương */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên chương
            </label>
            <input
              type="text"
              value={formData.chapterName}
              onChange={(e) => setFormData(prev => ({ ...prev, chapterName: e.target.value }))}
              placeholder="Ví dụ: Đại số"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã chương
            </label>
            <input
              type="text"
              value={formData.chapterCode}
              onChange={(e) => setFormData(prev => ({ ...prev, chapterCode: e.target.value.toUpperCase() }))}
              placeholder="Ví dụ: DAI-SO"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
        </div>

        {/* Bài học */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên bài học
            </label>
            <input
              type="text"
              value={formData.lessonName}
              onChange={(e) => setFormData(prev => ({ ...prev, lessonName: e.target.value }))}
              placeholder="Ví dụ: Phương trình bậc nhất"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã bài học
            </label>
            <input
              type="text"
              value={formData.lessonCode}
              onChange={(e) => setFormData(prev => ({ ...prev, lessonCode: e.target.value.toUpperCase() }))}
              placeholder="Ví dụ: BAI1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
        </div>

        {/* Dạng bài */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên dạng bài
            </label>
            <input
              type="text"
              value={formData.questionTypeName}
              onChange={(e) => setFormData(prev => ({ ...prev, questionTypeName: e.target.value }))}
              placeholder="Ví dụ: Giải phương trình cơ bản"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã dạng bài
            </label>
            <input
              type="text"
              value={formData.questionTypeCode}
              onChange={(e) => setFormData(prev => ({ ...prev, questionTypeCode: e.target.value.toUpperCase() }))}
              placeholder="Ví dụ: DANG1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Độ khó
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Preview Path:</h3>
          <code className="text-sm text-indigo-600">
            {formData.subjectCode}-{formData.chapterCode}-{formData.lessonCode}-{formData.questionTypeCode}
          </code>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            {loading ? 'Đang tạo...' : '🚀 Tạo cấu trúc'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuickAddForm;