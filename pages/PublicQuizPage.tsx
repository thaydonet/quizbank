import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QuizService, type SavedQuiz } from '../services/quizService';
import PlayCircleIcon from '../components/icons/PlayCircleIcon';
import BookOpenIcon from '../components/icons/BookOpenIcon';

const PublicQuizPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<SavedQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadQuiz(slug);
    }
  }, [slug]);

  const loadQuiz = async (quizSlug: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const quizData = await QuizService.getQuizBySlug(quizSlug);
      if (quizData) {
        setQuiz(quizData);
      } else {
        setError('Không tìm thấy đề thi này.');
      }
    } catch (err) {
      console.error('Error loading quiz:', err);
      setError('Có lỗi xảy ra khi tải đề thi.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = () => {
    if (quiz) {
      navigate('/exam', {
        state: {
          questions: quiz.questions,
          title: quiz.title,
          quizId: quiz.id,
          isPublic: true // Đánh dấu là quiz public
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Đang tải đề thi...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-rose-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpenIcon className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Không tìm thấy đề thi</h1>
          <p className="text-gray-600 mb-8">{error || 'Đề thi này có thể đã bị xóa hoặc không tồn tại.'}</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/')}
            className="text-2xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Math<span className="text-gray-800">Bank AI</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Quiz Info Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <PlayCircleIcon className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{quiz.title}</h1>
              {quiz.description && (
                <p className="text-lg text-gray-600 mb-6">{quiz.description}</p>
              )}
            </div>

            {/* Quiz Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900">{quiz.questionCount}</div>
                <div className="text-sm text-gray-600">Tổng số câu</div>
              </div>
              
              {quiz.mcqCount > 0 && (
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-700">{quiz.mcqCount}</div>
                  <div className="text-sm text-blue-600">Trắc nghiệm</div>
                </div>
              )}
              
              {quiz.msqCount > 0 && (
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <div className="text-2xl font-bold text-purple-700">{quiz.msqCount}</div>
                  <div className="text-sm text-purple-600">Đúng/Sai</div>
                </div>
              )}
              
              {quiz.saCount > 0 && (
                <div className="text-center p-4 bg-amber-50 rounded-xl">
                  <div className="text-2xl font-bold text-amber-700">{quiz.saCount}</div>
                  <div className="text-sm text-amber-600">Tự luận</div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">📋 Hướng dẫn làm bài</h3>
              <ul className="space-y-2 text-blue-800">
                <li>• Đọc kỹ đề bài trước khi chọn đáp án</li>
                <li>• Có thể thay đổi đáp án trước khi nộp bài</li>
                <li>• Bấm "Nộp bài" khi hoàn thành</li>
                <li>• Kết quả sẽ hiển thị ngay sau khi nộp</li>
              </ul>
            </div>

            {/* Start Button */}
            <div className="text-center">
              <button
                onClick={handleStartQuiz}
                className="inline-flex items-center px-8 py-4 text-xl font-bold text-white bg-gradient-to-r from-green-600 to-blue-600 rounded-xl hover:from-green-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <PlayCircleIcon className="w-6 h-6 mr-3" />
                Bắt đầu làm bài
              </button>
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-center text-gray-500">
            <p className="text-sm">
              Đề thi được tạo bởi <strong>MathBank AI</strong> • 
              Tạo lúc: {new Date(quiz.created_at).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicQuizPage;
