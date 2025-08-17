import React, { useState, useEffect } from 'react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'success', 
  duration = 3000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-sm w-full
      transform transition-all duration-300 ease-in-out
      ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `}>
      <div className={`
        flex items-center p-4 rounded-lg border shadow-lg
        ${getColors()}
      `}>
        <span className="text-lg mr-3">{getIcon()}</span>
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose?.(), 300);
          }}
          className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Toast Manager
class ToastManager {
  private static toasts: ToastProps[] = [];
  private static listeners: ((toasts: ToastProps[]) => void)[] = [];

  static show(toast: Omit<ToastProps, 'onClose'>) {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastProps = {
      ...toast,
      onClose: () => this.remove(id)
    };

    this.toasts.push({ ...newToast, message: `${id}:${newToast.message}` });
    this.notifyListeners();

    return id;
  }

  static remove(id: string) {
    this.toasts = this.toasts.filter(toast => !toast.message.startsWith(`${id}:`));
    this.notifyListeners();
  }

  static subscribe(listener: (toasts: ToastProps[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notifyListeners() {
    this.listeners.forEach(listener => listener(this.toasts));
  }
}

// Toast Container Component
export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  useEffect(() => {
    const unsubscribe = ToastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => {
        const [id, message] = toast.message.split(':', 2);
        return (
          <Toast
            key={id}
            {...toast}
            message={message}
          />
        );
      })}
    </div>
  );
};

// Helper functions
export const showToast = {
  success: (message: string, duration?: number) => 
    ToastManager.show({ message, type: 'success', duration }),
  
  error: (message: string, duration?: number) => 
    ToastManager.show({ message, type: 'error', duration }),
  
  warning: (message: string, duration?: number) => 
    ToastManager.show({ message, type: 'warning', duration }),
  
  info: (message: string, duration?: number) => 
    ToastManager.show({ message, type: 'info', duration }),
};

export default Toast;
