import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PlayCircleIcon from '../components/icons/PlayCircleIcon';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';
import BookOpenIcon from '../components/icons/BookOpenIcon';
import { QuizService, type SavedQuiz } from '../services/quizService';

const OnlineExamLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>([]);

  useEffect(() => {
    setSavedQuizzes(QuizService.getAllQuizzes());
  }, []);

  const handleStartQuiz = (quiz: SavedQuiz) => {
    navigate('/exam', { 
      state: { 
        questions: quiz.questions, 
        title: quiz.title,
        quizId: quiz.id
      } 
    });
  };

  const handleDeleteQuiz = (quizId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa đề thi này?')) {
      QuizService.deleteQuiz(quizId);
      setSavedQuizzes(QuizService.getAllQuizzes());
    }
  };

  const examTypes = [
    {
      title: "Thi từ Ngân hàng câu hỏi",
      description: "Chọn câu hỏi từ kho đề sẵn có và thi ngay",
      icon: <BookOpenIcon className="w-8 h-8" />,
      link: "/quiz-bank",
      color: "from-blue-500 to-indigo-600"
    },
    {
      title: "Thi theo nhóm",
      description: "Tham gia các bài thi được tạo bởi giáo viên",
      icon: <CheckCircleIcon className="w-8 h-8" />,
      link: "/exam-group",
      color: "from-green-500 to-emerald-600"
    }
  ];

  const features = [
    "Giao diện thân thiện, dễ sử dụng",
    "Chấm điểm tự động và chính xác",
    "Kết quả chi tiết với lời giải",
    "Hỗ trợ LaTeX cho công thức toán",
    "Lưu lịch sử bài thi",
    "Thống kê tiến độ học tập"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="text-2xl font-bold text-indigo-600">
            Math<span className="text-gray-800">Bank AI</span>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <PlayCircleIcon className="w-20 h-20 text-green-600 mx-auto mb-6" />
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
              Thi Online
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
                Toán THPT
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              Hệ thống thi trực tuyến hiện đại với công nghệ chấm điểm tự động
              <br />
              <span className="text-green-600 font-semibold">Nhanh chóng • Chính xác • Tiện lợi</span>
            </p>
          </div>
        </div>
      </section>

      {/* Exam Types */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Chọn hình thức thi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {examTypes.map((type, index) => (
              <Link
                key={index}
                to={type.link}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 hover:border-green-200"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-r ${type.color} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {type.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors duration-300">
                  {type.title}
                </h3>
                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  {type.description}
                </p>
                <div className="flex items-center text-green-600 font-semibold group-hover:text-green-700">
                  <span>Bắt đầu thi</span>
                  <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Tính năng nổi bật
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Saved Quizzes */}
      {savedQuizzes.length > 0 && (
        <section className="py-16 bg-white/30 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-gray-900">
                  Đề thi đã tạo ({savedQuizzes.length})
                </h2>
                <button
                  onClick={() => {
                    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả đề thi đã lưu?')) {
                      QuizService.clearAllQuizzes();
                      setSavedQuizzes([]);
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Xóa tất cả
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer group"
                    onClick={() => handleStartQuiz(quiz)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                          {quiz.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-3">
                          {new Date(quiz.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteQuiz(quiz.id, e)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Xóa đề thi"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Tổng số câu:</span>
                        <span className="font-semibold text-gray-900">{quiz.questionCount}</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {quiz.mcqCount > 0 && (
                          <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-center">
                            TN: {quiz.mcqCount}
                          </div>
                        )}
                        {quiz.msqCount > 0 && (
                          <div className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-center">
                            Đ-S: {quiz.msqCount}
                          </div>
                        )}
                        {quiz.saCount > 0 && (
                          <div className="bg-amber-50 text-amber-700 px-2 py-1 rounded text-center">
                            TLN: {quiz.saCount}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center pt-4 border-t border-gray-100">
                      <div className="flex items-center text-indigo-600 font-semibold group-hover:text-indigo-700">
                        <PlayCircleIcon className="w-5 h-5 mr-2" />
                        <span>Bắt đầu thi</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Sẵn sàng kiểm tra kiến thức?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Bắt đầu bài thi đầu tiên của bạn ngay hôm nay
          </p>
          <Link
            to="/quiz-bank"
            className="inline-flex items-center px-8 py-4 text-lg font-semibold text-green-600 bg-white rounded-xl hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <PlayCircleIcon className="w-6 h-6 mr-3" />
            Tạo đề thi mới
          </Link>
        </div>
      </section>
    </div>
  );
};

export default OnlineExamLandingPage;