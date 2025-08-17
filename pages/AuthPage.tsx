import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      {/* Home Button */}
      <Link
        to="/"
        className="fixed top-4 left-4 z-10 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-lg hover:bg-white hover:text-indigo-600 transition-all shadow-lg"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Về trang chủ
      </Link>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="text-center lg:text-left">
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Math<span className="text-indigo-600">Bank</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              AI
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Nền tảng học tập toán học thông minh dành cho học sinh và giáo viên THPT
          </p>
          
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
              <span className="text-gray-700">Ngân hàng câu hỏi phong phú</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              <span className="text-gray-700">Tạo câu hỏi bằng AI</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-gray-700">Thi online và thi đấu nhóm</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <span className="text-gray-700">Quản lý lớp học hiệu quả</span>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="w-full">
          {isLogin ? (
            <LoginForm onToggleMode={toggleMode} />
          ) : (
            <RegisterForm onToggleMode={toggleMode} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;