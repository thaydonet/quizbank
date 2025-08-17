import React from 'react';
import { Link } from 'react-router-dom';
import BookOpenIcon from '../components/icons/BookOpenIcon';
import SparklesIcon from '../components/icons/SparklesIcon';
import PlayCircleIcon from '../components/icons/PlayCircleIcon';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';

const HomePage: React.FC = () => {
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
      icon: <CheckCircleIcon className="w-12 h-12 text-orange-600" />,
      title: "Exam Group",
      description: "Tạo nhóm thi cho học sinh, quản lý bài thi và theo dõi kết quả real-time",
      link: "/exam-group",
      color: "from-orange-500 to-red-600"
    }
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

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center text-white">
            <div className="transform hover:scale-105 transition-transform duration-300">
              <div className="text-4xl sm:text-5xl font-bold mb-2">1000+</div>
              <div className="text-lg opacity-90">Câu hỏi chất lượng</div>
            </div>
            <div className="transform hover:scale-105 transition-transform duration-300">
              <div className="text-4xl sm:text-5xl font-bold mb-2">3</div>
              <div className="text-lg opacity-90">Khối lớp THPT</div>
            </div>
            <div className="transform hover:scale-105 transition-transform duration-300">
              <div className="text-4xl sm:text-5xl font-bold mb-2">AI</div>
              <div className="text-lg opacity-90">Công nghệ tiên tiến</div>
            </div>
            <div className="transform hover:scale-105 transition-transform duration-300">
              <div className="text-4xl sm:text-5xl font-bold mb-2">24/7</div>
              <div className="text-lg opacity-90">Hỗ trợ học tập</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Sẵn sàng bắt đầu?
            </h2>
            <p className="text-xl text-gray-600 mb-12">
              Tham gia cùng hàng nghìn học sinh và giáo viên đang sử dụng nền tảng của chúng tôi
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/quiz-bank"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Bắt đầu học ngay
              </Link>
              <Link
                to="/exam-group"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-indigo-600 bg-indigo-50 border-2 border-indigo-200 rounded-xl hover:bg-indigo-100 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Tạo nhóm thi
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;