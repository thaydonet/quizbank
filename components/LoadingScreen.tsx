import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  message?: string;
  showTimeout?: boolean;
  onTimeout?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Đang tải...", 
  showTimeout = true,
  onTimeout 
}) => {
  const [showTimeoutButton, setShowTimeoutButton] = useState(false);
  const [dots, setDots] = useState('');

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Timeout button
  useEffect(() => {
    if (showTimeout) {
      const timer = setTimeout(() => {
        setShowTimeoutButton(true);
      }, 3000); // Show timeout button after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [showTimeout]);

  const handleTimeout = () => {
    if (onTimeout) {
      onTimeout();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        {/* Spinner */}
        <div className="relative mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
          <div className="absolute inset-0 rounded-full border-2 border-indigo-200"></div>
        </div>
        
        {/* Message */}
        <p className="text-gray-700 text-lg font-medium mb-2">
          {message}{dots}
        </p>
        
        <p className="text-gray-500 text-sm mb-6">
          Vui lòng đợi trong giây lát
        </p>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-1 mb-6">
          <div className="bg-indigo-600 h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
        </div>
        
        {/* Timeout button */}
        {showTimeoutButton && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm mb-3">
              ⚠️ Tải dữ liệu mất nhiều thời gian hơn bình thường
            </p>
            <button
              onClick={handleTimeout}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
            >
              🔄 Tải lại trang
            </button>
          </div>
        )}

        {/* Tips */}
        <div className="mt-6 text-xs text-gray-400">
          <p>💡 Mẹo: Kiểm tra kết nối internet nếu tải quá lâu</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
