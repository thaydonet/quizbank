import React, { useState } from 'react';
import { TeacherVerificationService } from '../../services/teacherVerificationService';

interface TeacherVerificationFormProps {
  onVerificationSuccess: () => void;
}

const TeacherVerificationForm: React.FC<TeacherVerificationFormProps> = ({ onVerificationSuccess }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) return;

    setLoading(true);
    setMessage(null);

    const result = await TeacherVerificationService.verifyTeacherWithCode(verificationCode.trim());
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      setTimeout(() => {
        onVerificationSuccess();
      }, 2000);
    } else {
      setMessage({ type: 'error', text: result.message });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Xác thực giáo viên</h2>
          <p className="text-gray-600">
            Nhập mã xác thực do trường học cung cấp để trở thành giáo viên
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {message && (
            <div className={`p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <div>
            <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
              Mã xác thực giáo viên
            </label>
            <input
              id="verificationCode"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors font-mono text-center text-lg"
              placeholder="Nhập mã xác thực"
              maxLength={20}
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              Liên hệ với trường học hoặc quản trị viên để nhận mã xác thực
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Đang xác thực...' : 'Xác thực'}
          </button>
        </form>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Làm thế nào để có mã xác thực?</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Liên hệ với trường học nơi bạn công tác</li>
            <li>• Yêu cầu quản trị viên hệ thống cấp mã</li>
            <li>• Cung cấp thông tin giáo viên để xác minh</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Đăng ký nhầm?{' '}
            <button
              onClick={() => window.location.reload()}
              className="text-yellow-600 hover:text-yellow-700 font-semibold"
            >
              Đăng ký lại
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeacherVerificationForm;