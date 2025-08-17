import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthPage from '../pages/AuthPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'teacher' | 'student';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthPage />;
  }

  if (requiredRole && profile.role !== requiredRole) {
    // Nếu yêu cầu teacher nhưng user là pending_teacher
    if (requiredRole === 'teacher' && profile.role === 'pending_teacher') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg mb-4">
              <h2 className="text-lg font-semibold mb-2">Tài khoản chờ xác thực</h2>
              <p>Bạn cần xác thực bằng mã giáo viên để truy cập tính năng này.</p>
            </div>
            <p className="text-gray-600 mb-4">
              Trạng thái: <span className="font-semibold text-yellow-600">Chờ xác thực giáo viên</span>
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
            >
              Về trang xác thực
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            <h2 className="text-lg font-semibold mb-2">Không có quyền truy cập</h2>
            <p>Bạn cần quyền {requiredRole === 'teacher' ? 'Giáo viên' : 'Học sinh'} để truy cập trang này.</p>
          </div>
          <p className="text-gray-600">
            Vai trò hiện tại: <span className="font-semibold">
              {profile.role === 'teacher' ? 'Giáo viên' : 
               profile.role === 'pending_teacher' ? 'Giáo viên (chờ xác thực)' : 'Học sinh'}
            </span>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;