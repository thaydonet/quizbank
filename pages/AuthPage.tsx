import React, { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
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