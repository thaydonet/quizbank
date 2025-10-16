import React, { useState } from 'react';
import { AdminService } from '../../services/adminService';
import { generateQuizQuestions } from '../../services/geminiService';
import type { QuestionType } from '../../services/questionBankService';
import DynamicQuestionEditor from '../DynamicQuestionEditor';

interface QuestionFormProps {
  questionTypes: QuestionType[];
  onQuestionAdded?: () => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ questionTypes, onQuestionAdded }) => {
  const [formData, setFormData] = useState({
    question_type_id: '',
    type: 'mcq' as 'mcq' | 'msq' | 'sa',
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: '',
    explanation: '',
    difficulty_level: 'easy' as 'easy' | 'medium' | 'hard',
    tags: '',
    is_dynamic: false
  });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showDynamicEditor, setShowDynamicEditor] = useState(false);
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [jsonImportLoading, setJsonImportLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const questionData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      };

      await AdminService.createQuestion(questionData);
      alert('Thêm câu hỏi thành công!');
      
      // Reset form
      setFormData({
        question_type_id: '',
        type: 'mcq',
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_option: '',
        explanation: '',
        difficulty_level: 'easy',
        tags: '',
        is_dynamic: false
      });

      if (onQuestionAdded) {
        onQuestionAdded();
      }

    } catch (error) {
      console.error('Error creating question:', error);
      alert('Có lỗi xảy ra: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      alert('Vui lòng nhập mô tả cho câu hỏi AI');
      return;
    }

    setAiLoading(true);
    try {
      const result = await generateQuizQuestions(aiPrompt);
      const parsedResult = JSON.parse(result);
      
      if (parsedResult.error) {
        alert(`Lỗi từ AI: ${parsedResult.error}\n${parsedResult.details || ''}`);
        return;
      }

      if (parsedResult.questions && parsedResult.questions.length > 0) {
        // Auto-fill the first question
        const firstQuestion = parsedResult.questions[0];
        setFormData(prev => ({
          ...prev,
          question_text: firstQuestion.question || '',
          option_a: firstQuestion.option_a || '',
          option_b: firstQuestion.option_b || '',
          option_c: firstQuestion.option_c || '',
          option_d: firstQuestion.option_d || '',
          correct_option: firstQuestion.correct_option || '',
          explanation: firstQuestion.explanation || '',
          type: firstQuestion.type || 'mcq'
        }));
        alert(`Đã tạo ${parsedResult.questions.length} câu hỏi từ AI. Câu hỏi đầu tiên đã được điền vào form.`);
      } else {
        alert('AI không tạo được câu hỏi. Vui lòng thử lại với mô tả khác.');
      }
    } catch (error) {
      console.error('Error generating AI questions:', error);
      alert('Có lỗi xảy ra khi tạo câu hỏi từ AI: ' + error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIQuestionGenerated = (generatedQuestion: any) => {
    if (generatedQuestion) {
      setFormData(prev => ({
        ...prev,
        question_text: generatedQuestion.question || '',
        option_a: generatedQuestion.option_a || '',
        option_b: generatedQuestion.option_b || '',
        option_c: generatedQuestion.option_c || '',
        option_d: generatedQuestion.option_d || '',
        correct_option: generatedQuestion.correct_option || '',
        explanation: generatedQuestion.explanation || '',
        type: generatedQuestion.type || 'mcq',
        is_dynamic: generatedQuestion.isDynamic || false
      }));
      setShowDynamicEditor(false);
      alert('Đã tạo câu hỏi động từ AI!');
    }
  };

  const handleJsonFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setJsonFile(file);
    setJsonImportLoading(true);

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      
      // Validate JSON structure
      if (!jsonData.questions || !Array.isArray(jsonData.questions)) {
        throw new Error('JSON không hợp lệ: Cần có trường "questions" là một mảng');
      }

      // Import questions
      const questionsToImport = jsonData.questions.map((q: any) => ({
        question_type_id: formData.question_type_id || jsonData.question_type_id,
        type: q.type || 'mcq',
        question_text: q.question || q.question_text || '',
        option_a: q.option_a || '',
        option_b: q.option_b || '',
        option_c: q.option_c || '',
        option_d: q.option_d || '',
        correct_option: q.correct_option || '',
        explanation: q.explanation || '',
        difficulty_level: q.difficulty_level || 'medium',
        tags: q.tags || [],
        is_dynamic: q.is_dynamic || false
      }));

      // Check if question_type_id is provided
      if (!questionsToImport[0].question_type_id) {
        throw new Error('Vui lòng chọn dạng bài hoặc cung cấp question_type_id trong JSON');
      }

      // Bulk import questions
      await AdminService.createQuestionsBulk(questionsToImport);
      
      alert(`Import thành công ${questionsToImport.length} câu hỏi từ file JSON!`);
      
      // Reset file input
      e.target.value = '';
      setJsonFile(null);

    } catch (error) {
      console.error('Error importing JSON:', error);
      alert('Có lỗi xảy ra khi import JSON: ' + error);
    } finally {
      setJsonImportLoading(false);
    }
  };

  const downloadSampleJson = () => {
    const sampleData = {
      "question_type_id": "YOUR_QUESTION_TYPE_ID_HERE",
      "questions": [
        {
          "type": "mcq",
          "question_text": "Đây là câu hỏi mẫu số 1",
          "option_a": "Đáp án A",
          "option_b": "Đáp án B",
          "option_c": "Đáp án C",
          "option_d": "Đáp án D",
          "correct_option": "B",
          "explanation": "Giải thích cho câu trả lời đúng",
          "difficulty_level": "medium",
          "tags": ["mẫu", "ví dụ"],
          "is_dynamic": false
        },
        {
          "type": "sa",
          "question_text": "Đây là câu hỏi trả lời ngắn mẫu",
          "correct_option": "Đáp án đúng",
          "explanation": "Giải thích cho câu trả lời đúng",
          "difficulty_level": "easy",
          "tags": ["mẫu", "trả lời ngắn"],
          "is_dynamic": false
        }
      ]
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sampleData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "sample_questions.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const renderOptions = () => {
    if (formData.type === 'sa') return null;

    return (
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Các lựa chọn</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lựa chọn A
            </label>
            <input
              type="text"
              value={formData.option_a}
              onChange={(e) => setFormData(prev => ({ ...prev, option_a: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required={formData.type === 'mcq' || formData.type === 'msq'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lựa chọn B
            </label>
            <input
              type="text"
              value={formData.option_b}
              onChange={(e) => setFormData(prev => ({ ...prev, option_b: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required={formData.type === 'mcq' || formData.type === 'msq'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lựa chọn C
            </label>
            <input
              type="text"
              value={formData.option_c}
              onChange={(e) => setFormData(prev => ({ ...prev, option_c: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required={formData.type === 'mcq' || formData.type === 'msq'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lựa chọn D
            </label>
            <input
              type="text"
              value={formData.option_d}
              onChange={(e) => setFormData(prev => ({ ...prev, option_d: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required={formData.type === 'mcq' || formData.type === 'msq'}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">➕ Thêm câu hỏi mới</h2>
      
      {/* AI Question Generation */}
      <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <h3 className="font-medium text-purple-900 mb-3">✨ Tạo câu hỏi bằng AI</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Mô tả câu hỏi bạn muốn AI tạo (ví dụ: 5 câu hỏi đạo hàm lớp 12 với độ khó trung bình)..."
            className="flex-1 px-3 py-2 border border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
          <button
            onClick={handleAIGenerate}
            disabled={aiLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 disabled:bg-purple-400"
          >
            {aiLoading ? 'Đang tạo...' : 'Tạo bằng AI'}
          </button>
          <button
            onClick={() => setShowDynamicEditor(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500"
          >
            Tạo câu hỏi động
          </button>
        </div>
        <p className="mt-2 text-sm text-purple-700">
          💡 Gợi ý: Nhập "Tạo 3 câu hỏi trắc nghiệm về đạo hàm lớp 12 với độ khó trung bình"
        </p>
      </div>

      {/* JSON Import Section */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <h3 className="font-medium text-green-900 mb-3">📥 Import câu hỏi từ file JSON</h3>
        <div className="flex items-center gap-3 mb-3">
          <label className="flex-1">
            <input
              type="file"
              accept=".json"
              onChange={handleJsonFileImport}
              className="w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-green-50 file:text-green-700
                hover:file:bg-green-100"
              disabled={jsonImportLoading}
            />
          </label>
          {jsonImportLoading && (
            <div className="flex items-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
              Đang xử lý...
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadSampleJson}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            Tải file mẫu
          </button>
        </div>
        <p className="mt-2 text-sm text-green-700">
          💡 File JSON cần có cấu trúc với trường "questions" là một mảng các câu hỏi. Bạn có thể tải file mẫu để tham khảo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Chọn dạng bài */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dạng bài *
          </label>
          <select
            value={formData.question_type_id}
            onChange={(e) => setFormData(prev => ({ ...prev, question_type_id: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            required
          >
            <option value="">-- Chọn dạng bài --</option>
            {questionTypes.map(qt => (
              <option key={qt.id} value={qt.id}>
                {qt.name} ({qt.code})
              </option>
            ))}
          </select>
        </div>

        {/* Loại câu hỏi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loại câu hỏi
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="mcq">Trắc nghiệm (MCQ)</option>
            <option value="msq">Đúng/Sai (MSQ)</option>
            <option value="sa">Trả lời ngắn (SA)</option>
          </select>
        </div>

        {/* Câu hỏi động */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_dynamic"
            checked={formData.is_dynamic}
            onChange={(e) => setFormData(prev => ({ ...prev, is_dynamic: e.target.checked }))}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="is_dynamic" className="ml-2 block text-sm text-gray-900">
            Câu hỏi động (sử dụng biến số)
          </label>
        </div>

        {/* Nội dung câu hỏi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nội dung câu hỏi *
          </label>
          <textarea
            value={formData.question_text}
            onChange={(e) => setFormData(prev => ({ ...prev, question_text: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Nhập nội dung câu hỏi..."
            required
          />
        </div>

        {/* Các lựa chọn */}
        {renderOptions()}

        {/* Đáp án đúng */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Đáp án đúng *
          </label>
          {formData.type === 'sa' ? (
            <input
              type="text"
              value={formData.correct_option}
              onChange={(e) => setFormData(prev => ({ ...prev, correct_option: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Nhập đáp án đúng..."
              required
            />
          ) : formData.type === 'mcq' ? (
            <select
              value={formData.correct_option}
              onChange={(e) => setFormData(prev => ({ ...prev, correct_option: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">-- Chọn đáp án đúng --</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          ) : (
            <input
              type="text"
              value={formData.correct_option}
              onChange={(e) => setFormData(prev => ({ ...prev, correct_option: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ví dụ: A,C (các đáp án đúng cách nhau bởi dấu phẩy)"
              required
            />
          )}
        </div>

        {/* Giải thích */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lời giải chi tiết
          </label>
          <textarea
            value={formData.explanation}
            onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Nhập lời giải chi tiết..."
          />
        </div>

        {/* Độ khó và Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Độ khó
            </label>
            <select
              value={formData.difficulty_level}
              onChange={(e) => setFormData(prev => ({ ...prev, difficulty_level: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (cách nhau bởi dấu phẩy)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ví dụ: phương trình, đại số, cơ bản"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            {loading ? 'Đang thêm...' : '➕ Thêm câu hỏi'}
          </button>
        </div>
      </form>

      {/* Dynamic Question Editor Modal */}
      {showDynamicEditor && (
        <DynamicQuestionEditor
          onSave={handleAIQuestionGenerated}
          onCancel={() => setShowDynamicEditor(false)}
        />
      )}
    </div>
  );
};

export default QuestionForm;