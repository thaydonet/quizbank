
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import type { MultipleChoiceQuestion } from '../types';
import MathContent from '../components/MathContent';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';
import XCircleIcon from '../components/icons/XCircleIcon';

type UserAnswers = { [questionId: string]: string };

const OnlineExamPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<MultipleChoiceQuestion[]>([]);
  const [title, setTitle] = useState<string>('Đề thi Online');
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  useEffect(() => {
    if (location.state && location.state.questions && location.state.title) {
      setQuestions(location.state.questions);
      setTitle(location.state.title);
    } else {
      // If no state is passed, redirect to home
      navigate('/');
    }
  }, [location.state, navigate]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = () => {
    if (window.confirm('Bạn có chắc chắn muốn nộp bài không?')) {
      setIsSubmitted(true);
      window.scrollTo(0, 0);
    }
  };

  const getScore = () => {
    return questions.reduce((score, q) => {
      if (userAnswers[q.id] === q.correct_option) {
        return score + 1;
      }
      return score;
    }, 0);
  };

  const getResultClasses = (q: MultipleChoiceQuestion, optionKey: string) => {
    const isCorrect = q.correct_option === optionKey;
    const isUserChoice = userAnswers[q.id] === optionKey;

    if (isCorrect) return 'bg-green-100 border-green-400 ring-2 ring-green-300';
    if (isUserChoice && !isCorrect) return 'bg-red-100 border-red-400';
    return 'bg-gray-100 border-gray-200';
  };

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-600">Đang tải đề thi...</p>
        <Link to="/" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Quay về Trang chủ
        </Link>
      </div>
    );
  }

  const score = getScore();
  const percentage = (score / questions.length) * 100;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">{title}</h1>
        <p className="text-center text-gray-500 mb-8">Thời gian làm bài: Tự do</p>
        
        {isSubmitted && (
          <div className="mb-8 p-6 rounded-lg bg-indigo-50 border border-indigo-200 text-center">
            <h2 className="text-2xl font-bold text-indigo-800">KẾT QUẢ</h2>
            <p className="text-4xl font-bold my-2" style={{ color: percentage >= 50 ? '#10B981' : '#EF4444' }}>
              {score} / {questions.length}
            </p>
            <p className="text-lg text-gray-600">({percentage.toFixed(2)}%)</p>
          </div>
        )}

        <div className="space-y-8">
          {questions.map((q, index) => (
            <div key={q.id} className="p-5 rounded-lg border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 font-bold text-gray-700">Câu {index + 1}:</div>
                <div className="flex-grow"><MathContent content={q.question} /></div>
                {isSubmitted && (
                  userAnswers[q.id] === q.correct_option ? 
                  <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" /> :
                  <XCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
                )}
              </div>
              <div className="mt-4 pl-8 space-y-3">
                {['A', 'B', 'C', 'D'].map(key => {
                  const optionKey = `option_${key.toLowerCase()}` as keyof MultipleChoiceQuestion;
                  return (
                    <label key={key} className={`flex items-center p-3 rounded-md border transition-all cursor-pointer ${isSubmitted ? getResultClasses(q, key) : 'hover:bg-gray-100'}`}>
                      <input
                        type="radio"
                        name={q.id}
                        value={key}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        disabled={isSubmitted}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-3 flex items-center gap-2">
                        <span className="font-bold">{key}.</span>
                        <MathContent content={q[optionKey] as string} />
                      </span>
                    </label>
                  )
                })}
              </div>
              {isSubmitted && (
                <div className="mt-4 p-4 bg-gray-50 border-l-4 border-gray-300 rounded-r-md">
                   <h4 className="font-semibold text-gray-800 mb-2">Lời giải chi tiết:</h4>
                   <div className="text-gray-700 leading-relaxed">
                       <MathContent content={q.explanation} />
                   </div>
                 </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-10 flex justify-center gap-4">
            <Link to="/" className="px-6 py-3 text-base font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
              Quay về Ngân hàng đề
            </Link>
            {!isSubmitted && (
                <button
                    onClick={handleSubmit}
                    className="px-8 py-3 text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Nộp bài
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default OnlineExamPage;
