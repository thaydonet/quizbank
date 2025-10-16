import React, { useState } from 'react';
import { QuestionBankService } from '../../services/questionBankService';
import type { Question } from '../../types';

interface QuestionImporterProps {
  onClose?: () => void;
  onImportComplete?: (count: number) => void;
}

interface ImportQuestion {
  type: 'mcq' | 'msq' | 'sa';
  question: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_option: string;
  explanation: string;
  difficulty_level?: 'easy' | 'medium' | 'hard';
  is_dynamic?: boolean;
  tags?: string[];
}

const QuestionImporter: React.FC<QuestionImporterProps> = ({ onClose, onImportComplete }) => {
  const [activeTab, setActiveTab] = useState<'text' | 'json' | 'template'>('text');
  const [textInput, setTextInput] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [selectedQuestionType, setSelectedQuestionType] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewQuestions, setPreviewQuestions] = useState<ImportQuestion[]>([]);

  // Hierarchy data for selection
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [questionTypes, setQuestionTypes] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedLesson, setSelectedLesson] = useState('');

  // Load hierarchy data
  React.useEffect(() => {
    loadSubjects();
  }, []);

  React.useEffect(() => {
    if (selectedSubject) {
      loadChapters(selectedSubject);
    } else {
      setChapters([]);
      setSelectedChapter('');
    }
  }, [selectedSubject]);

  React.useEffect(() => {
    if (selectedChapter) {
      loadLessons(selectedChapter);
    } else {
      setLessons([]);
      setSelectedLesson('');
    }
  }, [selectedChapter]);

  React.useEffect(() => {
    if (selectedLesson) {
      loadQuestionTypes(selectedLesson);
    } else {
      setQuestionTypes([]);
      setSelectedQuestionType('');
    }
  }, [selectedLesson]);

  const loadSubjects = async () => {
    try {
      const data = await QuestionBankService.getSubjects();
      setSubjects(data);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadChapters = async (subjectId: string) => {
    try {
      const data = await QuestionBankService.getChaptersBySubject(subjectId);
      setChapters(data);
    } catch (error) {
      console.error('Error loading chapters:', error);
    }
  };

  const loadLessons = async (chapterId: string) => {
    try {
      const data = await QuestionBankService.getLessonsByChapter(chapterId);
      setLessons(data);
    } catch (error) {
      console.error('Error loading lessons:', error);
    }
  };

  const loadQuestionTypes = async (lessonId: string) => {
    try {
      const data = await QuestionBankService.getQuestionTypesByLesson(lessonId);
      setQuestionTypes(data);
    } catch (error) {
      console.error('Error loading question types:', error);
    }
  };

  // Parse text input to questions
  const parseTextInput = (text: string): ImportQuestion[] => {
    const questions: ImportQuestion[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    let currentQuestion: Partial<ImportQuestion> = {};
    let currentSection = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect question start
      if (line.match(/^(Câu|Question)\s*\d+/i) || line.match(/^\d+\./)) {
        // Save previous question if exists
        if (currentQuestion.question && currentQuestion.correct_option && currentQuestion.explanation) {
          questions.push(currentQuestion as ImportQuestion);
        }
        
        // Start new question
        currentQuestion = {
          type: 'mcq', // Default type
          question: line.replace(/^(Câu|Question)\s*\d+[:.]\s*/i, '').replace(/^\d+\.\s*/, ''),
          difficulty_level: difficulty,
          tags: []
        };
        currentSection = 'question';
        continue;
      }
      
      // Detect question type
      if (line.match(/^(Type|Loại):\s*(mcq|msq|sa)/i)) {
        const type = line.match(/(mcq|msq|sa)/i)?.[1] as 'mcq' | 'msq' | 'sa';
        if (type) currentQuestion.type = type;
        continue;
      }
      
      // Detect options
      if (line.match(/^[A-Da-d][.)]\s*/)) {
        const optionKey = line.charAt(0).toLowerCase();
        const optionValue = line.replace(/^[A-Da-d][.)]\s*/, '');
        currentQuestion[`option_${optionKey}` as keyof ImportQuestion] = optionValue;
        continue;
      }
      
      // Detect correct answer
      if (line.match(/^(Đáp án|Answer|Correct):/i)) {
        currentQuestion.correct_option = line.replace(/^(Đáp án|Answer|Correct):\s*/i, '');
        continue;
      }
      
      // Detect explanation
      if (line.match(/^(Giải thích|Explanation|Lời giải):/i)) {
        currentQuestion.explanation = line.replace(/^(Giải thích|Explanation|Lời giải):\s*/i, '');
        currentSection = 'explanation';
        continue;
      }
      
      // Continue explanation on multiple lines
      if (currentSection === 'explanation' && currentQuestion.explanation) {
        currentQuestion.explanation += ' ' + line;
        continue;
      }
      
      // Continue question on multiple lines
      if (currentSection === 'question' && currentQuestion.question && !line.match(/^[A-Da-d][.)]/)) {
        currentQuestion.question += ' ' + line;
      }
    }
    
    // Save last question
    if (currentQuestion.question && currentQuestion.correct_option && currentQuestion.explanation) {
      questions.push(currentQuestion as ImportQuestion);
    }
    
    return questions;
  };

  // Parse JSON input
  const parseJsonInput = (jsonText: string): ImportQuestion[] => {
    try {
      const data = JSON.parse(jsonText);
      
      // Handle different JSON formats
      if (Array.isArray(data)) {
        return data.map(q => ({
          type: q.type || 'mcq',
          question: q.question || q.question_text || '',
          option_a: q.option_a || q.options?.A || '',
          option_b: q.option_b || q.options?.B || '',
          option_c: q.option_c || q.options?.C || '',
          option_d: q.option_d || q.options?.D || '',
          correct_option: q.correct_option || q.answer || '',
          explanation: q.explanation || q.solution || '',
          difficulty_level: q.difficulty_level || q.difficulty || difficulty,
          is_dynamic: q.is_dynamic || q.isDynamic || false,
          tags: q.tags || []
        }));
      } else if (data.questions && Array.isArray(data.questions)) {
        return data.questions.map((q: any) => ({
          type: q.type || 'mcq',
          question: q.question || q.question_text || '',
          option_a: q.option_a || q.options?.A || '',
          option_b: q.option_b || q.options?.B || '',
          option_c: q.option_c || q.options?.C || '',
          option_d: q.option_d || q.options?.D || '',
          correct_option: q.correct_option || q.answer || '',
          explanation: q.explanation || q.solution || '',
          difficulty_level: q.difficulty_level || q.difficulty || difficulty,
          is_dynamic: q.is_dynamic || q.isDynamic || false,
          tags: q.tags || []
        }));
      } else {
        throw new Error('Invalid JSON format');
      }
    } catch (error) {
      throw new Error(`JSON parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Preview questions
  const handlePreview = () => {
    setError('');
    setSuccess('');
    
    try {
      let questions: ImportQuestion[] = [];
      
      if (activeTab === 'text') {
        if (!textInput.trim()) {
          setError('Vui lòng nhập nội dung câu hỏi');
          return;
        }
        questions = parseTextInput(textInput);
      } else if (activeTab === 'json') {
        if (!jsonInput.trim()) {
          setError('Vui lòng nhập JSON');
          return;
        }
        questions = parseJsonInput(jsonInput);
      }
      
      if (questions.length === 0) {
        setError('Không tìm thấy câu hỏi hợp lệ');
        return;
      }
      
      setPreviewQuestions(questions);
      setSuccess(`Đã phân tích thành công ${questions.length} câu hỏi`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi phân tích');
    }
  };

  // Import questions to database
  const handleImport = async () => {
    if (!selectedQuestionType) {
      setError('Vui lòng chọn dạng câu hỏi');
      return;
    }
    
    if (previewQuestions.length === 0) {
      setError('Không có câu hỏi để import');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      let successCount = 0;
      let errorCount = 0;
      
      for (const question of previewQuestions) {
        try {
          await QuestionBankService.createQuestion({
            question_type_id: selectedQuestionType,
            type: question.type,
            question_text: question.question,
            option_a: question.option_a,
            option_b: question.option_b,
            option_c: question.option_c,
            option_d: question.option_d,
            correct_option: question.correct_option,
            explanation: question.explanation,
            difficulty_level: question.difficulty_level || difficulty,
            is_dynamic: question.is_dynamic || false,
            tags: question.tags || []
          });
          successCount++;
        } catch (error) {
          console.error('Error importing question:', error);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        setSuccess(`Đã import thành công ${successCount} câu hỏi${errorCount > 0 ? `, ${errorCount} câu lỗi` : ''}`);
        setTextInput('');
        setJsonInput('');
        setPreviewQuestions([]);
        
        if (onImportComplete) {
          onImportComplete(successCount);
        }
      } else {
        setError('Không thể import câu hỏi nào');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi import');
    } finally {
      setLoading(false);
    }
  };

  const getTemplate = () => {
    return `Câu 1: Tìm đạo hàm của hàm số $f(x) = x^2 + 2x + 1$
Type: mcq
A) $f'(x) = 2x + 2$
B) $f'(x) = x^2 + 2$
C) $f'(x) = 2x + 1$
D) $f'(x) = x + 2$
Đáp án: A
Giải thích: Áp dụng quy tắc đạo hàm $(x^n)' = nx^{n-1}$ và $(c)' = 0$. Ta có $f'(x) = 2x + 2$.

Câu 2: Cho hàm số $f(x) = !a!x^2 + !b!x + !c!$. Tìm đạo hàm.
Type: mcq
A) $f'(x) = {tinh: 2*!a!}x + !b!$
B) $f'(x) = !a!x + !b!$
C) $f'(x) = {tinh: 2*!a!}x + {tinh: 2*!b!}$
D) $f'(x) = !a!x^2 + !b!$
Đáp án: A
Giải thích: Đạo hàm của $ax^2 + bx + c$ là $2ax + b$. Với $a = !a!$, $b = !b!$, ta có $f'(x) = {tinh: 2*!a!}x + !b!$.

Câu 3: Tính giá trị của biểu thức $2^3 + 3^2$
Type: sa
Đáp án: 17
Giải thích: Ta có $2^3 = 8$ và $3^2 = 9$. Vậy $2^3 + 3^2 = 8 + 9 = 17$.`;
  };

  const getJsonTemplate = () => {
    return JSON.stringify({
      title: "Bài tập đạo hàm",
      questions: [
        {
          type: "mcq",
          question: "Tìm đạo hàm của hàm số $f(x) = x^2 + 2x + 1$",
          option_a: "$f'(x) = 2x + 2$",
          option_b: "$f'(x) = x^2 + 2$",
          option_c: "$f'(x) = 2x + 1$",
          option_d: "$f'(x) = x + 2$",
          correct_option: "A",
          explanation: "Áp dụng quy tắc đạo hàm $(x^n)' = nx^{n-1}$ và $(c)' = 0$. Ta có $f'(x) = 2x + 2$.",
          difficulty_level: "easy",
          is_dynamic: false,
          tags: ["đạo hàm", "cơ bản"]
        },
        {
          type: "sa",
          question: "Tính giá trị của biểu thức $2^3 + 3^2$",
          correct_option: "17",
          explanation: "Ta có $2^3 = 8$ và $3^2 = 9$. Vậy $2^3 + 3^2 = 8 + 9 = 17$.",
          difficulty_level: "easy",
          tags: ["tính toán"]
        }
      ]
    }, null, 2);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Import Câu hỏi</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Hierarchy Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Chọn vị trí lưu câu hỏi</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Môn học *</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Chọn môn học</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chương *</label>
                <select
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(e.target.value)}
                  disabled={!selectedSubject}
                  className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                >
                  <option value="">Chọn chương</option>
                  {chapters.map(chapter => (
                    <option key={chapter.id} value={chapter.id}>{chapter.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bài học *</label>
                <select
                  value={selectedLesson}
                  onChange={(e) => setSelectedLesson(e.target.value)}
                  disabled={!selectedChapter}
                  className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                >
                  <option value="">Chọn bài học</option>
                  {lessons.map(lesson => (
                    <option key={lesson.id} value={lesson.id}>{lesson.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dạng câu hỏi *</label>
                <select
                  value={selectedQuestionType}
                  onChange={(e) => setSelectedQuestionType(e.target.value)}
                  disabled={!selectedLesson}
                  className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                >
                  <option value="">Chọn dạng</option>
                  {questionTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Độ khó mặc định</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              className="w-48 p-2 border border-gray-300 rounded-md"
            >
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          </div>

          {/* Tabs */}
          <div className="flex border-b mb-6">
            <button
              onClick={() => setActiveTab('text')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'text'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📝 Nhập Text
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'json'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📄 Nhập JSON
            </button>
            <button
              onClick={() => setActiveTab('template')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'template'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📋 Mẫu
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhập câu hỏi (định dạng text)
                </label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  rows={15}
                  className="w-full p-3 border border-gray-300 rounded-md font-mono text-sm"
                  placeholder="Nhập câu hỏi theo định dạng mẫu..."
                />
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nhập JSON
                </label>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  rows={15}
                  className="w-full p-3 border border-gray-300 rounded-md font-mono text-sm"
                  placeholder="Nhập JSON theo định dạng mẫu..."
                />
              </div>
            </div>
          )}

          {activeTab === 'template' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold mb-3">Mẫu định dạng Text</h4>
                <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto whitespace-pre-wrap">
                  {getTemplate()}
                </pre>
                <button
                  onClick={() => {
                    setTextInput(getTemplate());
                    setActiveTab('text');
                  }}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Sử dụng mẫu Text
                </button>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-3">Mẫu định dạng JSON</h4>
                <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
                  {getJsonTemplate()}
                </pre>
                <button
                  onClick={() => {
                    setJsonInput(getJsonTemplate());
                    setActiveTab('json');
                  }}
                  className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Sử dụng mẫu JSON
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-blue-800 mb-2">Hướng dẫn</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Text format:</strong> Mỗi câu hỏi bắt đầu bằng "Câu X:" hoặc "X."</li>
                  <li>• <strong>Type:</strong> mcq (trắc nghiệm), msq (đúng/sai), sa (trả lời ngắn)</li>
                  <li>• <strong>Options:</strong> A), B), C), D) cho mcq/msq</li>
                  <li>• <strong>Đáp án:</strong> "Đáp án: A" hoặc "Answer: A"</li>
                  <li>• <strong>Giải thích:</strong> "Giải thích:" hoặc "Explanation:"</li>
                  <li>• <strong>LaTeX:</strong> Sử dụng $...$ cho công thức toán</li>
                  <li>• <strong>Dynamic:</strong> Sử dụng !a!, !b:1:10!, {`{tinh: 2*!a!}`} cho câu hỏi động</li>
                </ul>
              </div>
            </div>
          )}

          {/* Preview Section */}
          {previewQuestions.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-3">Xem trước ({previewQuestions.length} câu hỏi)</h4>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {previewQuestions.map((q, index) => (
                  <div key={index} className="p-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">Câu {index + 1}</span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        q.type === 'mcq' ? 'bg-blue-100 text-blue-800' :
                        q.type === 'msq' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {q.type === 'mcq' ? 'Trắc nghiệm' :
                         q.type === 'msq' ? 'Đúng/Sai' : 'Trả lời ngắn'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{q.question}</p>
                    <p className="text-xs text-gray-500">Đáp án: {q.correct_option}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 p-6 border-t">
          <button
            onClick={handlePreview}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Xem trước
          </button>
          <button
            onClick={handleImport}
            disabled={loading || previewQuestions.length === 0 || !selectedQuestionType}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Đang import...' : `Import ${previewQuestions.length} câu hỏi`}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionImporter;