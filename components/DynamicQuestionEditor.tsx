import React, { useState, useCallback } from 'react';
import { DynamicQuestionEngine } from '../services/dynamicQuestionEngine';
import SparklesIcon from './icons/SparklesIcon';

interface DynamicQuestionEditorProps {
  onSave: (question: any) => void;
  onCancel: () => void;
}

export default function DynamicQuestionEditor({ onSave, onCancel }: DynamicQuestionEditorProps) {
  const [questionData, setQuestionData] = useState({
    id: `dyn_${Date.now()}`,
    type: 'mcq' as 'mcq' | 'msq' | 'sa',
    question: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: '',
    explanation: '',
    isDynamic: true
  });

  // Additional metadata fields
  const [metadata, setMetadata] = useState({
    grade_level: '12',
    chapter: '1',
    lesson: '1',
    type_category: '1'
  });

  // JSON import functionality
  const [jsonInput, setJsonInput] = useState('');
  const [showJsonImport, setShowJsonImport] = useState(false);

  const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewCount, setPreviewCount] = useState(3);

  const engine = new DynamicQuestionEngine();

  const handleInputChange = useCallback((field: string, value: string) => {
    setQuestionData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleMetadataChange = useCallback((field: string, value: string) => {
    setMetadata(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleJsonImport = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonInput);
      
      // Validate required fields
      if (!parsed.question || !parsed.type || !parsed.correct_option) {
        alert('JSON không hợp lệ! Cần có ít nhất: question, type, correct_option');
        return;
      }

      // Convert colon syntax (!b:5:15!) to standard dynamic syntax (!b#5#15#integer!)
      const convertVariableSyntax = (text: string): string => {
        if (!text) return text;
        
        // Pattern: !variable:min:max! → !variable#min#max#integer!
        return text.replace(/!(\w+):([-]?\d*\.?\d+):([-]?\d*\.?\d+)!/g, '!$1#$2#$3#integer!');
      };

      // Apply conversion to all text fields
      const convertedQuestion = convertVariableSyntax(parsed.question);
      const convertedOptionA = convertVariableSyntax(parsed.option_a || '');
      const convertedOptionB = convertVariableSyntax(parsed.option_b || '');
      const convertedOptionC = convertVariableSyntax(parsed.option_c || '');
      const convertedOptionD = convertVariableSyntax(parsed.option_d || '');
      const convertedCorrectOption = convertVariableSyntax(parsed.correct_option);
      const convertedExplanation = convertVariableSyntax(parsed.explanation || '');

      // Update question data
      setQuestionData({
        id: parsed.id || `dyn_${Date.now()}`,
        type: parsed.type,
        question: convertedQuestion,
        option_a: convertedOptionA,
        option_b: convertedOptionB,
        option_c: convertedOptionC,
        option_d: convertedOptionD,
        correct_option: convertedCorrectOption,
        explanation: convertedExplanation,
        isDynamic: true
      });

      setJsonInput('');
      setShowJsonImport(false);
      alert('✅ Đã import thành công từ JSON! Cú pháp biến đã được chuyển đổi tự động.');
    } catch (error) {
      alert('❌ Lỗi định dạng JSON! Vui lòng kiểm tra lại.');
    }
  }, [jsonInput]);

  const generatePreview = useCallback(() => {
    try {
      const variations = engine.generateVariations(questionData, previewCount);
      setPreviewQuestions(variations);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      alert('Lỗi khi tạo xem trước. Vui lòng kiểm tra lại định dạng câu hỏi.');
    }
  }, [questionData, previewCount, engine]);

  const handleSave = useCallback(() => {
    if (!questionData.question.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi');
      return;
    }

    if (!questionData.correct_option.trim()) {
      alert('Vui lòng nhập đáp án đúng');
      return;
    }

    // Validate question has dynamic elements
    if (!engine.isDynamicQuestion(questionData)) {
      const confirmSave = confirm('Câu hỏi này không chứa yếu tố động. Bạn có muốn lưu như câu hỏi thường không?');
      if (!confirmSave) return;
    }

    // Combine question data with metadata
    const finalQuestionData = {
      ...questionData,
      metadata
    };

    onSave(finalQuestionData);
  }, [questionData, metadata, engine, onSave]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-purple-600" />
              Tạo câu hỏi động
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Help Section */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Hướng dẫn sử dụng:</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <div>
                <strong>Biến số:</strong> <code>!tên#min#max#loại!</code>
                <br />
                Ví dụ: <code>!a#-10#10#integer!</code> (số nguyên từ -10 đến 10)
                <br />
                <code>!b#0#5#decimal#2!</code> (số thập phân từ 0 đến 5, 2 chữ số thập phân)
              </div>
              <div>
                <strong>Tính toán:</strong> <code>{`{tinh: biểu_thức}`}</code>
                <br />
                Ví dụ: <code>{`{tinh: !a! + !b!}`}</code>, <code>{`{tinh: !a! * !b! - 5}`}</code>
              </div>
              <div>
                <strong>Sử dụng biến:</strong> <code>!tên!</code> sau khi đã định nghĩa
              </div>
              <div>
                <strong>💡 Tự động xử lý dấu:</strong> Hệ thống tự động chuyển <code>+ -</code> thành <code>-</code> và <code>- -</code> thành <code>+</code>
                <br />
                Ví dụ: <code>$x^2 + !b!x$</code> với b=-5 sẽ hiển thị <code>$x^2 - 5x$</code>
              </div>
              <div>
                <strong>🎯 Quy tắc toán học:</strong> Tự động áp dụng quy tắc cho 0 và 1 (hỗ trợ mọi bậc: x, x^2, x^3, x^4, ...)
                <br />
                • <code>1x^3</code> → <code>x^3</code>, <code>-1x^2</code> → <code>-x^2</code>
                <br />
                • <code>0x^4</code> → bỏ số hạng, <code>x^1</code> → <code>x</code>, <code>x^0</code> → <code>1</code>
                <br />
                • Ví dụ: <code>1x^3 + 0x^2 + -1x + 0</code> → <code>x^3 - x</code>
              </div>
            </div>
          </div>

          {/* JSON Import Section */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-green-900">Import từ JSON</h3>
              <button
                onClick={() => setShowJsonImport(!showJsonImport)}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                {showJsonImport ? 'Ẩn' : 'Hiển thị'} JSON Import
              </button>
            </div>
            
            {showJsonImport && (
              <div className="space-y-4">
                {/* Metadata Selection */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lớp
                    </label>
                    <select
                      value={metadata.grade_level}
                      onChange={(e) => handleMetadataChange('grade_level', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="10">Lớp 10</option>
                      <option value="11">Lớp 11</option>
                      <option value="12">Lớp 12</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Chương
                    </label>
                    <select
                      value={metadata.chapter}
                      onChange={(e) => handleMetadataChange('chapter', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-green-500 focus:border-green-500"
                    >
                      {[1,2,3,4,5,6,7,8,9,10].map(num => (
                        <option key={num} value={num.toString()}>Chương {num}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bài
                    </label>
                    <select
                      value={metadata.lesson}
                      onChange={(e) => handleMetadataChange('lesson', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-green-500 focus:border-green-500"
                    >
                      {[1,2,3,4,5,6,7,8,9,10].map(num => (
                        <option key={num} value={num.toString()}>Bài {num}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dạng
                    </label>
                    <select
                      value={metadata.type_category}
                      onChange={(e) => handleMetadataChange('type_category', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-green-500 focus:border-green-500"
                    >
                      {[1,2,3,4,5].map(num => (
                        <option key={num} value={num.toString()}>Dạng {num}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* JSON Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dán JSON câu hỏi (theo định dạng toan-12-chuong-1-bai-1-dang-1.json)
                  </label>
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder={`Ví dụ:
{
  "id": "mcq1-12-1-1-2",
  "type": "mcq",
  "question": "Cho hàm số $y = !a#0!x^2 + !b:5:15!x + !c!$. Tính {tinh: !a! + !b!} =",
  "option_a": "{tinh: !a! + !b! + 1}",
  "option_b": "{tinh: !a! + !b!}",
  "option_c": "{tinh: !a! + !b! - 1}",
  "option_d": "{tinh: !a! + !b! + 2}",
  "correct_option": "B",
  "explanation": "Ta có !a! + !b! = {tinh: !a! + !b!}"
}`}
                    className="w-full p-3 border border-gray-300 rounded-md text-sm font-mono focus:ring-green-500 focus:border-green-500"
                    rows={8}
                  />
                </div>
                
                <button
                  onClick={handleJsonImport}
                  disabled={!jsonInput.trim()}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Import JSON
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Editor Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Soạn câu hỏi</h3>
              
              {/* Question Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại câu hỏi
                </label>
                <select
                  value={questionData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="mcq">Trắc nghiệm</option>
                  <option value="msq">Đúng - Sai</option>
                  <option value="sa">Trả lời ngắn</option>
                </select>
              </div>

              {/* Question */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Câu hỏi *
                </label>
                <textarea
                  value={questionData.question}
                  onChange={(e) => handleInputChange('question', e.target.value)}
                  placeholder="Ví dụ: Cho hàm số $y=!a#-10#10#integer!x^2+!b#-5#5#integer!x+!c#-3#3#integer!$, tính {tinh: !a!+!b!} = ?"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                />
              </div>

              {/* Options for MCQ and MSQ */}
              {(questionData.type === 'mcq' || questionData.type === 'msq') && (
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Đáp án A
                    </label>
                    <input
                      type="text"
                      value={questionData.option_a}
                      onChange={(e) => handleInputChange('option_a', e.target.value)}
                      placeholder="Ví dụ: {tinh: !a! + !b! + 1}"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Đáp án B
                    </label>
                    <input
                      type="text"
                      value={questionData.option_b}
                      onChange={(e) => handleInputChange('option_b', e.target.value)}
                      placeholder="Ví dụ: {tinh: !a! + !b! - 1}"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Đáp án C
                    </label>
                    <input
                      type="text"
                      value={questionData.option_c}
                      onChange={(e) => handleInputChange('option_c', e.target.value)}
                      placeholder="Ví dụ: {tinh: !a! + !b!}"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Đáp án D
                    </label>
                    <input
                      type="text"
                      value={questionData.option_d}
                      onChange={(e) => handleInputChange('option_d', e.target.value)}
                      placeholder="Ví dụ: {tinh: !a! + !b! + 2}"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Correct Answer */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Đáp án đúng *
                </label>
                <input
                  type="text"
                  value={questionData.correct_option}
                  onChange={(e) => handleInputChange('correct_option', e.target.value)}
                  placeholder={questionData.type === 'sa' ? "Ví dụ: {tinh: !a! + !b!}" : "Ví dụ: C hoặc {tinh: !a! + !b!}"}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Explanation */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giải thích
                </label>
                <textarea
                  value={questionData.explanation}
                  onChange={(e) => handleInputChange('explanation', e.target.value)}
                  placeholder="Ví dụ: Ta có !a! + !b! = {tinh: !a! + !b!}"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                />
              </div>

              {/* Preview Controls */}
              <div className="mb-4">
                <div className="flex items-center gap-4 mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Số câu xem trước:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={previewCount}
                    onChange={(e) => setPreviewCount(parseInt(e.target.value) || 3)}
                    className="w-20 p-1 border border-gray-300 rounded text-center"
                  />
                </div>
                <button
                  onClick={generatePreview}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Xem trước câu hỏi
                </button>
              </div>
            </div>

            {/* Preview Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Xem trước</h3>
              
              {showPreview && previewQuestions.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {previewQuestions.map((q, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h4 className="font-medium text-sm text-gray-600 mb-2">Biến thể {index + 1}</h4>
                      
                      <div className="mb-3">
                        <div className="font-medium text-gray-800">{q.question}</div>
                      </div>

                      {(questionData.type === 'mcq' || questionData.type === 'msq') && (
                        <div className="space-y-1 mb-3 text-sm">
                          {q.option_a && <div>A. {q.option_a}</div>}
                          {q.option_b && <div>B. {q.option_b}</div>}
                          {q.option_c && <div>C. {q.option_c}</div>}
                          {q.option_d && <div>D. {q.option_d}</div>}
                        </div>
                      )}

                      <div className="text-sm">
                        <div className="text-green-600 font-medium">
                          Đáp án: {q.correct_option}
                        </div>
                        {q.explanation && (
                          <div className="text-gray-600 mt-1">
                            Giải thích: {q.explanation}
                          </div>
                        )}
                      </div>

                      {/* Show generated variables */}
                      <div className="mt-2 text-xs text-gray-500">
                        Biến: {Object.entries(q.variables).map(([name, value]) => `${name}=${value}`).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Nhấn "Xem trước câu hỏi" để xem các biến thể
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium"
            >
              Lưu câu hỏi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}