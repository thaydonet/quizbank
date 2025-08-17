import React, { useState, useEffect } from 'react';

interface LoadingSpinnerProps {
  message?: string;
  timeout?: number; // milliseconds
  onTimeout?: () => void;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Đang tải...", 
  timeout = 10000,
  onTimeout 
}) => {
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);

  useEffect(() => {
    if (timeout > 0) {
      const timer = setTimeout(() => {
        setShowTimeoutMessage(true);
        if (onTimeout) {
          onTimeout();
        }
      }, timeout);

      return () => clearTimeout(timer);
    }
  }, [timeout, onTimeout]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg mb-4">{message}</p>
        
        {showTimeoutMessage && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <p className="text-yellow-800 text-sm mb-3">
              ⚠️ Tải dữ liệu mất nhiều thời gian hơn bình thường
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
            >
              🔄 Tải lại trang
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
