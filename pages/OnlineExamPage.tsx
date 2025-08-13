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
  
  // Trộn mảng
  function shuffleArray(array: any[]) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const initializeState = useCallback(() => {
    if (location.state && location.state.questions && location.state.title) {
      // Chia nhóm câu hỏi
      let mcq = location.state.questions.filter((q: Question) => q.type === 'mcq');
      let msq = location.state.questions.filter((q: Question) => q.type === 'msq');
      let sa = location.state.questions.filter((q: Question) => q.type === 'sa');
      // Trộn câu hỏi từng loại
      mcq = shuffleArray(mcq);
      msq = shuffleArray(msq); // chỉ trộn câu hỏi, không trộn đáp án
      sa = shuffleArray(sa);
      // Trộn đáp án phần I và cập nhật correct_option
      mcq = mcq.map((q: Question) => {
        const options = [
          { key: 'A', value: q.option_a },
          { key: 'B', value: q.option_b },
          { key: 'C', value: q.option_c },
          { key: 'D', value: q.option_d }
        ].filter(opt => opt.value);
        let correctKey = q.correct_option.trim();
        let correctValue = '';
        if (['A','B','C','D'].includes(correctKey)) {
          correctValue = q[`option_${correctKey.toLowerCase()}`];
        } else {
          correctValue = correctKey;
        }
        const shuffled = shuffleArray(options);
        // Tìm vị trí mới của đáp án đúng
        let newCorrectIndex = shuffled.findIndex(opt => opt.value === correctValue);
        let newCorrectOption = String.fromCharCode(65 + newCorrectIndex);
        // Gán lại đáp án đã trộn
        return {
          ...q,
          option_a: shuffled[0]?.value,
          option_b: shuffled[1]?.value,
          option_c: shuffled[2]?.value,
          option_d: shuffled[3]?.value,
          correct_option: newCorrectOption
        };
      });
      const shuffledQuestions = [...mcq, ...msq, ...sa];
      setQuestions(shuffledQuestions);
      setTitle(location.state.title);
      setUserAnswers({});
      setIsSubmitted(false);
      window.scrollTo(0, 0);
    } else {
      navigate('/');
    }
  }, [location.state, navigate]);

  useEffect(() => {
    initializeState();
  }, [initializeState]);

  const handleAnswerChange = (questionId: string, answer: string, type: 'mcq' | 'sa' | 'msq') => {
    if (isSubmitted) return;
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
      if(window.confirm('Bạn có chắc chắn muốn nộp bài không?')) {
        setIsSubmitted(true);
        window.scrollTo(0, 0);
      }
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
  
  const getQuestionCardClass = (type: Question['type'], isSubmitted: boolean): string => {
    if (isSubmitted) return 'bg-white border-gray-200';
    switch (type) {
        case 'mcq': return 'bg-blue-50 border-blue-200/80';
        case 'msq': return 'bg-purple-50 border-purple-200/80';
        case 'sa': return 'bg-amber-50 border-amber-200/80';
        default: return 'bg-white border-gray-200';
    }
  };

  const renderQuestionInputs = (q: Question) => {
    const commonOptionClasses = 'flex items-center p-3.5 rounded-lg border transition-all duration-200';
    const activeOptionClasses = isSubmitted ? '' : 'cursor-pointer hover:bg-indigo-50 hover:border-indigo-400';

    switch(q.type) {
      case 'mcq':
        return ['A', 'B', 'C', 'D'].map(key => {
          const optionKey = `option_${key.toLowerCase()}` as keyof Question;
          if (!q[optionKey]) return null;
          return (
            <label key={key} className={`${commonOptionClasses} ${isSubmitted ? getResultClasses(q, key) : 'bg-white'}`}>
              <input type="radio" name={q.id} value={key} onChange={(e) => handleAnswerChange(q.id, e.target.value, 'mcq')} disabled={isSubmitted} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 accent-indigo-600"/>
              <span className="ml-3 flex items-center gap-2 text-gray-700"><span className="font-bold">{key}.</span><MathContent content={q[optionKey] as string} /></span>
            </label>
          )
        });
      case 'msq':
        return ['A', 'B', 'C', 'D'].map(key => {
          const optionKey = `option_${key.toLowerCase()}` as keyof Question;
          if (!q[optionKey]) return null;
          return (
            <label key={key} className={`${commonOptionClasses} ${isSubmitted ? getResultClasses(q, key) : 'bg-white'}`}>
              <input type="checkbox" name={q.id} value={key} onChange={(e) => handleAnswerChange(q.id, e.target.value, 'msq')} disabled={isSubmitted} checked={(userAnswers[q.id] || '').includes(key)} className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 accent-indigo-600"/>
              <span className="ml-3 flex items-center gap-2 text-gray-700"><span className="font-bold">{key}.</span><MathContent content={q[optionKey] as string} /></span>
            </label>
          )
        });
      case 'sa':
        const userAnswer = userAnswers[q.id] || '';
        let saResultClass = 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 bg-white';
        if(isSubmitted) {
            const isCorrect = q.correct_option.split(';').map(a=>a.trim().toLowerCase()).includes(userAnswer.trim().toLowerCase());
            saResultClass = isCorrect ? 'border-green-500 ring-2 ring-green-300 bg-green-50' : 'border-red-500 ring-2 ring-red-300 bg-red-50';
        }
        return (
          <div>
            <label className="font-medium text-gray-700 mb-2 block">Nhập câu trả lời:</label>
            <input type="text" value={userAnswer} onChange={(e) => handleAnswerChange(q.id, e.target.value, 'sa')} disabled={isSubmitted} className={`w-full p-2 border rounded-lg shadow-sm transition ${saResultClass}`}/>
          </div>
        );
      default:
        return null;
    }
  }

  if (questions.length === 0) {
    return <div className="text-center p-8 text-gray-500">Đang tải đề...</div>;
  }

  const score = getScore();
  const percentage = questions.length > 0 ? (score / questions.length) * 100 : 0;

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">{title}</h1>
          <p className="text-center text-gray-500 mb-8">Số câu: {questions.length}</p>

          {isSubmitted && (
            <div className="mb-10 p-6 rounded-xl bg-indigo-50 border border-indigo-200 text-center">
              <h2 className="text-2xl font-bold text-indigo-800">KẾT QUẢ BÀI LÀM</h2>
              <p className="text-5xl font-bold my-3" style={{ color: percentage >= 50 ? '#10B981' : '#EF4444' }}>
                {score} / {questions.length}
              </p>
              <p className="text-lg text-gray-600">({percentage.toFixed(2)}% chính xác)</p>
            </div>
          )}

          {/* Chia nhóm câu hỏi */}
          {(() => {
            const mcq = questions.filter(q => q.type === 'mcq');
            const msq = questions.filter(q => q.type === 'msq');
            const sa = questions.filter(q => q.type === 'sa');
            let idx = 1;
            return (
              <>
                {mcq.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-bold text-indigo-700 mb-4">Phần I: Trắc nghiệm</h2>
                    {mcq.map((q) => {
                      const userAnswer = userAnswers[q.id] || '';
                      let isCorrect = false;
                      if (isSubmitted) isCorrect = userAnswer === q.correct_option;
                      const number = idx++;
                      return (
                        <div key={q.id} className={`p-5 rounded-xl border-2 transition-colors duration-300 ${getQuestionCardClass(q.type, isSubmitted)} mb-4`}>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 font-bold text-gray-700 text-lg">Câu {number}:</div>
                            <div className="flex-grow pt-0.5 text-gray-800"><MathContent content={q.question} /></div>
                            {isSubmitted && (isCorrect ? <CheckCircleIcon className="w-7 h-7 text-green-500 flex-shrink-0" /> : <XCircleIcon className="w-7 h-7 text-red-500 flex-shrink-0" />)}
                          </div>
                          <div className="mt-5 pl-10 space-y-3">
                            {['A', 'B', 'C', 'D'].map(key => {
                              const optionKey = `option_${key.toLowerCase()}` as keyof Question;
                              if (!q[optionKey]) return null;
                              // Highlight selected answer before submit, green/red after submit
                              let optionClass = 'bg-white';
                              if (!isSubmitted && userAnswer === key) optionClass = 'bg-indigo-100 border-indigo-400';
                              if (isSubmitted && key === q.correct_option) optionClass = 'bg-green-100 border-green-400 ring-2 ring-green-300';
                              if (isSubmitted && userAnswer === key && key !== q.correct_option) optionClass = 'bg-red-100 border-red-400';
                              return (
                                <label key={key} className={`flex items-center p-3.5 rounded-lg border transition-all duration-200 ${optionClass}`}>
                                  <input type="radio" name={q.id} value={key} onChange={(e) => handleAnswerChange(q.id, e.target.value, 'mcq')} disabled={isSubmitted} checked={userAnswer === key} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 accent-indigo-600"/>
                                  <span className="ml-3 flex items-center gap-2 text-gray-700"><span className="font-bold">{key}.</span><MathContent content={q[optionKey] as string} /></span>
                                </label>
                              )
                            })}
                          </div>
                          {isSubmitted && (
                            <div className="mt-5 p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg -m-5 mt-5 pt-5">
                              <div className="font-semibold text-gray-700 mb-2">Đáp án đúng:
                                <span className="ml-2 font-mono text-indigo-700 text-base">{q.correct_option}</span>
                              </div>
                              <h4 className="font-semibold text-gray-700 mb-2">Lời giải chi tiết:</h4>
                              <div className="text-gray-600 leading-relaxed prose prose-sm max-w-none"><MathContent content={q.explanation} /></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {msq.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-bold text-indigo-700 mb-4">Phần II: Đúng - Sai</h2>
                    {msq.map((q) => {
                      const userAnswer = userAnswers[q.id] || '';
                      let isCorrect = false;
                      if (isSubmitted) isCorrect = userAnswer === q.correct_option.split(',').map(x=>x.trim().toLowerCase()).sort().join(',');
                      const correctOptions = q.correct_option.split(',').map(x=>x.trim().toLowerCase());
                      const userOptions = userAnswer.split(',').map(x=>x.trim().toLowerCase());
                      const number = idx++;
                      return (
                        <div key={q.id} className={`p-5 rounded-xl border-2 transition-colors duration-300 ${getQuestionCardClass(q.type, isSubmitted)} mb-4`}>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 font-bold text-gray-700 text-lg">Câu {number}:</div>
                            <div className="flex-grow pt-0.5 text-gray-800"><MathContent content={q.question} /></div>
                            {isSubmitted && (isCorrect ? <CheckCircleIcon className="w-7 h-7 text-green-500 flex-shrink-0" /> : <XCircleIcon className="w-7 h-7 text-red-500 flex-shrink-0" />)}
                          </div>
                          <div className="mt-5 pl-10 space-y-3">
                            {['a', 'b', 'c', 'd'].map(key => {
                              const optionKey = `option_${key}` as keyof Question;
                              if (!q[optionKey]) return null;
                              // Đánh dấu đúng/sai cho từng đáp án
                              let optionClass = 'bg-white';
                              if (!isSubmitted && userOptions.includes(key)) optionClass = 'bg-indigo-100 border-indigo-400';
                              if (isSubmitted && correctOptions.includes(key)) optionClass = 'bg-green-100 border-green-400 ring-2 ring-green-300';
                              if (isSubmitted && userOptions.includes(key) && !correctOptions.includes(key)) optionClass = 'bg-red-100 border-red-400';
                              return (
                                <label key={key} className={`flex items-center p-3.5 rounded-lg border transition-all duration-200 ${optionClass}`}>
                                  <input type="checkbox" name={q.id} value={key} onChange={(e) => handleAnswerChange(q.id, e.target.value, 'msq')} disabled={isSubmitted} checked={userOptions.includes(key)} className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 accent-indigo-600"/>
                                  <span className="ml-3 flex items-center gap-2 text-gray-700"><span className="font-bold">{key})</span><MathContent content={q[optionKey] as string} /></span>
                                </label>
                              )
                            })}
                          </div>
                          {isSubmitted && (
                            <div className="mt-5 p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg -m-5 mt-5 pt-5">
                              <div className="font-semibold text-gray-700 mb-2">Đáp án đúng:
                                <span className="ml-2 font-mono text-indigo-700 text-base">{q.correct_option}</span>
                              </div>
                              <h4 className="font-semibold text-gray-700 mb-2">Lời giải chi tiết:</h4>
                              <div className="text-gray-600 leading-relaxed prose prose-sm max-w-none"><MathContent content={q.explanation} /></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {sa.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-bold text-indigo-700 mb-4">Phần III: Trả lời ngắn</h2>
                    {sa.map((q) => {
                      const userAnswer = userAnswers[q.id] || '';
                      let isCorrect = false;
                      if (isSubmitted) isCorrect = q.correct_option.split(';').map(a=>a.trim().toLowerCase()).includes(userAnswer.trim().toLowerCase());
                      const correctAnswers = q.correct_option.split(';').map(a=>a.trim().toLowerCase());
                      const number = idx++;
                      let saResultClass = 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 bg-white';
                      if (!isSubmitted && userAnswer) saResultClass = 'bg-indigo-100 border-indigo-400';
                      if (isSubmitted && isCorrect) saResultClass = 'border-green-500 ring-2 ring-green-300 bg-green-50';
                      if (isSubmitted && userAnswer && !isCorrect) saResultClass = 'border-red-500 ring-2 ring-red-300 bg-red-50';
                      return (
                        <div key={q.id} className={`p-5 rounded-xl border-2 transition-colors duration-300 ${getQuestionCardClass(q.type, isSubmitted)} mb-4`}>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 font-bold text-gray-700 text-lg">Câu {number}:</div>
                            <div className="flex-grow pt-0.5 text-gray-800"><MathContent content={q.question} /></div>
                            {isSubmitted && (isCorrect ? <CheckCircleIcon className="w-7 h-7 text-green-500 flex-shrink-0" /> : <XCircleIcon className="w-7 h-7 text-red-500 flex-shrink-0" />)}
                          </div>
                          <div className="mt-5 pl-10 space-y-3">
                            <label className="font-medium text-gray-700 mb-2 block">Nhập câu trả lời:</label>
                            <input type="text" value={userAnswer} onChange={(e) => handleAnswerChange(q.id, e.target.value, 'sa')} disabled={isSubmitted} className={`w-full p-2 border rounded-lg shadow-sm transition ${saResultClass}`} />
                          </div>
                          {isSubmitted && (
                            <div className="mt-5 p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg -m-5 mt-5 pt-5">
                              <div className="font-semibold text-gray-700 mb-2">Đáp án đúng:
                                <span className="ml-2 font-mono text-indigo-700 text-base"><MathContent content={q.correct_option} /></span>
                              </div>
                              <h4 className="font-semibold text-gray-700 mb-2">Lời giải chi tiết:</h4>
                              <div className="text-gray-600 leading-relaxed prose prose-sm max-w-none"><MathContent content={q.explanation} /></div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}

          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link to="/" className="w-full sm:w-auto px-6 py-3 text-center text-base font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
              Quay về trang chủ
            </Link>
            {isSubmitted ? (
              <button onClick={initializeState} className="w-full sm:w-auto px-8 py-3 text-base font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm">
                Làm lại bài thi này
              </button>
            ) : (
              <button onClick={handleSubmit} className="w-full sm:w-auto px-8 py-3 text-base font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                Nộp bài
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineExamPage;