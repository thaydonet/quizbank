import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import type { Question } from '../types';
import MathContent from '../components/MathContent';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';
import XCircleIcon from '../components/icons/XCircleIcon';
import { QuizService } from '../services/quizService';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../components/Toast';

type UserAnswers = { [questionId: string]: string };

// Interface mở rộng cho Question với uniqueId
interface QuestionWithUniqueId extends Question {
  uniqueId: string;
  originalId: string;
}

const OnlineExamPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [questions, setQuestions] = useState<QuestionWithUniqueId[]>([]);
  const [title, setTitle] = useState<string>('Đề thi Online');
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [studentName, setStudentName] = useState<string>('');
  const [studentClass, setStudentClass] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isPublicQuiz, setIsPublicQuiz] = useState<boolean>(false);
  
  // Trộn mảng
  function shuffleArray(array: any[]) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Tạo uniqueId để tránh trùng lặp
  const generateUniqueId = (originalId: string, type: string, index: number): string => {
    return `${type}_${originalId}_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const initializeState = useCallback(() => {
    if (location.state && location.state.questions && location.state.title) {
      // Chia nhóm câu hỏi
      let mcq = location.state.questions.filter((q: Question) => q.type === 'mcq');
      let msq = location.state.questions.filter((q: Question) => q.type === 'msq');
      let sa = location.state.questions.filter((q: Question) => q.type === 'sa');
      
      // Trộn câu hỏi từng loại
      mcq = shuffleArray(mcq);
      msq = shuffleArray(msq);
      sa = shuffleArray(sa);
      
      // Trộn đáp án phần I và cập nhật correct_option
      mcq = mcq.map((q: Question, index: number) => {
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
        
        // Tạo uniqueId và gán lại đáp án đã trộn
        return {
          ...q,
          uniqueId: generateUniqueId(q.id, 'mcq', index),
          originalId: q.id,
          option_a: shuffled[0]?.value,
          option_b: shuffled[1]?.value,
          option_c: shuffled[2]?.value,
          option_d: shuffled[3]?.value,
          correct_option: newCorrectOption
        } as QuestionWithUniqueId;
      });

      // Thêm uniqueId cho các câu hỏi MSQ và SA
      msq = msq.map((q: Question, index: number) => ({
        ...q,
        uniqueId: generateUniqueId(q.id, 'msq', index),
        originalId: q.id
      } as QuestionWithUniqueId));

      sa = sa.map((q: Question, index: number) => ({
        ...q,
        uniqueId: generateUniqueId(q.id, 'sa', index),
        originalId: q.id
      } as QuestionWithUniqueId));
      
      const shuffledQuestions = [...mcq, ...msq, ...sa];
      setQuestions(shuffledQuestions);
      setTitle(location.state.title);
      setUserAnswers({});
      setIsSubmitted(false);
      setStudentName('');
      setStudentClass('');
      window.scrollTo(0, 0);
    } else {
      navigate('/');
    }
  }, [location.state, navigate]);

  useEffect(() => {
    initializeState();

    // Kiểm tra xem có phải quiz public không
    if (location.state?.isPublic) {
      setIsPublicQuiz(true);
    }

    // Auto-fill thông tin nếu user đã đăng nhập
    if (profile) {
      setIsLoggedIn(true);
      setStudentName(profile.full_name || profile.email || '');
      setStudentClass(profile.school || '');
    }
  }, [initializeState, profile, location.state]);

  const handleAnswerChange = (questionUniqueId: string, answer: string, type: 'mcq' | 'sa' | 'msq') => {
    if (isSubmitted) return;
    if (type === 'msq') {
        // MSQ với định dạng a:true,b:false,c:true,d:false
        const currentAnswers = userAnswers[questionUniqueId] || '';
        const answerMap: {[key: string]: string} = {};
        
        // Parse current answers
        if (currentAnswers) {
          currentAnswers.split(',').forEach(item => {
            const [key, value] = item.split(':');
            if (key && value) answerMap[key] = value;
          });
        }
        
        // Parse new answer (format: "a:true" or "b:false")
        const [optionKey, value] = answer.split(':');
        answerMap[optionKey] = value;
        
        // Convert back to string format
        const newAnswerString = Object.keys(answerMap)
          .sort()
          .map(key => `${key}:${answerMap[key]}`)
          .join(',');
        
        setUserAnswers(prev => ({ ...prev, [questionUniqueId]: newAnswerString }));
    } else {
        setUserAnswers(prev => ({ ...prev, [questionUniqueId]: answer }));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitted(true);
    showToast.success('Nộp bài thành công! Đang tính điểm...', 3000);

    // Lưu kết quả thi nếu có quizId và user đã đăng nhập
    const quizId = location.state?.quizId;
    if (quizId && profile) {
      const score = getScore();
      await QuizService.saveQuizAttempt(quizId, userAnswers, score);
    }

    window.scrollTo(0, 0);
  };

  const getScore = () => {
    let totalScore = 0;
    
    questions.forEach(q => {
      const userAnswer = userAnswers[q.uniqueId] || '';
      
      if (q.type === 'mcq') {
        // MCQ: 0.25 điểm nếu đúng, 0 điểm nếu không làm hoặc sai
        if (userAnswer && userAnswer === q.correct_option) {
          totalScore += 0.25;
        }
        // Không làm (userAnswer rỗng) hoặc sai → 0 điểm
      } else if (q.type === 'msq') {
        // MSQ: Chỉ tính điểm nếu có trả lời
        if (userAnswer && userAnswer.trim()) {
          const correctAnswers = q.correct_option.split(',').map(x => x.trim().toLowerCase());
          const userAnswerMap: {[key: string]: string} = {};

          userAnswer.split(',').forEach(item => {
            const [key, value] = item.split(':');
            if (key && value) userAnswerMap[key.trim().toLowerCase()] = value;
          });

          // Kiểm tra từng đáp án a, b, c, d (chỉ khi có trả lời)
          ['a', 'b', 'c', 'd'].forEach(option => {
            const isCorrectlyAnswered = correctAnswers.includes(option);
            const userAnsweredTrue = userAnswerMap[option] === 'true';

            // Đúng khi: (đáp án đúng và chọn true) hoặc (đáp án sai và chọn false hoặc không chọn)
            if ((isCorrectlyAnswered && userAnsweredTrue) || (!isCorrectlyAnswered && !userAnsweredTrue)) {
              totalScore += 0.25;
            }
          });
        }
        // Không làm (userAnswer rỗng) → 0 điểm
      } else if (q.type === 'sa') {
        // SA: 0.5 điểm nếu đúng, 0 điểm nếu không làm hoặc sai
        if (userAnswer && userAnswer.trim()) {
          const correctAnswers = q.correct_option.split(';').map(a => a.trim().toLowerCase());
          if (correctAnswers.includes(userAnswer.trim().toLowerCase())) {
            totalScore += 0.5;
          }
        }
        // Không làm (userAnswer rỗng) → 0 điểm
      }
    });
    
    return totalScore;
  };

  const getMaxScore = () => {
    let maxScore = 0;
    questions.forEach(q => {
      if (q.type === 'mcq') maxScore += 0.25;
      else if (q.type === 'msq') maxScore += 1.0; // 4 đáp án x 0.25
      else if (q.type === 'sa') maxScore += 0.5;
    });
    return maxScore;
  };
  
  const getResultClasses = (q: QuestionWithUniqueId, optionKey: string, isTrue: boolean) => {
    if (q.type === 'msq') {
      const correctOptions = q.correct_option.split(',').map(x => x.trim().toLowerCase());
      const userAnswer = userAnswers[q.uniqueId] || '';
      const userAnswerMap: {[key: string]: string} = {};
      
      if (userAnswer) {
        userAnswer.split(',').forEach(item => {
          const [key, value] = item.split(':');
          if (key && value) userAnswerMap[key.trim().toLowerCase()] = value;
        });
      }
      
      const isCorrectAnswer = correctOptions.includes(optionKey.toLowerCase());
      const userSelected = userAnswerMap[optionKey.toLowerCase()] === (isTrue ? 'true' : 'false');
      
      // Đúng khi: (là đáp án đúng và chọn Đúng) hoặc (không phải đáp án đúng và chọn Sai)
      const isCorrectChoice = (isCorrectAnswer && isTrue) || (!isCorrectAnswer && !isTrue);
      
      if (isCorrectChoice && userSelected) return 'bg-green-100 border-green-400 ring-2 ring-green-300';
      if (!isCorrectChoice && userSelected) return 'bg-red-100 border-red-400';
      if (isCorrectChoice && !userSelected) return 'bg-yellow-100 border-yellow-400'; // Đáp án đúng nhưng không chọn
      return 'bg-gray-100 border-gray-200';
    }
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

  if (questions.length === 0) {
    return <div className="text-center p-8 text-gray-500">Đang tải đề...</div>;
  }

  const score = getScore();
  const maxScore = getMaxScore();
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">{title}</h1>
          <p className="text-center text-gray-500 mb-6">Số câu: {questions.length}</p>

          {/* Thông tin học sinh */}
          {!isSubmitted && (
            <div className="mb-8 p-6 rounded-xl bg-blue-50 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">
                Thông tin học sinh
                {isLoggedIn && <span className="text-sm font-normal text-blue-600">(đã tự động điền từ tài khoản)</span>}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên:</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Nhập họ và tên"
                    disabled={isLoggedIn}
                  />
                  {isLoggedIn && (
                    <p className="text-xs text-blue-600 mt-1">✓ Lấy từ tài khoản đã đăng nhập</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lớp/Trường:</label>
                  <input
                    type="text"
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Nhập lớp hoặc trường"
                    disabled={isLoggedIn}
                  />
                  {isLoggedIn && (
                    <p className="text-xs text-blue-600 mt-1">✓ Lấy từ tài khoản đã đăng nhập</p>
                  )}
                </div>
              </div>
              {!isLoggedIn && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    👤 <strong>Khách không đăng nhập:</strong> Bạn có thể làm bài nhưng kết quả sẽ không được lưu.
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    💡 <Link to="/login" className="text-blue-600 hover:underline font-semibold">Đăng nhập</Link> để lưu kết quả và theo dõi tiến độ học tập
                  </p>
                </div>
              )}
            </div>
          )}

          {isSubmitted && (
            <div className="mb-10 p-6 rounded-xl bg-indigo-50 border border-indigo-200 text-center">
              <h2 className="text-2xl font-bold text-indigo-800 mb-4">KẾT QUẢ BÀI LÀM</h2>
              {(studentName || studentClass) && (
                <div className="mb-4 text-lg text-gray-700">
                  {studentName && <p><strong>Họ tên:</strong> {studentName}</p>}
                  {studentClass && <p><strong>Lớp:</strong> {studentClass}</p>}
                </div>
              )}
              <p className="text-5xl font-bold my-3" style={{ color: percentage >= 50 ? '#10B981' : '#EF4444' }}>
                {score.toFixed(2)} / {maxScore.toFixed(2)}
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
                    <h2 className="text-xl font-bold text-indigo-700 mb-4">Phần I: Trắc nghiệm (0.25 điểm/câu)</h2>
                    {mcq.map((q) => {
                      const userAnswer = userAnswers[q.uniqueId] || '';
                      let isCorrect = false;
                      if (isSubmitted) isCorrect = userAnswer === q.correct_option;
                      const number = idx++;
                      return (
                        <div key={q.uniqueId} className={`p-5 rounded-xl border-2 transition-colors duration-300 ${getQuestionCardClass(q.type, isSubmitted)} mb-4`}>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 font-bold text-blue-600 text-lg">Câu {number}:</div>
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
                                <label key={`${q.uniqueId}_${key}`} className={`flex items-center p-3.5 rounded-lg border transition-all duration-200 ${optionClass}`}>
                                  <input 
                                    type="radio" 
                                    name={q.uniqueId} 
                                    value={key} 
                                    onChange={(e) => handleAnswerChange(q.uniqueId, e.target.value, 'mcq')} 
                                    disabled={isSubmitted} 
                                    checked={userAnswer === key} 
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 accent-indigo-600"
                                  />
                                  <span className="ml-3 flex items-center gap-2 text-gray-700">
                                    <span className="font-bold">{key}.</span>
                                    <MathContent content={q[optionKey] as string} />
                                  </span>
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
                    <h2 className="text-xl font-bold text-indigo-700 mb-4">Phần II: Đúng - Sai (0.25 điểm/đáp án)</h2>
                    {msq.map((q) => {
                      const userAnswer = userAnswers[q.uniqueId] || '';
                      const correctOptions = q.correct_option.split(',').map(x=>x.trim().toLowerCase());
                      const userAnswerMap: {[key: string]: string} = {};
                      
                      if (userAnswer) {
                        userAnswer.split(',').forEach(item => {
                          const [key, value] = item.split(':');
                          if (key && value) userAnswerMap[key.trim().toLowerCase()] = value;
                        });
                      }

                      // Tính điểm cho câu MSQ này
                      let questionScore = 0;
                      if (isSubmitted) {
                        ['a', 'b', 'c', 'd'].forEach(option => {
                          const isCorrectlyAnswered = correctOptions.includes(option);
                          const userAnsweredTrue = userAnswerMap[option] === 'true';
                          if ((isCorrectlyAnswered && userAnsweredTrue) || (!isCorrectlyAnswered && !userAnsweredTrue)) {
                            questionScore += 0.25;
                          }
                        });
                      }

                      const number = idx++;
                      return (
                        <div key={q.uniqueId} className={`p-5 rounded-xl border-2 transition-colors duration-300 ${getQuestionCardClass(q.type, isSubmitted)} mb-4`}>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 font-bold text-blue-600 text-lg">Câu {number}:</div>
                            <div className="flex-grow pt-0.5 text-gray-800"><MathContent content={q.question} /></div>
                            {isSubmitted && (
                              <div className="flex-shrink-0 flex items-center gap-2">
                                <span className="text-sm font-semibold" style={{ color: questionScore === 1.0 ? '#10B981' : questionScore > 0 ? '#F59E0B' : '#EF4444' }}>
                                  {questionScore.toFixed(2)}/1.00
                                </span>
                                {questionScore === 1.0 ? <CheckCircleIcon className="w-7 h-7 text-green-500" /> : <XCircleIcon className="w-7 h-7 text-red-500" />}
                              </div>
                            )}
                          </div>
                          <div className="mt-5 pl-10 space-y-4">
                            {['a', 'b', 'c', 'd'].map(key => {
                              const optionKey = `option_${key}` as keyof Question;
                              if (!q[optionKey]) return null;
                              
                              const userSelectedTrue = userAnswerMap[key] === 'true';
                              const userSelectedFalse = userAnswerMap[key] === 'false';
                              
                              return (
                                <div key={`${q.uniqueId}_${key}`} className="border rounded-lg p-4 bg-white">
                                  <div className="mb-3">
                                    <span className="font-bold text-gray-700">{key})</span>
                                    <span className="ml-2 text-gray-800"><MathContent content={q[optionKey] as string} /></span>
                                  </div>
                                  <div className="flex gap-4 ml-6">
                                    <label className={`flex items-center p-2 rounded border transition-all duration-200 ${
                                      isSubmitted ? getResultClasses(q, key, true) : (userSelectedTrue ? 'bg-indigo-100 border-indigo-400' : 'bg-white hover:bg-gray-50')
                                    }`}>
                                      <input
                                        type="radio"
                                        name={`${q.uniqueId}_${key}`}
                                        value={`${key}:true`}
                                        onChange={(e) => handleAnswerChange(q.uniqueId, e.target.value, 'msq')}
                                        disabled={isSubmitted}
                                        checked={userSelectedTrue}
                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                                      />
                                      <span className="ml-2 text-green-700 font-semibold">Đúng</span>
                                    </label>
                                    <label className={`flex items-center p-2 rounded border transition-all duration-200 ${
                                      isSubmitted ? getResultClasses(q, key, false) : (userSelectedFalse ? 'bg-indigo-100 border-indigo-400' : 'bg-white hover:bg-gray-50')
                                    }`}>
                                      <input
                                        type="radio"
                                        name={`${q.uniqueId}_${key}`}
                                        value={`${key}:false`}
                                        onChange={(e) => handleAnswerChange(q.uniqueId, e.target.value, 'msq')}
                                        disabled={isSubmitted}
                                        checked={userSelectedFalse}
                                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                                      />
                                      <span className="ml-2 text-red-700 font-semibold">Sai</span>
                                    </label>
                                  </div>
                                </div>
                              );
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
                    <h2 className="text-xl font-bold text-indigo-700 mb-4">Phần III: Trả lời ngắn (0.5 điểm/câu)</h2>
                    {sa.map((q) => {
                      const userAnswer = userAnswers[q.uniqueId] || '';
                      let isCorrect = false;
                      if (isSubmitted) isCorrect = q.correct_option.split(';').map(a=>a.trim().toLowerCase()).includes(userAnswer.trim().toLowerCase());
                      const number = idx++;
                      let saResultClass = 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 bg-white';
                      if (!isSubmitted && userAnswer) saResultClass = 'bg-indigo-100 border-indigo-400';
                      if (isSubmitted && isCorrect) saResultClass = 'border-green-500 ring-2 ring-green-300 bg-green-50';
                      if (isSubmitted && userAnswer && !isCorrect) saResultClass = 'border-red-500 ring-2 ring-red-300 bg-red-50';
                      return (
                        <div key={q.uniqueId} className={`p-5 rounded-xl border-2 transition-colors duration-300 ${getQuestionCardClass(q.type, isSubmitted)} mb-4`}>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 font-bold text-blue-600 text-lg">Câu {number}:</div>
                            <div className="flex-grow pt-0.5 text-gray-800"><MathContent content={q.question} /></div>
                            {isSubmitted && (isCorrect ? <CheckCircleIcon className="w-7 h-7 text-green-500 flex-shrink-0" /> : <XCircleIcon className="w-7 h-7 text-red-500 flex-shrink-0" />)}
                          </div>
                          <div className="mt-5 pl-10 space-y-3">
                            <label className="font-medium text-gray-700 mb-2 block">Nhập câu trả lời:</label>
                            <input 
                              type="text" 
                              value={userAnswer} 
                              onChange={(e) => handleAnswerChange(q.uniqueId, e.target.value, 'sa')} 
                              disabled={isSubmitted} 
                              className={`w-full p-2 border rounded-lg shadow-sm transition ${saResultClass}`} 
                            />
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
            <Link to="/online-exam" className="w-full sm:w-auto px-6 py-3 text-center text-base font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
              Quay về danh sách đề thi
            </Link>
            <Link to="/" className="w-full sm:w-auto px-6 py-3 text-center text-base font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
              Trang chủ
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