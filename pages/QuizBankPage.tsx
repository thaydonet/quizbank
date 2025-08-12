
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
  const [activeTab, setActiveTab] = useState<'all' | 'choice' | 'short'>('all');
  const navigate = useNavigate();

  const fetchLessonData = useCallback(async (path: string) => {
    setIsLoading(true);
    setError(null);
    setActiveLesson(path);
    setSelectedQuestions([]); // Reset selection on new lesson
    try {
      const response = await fetch(`/QuizBank_JSON/${path}.json?t=${new Date().getTime()}`);
      if (!response.ok) {
        throw new Error(`Không tìm thấy file: ${path}.json. Vui lòng tạo file này hoặc kiểm tra lại đường dẫn.`);
      }
      const data: QuizData = await response.json();
      setQuizData(data);
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
    if (activeTab === 'all') return quizData.questions;
    if (activeTab === 'choice') return quizData.questions.filter(q => q.type === 'mcq' || q.type === 'msq');
    if (activeTab === 'short') return quizData.questions.filter(q => q.type === 'sa');
    return [];
  }, [quizData, activeTab]);
  
  const counts = useMemo(() => {
      if (!quizData) return { all: 0, choice: 0, short: 0 };
      const all = quizData.questions.length;
      const choice = quizData.questions.filter(q => q.type === 'mcq' || q.type === 'msq').length;
      const short = all - choice;
      return { all, choice, short };
  }, [quizData]);

  const handleSelectAll = () => {
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions(prev => prev.filter(id => !filteredQuestions.some(q => q.id === id)));
    } else {
      setSelectedQuestions(prev => [...new Set([...prev, ...filteredQuestions.map(q => q.id)])]);
    }
  };
  
  const handleOfflineExam = () => {
    if (!quizData || selectedQuestions.length === 0) return;
    const questionsToPrint = quizData.questions.filter(q => selectedQuestions.includes(q.id));
    
    let fileContent = `ĐỀ THI: ${quizData.title}\n`;
    fileContent += `Số câu: ${questionsToPrint.length}\n`;
    fileContent += `----------------------------------------\n\n`;
    fileContent += "--- PHẦN CÂU HỎI ---\n\n";

    questionsToPrint.forEach((q, i) => {
        fileContent += `Câu ${i + 1}: ${q.question}\n`;
        if (q.type !== 'sa') {
            fileContent += `  A. ${q.option_a || ''}\n`;
            fileContent += `  B. ${q.option_b || ''}\n`;
            fileContent += `  C. ${q.option_c || ''}\n`;
            fileContent += `  D. ${q.option_d || ''}\n`;
        } else {
            fileContent += `  Đáp án: ________________\n`
        }
        fileContent += "\n";
    });

    fileContent += "\n\n--- PHẦN ĐÁP ÁN & LỜI GIẢI ---\n\n";

    questionsToPrint.forEach((q, i) => {
        fileContent += `Câu ${i + 1}:\n`;
        fileContent += `  Đáp án đúng: ${q.correct_option}\n`;
        fileContent += `  Giải thích: ${q.explanation}\n\n`;
    });
    
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeFileName = quizData.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    a.download = `de-thi-offline-${safeFileName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOnlineExam = () => {
    if (!quizData || selectedQuestions.length === 0) return;
    const questionsForExam = quizData.questions.filter(q => selectedQuestions.includes(q.id));
    navigate('/exam', { state: { questions: questionsForExam, title: quizData.title } });
  };
  
  const renderContent = () => {
    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
    if (error) return <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
    if (!quizData || quizData.questions.length === 0) return <div className="text-center text-gray-500">Không có câu hỏi nào cho bài học này.</div>;

    const allInViewSelected = filteredQuestions.length > 0 && selectedQuestions.length >= filteredQuestions.length && filteredQuestions.every(q => selectedQuestions.includes(q.id));

    const renderTabs = () => (
      <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <button onClick={() => setActiveTab('all')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'all' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                  Tất cả <span className="bg-gray-200 text-gray-600 ml-2 px-2 py-0.5 rounded-full">{counts.all}</span>
              </button>
              <button onClick={() => setActiveTab('choice')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'choice' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                  Trắc nghiệm <span className="bg-gray-200 text-gray-600 ml-2 px-2 py-0.5 rounded-full">{counts.choice}</span>
              </button>
              <button onClick={() => setActiveTab('short')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'short' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                  Trả lời ngắn <span className="bg-gray-200 text-gray-600 ml-2 px-2 py-0.5 rounded-full">{counts.short}</span>
              </button>
          </nav>
      </div>
    );

    return (
      <div>
        <div className="md:flex md:items-center md:justify-between mb-2">
            <h2 className="text-3xl font-bold text-gray-800 truncate" title={quizData.title}>{quizData.title}</h2>
            <div className="mt-4 md:mt-0 flex items-center gap-2 flex-shrink-0">
                <button onClick={handleOfflineExam} disabled={selectedQuestions.length === 0} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                    <PrinterIcon className="w-5 h-5"/>
                    <span>Tải đề .txt ({selectedQuestions.length})</span>
                </button>
                <button onClick={handleOnlineExam} disabled={selectedQuestions.length === 0} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                    <PlayCircleIcon className="w-5 h-5"/>
                    <span>Thi Online ({selectedQuestions.length})</span>
                </button>
            </div>
        </div>
        
        {renderTabs()}
        
        <div className="mb-4 p-3 bg-white rounded-md border shadow-sm flex items-center justify-between">
            <div className="flex items-center">
                 <input
                    id="select-all"
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={allInViewSelected}
                    onChange={handleSelectAll}
                    disabled={filteredQuestions.length === 0}
                />
                <label htmlFor="select-all" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                    {allInViewSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả trong tab này'}
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
             {filteredQuestions.length === 0 && <p className="text-center text-gray-500 py-8">Không có câu hỏi loại này.</p>}
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
