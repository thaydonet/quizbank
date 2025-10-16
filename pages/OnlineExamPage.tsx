import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import type { Question } from '../types';
import { DynamicQuestionEngine } from '../services/dynamicQuestionEngine';
import { QuizSubmissionService } from '../services/quizSubmissionService';
import { SupabaseQuizService } from '../services/supabaseQuizService';
import { supabase } from '../services/supabaseClient';
import MathContent from '../components/MathContent';
import RLSErrorHandler from '../components/RLSErrorHandler';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';
import XCircleIcon from '../components/icons/XCircleIcon';

type UserAnswers = { [questionId: string]: string };

// Interface mở rộng cho Question với uniqueId
interface QuestionWithUniqueId extends Question {
  uniqueId: string;
  originalId: string;
}

const OnlineExamPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  
  const [questions, setQuestions] = useState<QuestionWithUniqueId[]>([]);
  const [title, setTitle] = useState<string>('Đề thi Online');
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [studentName, setStudentName] = useState<string>('');
  const [studentClass, setStudentClass] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [quizMetadata, setQuizMetadata] = useState<any>(null); // Store quiz metadata
  const [canTakeQuiz, setCanTakeQuiz] = useState<boolean>(true);
  const [attemptInfo, setAttemptInfo] = useState<{ current: number; max: number }>({ current: 0, max: 1 });
  const [submitNotification, setSubmitNotification] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({ show: false, type: 'success', message: '' });
  const [rlsError, setRlsError] = useState<string>('');
  
  // Load current user data for auto-populate
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (userData) {
            setCurrentUser(userData);
            // Auto-populate if user is a student
            if (userData.role === 'student') {
              if (userData.student_name) {
                setStudentName(userData.student_name);
              }
              if (userData.student_class) {
                setStudentClass(userData.student_class);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    getCurrentUser();
  }, []);
  
  // Check quiz attempts when component loads
  useEffect(() => {
    const checkQuizAttempts = async () => {
      // Skip attempt checking for anonymous users since we allow unlimited attempts anyway
      if (!currentUser) {
        console.log('Anonymous user - skipping attempt check');
        return;
      }
      
      // Get maxAttempts from location state or default to 1
      let maxAttempts = 1;
      let quizTitle = 'Đề thi Online';
      let quizCreatorId = null;
      
      if (location.state?.title) {
        quizTitle = location.state.title;
        maxAttempts = location.state?.maxAttempts || 1;
        quizCreatorId = location.state?.quizCreatorId;
      } else if (slug) {
        // If using slug, we need to get quiz info from Supabase
        try {
          const supabaseQuiz = await SupabaseQuizService.getQuizBySlug(slug);
          if (supabaseQuiz) {
            quizTitle = supabaseQuiz.title;
            maxAttempts = supabaseQuiz.max_attempts || 1;
            quizCreatorId = supabaseQuiz.created_by;
          }
        } catch (error) {
          console.error('Error fetching quiz metadata:', error);
        }
      }
      
      try {
        console.log('Checking quiz attempts for:', {
          studentId: currentUser.id,
          quizTitle: quizTitle,
          maxAttempts
        });
        
        setQuizMetadata({
          maxAttempts,
          quizCreatorId,
          title: quizTitle
        });
        
        // Check current attempts
        const attemptCheck = await QuizSubmissionService.canStudentTakeQuiz(
          currentUser.id,
          quizTitle,
          maxAttempts
        );
        
        console.log('Attempt check result:', attemptCheck);
        
        setAttemptInfo({
          current: attemptCheck.currentAttempts,
          max: maxAttempts
        });
        
        setCanTakeQuiz(attemptCheck.canTake);
        
        // Since we allow unlimited attempts now, don't block users
        if (!attemptCheck.canTake) {
          console.warn('Attempt check returned false, but allowing unlimited attempts');
          setCanTakeQuiz(true); // Override to allow unlimited attempts
        }
      } catch (error) {
        console.error('Error checking quiz attempts:', error);
      }
    };
    
    checkQuizAttempts();
  }, [currentUser, location.state, slug]);
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

  // Function to regenerate questions for retake (especially dynamic ones)
  const regenerateQuestionsForRetake = useCallback(async () => {
    try {
      // Get the original quiz data
      let quizData = null;
      
      if (location.state && location.state.questions && location.state.title) {
        quizData = {
          questions: location.state.questions,
          title: location.state.title
        };
      } else if (slug) {
        const supabaseQuiz = await SupabaseQuizService.getQuizBySlug(slug);
        if (supabaseQuiz) {
          quizData = {
            questions: supabaseQuiz.questions,
            title: supabaseQuiz.title
          };
        }
      }
      
      if (!quizData) {
        console.error('No quiz data available for regeneration');
        return;
      }
      
      const engine = new DynamicQuestionEngine();
      
      // Process questions again (this will regenerate dynamic ones with new variables)
      const processedQuestions = quizData.questions.map((q: Question) => {
        const isQuestionDynamic = q.isDynamic || engine.isDynamicQuestion(q);
        
        if (isQuestionDynamic) {
          try {
            console.log('Regenerating dynamic question for retake:', q.id);
            const processed = engine.processQuestion(q);
            return {
              ...q,
              ...processed,
              isDynamic: true
            };
          } catch (error) {
            console.error('Error regenerating dynamic question:', q.id, error);
            return q;
          }
        }
        return q;
      });
      
      // Separate and shuffle questions again
      let mcq = processedQuestions.filter((q: Question) => q.type === 'mcq');
      let msq = processedQuestions.filter((q: Question) => q.type === 'msq');
      let sa = processedQuestions.filter((q: Question) => q.type === 'sa');
      
      // Shuffle questions by type
      mcq = shuffleArray(mcq);
      msq = shuffleArray(msq);
      sa = shuffleArray(sa);
      
      // Shuffle MCQ options and update correct_option
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
        let newCorrectIndex = shuffled.findIndex(opt => opt.value === correctValue);
        let newCorrectOption = String.fromCharCode(65 + newCorrectIndex);
        
        return {
          ...q,
          option_a: shuffled[0]?.value || '',
          option_b: shuffled[1]?.value || '',
          option_c: shuffled[2]?.value || '',
          option_d: shuffled[3]?.value || '',
          correct_option: newCorrectOption,
          uniqueId: generateUniqueId(q.id, 'mcq', index),
          originalId: q.id
        } as QuestionWithUniqueId;
      });
      
      // Add unique IDs to MSQ and SA questions
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
      
      console.log('Questions regenerated for retake, including', 
        processedQuestions.filter(q => q.isDynamic).length, 'dynamic questions');
    } catch (error) {
      console.error('Error regenerating questions for retake:', error);
    }
  }, [location.state, slug, generateUniqueId]);

  const initializeState = useCallback(async () => {
    if (initialized) return; // Prevent multiple initializations
    
    try {
      setLoading(true);
      
      let quizData = null;
      
      // If we have location state, use it (traditional flow)
      if (location.state && location.state.questions && location.state.title) {
        quizData = {
          questions: location.state.questions,
          title: location.state.title,
          quizId: location.state.quizId,
          supabaseQuizId: location.state.supabaseQuizId,
          teacherName: location.state.teacherName
        };
      }
      // If we have a slug but no state, load from Supabase
      else if (slug) {
        console.log('Loading quiz from slug:', slug);
        const supabaseQuiz = await SupabaseQuizService.getQuizBySlug(slug);
        if (supabaseQuiz) {
          quizData = {
            questions: supabaseQuiz.questions,
            title: supabaseQuiz.title,
            quizId: supabaseQuiz.id,
            supabaseQuizId: supabaseQuiz.id,
            teacherName: supabaseQuiz.creator_name
          };
        } else {
          console.warn('Quiz not found for slug:', slug);
          navigate('/online-exam');
          return;
        }
      }
      // If no data available, redirect to exam selection
      else {
        console.warn('No quiz data found, redirecting to online-exam');
        navigate('/online-exam');
        return;
      }
      if (quizData) {
        const engine = new DynamicQuestionEngine();
        
        // Process dynamic questions first
        const processedQuestions = quizData.questions.map((q: Question) => {
          // Check if question is dynamic by looking for isDynamic flag or dynamic patterns
          const isQuestionDynamic = q.isDynamic || engine.isDynamicQuestion(q);
          
          if (isQuestionDynamic) {
            try {
              console.log('Processing dynamic question:', q.id, q.question.substring(0, 50) + '...');
              const processed = engine.processQuestion(q);
              console.log('Processed result:', processed.question.substring(0, 50) + '...');
              return {
                ...q,
                ...processed,
                isDynamic: true // Ensure the flag is maintained
              };
            } catch (error) {
              console.error('Error processing dynamic question:', q.id, error);
              return q; // Fallback to original question
            }
          }
          return q;
        });
        
        // Chia nhóm câu hỏi
        let mcq = processedQuestions.filter((q: Question) => q.type === 'mcq');
        let msq = processedQuestions.filter((q: Question) => q.type === 'msq');
        let sa = processedQuestions.filter((q: Question) => q.type === 'sa');
        
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
        setTitle(quizData.title);
        setUserAnswers({});
        setIsSubmitted(false);
        setStudentName('');
        setStudentClass('');
        
        // Smooth scroll to top
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      } else {
        console.warn('No quiz data found, redirecting to home');
        navigate('/');
        return;
      }
    } catch (error) {
      console.error('Error initializing exam:', error);
      navigate('/');
      return;
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [location.state, navigate, slug, initialized]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      initializeState();
    }, 50);

    return () => clearTimeout(timeoutId);
  }, []);

  if (loading || !initialized) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Đang chuẩn bị đề thi...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-gray-500 text-lg mb-4">Không có câu hỏi nào được tìm thấy.</p>
          <button 
            onClick={() => navigate('/online-exam')}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

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
    // Validate mandatory fields
    if (!studentName.trim()) {
      setSubmitNotification({
        show: true,
        type: 'error',
        message: 'Vui lòng nhập họ và tên của bạn.'
      });
      setTimeout(() => {
        setSubmitNotification(prev => ({ ...prev, show: false }));
      }, 5000);
      return;
    }
    
    if (!studentClass.trim()) {
      setSubmitNotification({
        show: true,
        type: 'error',
        message: 'Vui lòng nhập lớp của bạn.'
      });
      setTimeout(() => {
        setSubmitNotification(prev => ({ ...prev, show: false }));
      }, 5000);
      return;
    }
    
    // Since we allow unlimited attempts, don't check limits
    // if (!canTakeQuiz) {
    //   setSubmitNotification({
    //     show: true,
    //     type: 'error',
    //     message: 'Bạn đã hoàn thành tối đa số lần thi cho đề này.'
    //   });
    //   setTimeout(() => {
    //     setSubmitNotification(prev => ({ ...prev, show: false }));
    //   }, 5000);
    //   return;
    // }
    
    setLoading(true);
    
    try {
      // Calculate score first
      const finalScore = getScore();
      const maxScore = getMaxScore();
      const totalQuestions = questions.length;
      
      // Prepare submission data
      const submissionData = {
        student_id: currentUser?.id || null, // Use null for anonymous users instead of invalid UUID
        student_name: studentName.trim(),
        student_email: currentUser?.email || `anonymous_${studentName.trim().toLowerCase().replace(/\s+/g, '')}@temp.local`,
        student_class: studentClass.trim(),
        quiz_title: quizMetadata?.title || title, // Use metadata title if available
        quiz_id: location.state?.quizId || `quiz_${Date.now()}`,
        quiz_creator_id: quizMetadata?.quizCreatorId || currentUser?.id || null,
        score: finalScore,
        total_questions: totalQuestions,
        answers: userAnswers
      };
      
      // Submit to Supabase
      const result = await QuizSubmissionService.submitQuizResult(submissionData);
      
      if (result.success) {
        // Show success notification
        setSubmitNotification({
          show: true,
          type: 'success',
          message: `Nộp bài thành công! Điểm số: ${finalScore.toFixed(2)}/${maxScore.toFixed(2)} (${((finalScore/maxScore)*100).toFixed(1)}%)`
        });
        
        // Set submitted state
        setIsSubmitted(true);
        
        // Update attempt info
        setAttemptInfo(prev => ({ ...prev, current: prev.current + 1 }));
        
        // Auto-hide notification after 5 seconds
        setTimeout(() => {
          setSubmitNotification(prev => ({ ...prev, show: false }));
        }, 5000);
      } else {
        // Check if it's an RLS error
        if (result.error?.includes('row-level security policy') || result.error?.includes('RLS')) {
          setRlsError(result.error);
        } else {
          // Show regular error notification
          setSubmitNotification({
            show: true,
            type: 'error',
            message: `Lỗi khi nộp bài: ${result.error || 'Không thể lưu kết quả'}`
          });
          
          // Auto-hide notification after 7 seconds
          setTimeout(() => {
            setSubmitNotification(prev => ({ ...prev, show: false }));
          }, 7000);
        }
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      setSubmitNotification({
        show: true,
        type: 'error',
        message: 'Có lỗi xảy ra khi nộp bài. Vui lòng thử lại!'
      });
      
      setTimeout(() => {
        setSubmitNotification(prev => ({ ...prev, show: false }));
      }, 7000);
    } finally {
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
        // Nếu không trả lời (userAnswer === '') thì được 0 điểm
      } else if (q.type === 'msq') {
        // MSQ: 0.25 điểm cho mỗi đáp án đúng, chỉ tính điểm nếu có trả lời
        const correctAnswers = q.correct_option.split(',').map(x => x.trim().toLowerCase());
        const userAnswerMap: {[key: string]: string} = {};
        
        // Chỉ tính điểm nếu có trả lời
        if (userAnswer) {
          userAnswer.split(',').forEach(item => {
            const [key, value] = item.split(':');
            if (key && value) userAnswerMap[key.trim().toLowerCase()] = value;
          });
          
          // Kiểm tra từng đáp án a, b, c, d
          ['a', 'b', 'c', 'd'].forEach(option => {
            const isCorrectlyAnswered = correctAnswers.includes(option);
            const userAnsweredTrue = userAnswerMap[option] === 'true';
            const userAnsweredFalse = userAnswerMap[option] === 'false';
            
            // Chỉ tính điểm khi học sinh đã chọn (true hoặc false)
            if (userAnsweredTrue || userAnsweredFalse) {
              // Đúng khi: (đáp án đúng và chọn true) hoặc (đáp án sai và chọn false)
              if ((isCorrectlyAnswered && userAnsweredTrue) || (!isCorrectlyAnswered && userAnsweredFalse)) {
                totalScore += 0.25;
              }
            }
            // Nếu không chọn gì cho option này thì được 0 điểm
          });
        }
        // Nếu không trả lời gì cả thì được 0 điểm
      } else if (q.type === 'sa') {
        // SA: 0.5 điểm nếu đúng, 0 điểm nếu không làm hoặc sai
        if (userAnswer && userAnswer.trim()) {
          const correctAnswers = q.correct_option.split(';').map(a => a.trim().toLowerCase());
          if (correctAnswers.includes(userAnswer.trim().toLowerCase())) {
            totalScore += 0.5;
          }
        }
        // Nếu không trả lời thì được 0 điểm
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

  const score = getScore();
  const maxScore = getMaxScore();
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">{title}</h1>
          <p className="text-center text-gray-500 mb-6">Số câu: {questions.length}</p>

          {/* RLS Error Handler */}
          {rlsError && (
            <RLSErrorHandler 
              error={rlsError} 
              onRetry={() => {
                setRlsError('');
                // Retry submit
                handleSubmit();
              }}
            />
          )}

          {/* Visual Notification */}
          {submitNotification.show && (
            <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg border-l-4 shadow-lg transition-all duration-300 ${
              submitNotification.type === 'success' 
                ? 'bg-green-50 border-green-500 text-green-800' 
                : 'bg-red-50 border-red-500 text-red-800'
            }`}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {submitNotification.type === 'success' ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex-grow">
                  <p className="font-semibold text-sm">
                    {submitNotification.type === 'success' ? 'Thành công!' : 'Có lỗi xảy ra!'}
                  </p>
                  <p className="text-xs mt-1">{submitNotification.message}</p>
                </div>
                <button 
                  onClick={() => setSubmitNotification(prev => ({ ...prev, show: false }))}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Thông tin học sinh */}
          {!isSubmitted && (
            <div className="mb-8 p-6 rounded-xl bg-blue-50 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">
                Thông tin học sinh <span className="text-red-500">*</span>
                <span className="text-sm font-normal text-blue-600 ml-2">(Bắt buộc)</span>
              </h3>
              
              {/* Attempt information - now shows unlimited */}
              {attemptInfo.current > 0 && (
                <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold">Thông tin lượt thi</span>
                  </div>
                  <p className="text-blue-600 text-sm mt-1">
                    Lần thi: <strong>{attemptInfo.current + 1}</strong> (Không giới hạn số lần)
                    {attemptInfo.current > 0 && (
                      <span className="ml-2 text-blue-500">(Bạn đã thi {attemptInfo.current} lần)</span>
                    )}
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Nhập họ và tên"
                  />
                  {!studentName.trim() && (
                    <p className="text-red-500 text-xs mt-1">Vui lòng nhập họ và tên</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lớp <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="text"
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Nhập lớp"
                  />
                  {!studentClass.trim() && (
                    <p className="text-red-500 text-xs mt-1">Vui lòng nhập lớp</p>
                  )}
                </div>
              </div>
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
                      if (isSubmitted && userAnswer) {
                        ['a', 'b', 'c', 'd'].forEach(option => {
                          const isCorrectlyAnswered = correctOptions.includes(option);
                          const userAnsweredTrue = userAnswerMap[option] === 'true';
                          const userAnsweredFalse = userAnswerMap[option] === 'false';
                          
                          // Chỉ tính điểm khi học sinh đã chọn (true hoặc false)
                          if (userAnsweredTrue || userAnsweredFalse) {
                            // Đúng khi: (đáp án đúng và chọn true) hoặc (đáp án sai và chọn false)
                            if ((isCorrectlyAnswered && userAnsweredTrue) || (!isCorrectlyAnswered && userAnsweredFalse)) {
                              questionScore += 0.25;
                            }
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
              <>
                {/* Always show retake button for unlimited attempts */}
                <button 
                  onClick={async () => {
                    try {
                      // For anonymous users, always allow retakes
                      if (!currentUser) {
                        setAttemptInfo(prev => ({...prev, current: prev.current + 1}));
                      } else {
                        // Re-check quiz attempts for authenticated users
                        const attemptCheck = await QuizSubmissionService.canStudentTakeQuiz(
                          currentUser.id,
                          title,
                          attemptInfo.max
                        );
                        
                        // Update attempt info
                        setAttemptInfo({
                          current: attemptCheck.currentAttempts,
                          max: attemptInfo.max
                        });
                      }
                      
                      // Reset quiz state for retake
                      setIsSubmitted(false);
                      setUserAnswers({});
                      setCanTakeQuiz(true);
                      
                      // Regenerate questions for retake (especially dynamic ones)
                      await regenerateQuestionsForRetake();
                      
                      // Scroll to top
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      
                      setSubmitNotification({
                        show: true,
                        type: 'success',
                        message: `Bắt đầu lần thi thứ ${currentUser ? attemptInfo.current + 1 : attemptInfo.current}`
                      });
                      setTimeout(() => {
                        setSubmitNotification(prev => ({ ...prev, show: false }));
                      }, 3000);
                      
                    } catch (error) {
                      console.error('Error setting up retake:', error);
                      setSubmitNotification({
                        show: true,
                        type: 'error',
                        message: 'Có lỗi xảy ra khi chuẩn bị thi lại. Vui lòng thử lại.'
                      });
                      setTimeout(() => {
                        setSubmitNotification(prev => ({ ...prev, show: false }));
                      }, 5000);
                    }
                  }} 
                  className="w-full sm:w-auto px-8 py-3 text-base font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Thi lại (Lần {attemptInfo.current + 1})
                </button>
              </>
            ) : (
              <button 
                onClick={handleSubmit} 
                disabled={loading || !studentName.trim() || !studentClass.trim()}
                className="w-full sm:w-auto px-8 py-3 text-base font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {loading ? 'Đang nộp bài...' : 'Nộp bài'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineExamPage;