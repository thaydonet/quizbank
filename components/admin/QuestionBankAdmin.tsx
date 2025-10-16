import React, { useState, useEffect } from 'react';
import { QuestionBankService, Subject, Chapter, Lesson, QuestionType, DatabaseQuestion } from '../../services/questionBankService';
import MathContent from '../MathContent';
import { DynamicQuestionEngine } from '../../services/dynamicQuestionEngine';
import QuestionImporter from './QuestionImporter';
import DynamicQuestionEditor from '../DynamicQuestionEditor';

interface QuestionBankAdminProps {
  onClose?: () => void;
}

const QuestionBankAdmin: React.FC<QuestionBankAdminProps> = ({ onClose }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
  const [selectedQuestionType, setSelectedQuestionType] = useState<string>('');
  const [questions, setQuestions] = useState<DatabaseQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'browse' | 'create' | 'import' | 'ai'>('browse');
  const [showImporter, setShowImporter] = useState(false);

  // Edit/Delete states
  const [editingQuestion, setEditingQuestion] = useState<DatabaseQuestion | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<DatabaseQuestion | null>(null);

  // AI states
  const [showAIEditor, setShowAIEditor] = useState(false);

  // Form states for creating questions
  const [newQuestion, setNewQuestion] = useState({
    type: 'mcq' as 'mcq' | 'msq' | 'sa',
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: '',
    explanation: '',
    difficulty_level: 'medium' as 'easy' | 'medium' | 'hard',
    is_dynamic: false,
    tags: [] as string[]
  });

  // Form states for editing questions
  const [editQuestion, setEditQuestion] = useState({
    type: 'mcq' as 'mcq' | 'msq' | 'sa',
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: '',
    explanation: '',
    difficulty_level: 'medium' as 'easy' | 'medium' | 'hard',
    is_dynamic: false,
    tags: [] as string[]
  });



  // Load initial data
  useEffect(() => {
    loadSubjects();
  }, [activeTab]);

  // Load chapters when subject changes
  useEffect(() => {
    if (selectedSubject) {
      loadChapters(selectedSubject);
    } else {
      setChapters([]);
      setSelectedChapter('');
    }
  }, [selectedSubject]);

  // Load lessons when chapter changes
  useEffect(() => {
    if (selectedChapter) {
      loadLessons(selectedChapter);
    } else {
      setLessons([]);
      setSelectedLesson('');
    }
  }, [selectedChapter]);

  // Load question types when lesson changes
  useEffect(() => {
    if (selectedLesson) {
      loadQuestionTypes(selectedLesson);
    } else {
      setQuestionTypes([]);
      setSelectedQuestionType('');
    }
  }, [selectedLesson]);

  // Load questions when question type changes
  useEffect(() => {
    if (selectedQuestionType) {
      loadQuestions(selectedQuestionType);
    } else {
      setQuestions([]);
    }
  }, [selectedQuestionType]);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const data = await QuestionBankService.getSubjects();
      setSubjects(data);
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setLoading(false);
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

  const loadQuestions = async (questionTypeId: string) => {
    try {
      setLoading(true);
      const data = await QuestionBankService.getQuestionsByType(questionTypeId, { approvedOnly: false });
      setQuestions(data);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    if (!selectedQuestionType) {
      alert('Vui lòng chọn dạng câu hỏi');
      return;
    }

    try {
      setLoading(true);
      const result = await QuestionBankService.createQuestion({
        ...newQuestion,
        question_type_id: selectedQuestionType
      });

      // Reset form
      setNewQuestion({
        type: 'mcq',
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_option: '',
        explanation: '',
        difficulty_level: 'medium',
        is_dynamic: false,
        tags: []
      });

      alert('Tạo câu hỏi thành công!');

      // Reload questions
      if (selectedQuestionType) {
        loadQuestions(selectedQuestionType);
      }
    } catch (error: any) {
      console.error('Error creating question:', error);
      // Provide more specific error messages
      if (error.message) {
        alert(`Có lỗi xảy ra khi tạo câu hỏi: ${error.message}`);
      } else {
        alert('Có lỗi xảy ra khi tạo câu hỏi');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle edit question
  const handleEditQuestion = (question: DatabaseQuestion) => {
    setEditingQuestion(question);
    setEditQuestion({
      type: question.type,
      question_text: question.question_text,
      option_a: question.option_a || '',
      option_b: question.option_b || '',
      option_c: question.option_c || '',
      option_d: question.option_d || '',
      correct_option: question.correct_option,
      explanation: question.explanation,
      difficulty_level: question.difficulty_level,
      is_dynamic: question.is_dynamic || false,
      tags: question.tags || []
    });
    setShowEditModal(true);
  };

  // Handle update question
  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return;

    try {
      setLoading(true);
      await QuestionBankService.updateQuestion(editingQuestion.id, editQuestion);

      alert('Cập nhật câu hỏi thành công!');
      setShowEditModal(false);
      setEditingQuestion(null);

      // Reload questions
      if (selectedQuestionType) {
        loadQuestions(selectedQuestionType);
      }
    } catch (error: any) {
      console.error('Error updating question:', error);
      // Provide more specific error messages
      if (error.message) {
        alert(`Có lỗi xảy ra khi cập nhật câu hỏi: ${error.message}`);
      } else {
        alert('Có lỗi xảy ra khi cập nhật câu hỏi');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle delete question
  const handleDeleteQuestion = (question: DatabaseQuestion) => {
    setQuestionToDelete(question);
    setShowDeleteConfirm(true);
  };

  // Confirm delete question
  const confirmDeleteQuestion = async () => {
    if (!questionToDelete) return;

    try {
      setLoading(true);
      await QuestionBankService.deleteQuestion(questionToDelete.id);

      alert('Xóa câu hỏi thành công!');
      setShowDeleteConfirm(false);
      setQuestionToDelete(null);

      // Reload questions
      if (selectedQuestionType) {
        loadQuestions(selectedQuestionType);
      }
    } catch (error: any) {
      console.error('Error deleting question:', error);
      // Provide more specific error messages
      if (error.message) {
        alert(`Có lỗi xảy ra khi xóa câu hỏi: ${error.message}`);
      } else {
        alert('Có lỗi xảy ra khi xóa câu hỏi');
      }
    } finally {
      setLoading(false);
    }
  };



  const renderBrowseTab = () => (
    <div className="space-y-6">
      {/* Hierarchy Selection */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Môn học</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Chương</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Bài học</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Dạng câu hỏi</label>
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

      {/* Questions List */}
      {selectedQuestionType && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Danh sách câu hỏi ({questions.length})</h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Chưa có câu hỏi nào trong dạng này
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-medium text-gray-900">Câu {index + 1}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${question.difficulty_level === 'easy' ? 'bg-blue-100 text-blue-800' :
                        question.difficulty_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                        {question.difficulty_level === 'easy' ? 'Dễ' :
                          question.difficulty_level === 'medium' ? 'Trung bình' : 'Khó'}
                      </span>
                      {question.is_dynamic && (
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                          Động
                        </span>
                      )}

                      {/* Edit/Delete buttons */}
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => handleEditQuestion(question)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Sửa câu hỏi"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(question)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Xóa câu hỏi"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <MathContent content={question.question_text} />
                  </div>

                  {question.type !== 'sa' && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {question.option_a && (
                        <div className="p-2 bg-gray-50 rounded">
                          <strong>A.</strong> <MathContent content={question.option_a} />
                        </div>
                      )}
                      {question.option_b && (
                        <div className="p-2 bg-gray-50 rounded">
                          <strong>B.</strong> <MathContent content={question.option_b} />
                        </div>
                      )}
                      {question.option_c && (
                        <div className="p-2 bg-gray-50 rounded">
                          <strong>C.</strong> <MathContent content={question.option_c} />
                        </div>
                      )}
                      {question.option_d && (
                        <div className="p-2 bg-gray-50 rounded">
                          <strong>D.</strong> <MathContent content={question.option_d} />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-sm text-gray-600">
                    <strong>Đáp án:</strong> {question.correct_option}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderCreateTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Tạo câu hỏi mới</h3>

      {/* Hierarchy Selection */}
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

      {selectedQuestionType && (
        <div className="space-y-4">
          {/* Question Type and Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại câu hỏi</label>
              <select
                value={newQuestion.type}
                onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value as 'mcq' | 'msq' | 'sa' })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="mcq">Trắc nghiệm (1 đáp án)</option>
                <option value="msq">Đúng/Sai (nhiều đáp án)</option>
                <option value="sa">Trả lời ngắn</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Độ khó</label>
              <select
                value={newQuestion.difficulty_level}
                onChange={(e) => setNewQuestion({ ...newQuestion, difficulty_level: e.target.value as 'easy' | 'medium' | 'hard' })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="easy">Dễ</option>
                <option value="medium">Trung bình</option>
                <option value="hard">Khó</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_dynamic"
                checked={newQuestion.is_dynamic}
                onChange={(e) => setNewQuestion({ ...newQuestion, is_dynamic: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="is_dynamic" className="ml-2 block text-sm text-gray-900">
                Câu hỏi động
              </label>
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung câu hỏi *</label>
            <textarea
              value={newQuestion.question_text}
              onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Nhập nội dung câu hỏi (có thể sử dụng LaTeX: $x^2 + y^2 = 1$)"
            />
          </div>

          {/* Options (for MCQ/MSQ) */}
          {newQuestion.type !== 'sa' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phương án A</label>
                <input
                  type="text"
                  value={newQuestion.option_a}
                  onChange={(e) => setNewQuestion({ ...newQuestion, option_a: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phương án B</label>
                <input
                  type="text"
                  value={newQuestion.option_b}
                  onChange={(e) => setNewQuestion({ ...newQuestion, option_b: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phương án C</label>
                <input
                  type="text"
                  value={newQuestion.option_c}
                  onChange={(e) => setNewQuestion({ ...newQuestion, option_c: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phương án D</label>
                <input
                  type="text"
                  value={newQuestion.option_d}
                  onChange={(e) => setNewQuestion({ ...newQuestion, option_d: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          )}

          {/* Correct Answer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Đáp án đúng *</label>
            <input
              type="text"
              value={newQuestion.correct_option}
              onChange={(e) => setNewQuestion({ ...newQuestion, correct_option: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder={
                newQuestion.type === 'mcq' ? 'A, B, C, hoặc D' :
                  newQuestion.type === 'msq' ? 'A,C hoặc B,D (cách nhau bởi dấu phẩy)' :
                    'Đáp án chính xác'
              }
            />
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lời giải chi tiết *</label>
            <textarea
              value={newQuestion.explanation}
              onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Nhập lời giải chi tiết (có thể sử dụng LaTeX)"
            />
          </div>

          {/* Create Button */}
          <div className="flex justify-end">
            <button
              onClick={handleCreateQuestion}
              disabled={loading || !newQuestion.question_text || !newQuestion.correct_option || !newQuestion.explanation}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang tạo...' : 'Tạo câu hỏi'}
            </button>
          </div>
        </div>
      )}
    </div>
  );



  const renderImportTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Import Câu hỏi từ Text/JSON</h3>
        <button
          onClick={() => setShowImporter(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          📥 Mở Import Tool
        </button>
      </div>

      {/* Import Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-blue-800 mb-3">📝 Import từ Text</h4>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>• Định dạng đơn giản, dễ nhập</li>
            <li>• Hỗ trợ LaTeX cho công thức toán</li>
            <li>• Hỗ trợ câu hỏi động với biến số</li>
            <li>• Tự động phân tích cấu trúc câu hỏi</li>
          </ul>
          <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-600">
            <strong>Ví dụ:</strong><br />
            Câu 1: Tìm đạo hàm của $f(x) = x^2$<br />
            A) $f'(x) = 2x$<br />
            B) $f'(x) = x$<br />
            Đáp án: A<br />
            Giải thích: Áp dụng quy tắc...
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-green-800 mb-3">📄 Import từ JSON</h4>
          <ul className="text-sm text-green-700 space-y-2">
            <li>• Định dạng có cấu trúc rõ ràng</li>
            <li>• Hỗ trợ metadata chi tiết</li>
            <li>• Dễ dàng export/import giữa hệ thống</li>
            <li>• Hỗ trợ batch import số lượng lớn</li>
          </ul>
          <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-600">
            <strong>Ví dụ:</strong><br />
            {`{`}<br />
            &nbsp;&nbsp;"questions": [{`{`}<br />
            &nbsp;&nbsp;&nbsp;&nbsp;"type": "mcq",<br />
            &nbsp;&nbsp;&nbsp;&nbsp;"question": "...",<br />
            &nbsp;&nbsp;&nbsp;&nbsp;"option_a": "...",<br />
            &nbsp;&nbsp;&nbsp;&nbsp;...<br />
            &nbsp;&nbsp;{`}`}]<br />
            {`}`}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-purple-800 mb-3">✨ Tính năng nâng cao</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-purple-700">
          <div>
            <strong>🧮 LaTeX Support</strong>
            <p>Hỗ trợ công thức toán học với cú pháp $...$ hoặc $$...$$</p>
          </div>
          <div>
            <strong>⚡ Dynamic Questions</strong>
            <p>Câu hỏi với biến số ngẫu nhiên: !a!, !b:1:10!, {`{tinh: 2*!a!}`}</p>
          </div>
          <div>
            <strong>🏷️ Auto Tagging</strong>
            <p>Tự động gắn tags và phân loại độ khó</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">🚀 Thao tác nhanh</h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowImporter(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-2"
          >
            📥 Import Text/JSON
          </button>
          <button
            onClick={() => {
              const link = document.createElement('a');
              link.href = '/QuizBank_JSON/sample-questions.json';
              link.download = 'sample-questions.json';
              link.click();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            📄 Tải mẫu JSON
          </button>
          <button
            onClick={() => {
              const template = `Câu 1: Tìm đạo hàm của hàm số $f(x) = x^2 + 2x + 1$
Type: mcq
A) $f'(x) = 2x + 2$
B) $f'(x) = x^2 + 2$
C) $f'(x) = 2x + 1$
D) $f'(x) = x + 2$
Đáp án: A
Giải thích: Áp dụng quy tắc đạo hàm...`;
              navigator.clipboard.writeText(template);
              alert('Đã copy mẫu text vào clipboard!');
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
          >
            📋 Copy mẫu Text
          </button>
        </div>
      </div>

      {/* Import Statistics */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-indigo-800 mb-4">📊 Thống kê Import</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">📝</div>
            <div className="text-lg font-semibold text-gray-900">Text Format</div>
            <div className="text-sm text-gray-600">Dễ nhập, tự động phân tích</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">📄</div>
            <div className="text-lg font-semibold text-gray-900">JSON Format</div>
            <div className="text-sm text-gray-600">Có cấu trúc, metadata đầy đủ</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">⚡</div>
            <div className="text-lg font-semibold text-gray-900">Dynamic</div>
            <div className="text-sm text-gray-600">Biến số, tính toán tự động</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">🧮</div>
            <div className="text-lg font-semibold text-gray-900">LaTeX</div>
            <div className="text-sm text-gray-600">Công thức toán học</div>
          </div>
        </div>
      </div>

      {/* Workflow */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-blue-800 mb-3">🔄 Quy trình Import</h4>
        <div className="flex items-center justify-between text-sm text-blue-700">
          <div className="text-center">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-2">1</div>
            <p>Chọn vị trí lưu</p>
          </div>
          <div className="flex-1 h-px bg-blue-300 mx-2"></div>
          <div className="text-center">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-2">2</div>
            <p>Import Text/JSON</p>
          </div>
          <div className="flex-1 h-px bg-blue-300 mx-2"></div>
          <div className="text-center">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-2">3</div>
            <p>Xem trước</p>
          </div>
          <div className="flex-1 h-px bg-blue-300 mx-2"></div>
          <div className="text-center">
            <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold mb-2">✓</div>
            <p>Sử dụng ngay</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAITab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">AI Tạo câu hỏi động</h3>
        <button
          onClick={() => setShowAIEditor(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          ✨ Mở AI Editor
        </button>
      </div>

      {/* AI Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-purple-800 mb-3">🤖 AI Question Generator</h4>
          <ul className="text-sm text-purple-700 space-y-2">
            <li>• Tạo câu hỏi từ prompt text</li>
            <li>• Hỗ trợ LaTeX cho công thức toán</li>
            <li>• Tạo câu hỏi động với biến số</li>
            <li>• Tự động tạo lời giải chi tiết</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-blue-800 mb-3">⚡ Dynamic Questions</h4>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>• Biến số ngẫu nhiên: !a!, !b:1:10!</li>
            <li>• Tính toán tự động: {`{tinh: 2*!a!}`}</li>
            <li>• Câu hỏi không trùng lặp</li>
            <li>• Preview real-time</li>
          </ul>
        </div>
      </div>

      {/* Usage Guide */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-purple-800 mb-4">📚 Hướng dẫn sử dụng</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">1</div>
            <div className="text-lg font-semibold text-gray-900">Chọn vị trí</div>
            <div className="text-sm text-gray-600">Chọn môn học, chương, bài, dạng</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">2</div>
            <div className="text-lg font-semibold text-gray-900">Tạo với AI</div>
            <div className="text-sm text-gray-600">Nhập prompt, AI tạo câu hỏi</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">3</div>
            <div className="text-lg font-semibold text-gray-900">Lưu vào DB</div>
            <div className="text-sm text-gray-600">Câu hỏi được lưu tự động</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">🚀 Thao tác nhanh</h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowAIEditor(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-2"
          >
            ✨ Tạo câu hỏi AI
          </button>
          <button
            onClick={() => {
              const template = `Tạo câu hỏi trắc nghiệm về đạo hàm:
- Hàm số: f(x) = !a!x^2 + !b!x + !c! với !a:1:5!, !b:-5:5!, !c:-10:10!
- Tính f'(x) = {tinh: 2*!a!}x + !b!
- 4 phương án A, B, C, D
- Lời giải chi tiết`;
              navigator.clipboard.writeText(template);
              alert('Đã copy mẫu prompt vào clipboard!');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            📋 Copy mẫu prompt
          </button>
        </div>
      </div>
    </div>
  );

  // Handle AI question generation
  const handleAIQuestionGenerated = async (generatedQuestion: any) => {
    if (!generatedQuestion) {
      alert('Không có câu hỏi nào được tạo.');
      setShowAIEditor(false);
      return;
    }

    try {
      // Save to database if question type is selected
      if (selectedQuestionType) {
        await QuestionBankService.createQuestion({
          ...generatedQuestion,
          question_type_id: selectedQuestionType
        });

        alert('Đã tạo và lưu câu hỏi AI thành công!');

        // Reload questions
        loadQuestions(selectedQuestionType);
      } else {
        alert('Vui lòng chọn dạng câu hỏi trước khi tạo câu hỏi AI.');
      }

      setShowAIEditor(false);
    } catch (error) {
      console.error('Error saving AI question:', error);
      alert('Có lỗi xảy ra khi lưu câu hỏi AI.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Quản lý Ngân hàng Câu hỏi</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-6 py-3 font-medium ${activeTab === 'browse'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Duyệt câu hỏi
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 font-medium ${activeTab === 'create'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Tạo câu hỏi
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`px-6 py-3 font-medium ${activeTab === 'import'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            📥 Import câu hỏi
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`px-6 py-3 font-medium ${activeTab === 'ai'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            ✨ AI tạo câu hỏi
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'browse' && renderBrowseTab()}
          {activeTab === 'create' && renderCreateTab()}
          {activeTab === 'import' && renderImportTab()}
          {activeTab === 'ai' && renderAITab()}
        </div>

        {/* Question Importer Modal */}
        {showImporter && (
          <QuestionImporter
            onClose={() => setShowImporter(false)}
            onImportComplete={(count) => {
              alert(`Đã import thành công ${count} câu hỏi!`);
              setShowImporter(false);
              // Reload questions if we're viewing the same question type
              if (selectedQuestionType) {
                loadQuestions(selectedQuestionType);
              }
            }}
          />
        )}

        {/* Edit Question Modal */}
        {showEditModal && editingQuestion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-xl font-bold text-gray-900">Sửa câu hỏi</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingQuestion(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Question Type and Difficulty */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại câu hỏi</label>
                    <select
                      value={editQuestion.type}
                      onChange={(e) => setEditQuestion({ ...editQuestion, type: e.target.value as 'mcq' | 'msq' | 'sa' })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="mcq">Trắc nghiệm (1 đáp án)</option>
                      <option value="msq">Đúng/Sai (nhiều đáp án)</option>
                      <option value="sa">Trả lời ngắn</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Độ khó</label>
                    <select
                      value={editQuestion.difficulty_level}
                      onChange={(e) => setEditQuestion({ ...editQuestion, difficulty_level: e.target.value as 'easy' | 'medium' | 'hard' })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="easy">Dễ</option>
                      <option value="medium">Trung bình</option>
                      <option value="hard">Khó</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="edit_is_dynamic"
                      checked={editQuestion.is_dynamic}
                      onChange={(e) => setEditQuestion({ ...editQuestion, is_dynamic: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="edit_is_dynamic" className="ml-2 block text-sm text-gray-900">
                      Câu hỏi động
                    </label>
                  </div>
                </div>

                {/* Question Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung câu hỏi *</label>
                  <textarea
                    value={editQuestion.question_text}
                    onChange={(e) => setEditQuestion({ ...editQuestion, question_text: e.target.value })}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Nhập nội dung câu hỏi (có thể sử dụng LaTeX: $x^2 + y^2 = 1$)"
                  />
                </div>

                {/* Options (for MCQ/MSQ) */}
                {editQuestion.type !== 'sa' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phương án A</label>
                      <input
                        type="text"
                        value={editQuestion.option_a}
                        onChange={(e) => setEditQuestion({ ...editQuestion, option_a: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phương án B</label>
                      <input
                        type="text"
                        value={editQuestion.option_b}
                        onChange={(e) => setEditQuestion({ ...editQuestion, option_b: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phương án C</label>
                      <input
                        type="text"
                        value={editQuestion.option_c}
                        onChange={(e) => setEditQuestion({ ...editQuestion, option_c: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phương án D</label>
                      <input
                        type="text"
                        value={editQuestion.option_d}
                        onChange={(e) => setEditQuestion({ ...editQuestion, option_d: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                )}

                {/* Correct Answer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Đáp án đúng *</label>
                  <input
                    type="text"
                    value={editQuestion.correct_option}
                    onChange={(e) => setEditQuestion({ ...editQuestion, correct_option: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder={
                      editQuestion.type === 'mcq' ? 'A, B, C, hoặc D' :
                        editQuestion.type === 'msq' ? 'A,C hoặc B,D (cách nhau bởi dấu phẩy)' :
                          'Đáp án chính xác'
                    }
                  />
                </div>

                {/* Explanation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lời giải chi tiết *</label>
                  <textarea
                    value={editQuestion.explanation}
                    onChange={(e) => setEditQuestion({ ...editQuestion, explanation: e.target.value })}
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Nhập lời giải chi tiết (có thể sử dụng LaTeX)"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingQuestion(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleUpdateQuestion}
                    disabled={loading || !editQuestion.question_text || !editQuestion.correct_option || !editQuestion.explanation}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Đang cập nhật...' : 'Cập nhật câu hỏi'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && questionToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Xác nhận xóa câu hỏi</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Bạn có chắc chắn muốn xóa câu hỏi này? Hành động này không thể hoàn tác.
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-md mb-4">
                  <p className="text-sm text-gray-700 font-medium">Nội dung câu hỏi:</p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {questionToDelete.question_text}
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setQuestionToDelete(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={confirmDeleteQuestion}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Đang xóa...' : 'Xóa câu hỏi'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Question Editor Modal */}
        {showAIEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-70">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] overflow-hidden">
              <DynamicQuestionEditor
                onSave={handleAIQuestionGenerated}
                onCancel={() => setShowAIEditor(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionBankAdmin;