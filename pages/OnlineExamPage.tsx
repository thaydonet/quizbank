
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import type { Question } from '../types';
import MathContent from '../components/MathContent';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';
import XCircleIcon from '../components/icons/XCircleIcon';

type UserAnswers = { [questionId: string]: string };

const OnlineExamPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState<string>('Đề thi Online');
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  
  const initializeState = useCallback(() => {
    if (location.state && location.state.questions && location.state.title) {
        setQuestions(location.state.questions);
        setTitle(location.state.title);
        setUserAnswers({});
        setIsSubmitted(false);
    } else {
        navigate('/');
    }
  }, [location.state, navigate]);

  useEffect(() => {
    initializeState();
  }, [initializeState]);

  const handleAnswerChange = (questionId: string, answer: string, type: 'mcq' | 'sa' | 'msq') => {
    if (type === 'msq') {
        const currentAnswers = (userAnswers[questionId] || '').split(',').filter(Boolean);
        const newAnswers = currentAnswers.includes(answer)
            ? currentAnswers.filter(a => a !== answer)
            : [...currentAnswers, answer];
        setUserAnswers(prev => ({ ...prev, [questionId]: newAnswers.sort().join(',') }));
    } else {
        setUserAnswers(prev => ({ ...prev, [questionId]: answer }));
    }
  };

  const handleSubmit = () => {
      setIsSubmitted(true);
      window.scrollTo(0, 0);
  };

  const getScore = () => {
    return questions.reduce((score, q) => {
        const userAnswer = userAnswers[q.id] || '';
        if (q.type === 'msq') {
            const correct = q.correct_option.split(',').sort().join(',');
            if (userAnswer === correct) return score + 1;
        } else if (q.type === 'sa') {
            const correctAnswers = q.correct_option.split(';').map(a => a.trim().toLowerCase());
            if (correctAnswers.includes(userAnswer.trim().toLowerCase())) return score + 1;
        } else { // mcq
            if (userAnswer === q.correct_option) return score + 1;
        }
        return score;
    }, 0);
  };
  
  const getResultClasses = (q: Question, optionKey: string) => {
    const correctOptions = q.correct_option.split(',');
    const userChoice = (userAnswers[q.id] || '').split(',');
    
    const isCorrect = correctOptions.includes(optionKey);
    const isUserSelected = userChoice.includes(optionKey);

    if (isCorrect) return 'bg-green-100 border-green-400 ring-2 ring-green-300';
    if (isUserSelected && !isCorrect) return 'bg-red-100 border-red-400';
    return 'bg-gray-100 border-gray-200';
  };
  
  const renderQuestionInputs = (q: Question) => {
    switch(q.type) {
      case 'mcq':
        return ['A', 'B', 'C', 'D'].map(key => {
          const optionKey = `option_${key.toLowerCase()}` as keyof Question;
          return (
            <label key={key} className={`flex items-center p-3 rounded-md border transition-all cursor-pointer ${isSubmitted ? getResultClasses(q, key) : 'hover:bg-gray-100'}`}>
              <input type="radio" name={q.id} value={key} onChange={(e) => handleAnswerChange(q.id, e.target.value, 'mcq')} disabled={isSubmitted} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"/>
              <span className="ml-3 flex items-center gap-2"><span className="font-bold">{key}.</span><MathContent content={q[optionKey] as string} /></span>
            </label>
          )
        });
      case 'msq':
        return ['A', 'B', 'C', 'D'].map(key => {
          const optionKey = `option_${key.toLowerCase()}` as keyof Question;
          return (
            <label key={key} className={`flex items-center p-3 rounded-md border transition-all cursor-pointer ${isSubmitted ? getResultClasses(q, key) : 'hover:bg-gray-100'}`}>
              <input type="checkbox" name={q.id} value={key} onChange={(e) => handleAnswerChange(q.id, e.target.value, 'msq')} disabled={isSubmitted} className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"/>
              <span className="ml-3 flex items-center gap-2"><span className="font-bold">{key}.</span><MathContent content={q[optionKey] as string} /></span>
            </label>
          )
        });
      case 'sa':
        const userAnswer = userAnswers[q.id] || '';
        const isCorrect = q.correct_option.split(';').map(a=>a.trim().toLowerCase()).includes(userAnswer.trim().toLowerCase());
        const saResultClass = isSubmitted ? (isCorrect ? 'border-green-500 ring-green-300' : 'border-red-500 ring-red-300') : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
        return (
          <div>
            <input type="text" value={userAnswer} onChange={(e) => handleAnswerChange(q.id, e.target.value, 'sa')} disabled={isSubmitted} className={`w-full p-2 border rounded-md shadow-sm ${saResultClass}`}/>
          </div>
        );
      default:
        return null;
    }
  }

  if (questions.length === 0) {
    return <div className="text-center p-8">Đang tải đề...</div>;
  }

  const score = getScore();
  const percentage = questions.length > 0 ? (score / questions.length) * 100 : 0;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">{title}</h1>
        <p className="text-center text-gray-500 mb-8">Số câu: {questions.length}</p>
        
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
          {questions.map((q, index) => {
             const userAnswer = userAnswers[q.id] || '';
             let isCorrect = false;
             if (q.type === 'msq') isCorrect = userAnswer === q.correct_option.split(',').sort().join(',');
             else if (q.type === 'sa') isCorrect = q.correct_option.split(';').map(a=>a.trim().toLowerCase()).includes(userAnswer.trim().toLowerCase());
             else isCorrect = userAnswer === q.correct_option;

            return (
              <div key={q.id} className="p-5 rounded-lg border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 font-bold text-gray-700">Câu {index + 1}:</div>
                  <div className="flex-grow"><MathContent content={q.question} /></div>
                  {isSubmitted && (isCorrect ? <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0" /> : <XCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />)}
                </div>
                <div className="mt-4 pl-8 space-y-3">{renderQuestionInputs(q)}</div>
                {isSubmitted && (
                  <div className="mt-4 p-4 bg-gray-50 border-l-4 border-gray-300 rounded-r-md">
                    <h4 className="font-semibold text-gray-800 mb-2">Lời giải chi tiết:</h4>
                    <div className="text-gray-700 leading-relaxed"><MathContent content={q.explanation} /></div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        <div className="mt-10 flex justify-center gap-4">
            <Link to="/" className="px-6 py-3 text-base font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
              Quay về
            </Link>
            {isSubmitted ? (
                 <button onClick={initializeState} className="px-8 py-3 text-base font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                     Làm lại
                 </button>
            ) : (
                <button onClick={handleSubmit} className="px-8 py-3 text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    Nộp bài
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default OnlineExamPage;
