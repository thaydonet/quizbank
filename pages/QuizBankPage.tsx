import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import QuestionCard from '../components/QuestionCard';
import { QuestionType } from '../types';
import type { QuizData } from '../types';

const TABS = [
  { id: QuestionType.MultipleChoice, name: 'Trắc nghiệm' },
  { id: QuestionType.TrueFalse, name: 'Đúng - Sai' },
  { id: QuestionType.ShortAnswer, name: 'Trả lời ngắn' },
];

const QuizBankPage: React.FC = () => {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [activeTab, setActiveTab] = useState<QuestionType>(QuestionType.MultipleChoice);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<string | null>(null);

  const fetchLessonData = useCallback(async (path: string) => {
    setIsLoading(true);
    setError(null);
    setActiveLesson(path);
    try {
      // Using a timestamp to bypass browser cache during development
      const response = await fetch(`/QuizBank_JSON/${path}.json?t=${new Date().getTime()}`);
      if (!response.ok) {
        throw new Error(`Không tìm thấy file: ${path}.json. Vui lòng tạo file này.`);
      }
      const data: QuizData = await response.json();
      setQuizData(data);
      // Reset to the first tab that has questions
      if (data.questions.multipleChoice?.length > 0) setActiveTab(QuestionType.MultipleChoice);
      else if (data.questions.trueFalse?.length > 0) setActiveTab(QuestionType.TrueFalse);
      else if (data.questions.shortAnswer?.length > 0) setActiveTab(QuestionType.ShortAnswer);

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Đã xảy ra lỗi không xác định.');
      }
      setQuizData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Load the first lesson by default
  useEffect(() => {
    fetchLessonData('toan-12-bai-1');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div></div>;
    }
    if (error) {
      return <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
    }
    if (!quizData) {
      return <div className="text-center text-gray-500">Vui lòng chọn một bài học từ menu bên trái.</div>;
    }

    const questionsForTab = quizData.questions[activeTab] || [];

    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">{quizData.title}</h2>
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            {TABS.map((tab) => {
              const questionsCount = quizData.questions[tab.id]?.length || 0;
              if (questionsCount === 0) return null;
              return (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                        activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                    {tab.name} <span className="bg-gray-200 text-gray-700 ml-2 px-2 py-0.5 rounded-full text-xs">{questionsCount}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {questionsForTab.length > 0 ? (
          <div className="space-y-4">
            {questionsForTab.map((q, i) => (
              <QuestionCard key={q.id} question={q} index={i} type={activeTab} />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">Không có câu hỏi nào cho mục này.</div>
        )}
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