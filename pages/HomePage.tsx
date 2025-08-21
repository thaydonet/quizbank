import React from 'react';
import { Link } from 'react-router-dom';
import BookOpenIcon from '../components/icons/BookOpenIcon';
import SparklesIcon from '../components/icons/SparklesIcon';
import PlayCircleIcon from '../components/icons/PlayCircleIcon';

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
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10"></div>
        <div className="relative container mx-auto px-6 py-8 lg:py-12">
          <div className="text-center max-w-5xl mx-auto">
            <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              Ngân Hàng Câu Hỏi
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                Toán AI
              </span>
            </h1>
            <p className="text-md lg:text-lg text-gray-600 mb-6 leading-relaxed max-w-3xl mx-auto">
              Nền tảng học tập toán học thông minh dành cho học sinh THPT
              <br />
              <span className="text-indigo-600 font-semibold">Học tập hiệu quả • Thi cử thuận tiện • Công nghệ AI</span>
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 lg:py-10 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="text-center mb-8 lg:mb-10">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              Tính năng nổi bật
            </h2>
            <p className="text-md lg:text-lg text-gray-600 max-w-3xl mx-auto">
              Hệ thống toàn diện hỗ trợ việc học và giảng dạy toán học một cách hiệu quả nhất
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Link
                key={index}
                to={feature.link}
                className="group relative bg-white rounded-2xl p-6 lg:p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 hover:border-indigo-200"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
                <div className="relative text-center">
                  <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300 flex justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    {feature.description}
                  </p>
                  <div className="flex items-center justify-center text-indigo-600 font-semibold text-sm group-hover:text-indigo-700">
                    <span>Trải nghiệm ngay</span>
                    <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;