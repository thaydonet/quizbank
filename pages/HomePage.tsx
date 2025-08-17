import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BookOpenIcon from '../components/icons/BookOpenIcon';
import SparklesIcon from '../components/icons/SparklesIcon';
import PlayCircleIcon from '../components/icons/PlayCircleIcon';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabase';

interface PublicQuiz {
  id: string;
  title: string;
  slug: string;
  questions: any[];
  created_at: string;
  created_by: string;
}

const HomePage: React.FC = () => {
  const [publicQuizzes, setPublicQuizzes] = useState<PublicQuiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPublicQuizzes();
  }, []);

  const loadPublicQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, title, slug, questions, created_at, created_by')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Error loading public quizzes:', error);
      } else {
        setPublicQuizzes(data || []);
      }
    } catch (error) {
      console.error('Error loading public quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <BookOpenIcon className="w-12 h-12 text-indigo-600" />,
      title: "Ngân hàng Quiz Toán",
      description: "Kho tàng câu hỏi toán học phong phú từ lớp 10-12, được phân loại theo chủ đề và độ khó",
      link: "/quiz-bank",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: <PlayCircleIcon className="w-12 h-12 text-green-600" />,
      title: "Thi Online",
      description: "Hệ thống thi trực tuyến với giao diện thân thiện, chấm điểm tự động và kết quả chi tiết",
      link: "/online-exam",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: <SparklesIcon className="w-12 h-12 text-purple-600" />,
      title: "Tạo câu hỏi từ AI",
      description: "Công nghệ AI tiên tiến giúp tạo câu hỏi toán học chất lượng cao theo yêu cầu",
      link: "/create",
      color: "from-purple-500 to-violet-600"
    },
    {
      icon: <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>,
      title: "Thi đấu Realtime",
      description: "Tham gia các cuộc thi đấu trực tiếp với bạn bè, cạnh tranh và học tập cùng nhau (không cần đăng nhập)",
      link: "/battle/join",
      color: "from-red-500 to-pink-600"
    },

  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10"></div>
        <div className="relative container mx-auto px-4 py-20 sm:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl sm:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Ngân Hàng Câu Hỏi
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                Toán AI
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-12 leading-relaxed">
              Nền tảng học tập toán học thông minh dành cho học sinh THPT
              <br />
              <span className="text-indigo-600 font-semibold">Học tập hiệu quả • Thi cử thuận tiện • Công nghệ AI</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/quiz-bank"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <BookOpenIcon className="w-6 h-6 mr-3" />
                Khám phá ngay
              </Link>
              <Link
                to="/create"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-indigo-600 bg-white border-2 border-indigo-600 rounded-xl hover:bg-indigo-50 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <SparklesIcon className="w-6 h-6 mr-3" />
                Tạo câu hỏi AI
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Tính năng nổi bật
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hệ thống toàn diện hỗ trợ việc học và giảng dạy toán học một cách hiệu quả nhất
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Link
                key={index}
                to={feature.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 hover:border-indigo-200"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
                <div className="relative">
                  <div className="mb-6 transform group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="mt-6 flex items-center text-indigo-600 font-semibold group-hover:text-indigo-700">
                    <span>Trải nghiệm ngay</span>
                    <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>



      {/* Public Quizzes Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              🎯 Quiz Mới Nhất
            </h2>
            <p className="text-lg text-gray-600">
              Thử sức với những đề thi mới nhất từ các giáo viên
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : publicQuizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {publicQuizzes.map((quiz) => (
                <div key={quiz.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                          {quiz.title}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {quiz.questions?.length || 0} câu hỏi
                        </div>
                        <div className="flex items-center text-xs text-gray-400 mb-4">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {new Date(quiz.created_at).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </div>

                    <Link
                      to={`/quiz/${quiz.slug}`}
                      className="block w-full text-center px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <PlayCircleIcon className="w-4 h-4 inline mr-2" />
                      Làm bài ngay
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500">Chưa có quiz công khai nào</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Sẵn sàng bắt đầu?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Tham gia ngay để trải nghiệm học toán hiệu quả
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/auth"
                className="inline-flex items-center px-6 py-3 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Đăng nhập
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center px-6 py-3 text-lg font-semibold text-indigo-600 bg-indigo-50 border-2 border-indigo-200 rounded-lg hover:bg-indigo-100 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Đăng ký
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;