import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DatabaseSidebar from '../components/DatabaseSidebar';
import QuestionCard from '../components/QuestionCard';
import QuizCreationModal from '../components/QuizCreationModal';
import WordPressShortcodeModal from '../components/WordPressShortcodeModal';
import type { Question } from '../types';
import PrinterIcon from '../components/icons/PrinterIcon';
import PlayCircleIcon from '../components/icons/PlayCircleIcon';

import { QuizManagementService, type QuizMetadata, type LocalQuiz } from '../services/quizManagementService';

import { QuestionBankService } from '../services/questionBankService';
import { supabase } from '../services/supabaseClient';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { QuizService } from '../services/quizService';
import { EnhancedExportService, type ExportOptions } from '../services/enhancedExportService';

const QuizBankPage: React.FC = () => {
  const navigate = useNavigate();

  // Print dialog states
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [printCount, setPrintCount] = useState(1);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleMcqOptions, setShuffleMcqOptions] = useState(false);
  const [exportFormat, setExportFormat] = useState<'docx' | 'xlsx' | 'tex'>('docx');

  // Question management
  const [activeQuestionTypeId, setActiveQuestionTypeId] = useState<string>('');
  const [activeQuestionTypePath, setActiveQuestionTypePath] = useState<string>('');
  const [databaseQuestions, setDatabaseQuestions] = useState<Question[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Store selections for each question type to persist when switching
  const [questionTypeSelections, setQuestionTypeSelections] = useState<{ [questionTypeId: string]: string[] }>({});

  // UI states
  const [activeTab, setActiveTab] = useState<'all' | 'mcq' | 'msq' | 'sa'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showQuizCreationModal, setShowQuizCreationModal] = useState(false);
  const [showWordPressModal, setShowWordPressModal] = useState(false);

  // Load questions from database when question type is selected
  const fetchDatabaseQuestions = useCallback(async (questionTypeId: string, path: string) => {
    // Save current selections before switching
    if (activeQuestionTypeId && selectedQuestionIds.length > 0) {
      setQuestionTypeSelections(prev => ({
        ...prev,
        [activeQuestionTypeId]: selectedQuestionIds
      }));
    }

    setIsLoading(true);
    setError(null);
    setActiveQuestionTypeId(questionTypeId);
    setActiveQuestionTypePath(path);

    try {
      const dbQuestions = await QuestionBankService.getQuestionsByType(questionTypeId, { approvedOnly: true });

      // Convert DatabaseQuestion to Question format
      const convertedQuestions: Question[] = dbQuestions.map(dbQ => ({
        id: dbQ.id,
        type: dbQ.type,
        question: dbQ.question_text,
        option_a: dbQ.option_a || '',
        option_b: dbQ.option_b || '',
        option_c: dbQ.option_c || '',
        option_d: dbQ.option_d || '',
        correct_option: dbQ.correct_option,
        explanation: dbQ.explanation,
        difficulty: dbQ.difficulty_level,
        tags: dbQ.tags || [],
        isDynamic: dbQ.is_dynamic || false
      }));

      setDatabaseQuestions(convertedQuestions);

      // Restore previous selections for this question type
      const previousSelections = questionTypeSelections[questionTypeId] || [];
      setSelectedQuestionIds(previousSelections);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('Đã xảy ra lỗi khi tải câu hỏi từ database.');
      setDatabaseQuestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeQuestionTypeId, selectedQuestionIds, questionTypeSelections]);

  // Filter questions by tab
  const filteredQuestions = useMemo(() => {
    if (!databaseQuestions.length) return [];
    switch (activeTab) {
      case 'mcq':
        return databaseQuestions.filter(q => q.type === 'mcq');
      case 'msq':
        return databaseQuestions.filter(q => q.type === 'msq');
      case 'sa':
        return databaseQuestions.filter(q => q.type === 'sa');
      case 'all':
      default:
        return databaseQuestions;
    }
  }, [databaseQuestions, activeTab]);

  // Count questions by type
  const counts = useMemo(() => {
    if (!databaseQuestions.length) return { all: 0, mcq: 0, msq: 0, sa: 0 };
    return {
      all: databaseQuestions.length,
      mcq: databaseQuestions.filter(q => q.type === 'mcq').length,
      msq: databaseQuestions.filter(q => q.type === 'msq').length,
      sa: databaseQuestions.filter(q => q.type === 'sa').length
    };
  }, [databaseQuestions]);

  // Count selected questions by type (from all question types)
  const selectedCounts = useMemo(() => {
    let mcqCount = 0, msqCount = 0, saCount = 0;
    
    // Count from current question type
    const currentSelected = databaseQuestions.filter(q => selectedQuestionIds.includes(q.id));
    mcqCount += currentSelected.filter(q => q.type === 'mcq').length;
    msqCount += currentSelected.filter(q => q.type === 'msq').length;
    saCount += currentSelected.filter(q => q.type === 'sa').length;
    
    // Count from other question types in questionTypeSelections
    Object.entries(questionTypeSelections).forEach(([questionTypeId, selections]) => {
      if (questionTypeId !== activeQuestionTypeId && selections.length > 0) {
        // We don't have access to the questions data here, so we'll just count the selections
        // In a real implementation, we might want to cache question types or fetch them
        // For now, we'll assume all selections are valid
        // This is a simplified approach - in reality, we might need to fetch and count properly
        // But for the purpose of this fix, we'll just add the selection counts
        // A more accurate approach would be to maintain counts in state
      }
    });
    
    return {
      all: mcqCount + msqCount + saCount,
      mcq: mcqCount,
      msq: msqCount,
      sa: saCount
    };
  }, [databaseQuestions, selectedQuestionIds, questionTypeSelections, activeQuestionTypeId]);

  // Enhanced function to get accurate counts across all question types
  const getAccurateSelectedCounts = useCallback(async () => {
    let mcqCount = 0, msqCount = 0, saCount = 0;
    
    // Count from current question type
    const currentSelected = databaseQuestions.filter(q => selectedQuestionIds.includes(q.id));
    mcqCount += currentSelected.filter(q => q.type === 'mcq').length;
    msqCount += currentSelected.filter(q => q.type === 'msq').length;
    saCount += currentSelected.filter(q => q.type === 'sa').length;
    
    // Count from other question types in questionTypeSelections
    for (const [questionTypeId, selections] of Object.entries(questionTypeSelections)) {
      if (questionTypeId !== activeQuestionTypeId && selections.length > 0) {
        try {
          const dbQuestions = await QuestionBankService.getQuestionsByType(questionTypeId, { approvedOnly: true });
          const selectedFromType = dbQuestions.filter(dbQ => selections.includes(dbQ.id));
          mcqCount += selectedFromType.filter(q => q.type === 'mcq').length;
          msqCount += selectedFromType.filter(q => q.type === 'msq').length;
          saCount += selectedFromType.filter(q => q.type === 'sa').length;
        } catch (error) {
          console.error(`Error loading questions for type ${questionTypeId}:`, error);
        }
      }
    }
    
    return {
      all: mcqCount + msqCount + saCount,
      mcq: mcqCount,
      msq: msqCount,
      sa: saCount
    };
  }, [databaseQuestions, selectedQuestionIds, questionTypeSelections, activeQuestionTypeId]);

  // Use state for selectedCounts since it depends on current data
  const [globalSelectedCounts, setGlobalSelectedCounts] = useState({
    all: 0, mcq: 0, msq: 0, sa: 0
  });

  // Update global selected counts when dependencies change
  useEffect(() => {
    const updateCounts = async () => {
      const counts = await getAccurateSelectedCounts();
      setGlobalSelectedCounts(counts);
    };
    updateCounts();
  }, [getAccurateSelectedCounts]);

  // Question selection handlers
  const handleQuestionToggle = useCallback((questionId: string) => {
    setSelectedQuestionIds(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const allQuestionIds = filteredQuestions.map(q => q.id);
    setSelectedQuestionIds(prev => {
      const newSelections = [...prev];
      allQuestionIds.forEach(id => {
        if (!newSelections.includes(id)) {
          newSelections.push(id);
        }
      });
      return newSelections;
    });
  }, [filteredQuestions]);

  const handleDeselectAll = useCallback(() => {
    const filteredQuestionIds = filteredQuestions.map(q => q.id);
    setSelectedQuestionIds(prev => prev.filter(id => !filteredQuestionIds.includes(id)));
  }, [filteredQuestions]);

  const getTotalSelectedCount = useCallback(() => {
    // Count current selections plus all saved selections from other question types
    const currentSelections = selectedQuestionIds.length;
    const savedSelections = Object.values(questionTypeSelections).reduce((total, selections) => total + selections.length, 0);
    return currentSelections + savedSelections;
  }, [selectedQuestionIds.length, questionTypeSelections]);

  // Get selected questions for export/quiz
  const getSelectedQuestionsForQuiz = useCallback(async (): Promise<Question[]> => {
    const allSelectedQuestions: Question[] = [];

    // Add current question type selections
    const currentSelections = databaseQuestions.filter(q => selectedQuestionIds.includes(q.id));
    allSelectedQuestions.push(...currentSelections);

    // Add selections from other question types
    for (const [questionTypeId, selections] of Object.entries(questionTypeSelections)) {
      if (questionTypeId !== activeQuestionTypeId && selections.length > 0) {
        try {
          const dbQuestions = await QuestionBankService.getQuestionsByType(questionTypeId, { approvedOnly: true });
          const convertedQuestions: Question[] = dbQuestions
            .filter(dbQ => selections.includes(dbQ.id))
            .map(dbQ => ({
              id: dbQ.id,
              type: dbQ.type,
              question: dbQ.question_text,
              option_a: dbQ.option_a || '',
              option_b: dbQ.option_b || '',
              option_c: dbQ.option_c || '',
              option_d: dbQ.option_d || '',
              correct_option: dbQ.correct_option,
              explanation: dbQ.explanation,
              difficulty: dbQ.difficulty_level,
              tags: dbQ.tags || [],
              isDynamic: dbQ.is_dynamic || false
            }));
          allSelectedQuestions.push(...convertedQuestions);
        } catch (error) {
          console.error(`Error loading questions for type ${questionTypeId}:`, error);
        }
      }
    }

    return allSelectedQuestions;
  }, [selectedQuestionIds, databaseQuestions, questionTypeSelections, activeQuestionTypeId]);

  // Shuffle array utility
  function shuffleArray<T>(arr: T[]): T[] {
    const newArr = [...arr];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  }

  // Export handlers
  const handleOfflineExam = useCallback(() => {
    const totalSelected = getTotalSelectedCount();
    if (totalSelected === 0) return;
    setShowPrintDialog(true);
  }, [getTotalSelectedCount]);

  const handleOnlineExam = useCallback(() => {
    const totalSelected = getTotalSelectedCount();
    if (totalSelected === 0) return;
    setShowQuizCreationModal(true);
  }, [getTotalSelectedCount]);

  // Handle print confirmation
  const handlePrintConfirm = useCallback(async () => {
    const questionsToPrint = await getSelectedQuestionsForQuiz();

    if (questionsToPrint.length === 0) {
      alert('Vui lòng chọn ít nhất một câu hỏi để tạo đề thi');
      return;
    }

    try {
      // Prepare export options
      const exportOptions: ExportOptions = {
        format: exportFormat,
        examCount: printCount,
        shuffleQuestions: shuffleQuestions,
        shuffleMcqOptions: shuffleMcqOptions,
        includeAnswerKey: true,
        organizeBySections: true
      };

      // Export using EnhancedExportService
      await EnhancedExportService.exportExams(questionsToPrint, exportOptions);

      setShowPrintDialog(false);
    } catch (error) {
      console.error('Lỗi khi tạo file:', error);
      alert('Có lỗi xảy ra khi tạo file. Vui lòng thử lại.');
    }
  }, [getSelectedQuestionsForQuiz, printCount, shuffleQuestions, shuffleMcqOptions, exportFormat]);

  // Handle quiz creation
  const handleQuizCreation = useCallback(async (title: string, maxAttempts: number) => {
    const totalSelected = getTotalSelectedCount();
    if (totalSelected === 0) return;

    const questionsForExam = await getSelectedQuestionsForQuiz();
    if (questionsForExam.length === 0) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      if (!user) {
        console.error('User not authenticated');
        return;
      }

      // Save to Supabase
      const result = await QuizManagementService.saveQuiz({
        title,
        questions: questionsForExam,
        max_attempts: maxAttempts,
        created_by: user.id
      });

      const savedQuiz = result.success ? result.data : null;

      if (savedQuiz) {
        navigate(`/exam/${savedQuiz.slug}`);
        return;
      }

      // Fallback to local storage
      const savedQuiz2 = QuizService.saveQuiz(title, questionsForExam);
      navigate(`/online-exam?quizId=${savedQuiz2.id}&title=${encodeURIComponent(savedQuiz2.title)}&maxAttempts=${maxAttempts}`);
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('Có lỗi xảy ra khi tạo quiz. Vui lòng thử lại.');
    }
  }, [getTotalSelectedCount, getSelectedQuestionsForQuiz, navigate]);

  // Generate WordPress shortcodes for selected questions (organized by sections)
  const generateWordPressShortcodes = useCallback(async () => {
    const selectedQuestions = await getSelectedQuestionsForQuiz();
    
    if (selectedQuestions.length === 0) {
      alert('Vui lòng chọn ít nhất một câu hỏi để tạo shortcode.');
      return '';
    }

    const cleanText = (text: string) => text.replace(/"/g, '&quot;').replace(/\[/g, '&#91;').replace(/\]/g, '&#93;');
    
    // Separate questions by type
    const mcqQuestions = selectedQuestions.filter(q => q.type === 'mcq');
    const msqQuestions = selectedQuestions.filter(q => q.type === 'msq');
    const saQuestions = selectedQuestions.filter(q => q.type === 'sa');
    
    const sections = [];
    
    // Trắc nghiệm (MCQ)
    if (mcqQuestions.length > 0) {
      sections.push('CÂU HỎI TRẮC NGHIỆM\n');
      mcqQuestions.forEach((question) => {
        sections.push(`[quiz_question question="${cleanText(question.question)}" option_a="${cleanText(question.option_a)}" option_b="${cleanText(question.option_b)}" option_c="${cleanText(question.option_c)}" option_d="${cleanText(question.option_d)}" correct="${question.correct_option}" explanation="${cleanText(question.explanation)}"]`);
      });
      sections.push(''); // Empty line after section
    }
    
    // Đúng - sai (MSQ)
    if (msqQuestions.length > 0) {
      sections.push('CÂU HỎI ĐÚNG - SAI\n');
      msqQuestions.forEach((question) => {
        sections.push(`[quiz_question_T_F question="${cleanText(question.question)}" option_a="${cleanText(question.option_a)}" option_b="${cleanText(question.option_b)}" option_c="${cleanText(question.option_c)}" option_d="${cleanText(question.option_d)}" correct="${question.correct_option}" explanation="${cleanText(question.explanation)}"]`);
      });
      sections.push(''); // Empty line after section
    }
    
    // Trả lời ngắn (SA)
    if (saQuestions.length > 0) {
      sections.push('CÂU HỎI TRẢ LỜI NGẮN\n');
      saQuestions.forEach((question) => {
        sections.push(`[quiz_question_TLN question="${cleanText(question.question)}" correct="${question.correct_option}" explanation="${cleanText(question.explanation)}"]`);
      });
    }

    return sections.join('\n');
  }, [getSelectedQuestionsForQuiz]);

  // Render main content
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-600 bg-red-100 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      );
    }

    if (!activeQuestionTypeId) {
      return (
        <div className="text-center text-gray-500 py-16">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-semibold mb-2">Chọn dạng câu hỏi</h3>
          <p>Hãy chọn một dạng câu hỏi từ menu bên trái để bắt đầu.</p>
        </div>
      );
    }

    if (databaseQuestions.length === 0) {
      return (
        <div className="text-center text-gray-500 py-16">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold mb-2">Chưa có câu hỏi</h3>
          <p>Dạng câu hỏi này chưa có câu hỏi nào.</p>
          <p className="text-sm mt-2">Hãy thêm câu hỏi trong Admin Panel.</p>
        </div>
      );
    }

    return (
      <div>
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {activeQuestionTypePath || 'Chọn dạng toán từ menu bên trái'}
          </h1>
          
          {/* Selection Statistics */}
          {getTotalSelectedCount() > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 font-medium">
                Bạn đã chọn được{' '}
                <span className="font-bold">{globalSelectedCounts.mcq} câu trắc nghiệm</span>;{' '}
                <span className="font-bold">{globalSelectedCounts.msq} câu đúng sai</span>;{' '}
                <span className="font-bold">{globalSelectedCounts.sa} câu TLN</span>
              </p>
            </div>
          )}
        </div>

        {/* Question type tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Tất cả', count: counts.all, selectedCount: globalSelectedCounts.all },
              { key: 'mcq', label: 'Trắc nghiệm', count: counts.mcq, selectedCount: globalSelectedCounts.mcq },
              { key: 'msq', label: 'Đúng/Sai', count: counts.msq, selectedCount: globalSelectedCounts.msq },
              { key: 'sa', label: 'Trả lời ngắn', count: counts.sa, selectedCount: globalSelectedCounts.sa }
            ].map(({ key, label, count, selectedCount }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
              >
                {label} ({selectedCount}/{count})
              </button>
            ))}
          </div>

          {/* Select All / Deselect All buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              disabled={filteredQuestions.length === 0 || filteredQuestions.every(q => selectedQuestionIds.includes(q.id))}
              className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ✓ Chọn tất cả
            </button>
            <button
              onClick={handleDeselectAll}
              disabled={selectedQuestionIds.length === 0}
              className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ✗ Bỏ chọn tất cả
            </button>
          </div>
        </div>

        {/* Questions grid */}
        <div className="grid gap-6">
          {filteredQuestions.map((question, index) => {
            console.debug('Rendering filteredQuestions map', { index, id: question.id });
            return (
              <QuestionCard
                key={question.id}
                question={question}
                index={index}
                onSelect={handleQuestionToggle}
                isSelected={selectedQuestionIds.includes(question.id)}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-gray-50 relative">
      {/* Desktop fixed sidebar - left column (does not overlap popups which use z-50+) */}
      <div className="hidden md:block md:fixed md:inset-y-0 md:left-0 md:w-[300px] md:z-10 bg-white border-r border-gray-200">
        <DatabaseSidebar
          onSelectQuestionType={fetchDatabaseQuestions}
          activeQuestionTypePath={activeQuestionTypePath}
        />
      </div>
      {/* Main area with left padding to account for fixed sidebar on md+ */}
      <div className="flex-1 md:pl-[300px]">
        {/* Print Dialog */}
        {showPrintDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-bold mb-4">Tùy chọn in đề</h2>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 font-medium">
                  Tổng số câu hỏi: <span className="font-bold text-indigo-600">{getTotalSelectedCount()}</span>
                </p>
                <p className="text-xs text-gray-600 mt-1">Nguồn: Ngân hàng Toán Thầy Đồ</p>
              </div>
              <div className="mb-3">
                <label className="block font-medium mb-1">Số đề cần in:</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={printCount}
                  onChange={e => setPrintCount(Number(e.target.value))}
                  className="w-full border rounded px-2 py-1"
                />
              </div>
              <div className="mb-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="shuffleQuestions"
                  checked={shuffleQuestions}
                  onChange={e => setShuffleQuestions(e.target.checked)}
                />
                <label htmlFor="shuffleQuestions">Trộn câu hỏi</label>
              </div>
              <div className="mb-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="shuffleMcqOptions"
                  checked={shuffleMcqOptions}
                  onChange={e => setShuffleMcqOptions(e.target.checked)}
                />
                <label htmlFor="shuffleMcqOptions">Trộn đáp án trắc nghiệm</label>
              </div>
              <div className="mb-4">
                <label className="block font-medium mb-2">Định dạng file:</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="exportFormat"
                      value="docx"
                      checked={exportFormat === 'docx'}
                      onChange={e => setExportFormat(e.target.value as 'docx')}
                    />
                    <span>File .docx</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="exportFormat"
                      value="xlsx"
                      checked={exportFormat === 'xlsx'}
                      onChange={e => setExportFormat(e.target.value as 'xlsx')}
                    />
                    <span>File .xlsx</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="exportFormat"
                      value="tex"
                      checked={exportFormat === 'tex'}
                      onChange={e => setExportFormat(e.target.value as 'tex')}
                    />
                    <span>File .tex</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrintConfirm}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  Tải {exportFormat.toUpperCase()}
                </button>
                <button
                  onClick={() => setShowPrintDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quiz Creation Modal */}
        {showQuizCreationModal && (
          <QuizCreationModal
            isOpen={showQuizCreationModal}
            onClose={() => setShowQuizCreationModal(false)}
            onConfirm={handleQuizCreation}
            questionCount={getTotalSelectedCount()}
          />
        )}

        {/* WordPress Shortcode Modal */}
        {showWordPressModal && (
          <WordPressShortcodeModal
            onClose={() => setShowWordPressModal(false)}
            generateShortcodes={generateWordPressShortcodes}
          />
        )}

        {/* Sidebar moved below main (rendered after main for stacking) */}

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black bg-opacity-40 flex md:hidden">
            <div className="w-[300px] bg-white border-r border-gray-200 p-0 h-full overflow-y-auto relative pt-4">
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl font-bold z-10"
                aria-label="Đóng menu"
              >
                ×
              </button>
              <DatabaseSidebar
                onSelectQuestionType={(questionTypeId, path) => {
                  fetchDatabaseQuestions(questionTypeId, path);
                  setSidebarOpen(false);
                }}
                activeQuestionTypePath={activeQuestionTypePath}
              />
            </div>
            <div className="flex-1" onClick={() => setSidebarOpen(false)}></div>
          </div>
        )}

        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed top-4 right-4 z-50 bg-white border border-gray-300 rounded-full p-2 shadow-lg hover:bg-indigo-50"
          aria-label="Mở menu"
        >
          ☰
        </button>

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-8 lg:p-10 overflow-y-auto pt-4">
          {renderContent()}

          {/* Action buttons - fixed at bottom */}
          {getTotalSelectedCount() > 0 && (
            <div className="fixed bottom-6 right-6 flex gap-3">
              <button
                onClick={() => setShowWordPressModal(true)}
                className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 shadow-lg"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21.469 6.825c.84 1.537 1.318 3.3 1.318 5.175 0 3.979-2.156 7.456-5.363 9.325l3.295-9.527c.615-1.54.82-2.771.82-3.864 0-.405-.026-.78-.07-1.11m-7.981.105c.647-.03 1.232-.105 1.232-.105.582-.075.514-.93-.067-.899 0 0-1.755.135-2.88.135-1.064 0-2.85-.135-2.85-.135-.584-.031-.661.854-.082.899 0 0 .541.075 1.115.105l1.65 4.53-2.31 6.92-3.85-11.45c.645-.03 1.231-.105 1.231-.105.582-.075.516-.93-.065-.899 0 0-1.755.135-2.88.135-.202 0-.438-.008-.69-.015C4.911 2.015 8.235 0 12.001 0c2.756 0 5.27 1.055 7.13 2.78-.045-.003-.087-.008-.125-.008-.202 0-.438-.008-.69-.015-.647.03-1.232.105-1.232.105-.582.075-.514.93.067.899 0 0 .541-.075 1.115-.105l1.65-4.53 2.31-6.92 3.85 11.45z"/>
                </svg>
                <span className="hidden sm:inline">Tạo shortcode WP</span>
                <span className="sm:hidden">WP</span>
              </button>

              <button
                onClick={handleOfflineExam}
                disabled={getTotalSelectedCount() === 0}
                className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed shadow-lg"
              >
                <PrinterIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Tải đề</span>
                <span className="sm:hidden">Tải</span>
                <span className="ml-1 px-1.5 py-0.5 bg-green-200 text-green-700 rounded text-[10px] font-bold">
                  {getTotalSelectedCount()}
                </span>
              </button>

              <button
                onClick={handleOnlineExam}
                disabled={getTotalSelectedCount() === 0}
                className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed shadow-lg"
              >
                <PlayCircleIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Thi online</span>
                <span className="sm:hidden">Thi</span>
                <span className="ml-1 px-1.5 py-0.5 bg-indigo-200 text-indigo-700 rounded text-[10px] font-bold">
                  {getTotalSelectedCount()}
                </span>
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default QuizBankPage;