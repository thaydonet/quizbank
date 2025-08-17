import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PlayCircleIcon from '../components/icons/PlayCircleIcon';
import BookOpenIcon from '../components/icons/BookOpenIcon';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';

const StudentDashboard: React.FC = () => {
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
      // Force reload to clear any stuck state
      window.location.href = '/';
    }
  };

  const features = [
    {
      title: "Thi Online",
      description: "Tham gia các bài thi trực tuyến và kiểm tra kiến thức",
      icon: <PlayCircleIcon className="w-8 h-8" />,
      link: "/online-exam",
      color: "from-green-500 to-emerald-600"
    },
    {
      title: "Ngân hàng câu hỏi",
      description: "Luyện tập với kho câu hỏi toán học phong phú",
      icon: <BookOpenIcon className="w-8 h-8" />,
      link: "/quiz-bank",
      color: "from-blue-500 to-indigo-600"
    },
    {
      title: "Tham gia nhóm",
      description: "Tham gia lớp học và thi đấu với bạn bè",
      icon: <CheckCircleIcon className="w-8 h-8" />,
      link: "/student/groups",
      color: "from-purple-500 to-violet-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-indigo-600">
              Math<span className="text-gray-800">Bank AI</span>
            </h1>
            <p className="text-sm text-gray-600">Dashboard Học sinh</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-semibold text-gray-900">{profile?.full_name}</p>
              <p className="text-sm text-gray-600">{profile?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Chào mừng, {profile?.full_name}!
          </h2>
          <p className="text-xl text-gray-600">
            Bắt đầu hành trình học tập toán học của bạn
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.link}
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 hover:border-indigo-200"
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-r ${feature.color} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                {feature.description}
              </p>
              <div className="flex items-center text-indigo-600 font-semibold group-hover:text-indigo-700">
                <span>Bắt đầu</span>
                <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Hoạt động gần đây</h3>
          <div className="text-center py-12 text-gray-500">
            <PlayCircleIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Chưa có hoạt động nào. Hãy bắt đầu làm bài thi đầu tiên!</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Thống kê của bạn</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="text-3xl font-bold text-green-600 mb-2">0</div>
              <div className="text-sm text-gray-600">Bài thi hoàn thành</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
              <div className="text-sm text-gray-600">Điểm trung bình</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="text-3xl font-bold text-purple-600 mb-2">0</div>
              <div className="text-sm text-gray-600">Nhóm tham gia</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <div className="text-3xl font-bold text-orange-600 mb-2">0</div>
              <div className="text-sm text-gray-600">Thứ hạng</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;