import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import QuestionCard from '../components/QuestionCard';
import type { QuizData, Question } from '../types';
import PrinterIcon from '../components/icons/PrinterIcon';
import PlayCircleIcon from '../components/icons/PlayCircleIcon';

const QuizBankPage: React.FC = () => {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<string>('toan-12-bai-1');
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [allLoadedQuestions, setAllLoadedQuestions] = useState<{ [id: string]: Question }>({});
  const [activeTab, setActiveTab] = useState<'all' | 'mcq' | 'msq' | 'sa'>('all');
  const navigate = useNavigate();

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
      setAllLoadedQuestions(prev => {
        const newPool = { ...prev };
        data.questions.forEach(q => {
          newPool[q.id] = q;
        });
        return newPool;
      });
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('Đã xảy ra lỗi không xác định.');
      setQuizData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchLessonData(activeLesson);
  }, [fetchLessonData, activeLesson]);

  const handleSelectQuestion = (id: string) => {
    setSelectedQuestions(prev =>
      prev.includes(id) ? prev.filter(qid => qid !== id) : [...prev, id]
    );
  };
  
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
  
  const counts = useMemo(() => {
      if (!quizData) return { all: 0, mcq: 0, msq: 0, sa: 0 };
      return {
        all: quizData.questions.length,
        mcq: quizData.questions.filter(q => q.type === 'mcq').length,
        msq: quizData.questions.filter(q => q.type === 'msq').length,
        sa: quizData.questions.filter(q => q.type === 'sa').length
      };
  }, [quizData]);

  const handleSelectAll = () => {
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions(prev => prev.filter(id => !filteredQuestions.some(q => q.id === id)));
    } else {
      setSelectedQuestions(prev => [...new Set([...prev, ...filteredQuestions.map(q => q.id)])]);
    }
  };
  
  const handleOfflineExam = () => {
    if (selectedQuestions.length === 0) return;
    const questionsToPrint = selectedQuestions
        .map(id => allLoadedQuestions[id])
        .filter((q): q is Question => q !== undefined);
    
    if (questionsToPrint.length === 0) return;
    
    let fileContent = `ĐỀ THI TỔNG HỢP\n`;
    fileContent += `Số câu: ${questionsToPrint.length}\n`;
    fileContent += `----------------------------------------\n\n`;
    fileContent += "--- PHẦN CÂU HỎI ---\n\n";

    questionsToPrint.forEach((q, i) => {
        fileContent += `Câu ${i + 1}: ${q.question.replace(/\$/g, '')}\n`; // Basic LaTeX removal for txt
        if (q.type !== 'sa') {
            fileContent += `  A. ${q.option_a?.replace(/\$/g, '') || ''}\n`;
            fileContent += `  B. ${q.option_b?.replace(/\$/g, '') || ''}\n`;
            fileContent += `  C. ${q.option_c?.replace(/\$/g, '') || ''}\n`;
            fileContent += `  D. ${q.option_d?.replace(/\$/g, '') || ''}\n`;
        } else {
            fileContent += `  Đáp án: ________________\n`
        }
        fileContent += "\n";
    });

    fileContent += "\n\n--- PHẦN ĐÁP ÁN & LỜI GIẢI ---\n\n";

    questionsToPrint.forEach((q, i) => {
        fileContent += `Câu ${i + 1}:\n`;
        fileContent += `  Đáp án đúng: ${q.correct_option}\n`;
        fileContent += `  Giải thích: ${q.explanation.replace(/\$/g, '')}\n\n`;
    });
    
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `de-thi-tong-hop.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOnlineExam = () => {
    if (selectedQuestions.length === 0) return;
    const questionsForExam = selectedQuestions
        .map(id => allLoadedQuestions[id])
        .filter((q): q is Question => q !== undefined);
        
    if (questionsForExam.length === 0) return;

    navigate('/exam', { state: { questions: questionsForExam, title: "Đề thi tổng hợp" } });
  };
  
  const renderContent = () => {
    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div></div>;
    if (error) return <div className="text-center text-red-600 bg-red-100 p-4 rounded-lg border border-red-200">{error}</div>;
    if (!quizData || quizData.questions.length === 0) return <div className="text-center text-gray-500 py-16">Không có câu hỏi nào cho bài học này.</div>;

    const allInViewSelected = filteredQuestions.length > 0 && selectedQuestions.length >= filteredQuestions.length && filteredQuestions.every(q => selectedQuestions.includes(q.id));

    const renderTabs = () => (
      <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <button onClick={() => setActiveTab('all')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'all' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                  Tất cả <span className="bg-gray-200 text-gray-700 ml-2 px-2.5 py-1 rounded-full text-xs font-bold">{counts.all}</span>
              </button>
              <button onClick={() => setActiveTab('mcq')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'mcq' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                  Một lựa chọn <span className="bg-blue-100 text-blue-800 ml-2 px-2.5 py-1 rounded-full text-xs font-bold">{counts.mcq}</span>
              </button>
              <button onClick={() => setActiveTab('msq')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'msq' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                  Nhiều lựa chọn <span className="bg-purple-100 text-purple-800 ml-2 px-2.5 py-1 rounded-full text-xs font-bold">{counts.msq}</span>
              </button>
              <button onClick={() => setActiveTab('sa')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'sa' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                  Trả lời ngắn <span className="bg-amber-100 text-amber-800 ml-2 px-2.5 py-1 rounded-full text-xs font-bold">{counts.sa}</span>
              </button>
          </nav>
      </div>
    );

    return (
      <div>
        <div className="md:flex md:items-center md:justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900 truncate" title={quizData.title}>{quizData.title}</h2>
            <div className="mt-4 md:mt-0 flex items-center gap-3 flex-shrink-0">
                <button onClick={handleOfflineExam} disabled={selectedQuestions.length === 0} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors">
                    <PrinterIcon className="w-5 h-5"/>
                    <span>Tải đề .txt ({selectedQuestions.length})</span>
                </button>
                <button onClick={handleOnlineExam} disabled={selectedQuestions.length === 0} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors shadow-sm">
                    <PlayCircleIcon className="w-5 h-5"/>
                    <span>Thi Online ({selectedQuestions.length})</span>
                </button>
            </div>
        </div>
        
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
                    {allInViewSelected ? 'Bỏ chọn tất cả' : `Chọn tất cả ${filteredQuestions.length} câu`}
                </label>
            </div>
        </div>

        <div className="space-y-4">
            {filteredQuestions.map((q, i) => (
              <QuestionCard 
                key={q.id} 
                question={q} 
                index={quizData.questions.findIndex(origQ => origQ.id === q.id)}
                isSelected={selectedQuestions.includes(q.id)}
                onSelect={handleSelectQuestion}
                />
            ))}
             {filteredQuestions.length === 0 && <p className="text-center text-gray-500 py-12">Không có câu hỏi loại này.</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full bg-gray-50">
      <Sidebar onSelectLesson={fetchLessonData} activeLessonPath={activeLesson} />
      <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default QuizBankPage;