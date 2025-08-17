import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SparklesIcon from './icons/SparklesIcon';

const Header: React.FC = () => {
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
      // Force reload to clear any stuck state
      window.location.href = '/';
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-indigo-600">
              Math<span className="text-gray-800">Bank AI</span>
            </Link>
            {!user && (
              <span className="ml-4 text-sm text-gray-500 hidden sm:inline">
                • Khách có thể làm bài thi và thi đấu
              </span>
            )}
          </div>
          
          {user && profile && (
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
                <p className="text-xs text-gray-500">
                  {profile.role === 'teacher' ? 'Giáo viên' : 
                   profile.role === 'pending_teacher' ? 'Giáo viên (chờ xác thực)' : 'Học sinh'}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;