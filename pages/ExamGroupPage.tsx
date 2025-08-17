import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';
import SparklesIcon from '../components/icons/SparklesIcon';
import PlayCircleIcon from '../components/icons/PlayCircleIcon';

const ExamGroupPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'teacher' | 'student'>('student');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100">
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
              <CheckCircleIcon className="w-20 h-20 text-orange-600 mx-auto mb-6" />
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
              Exam Group
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
                Real-time
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              Tạo và quản lý nhóm thi cho học sinh với theo dõi kết quả real-time
              <br />
              <span className="text-orange-600 font-semibold">Quản lý dễ dàng • Theo dõi real-time • Báo cáo chi tiết</span>
            </p>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="py-8 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-xl p-2 shadow-lg border border-gray-200">
              <button
                onClick={() => setActiveTab('student')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === 'student'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-orange-600'
                }`}
              >
                Dành cho Học sinh
              </button>
              <button
                onClick={() => setActiveTab('teacher')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === 'teacher'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-orange-600'
                }`}
              >
                Dành cho Giáo viên
              </button>
            </div>
          </div>

          {/* Student Tab */}
          {activeTab === 'student' && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Tham gia bài thi nhóm
                </h2>
                <p className="text-lg text-gray-600">
                  Nhập mã bài thi do giáo viên cung cấp để tham gia
                </p>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 mb-8">
                <div className="max-w-md mx-auto">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Mã bài thi
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Nhập mã bài thi (VD: ABC123)"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-center text-lg font-mono uppercase"
                      maxLength={6}
                    />
                    <button className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                      Tham gia
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-orange-600">1</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Nhập mã</h3>
                  <p className="text-sm text-gray-600">Nhập mã bài thi do giáo viên cung cấp</p>
                </div>
                <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-orange-600">2</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Làm bài</h3>
                  <p className="text-sm text-gray-600">Hoàn thành bài thi trong thời gian quy định</p>
                </div>
                <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-orange-600">3</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Xem kết quả</h3>
                  <p className="text-sm text-gray-600">Nhận kết quả và lời giải chi tiết</p>
                </div>
              </div>
            </div>
          )}

          {/* Teacher Tab */}
          {activeTab === 'teacher' && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Quản lý bài thi nhóm
                </h2>
                <p className="text-lg text-gray-600">
                  Tạo và quản lý bài thi cho học sinh của bạn
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                  <div className="text-center">
                    <SparklesIcon className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Tạo bài thi mới</h3>
                    <p className="text-gray-600 mb-6">
                      Tạo bài thi từ ngân hàng câu hỏi hoặc tự tạo câu hỏi
                    </p>
                    <button className="w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                      Tạo bài thi
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                  <div className="text-center">
                    <CheckCircleIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Quản lý bài thi</h3>
                    <p className="text-gray-600 mb-6">
                      Xem danh sách bài thi và theo dõi kết quả real-time
                    </p>
                    <button className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                      Xem bài thi
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
                  Tính năng dành cho giáo viên
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <PlayCircleIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Theo dõi real-time</h4>
                    <p className="text-sm text-gray-600">Xem học sinh làm bài trực tiếp</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Chấm tự động</h4>
                    <p className="text-sm text-gray-600">Hệ thống chấm điểm tự động</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <SparklesIcon className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Báo cáo chi tiết</h4>
                    <p className="text-sm text-gray-600">Thống kê kết quả học tập</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Giới hạn thời gian</h4>
                    <p className="text-sm text-gray-600">Thiết lập thời gian làm bài</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-red-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Bắt đầu sử dụng Exam Group
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Tạo trải nghiệm thi cử hiện đại cho học sinh của bạn
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="inline-flex items-center px-8 py-4 text-lg font-semibold text-orange-600 bg-white rounded-xl hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
              <SparklesIcon className="w-6 h-6 mr-3" />
              Tạo bài thi ngay
            </button>
            <Link
              to="/"
              className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white border-2 border-white rounded-xl hover:bg-white hover:text-orange-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ExamGroupPage;