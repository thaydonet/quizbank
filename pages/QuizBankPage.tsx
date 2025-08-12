
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import QuestionCard from '../components/QuestionCard';
import type { QuizData, MultipleChoiceQuestion } from '../types';
import PrinterIcon from '../components/icons/PrinterIcon';
import PlayCircleIcon from '../components/icons/PlayCircleIcon';

const QuizBankPage: React.FC = () => {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<string>('toan-12-bai-1');
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
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
  
  const handleSelectAll = () => {
    if (quizData && selectedQuestions.length === quizData.questions.length) {
      setSelectedQuestions([]);
    } else if (quizData) {
      setSelectedQuestions(quizData.questions.map(q => q.id));
    }
  };

  const handleOfflineExam = () => {
    if (!quizData || selectedQuestions.length === 0) return;
    const questionsToPrint = quizData.questions.filter(q => selectedQuestions.includes(q.id));
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Vui lòng cho phép mở cửa sổ pop-up để tạo đề thi.');
      return;
    }
    
    const questionHtml = questionsToPrint.map((q, i) => `
      <div class="question">
        <p><b>Câu ${i + 1}:</b> ${q.question}</p>
        <ul class="options">
          <li><b>A.</b> ${q.option_a}</li>
          <li><b>B.</b> ${q.option_b}</li>
          <li><b>C.</b> ${q.option_c}</li>
          <li><b>D.</b> ${q.option_d}</li>
        </ul>
      </div>
    `).join('');

    const answerHtml = questionsToPrint.map((q, i) => `
      <div class="answer">
        <p><b>Câu ${i + 1}:</b> Đáp án <b>${q.correct_option}</b></p>
        <p><b>Giải thích:</b> ${q.explanation}</p>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Đề thi: ${quizData.title}</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
          <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
          <style>
            body { font-family: 'Times New Roman', serif; line-height: 1.6; padding: 2rem; }
            .page-break { page-break-after: always; }
            h1, h2 { text-align: center; }
            .question { margin-bottom: 1.5rem; }
            .options { list-style-type: none; padding-left: 1rem; }
            .answer { margin-bottom: 1rem; border-top: 1px solid #ccc; padding-top: 1rem; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <button onclick="window.print()">In đề thi</button>
          <h1>ĐỀ THI</h1>
          <h2>${quizData.title}</h2>
          <hr>
          ${questionHtml}
          <div class="page-break"></div>
          <h1>ĐÁP ÁN & LỜI GIẢI CHI TIẾT</h1>
          ${answerHtml}
          <script>
            renderMathInElement(document.body, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false}
                ]
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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

    const allSelected = selectedQuestions.length === quizData.questions.length;

    return (
      <div>
        <div className="md:flex md:items-center md:justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-800">{quizData.title}</h2>
            <div className="mt-4 md:mt-0 flex items-center gap-2">
                <button onClick={handleOfflineExam} disabled={selectedQuestions.length === 0} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                    <PrinterIcon className="w-5 h-5"/>
                    <span>Tạo đề thi Offline ({selectedQuestions.length})</span>
                </button>
                <button onClick={handleOnlineExam} disabled={selectedQuestions.length === 0} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                    <PlayCircleIcon className="w-5 h-5"/>
                    <span>Tạo đề thi Online ({selectedQuestions.length})</span>
                </button>
            </div>
        </div>
        
        <div className="mb-4 p-3 bg-white rounded-md border shadow-sm flex items-center justify-between">
            <div className="flex items-center">
                 <input
                    id="select-all"
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={allSelected}
                    onChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                    {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'} ({selectedQuestions.length} / {quizData.questions.length})
                </label>
            </div>
        </div>

        <div className="space-y-4">
            {quizData.questions.map((q, i) => (
              <QuestionCard 
                key={q.id} 
                question={q} 
                index={i}
                isSelected={selectedQuestions.includes(q.id)}
                onSelect={handleSelectQuestion}
                />
            ))}
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
