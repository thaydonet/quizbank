import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import QuestionCard from '../components/QuestionCard';
import type { QuizData, Question } from '../types';
import PrinterIcon from '../components/icons/PrinterIcon';
import PlayCircleIcon from '../components/icons/PlayCircleIcon';

const QuizBankPage: React.FC = () => {
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [printCount, setPrintCount] = useState(1);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleMcqOptions, setShuffleMcqOptions] = useState(false);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<string>('toan-12-bai-1');
  
  // Global selections - lưu tất cả câu hỏi đã chọn từ mọi bài học
  const [globalSelectedQuestions, setGlobalSelectedQuestions] = useState<string[]>([]);
  
  // Lưu trữ tất cả câu hỏi đã load từ mọi bài học
  const [allLoadedQuestions, setAllLoadedQuestions] = useState<{ [lessonPath: string]: { [id: string]: Question } }>({});
  
  const [activeTab, setActiveTab] = useState<'all' | 'mcq' | 'msq' | 'sa'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Function để lấy tất cả questions đã load
  const getAllLoadedQuestionsFlat = useCallback((): Question[] => {
    const allQuestions: Question[] = [];
    Object.values(allLoadedQuestions).forEach(lessonQuestions => {
      Object.values(lessonQuestions).forEach(question => {
        if (question) allQuestions.push(question);
      });
    });
    return allQuestions;
  }, [allLoadedQuestions]);

  // Function để lấy questions thuộc lesson hiện tại
  const getCurrentLessonQuestions = useCallback((): string[] => {
    if (!quizData) return [];
    return quizData.questions.map(q => q.id);
  }, [quizData]);

  const fetchLessonData = useCallback(async (path: string) => {
    setIsLoading(true);
    setError(null);
    setActiveLesson(path);
    
    try {
      const response = await fetch(`./QuizBank_JSON/${path}.json?t=${new Date().getTime()}`);
      if (!response.ok) {
        throw new Error(`Không tìm thấy file: ${path}.json. Vui lòng tạo file này hoặc kiểm tra lại đường dẫn.`);
      }
      const data: QuizData = await response.json();
      setQuizData(data);
      
      // Cập nhật allLoadedQuestions theo lesson
      setAllLoadedQuestions(prev => ({
        ...prev,
        [path]: data.questions.reduce((acc, q) => ({ ...acc, [q.id]: q }), {})
      }));
      
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('Đã xảy ra lỗi không xác định.');
      setQuizData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load lesson đầu tiên
  useEffect(() => {
    fetchLessonData(activeLesson);
  }, []);

  // Handler để select/deselect question - áp dụng cho global selection
  const handleSelectQuestion = useCallback((id: string) => {
    setGlobalSelectedQuestions(prev => {
      if (prev.includes(id)) {
        // Bỏ chọn
        return prev.filter(qid => qid !== id);
      } else {
        // Thêm vào chọn
        return [...prev, id];
      }
    });
  }, []);
  
  // Filter questions theo tab hiện tại (chỉ trong lesson hiện tại)
  const filteredQuestions = useMemo(() => {
    if (!quizData) return [];
    switch (activeTab) {
      case 'mcq':
        return quizData.questions.filter(q => q.type === 'mcq');
      case 'msq':
        return quizData.questions.filter(q => q.type === 'msq');
      case 'sa':
        return quizData.questions.filter(q => q.type === 'sa');
      case 'all':
      default:
        return quizData.questions;
    }
  }, [quizData, activeTab]);
  
  // Đếm số câu hỏi theo loại trong lesson hiện tại
  const counts = useMemo(() => {
      if (!quizData) return { all: 0, mcq: 0, msq: 0, sa: 0 };
      return {
        all: quizData.questions.length,
        mcq: quizData.questions.filter(q => q.type === 'mcq').length,
        msq: quizData.questions.filter(q => q.type === 'msq').length,
        sa: quizData.questions.filter(q => q.type === 'sa').length
      };
  }, [quizData]);

  // Đếm số câu đã chọn trong lesson hiện tại theo loại
  const selectedCountsInCurrentLesson = useMemo(() => {
    if (!quizData) return { all: 0, mcq: 0, msq: 0, sa: 0 };
    
    const currentLessonSelectedIds = globalSelectedQuestions.filter(id => 
      quizData.questions.some(q => q.id === id)
    );
    
    const selectedQuestions = quizData.questions.filter(q => 
      currentLessonSelectedIds.includes(q.id)
    );
    
    return {
      all: selectedQuestions.length,
      mcq: selectedQuestions.filter(q => q.type === 'mcq').length,
      msq: selectedQuestions.filter(q => q.type === 'msq').length,
      sa: selectedQuestions.filter(q => q.type === 'sa').length
    };
  }, [quizData, globalSelectedQuestions]);

  // Handle select all cho lesson hiện tại và tab hiện tại
  const handleSelectAll = useCallback(() => {
    const filteredIds = filteredQuestions.map(q => q.id);
    const allFilteredSelected = filteredIds.length > 0 && 
      filteredIds.every(id => globalSelectedQuestions.includes(id));
    
    if (allFilteredSelected) {
      // Bỏ chọn tất cả câu hỏi trong tab hiện tại
      setGlobalSelectedQuestions(prev => 
        prev.filter(id => !filteredIds.includes(id))
      );
    } else {
      // Chọn tất cả câu hỏi trong tab hiện tại
      setGlobalSelectedQuestions(prev => {
        const newSelections = [...prev];
        filteredIds.forEach(id => {
          if (!newSelections.includes(id)) {
            newSelections.push(id);
          }
        });
        return newSelections;
      });
    }
  }, [filteredQuestions, globalSelectedQuestions]);
  
  const handleOfflineExam = useCallback(() => {
    if (globalSelectedQuestions.length === 0) return;
    setShowPrintDialog(true);
  }, [globalSelectedQuestions.length]);

  // Trộn mảng
  function shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Sinh đề và in file - sử dụng global selections
  const handlePrintConfirm = useCallback(() => {
    const allQuestionsFlat = getAllLoadedQuestionsFlat();
    const questionsToPrint = globalSelectedQuestions
      .map(id => allQuestionsFlat.find(q => q.id === id))
      .filter((q): q is Question => q !== undefined);
      
    if (questionsToPrint.length === 0) return;

    // Chia nhóm câu hỏi
    let mcq = questionsToPrint.filter(q => q.type === 'mcq');
    let msq = questionsToPrint.filter(q => q.type === 'msq');
    let sa = questionsToPrint.filter(q => q.type === 'sa');

    let now = new Date();
    let dateStr = now.toLocaleString('vi-VN');

    for (let d = 1; d <= printCount; d++) {
      let fileContent = `ĐỀ THI TỔNG HỢP - Đề số ${d}\n`;
      fileContent += `Ngày tạo: ${dateStr}\n`;
      fileContent += `Số câu: ${questionsToPrint.length}\n`;
      fileContent += `  - Trắc nghiệm: ${mcq.length} câu\n`;
      fileContent += `  - Đúng-Sai: ${msq.length} câu\n`;
      fileContent += `  - Trả lời ngắn: ${sa.length} câu\n`;
      fileContent += `----------------------------------------\n\n`;

      // Trộn câu hỏi từng loại nếu chọn
      let mcqQ = shuffleQuestions ? shuffleArray(mcq) : mcq;
      let msqQ = shuffleQuestions ? shuffleArray(msq) : msq;
      let saQ = shuffleQuestions ? shuffleArray(sa) : sa;

      // Trộn đáp án cho MCQ và cập nhật correct_option
      mcqQ = mcqQ.map(q => {
        let options = [
          { key: 'A', value: q.option_a },
          { key: 'B', value: q.option_b },
          { key: 'C', value: q.option_c },
          { key: 'D', value: q.option_d }
        ].filter(opt => opt.value);
        
        let correctKey = q.correct_option.trim();
        let correctValue = '';
        
        // Tìm giá trị đáp án đúng ban đầu
        if (['A','B','C','D'].includes(correctKey)) {
          correctValue = q[`option_${correctKey.toLowerCase()}` as keyof Question] as string;
        } else {
          correctValue = correctKey;
        }
        
        let shuffledOptions = shuffleMcqOptions ? shuffleArray(options) : options;
        
        // Tìm vị trí mới của đáp án đúng
        let newCorrectIndex = shuffledOptions.findIndex(opt => opt.value === correctValue);
        let newCorrectOption = newCorrectIndex >= 0 ? String.fromCharCode(65 + newCorrectIndex) : correctKey;
        
        // Gán lại đáp án đúng
        return {
          ...q,
          option_a: shuffledOptions[0]?.value || '',
          option_b: shuffledOptions[1]?.value || '',
          option_c: shuffledOptions[2]?.value || '',
          option_d: shuffledOptions[3]?.value || '',
          correct_option: newCorrectOption
        };
      });

      // Phần I: Trắc nghiệm
      if (mcqQ.length > 0) {
        fileContent += "PHẦN I: TRẮC NGHIỆM\n\n";
        mcqQ.forEach((q, idx) => {
          fileContent += `Câu ${idx + 1}: ${q.question}\n`;
          ['A','B','C','D'].forEach((key) => {
            if (q[`option_${key.toLowerCase()}` as keyof Question]) {
              fileContent += `  ${key}. ${q[`option_${key.toLowerCase()}` as keyof Question]}\n`;
            }
          });
          fileContent += `\n`;
        });
      }

      // Phần II: Đúng - Sai
      if (msqQ.length > 0) {
        fileContent += "PHẦN II: ĐÚNG - SAI\n\n";
        msqQ.forEach((q, idx) => {
          fileContent += `Câu ${mcqQ.length + idx + 1}: ${q.question}\n`;
          fileContent += `  a) ${q.option_a || ''}\n`;
          fileContent += `  b) ${q.option_b || ''}\n`;
          fileContent += `  c) ${q.option_c || ''}\n`;
          fileContent += `  d) ${q.option_d || ''}\n\n`;
        });
      }

      // Phần III: Trả lời ngắn
      if (saQ.length > 0) {
        fileContent += "PHẦN III: TRẢ LỜI NGẮN\n\n";
        saQ.forEach((q, idx) => {
          fileContent += `Câu ${mcqQ.length + msqQ.length + idx + 1}: ${q.question}\n`;
          fileContent += `  Đáp án: ________________\n\n`;
        });
      }

      // Đáp án & lời giải
      fileContent += "\n\n=== PHẦN ĐÁP ÁN & LỜI GIẢI ===\n\n";
      let allQuestions = [...mcqQ, ...msqQ, ...saQ];
      allQuestions.forEach((q, i) => {
        fileContent += `Câu ${i + 1}:\n`;
        fileContent += `  Đề bài: ${q.question}\n`;
        fileContent += `  Đáp án đúng: ${q.correct_option}\n`;
        fileContent += `  Giải thích: ${q.explanation}\n\n`;
      });

      const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `de-thi-tong-hop-${d}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    setShowPrintDialog(false);
  }, [globalSelectedQuestions, getAllLoadedQuestionsFlat, printCount, shuffleQuestions, shuffleMcqOptions]);

  // Thi online - sử dụng global selections
  const handleOnlineExam = useCallback(() => {
    if (globalSelectedQuestions.length === 0) return;
    const allQuestionsFlat = getAllLoadedQuestionsFlat();
    const questionsForExam = globalSelectedQuestions
      .map(id => allQuestionsFlat.find(q => q.id === id))
      .filter((q): q is Question => q !== undefined);
    if (questionsForExam.length === 0) return;

    // Chia nhóm câu hỏi
    let mcq = questionsForExam.filter(q => q.type === 'mcq');
    let msq = questionsForExam.filter(q => q.type === 'msq');
    let sa = questionsForExam.filter(q => q.type === 'sa');

    // Trộn câu hỏi từng loại nếu chọn
    let mcqQ = shuffleQuestions ? shuffleArray(mcq) : mcq;
    let msqQ = shuffleQuestions ? shuffleArray(msq) : msq;
    let saQ = shuffleQuestions ? shuffleArray(sa) : sa;

    const shuffledQuestions = [...mcqQ, ...msqQ, ...saQ];

    navigate('/exam', { state: { questions: shuffledQuestions, title: "Đề thi tổng hợp" } });
  }, [globalSelectedQuestions, getAllLoadedQuestionsFlat, shuffleQuestions, navigate]);

  // Function để clear tất cả selections
  const handleClearAllSelections = useCallback(() => {
    setGlobalSelectedQuestions([]);
  }, []);
  
  const renderContent = () => {
    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div></div>;
    if (error) return <div className="text-center text-red-600 bg-red-100 p-4 rounded-lg border border-red-200">{error}</div>;
    if (!quizData || quizData.questions.length === 0) return <div className="text-center text-gray-500 py-16">Không có câu hỏi nào cho bài học này.</div>;

    const filteredIds = filteredQuestions.map(q => q.id);
    const allInViewSelected = filteredIds.length > 0 && 
      filteredIds.every(id => globalSelectedQuestions.includes(id));

    const renderTabs = () => (
      <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <button onClick={() => setActiveTab('all')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'all' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                  Tất cả 
                  <span className="bg-gray-200 text-gray-700 ml-2 px-2.5 py-1 rounded-full text-xs font-bold">{counts.all}</span>
                  {selectedCountsInCurrentLesson.all > 0 && (
                    <span className="bg-indigo-500 text-white ml-1 px-2 py-1 rounded-full text-xs font-bold">
                      {selectedCountsInCurrentLesson.all}
                    </span>
                  )}
              </button>
              <button onClick={() => setActiveTab('mcq')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'mcq' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                  Một lựa chọn 
                  <span className="bg-blue-100 text-blue-800 ml-2 px-2.5 py-1 rounded-full text-xs font-bold">{counts.mcq}</span>
                  {selectedCountsInCurrentLesson.mcq > 0 && (
                    <span className="bg-indigo-500 text-white ml-1 px-2 py-1 rounded-full text-xs font-bold">
                      {selectedCountsInCurrentLesson.mcq}
                    </span>
                  )}
              </button>
              <button onClick={() => setActiveTab('msq')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'msq' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                  Nhiều lựa chọn 
                  <span className="bg-purple-100 text-purple-800 ml-2 px-2.5 py-1 rounded-full text-xs font-bold">{counts.msq}</span>
                  {selectedCountsInCurrentLesson.msq > 0 && (
                    <span className="bg-indigo-500 text-white ml-1 px-2 py-1 rounded-full text-xs font-bold">
                      {selectedCountsInCurrentLesson.msq}
                    </span>
                  )}
              </button>
              <button onClick={() => setActiveTab('sa')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'sa' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                  Trả lời ngắn 
                  <span className="bg-amber-100 text-amber-800 ml-2 px-2.5 py-1 rounded-full text-xs font-bold">{counts.sa}</span>
                  {selectedCountsInCurrentLesson.sa > 0 && (
                    <span className="bg-indigo-500 text-white ml-1 px-2 py-1 rounded-full text-xs font-bold">
                      {selectedCountsInCurrentLesson.sa}
                    </span>
                  )}
              </button>
          </nav>
      </div>
    );

    return (
      <div>
        <div className="relative mb-6">
          <h2 className="text-3xl font-bold text-gray-900 truncate pr-40" title={quizData.title}>{quizData.title}</h2>
          <div className="absolute top-0 right-0 flex items-center gap-2">
            <button onClick={handleOfflineExam} disabled={globalSelectedQuestions.length === 0} className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors">
              <PrinterIcon className="w-4 h-4"/>
              <span>Tải đề</span>
              <span className="ml-1 px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-[10px] font-bold">{globalSelectedQuestions.length}</span>
            </button>
            <button onClick={handleOnlineExam} disabled={globalSelectedQuestions.length === 0} className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors shadow-sm">
              <PlayCircleIcon className="w-4 h-4"/>
              <span>Thi Online</span>
              <span className="ml-1 px-1.5 py-0.5 bg-indigo-200 text-indigo-700 rounded text-[10px] font-bold">{globalSelectedQuestions.length}</span>
            </button>
          </div>
        </div>
        
        {/* Hiển thị tổng số câu đã chọn từ tất cả bài học */}
        {globalSelectedQuestions.length > 0 && (
          <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-indigo-800">
                <strong>Tổng số câu đã chọn từ tất cả bài học: {globalSelectedQuestions.length}</strong>
              </div>
              <button 
                onClick={handleClearAllSelections}
                className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
              >
                Xóa tất cả
              </button>
            </div>
          </div>
        )}
        
        {renderTabs()}
        
        <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
                 <input
                    id="select-all"
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                    checked={allInViewSelected}
                    onChange={handleSelectAll}
                    disabled={filteredQuestions.length === 0}
                />
                <label htmlFor="select-all" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                    {allInViewSelected ? 'Bỏ chọn tất cả trong bài này' : `Chọn tất cả ${filteredQuestions.length} câu trong bài này`}
                </label>
            </div>
        </div>

        <div className="space-y-4">
            {filteredQuestions.map((q) => (
              <QuestionCard 
                key={q.id} 
                question={q} 
                index={quizData.questions.findIndex(origQ => origQ.id === q.id)}
                isSelected={globalSelectedQuestions.includes(q.id)}
                onSelect={handleSelectQuestion}
                />
            ))}
             {filteredQuestions.length === 0 && <p className="text-center text-gray-500 py-12">Không có câu hỏi loại này.</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-gray-50 relative">
      {/* Popup in đề */}
      {showPrintDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Tùy chọn in đề</h2>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 font-medium">
                Tổng số câu hỏi: <span className="font-bold text-indigo-600">{globalSelectedQuestions.length}</span>
              </p>
            </div>
            <div className="mb-3">
              <label className="block font-medium mb-1">Số đề cần in:</label>
              <input type="number" min={1} max={20} value={printCount} onChange={e => setPrintCount(Number(e.target.value))} className="w-full border rounded px-2 py-1" />
            </div>
            <div className="mb-3 flex items-center gap-2">
              <input type="checkbox" id="shuffleQuestions" checked={shuffleQuestions} onChange={e => setShuffleQuestions(e.target.checked)} />
              <label htmlFor="shuffleQuestions">Trộn câu hỏi (chỉ trộn trong từng loại)</label>
            </div>
            <div className="mb-3 flex items-center gap-2">
              <input type="checkbox" id="shuffleMcqOptions" checked={shuffleMcqOptions} onChange={e => setShuffleMcqOptions(e.target.checked)} />
              <label htmlFor="shuffleMcqOptions">Trộn đáp án phần I (Trắc nghiệm)</label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 font-semibold" onClick={() => setShowPrintDialog(false)}>Hủy</button>
              <button className="px-4 py-2 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700" onClick={handlePrintConfirm}>In đề</button>
            </div>
          </div>
        </div>
      )}
      {/* Sidebar: ẩn trên mobile, hiện trên tablet trở lên */}
      <div className="hidden md:block">
        <Sidebar onSelectLesson={fetchLessonData} activeLessonPath={activeLesson} />
      </div>
      {/* Sidebar overlay trên mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-40 flex md:hidden">
          <div className="w-72 bg-white border-r border-gray-200 p-0 h-full overflow-y-auto relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-indigo-600 text-2xl font-bold"
              onClick={() => setSidebarOpen(false)}
              aria-label="Đóng menu"
            >×</button>
            <Sidebar onSelectLesson={(path) => { fetchLessonData(path); setSidebarOpen(false); }} activeLessonPath={activeLesson} />
          </div>
          <div className="flex-1" onClick={() => setSidebarOpen(false)}></div>
        </div>
      )}
      {/* Nút mở Sidebar trên mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-white border border-gray-300 rounded-full p-2 shadow-lg hover:bg-indigo-50"
        onClick={() => setSidebarOpen(true)}
        aria-label="Mở menu"
      >
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
      {/* Main content: chiếm toàn bộ màn hình trên mobile */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default QuizBankPage;