import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BattleService, type BattleRoom, type BattleParticipant } from '../services/battleService';
import { useAuth } from '../contexts/AuthContext';
import MathContent from '../components/MathContent';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Question } from '../types';

const BattleRoomPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [room, setRoom] = useState<BattleRoom | null>(null);
  const [participants, setParticipants] = useState<BattleParticipant[]>([]);
  const [currentParticipant, setCurrentParticipant] = useState<BattleParticipant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [guestName, setGuestName] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);
  
  // Battle state
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{ isCorrect: boolean; points: number } | null>(null);
  const [totalTime, setTotalTime] = useState(0);
  const [battleFinished, setBattleFinished] = useState(false);

  useEffect(() => {
    if (roomCode) {
      loadRoomData();
      setupRealtimeSubscription();
    }
  }, [roomCode]);

  useEffect(() => {
    if (room?.status === 'active' && room.quiz?.questions) {
      const questionIndex = room.current_question_index;
      if (questionIndex < room.quiz.questions.length) {
        setCurrentQuestion(room.quiz.questions[questionIndex]);
        setCurrentQuestionIndex(questionIndex);
        setTimeLeft(room.question_time_limit);
        setIsAnswered(false);
        setShowResult(false);
        setSelectedAnswer('');

        // Tính tổng thời gian battle
        const totalQuestions = room.quiz.questions.length;
        const timePerQuestion = room.question_time_limit;
        setTotalTime(totalQuestions * timePerQuestion);
      }
    }
  }, [room?.current_question_index, room?.status]);

  // Timer tổng cho battle
  useEffect(() => {
    if (room?.status === 'active' && totalTime > 0 && !battleFinished) {
      const timer = setTimeout(() => {
        setTotalTime(prev => {
          if (prev <= 1) {
            setBattleFinished(true);
            alert('⏰ Hết thời gian thi đấu! Đang tổng kết điểm...');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [room?.status, totalTime, battleFinished]);

  // Timer countdown
  useEffect(() => {
    if (room?.status === 'active' && timeLeft > 0 && !isAnswered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswered) {
      // Auto submit when time runs out
      handleTimeUp();
    }
  }, [timeLeft, isAnswered, room?.status]);

  const handleTimeUp = async () => {
    if (!room || !currentParticipant || !currentQuestion || isAnswered) return;

    setIsAnswered(true);
    const timeTaken = room.question_time_limit * 1000; // Full time taken

    try {
      const result = await BattleService.submitAnswer(
        room.id,
        currentParticipant.id,
        currentQuestionIndex,
        currentQuestion.id,
        '', // Empty answer for timeout
        timeTaken,
        currentQuestion.correct_option
      );

      setLastResult({ isCorrect: false, points: 0 });
      setShowResult(true);

      // Auto move to next question after 3 seconds
      setTimeout(() => {
        setShowResult(false);
        moveToNextQuestion();
      }, 3000);

    } catch (error) {
      console.error('Error submitting timeout answer:', error);
    }
  };

  const moveToNextQuestion = async () => {
    if (!room || !room.quiz?.questions) {
      console.log('Cannot move to next question: missing room or questions');
      return;
    }

    const nextIndex = currentQuestionIndex + 1;
    console.log(`Moving from question ${currentQuestionIndex} to ${nextIndex}`);
    console.log(`Total questions: ${room.quiz.questions.length}`);

    if (nextIndex < room.quiz.questions.length) {
      // Update database first
      try {
        await BattleService.updateQuestionIndex(room.id, nextIndex);

        // Then update local state
        setCurrentQuestionIndex(nextIndex);
        setCurrentQuestion(room.quiz.questions[nextIndex]);
        setTimeLeft(room.question_time_limit);
        setIsAnswered(false);
        setShowResult(false);
        setSelectedAnswer('');
        console.log('Moved to next question:', room.quiz.questions[nextIndex]);
      } catch (error) {
        console.error('Error updating question index:', error);
      }
    } else {
      // Battle finished
      console.log('Battle finished');
      try {
        await BattleService.finishBattle(room.id);
      } catch (error) {
        console.error('Error finishing battle:', error);
      }
      alert('🎉 Thi đấu kết thúc! Xem kết quả cuối cùng.');
    }
  };

  const loadRoomData = async () => {
    if (!roomCode) return;
    
    setLoading(true);
    try {
      const { room: roomData, participants: participantsData } = await BattleService.getBattleRoomInfo(roomCode);
      
      if (!roomData) {
        setError('Không tìm thấy phòng thi đấu');
        return;
      }
      
      setRoom(roomData);
      setParticipants(participantsData);
      
      // Find current participant
      const participant = participantsData.find(p => p.user_id === user?.id);
      setCurrentParticipant(participant || null);

      // Nếu chưa đăng nhập và chưa tham gia, hiển thị form guest
      if (!user && !participant) {
        setShowGuestForm(true);
      }
      
    } catch (error) {
      console.error('Error loading room data:', error);
      setError('Có lỗi xảy ra khi tải dữ liệu phòng');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!roomCode) return;

    try {
      const subscription = BattleService.subscribeToRoom(roomCode, (payload) => {
        console.log('Realtime update:', payload);
        // Debounce để tránh reload quá nhiều
        setTimeout(() => {
          loadRoomData();
        }, 500);
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!room || !currentParticipant || !currentQuestion || isAnswered || !selectedAnswer) return;

    setIsAnswered(true);
    const timeTaken = (room.question_time_limit - timeLeft) * 1000;

    try {
      const result = await BattleService.submitAnswer(
        room.id,
        currentParticipant.id,
        currentQuestionIndex,
        currentQuestion.id,
        selectedAnswer,
        timeTaken,
        currentQuestion.correct_option
      );

      setLastResult({ isCorrect: result.isCorrect, points: result.points });
      setShowResult(true);

      // Auto move to next question after 3 seconds
      setTimeout(() => {
        setShowResult(false);
        moveToNextQuestion();
      }, 3000);

    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleStartBattle = async () => {
    if (!room || profile?.role !== 'teacher') return;

    const success = await BattleService.startBattle(room.id);
    if (success) {
      loadRoomData();
    }
  };

  const handleJoinAsGuest = async () => {
    if (!room || !guestName.trim()) return;

    try {
      const participant = await BattleService.joinBattleRoom(room.room_code, guestName.trim());
      if (participant) {
        setCurrentParticipant(participant);
        setShowGuestForm(false);
        loadRoomData();
      }
    } catch (error) {
      console.error('Error joining as guest:', error);
      setError('Không thể tham gia phòng thi đấu');
    }
  };

  if (loading) {
    return (
      <LoadingSpinner
        message="Đang tải phòng thi đấu..."
        timeout={8000}
        onTimeout={() => {
          console.warn('Battle room loading timeout');
          setError('Tải phòng thi đấu quá lâu. Vui lòng thử lại.');
          setLoading(false);
        }}
      />
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Lỗi</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  // Guest Form Modal
  if (showGuestForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tham gia thi đấu</h2>
            <p className="text-gray-600">Nhập tên của bạn để tham gia phòng thi đấu</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên hiển thị
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Nhập tên của bạn..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={50}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Về trang chủ
            </button>
            <button
              onClick={handleJoinAsGuest}
              disabled={!guestName.trim()}
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Tham gia
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{room.title}</h1>
              <div className="text-3xl font-bold text-red-600 mt-2">
                Mã phòng: {room.room_code}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Người dùng</div>
              <div className="font-semibold text-gray-900">
                {user ? (profile?.full_name || user.email) : 'Khách'}
              </div>
              <button
                onClick={() => navigate('/')}
                className="mt-2 px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                🏠 Về Home
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {room.status === 'waiting' && (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Chờ bắt đầu thi đấu</h2>
                <p className="text-gray-600 mb-6">
                  Đang chờ giáo viên bắt đầu cuộc thi đấu...
                </p>
                
                {profile?.role === 'teacher' && room.created_by === user?.id && (
                  <button
                    onClick={handleStartBattle}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    🚀 Bắt đầu thi đấu
                  </button>
                )}
              </div>
            )}

            {room.status === 'active' && currentQuestion && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                {/* Question Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="text-sm text-gray-600">
                    Câu {currentQuestionIndex + 1} / {room.quiz?.questions.length}
                  </div>
                  <div className={`text-2xl font-bold ${timeLeft <= 5 ? 'text-red-600' : 'text-blue-600'}`}>
                    ⏱️ {timeLeft}s
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${(timeLeft / room.question_time_limit) * 100}%` }}
                  ></div>
                </div>

                {/* Question */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    <MathContent content={currentQuestion.question} />
                  </h2>

                  {/* Answer Options */}
                  {currentQuestion.type === 'mcq' && (
                    <div className="space-y-3">
                      {['A', 'B', 'C', 'D'].map((option) => {
                        const optionText = currentQuestion[`option_${option.toLowerCase()}` as keyof Question] as string;
                        if (!optionText || optionText.trim() === '') return null;

                        return (
                          <button
                            key={option}
                            onClick={() => !isAnswered && setSelectedAnswer(option)}
                            disabled={isAnswered}
                            className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                              selectedAnswer === option
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            } ${isAnswered ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                          >
                            <span className="font-semibold text-blue-600 mr-3">{option}.</span>
                            <MathContent content={optionText} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                {!isAnswered && selectedAnswer && timeLeft > 0 && (
                  <button
                    onClick={handleSubmitAnswer}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    ✅ Gửi đáp án
                  </button>
                )}

                {/* Waiting for answer */}
                {!isAnswered && !selectedAnswer && timeLeft > 0 && (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Chọn đáp án để tiếp tục...</p>
                  </div>
                )}

                {/* Time up message */}
                {timeLeft === 0 && !showResult && (
                  <div className="text-center py-4">
                    <p className="text-red-600 font-semibold">⏰ Hết giờ! Đang chuyển câu tiếp theo...</p>
                  </div>
                )}

                {/* Result */}
                {showResult && lastResult && (
                  <div className={`mt-6 p-4 rounded-lg text-center ${
                    lastResult.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className={`text-2xl font-bold mb-2 ${
                      lastResult.isCorrect ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {lastResult.isCorrect ? '✅ Chính xác!' : '❌ Sai rồi!'}
                    </div>
                    <div className="text-lg mb-3">
                      +{lastResult.points} điểm
                    </div>
                    <div className="text-sm text-gray-600">
                      Đang chuyển sang câu tiếp theo...
                    </div>
                    <button
                      onClick={() => {
                        setShowResult(false);
                        moveToNextQuestion();
                      }}
                      className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      ⏭️ Tiếp tục
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              🏆 Bảng xếp hạng
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({participants.length} người)
              </span>
            </h3>
            
            <div className="space-y-3">
              {participants
                .sort((a, b) => b.total_score - a.total_score)
                .map((participant, index) => (
                  <div
                    key={participant.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      participant.id === currentParticipant?.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        index === 2 ? 'bg-orange-400 text-orange-900' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {participant.display_name}
                          {participant.id === currentParticipant?.id && (
                            <span className="ml-2 text-xs text-blue-600">(Bạn)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {participant.correct_answers}/{participant.questions_answered} đúng
                          {participant.current_streak > 0 && (
                            <span className="ml-2 text-orange-600">🔥{participant.current_streak}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-gray-900">
                        {participant.total_score}
                      </div>
                      <div className="text-xs text-gray-500">điểm</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattleRoomPage;
