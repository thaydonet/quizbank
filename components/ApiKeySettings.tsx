import React, { useState, useEffect } from 'react';
import { ApiKeyManager } from '../services/apiKeyManager';

interface ApiKeySettingsProps {
  onClose?: () => void;
  onApiKeyUpdated?: () => void;
}

const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({ onClose, onApiKeyUpdated }) => {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState(ApiKeyManager.getApiKeyStatus());

  useEffect(() => {
    // Load existing API key status
    setApiKeyStatus(ApiKeyManager.getApiKeyStatus());
  }, []);

  const handleSaveGeminiKey = async () => {
    if (!geminiApiKey.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập API key' });
      return;
    }

    // Validate format
    if (!ApiKeyManager.validateApiKeyFormat('gemini', geminiApiKey)) {
      setMessage({ 
        type: 'error', 
        text: 'API key không đúng định dạng. Gemini API key phải bắt đầu bằng "AIza" và có độ dài > 20 ký tự' 
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Test API key trước khi lưu
      setMessage({ type: 'info', text: 'Đang kiểm tra API key...' });
      const testResult = await ApiKeyManager.testApiKey('gemini', geminiApiKey);
      
      if (!testResult.valid) {
        setMessage({ 
          type: 'error', 
          text: `API key không hợp lệ: ${testResult.error || 'Không thể kết nối'}` 
        });
        return;
      }

      // Lưu API key
      ApiKeyManager.saveApiKey('gemini', geminiApiKey);
      setApiKeyStatus(ApiKeyManager.getApiKeyStatus());
      setGeminiApiKey('');
      setMessage({ type: 'success', text: 'Đã lưu Gemini API key thành công!' });
      
      if (onApiKeyUpdated) {
        onApiKeyUpdated();
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Có lỗi xảy ra khi lưu API key' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestGeminiKey = async () => {
    const existingKey = ApiKeyManager.getApiKey('gemini');
    if (!existingKey) {
      setMessage({ type: 'error', text: 'Chưa có API key để test' });
      return;
    }

    setTesting(true);
    setMessage({ type: 'info', text: 'Đang test API key...' });

    try {
      const testResult = await ApiKeyManager.testApiKey('gemini', existingKey);
      
      if (testResult.valid) {
        setMessage({ type: 'success', text: 'API key hoạt động tốt!' });
      } else {
        setMessage({ 
          type: 'error', 
          text: `API key không hoạt động: ${testResult.error || 'Không thể kết nối'}` 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Có lỗi xảy ra khi test API key' 
      });
    } finally {
      setTesting(false);
    }
  };

  const handleRemoveGeminiKey = () => {
    if (confirm('Bạn có chắc muốn xóa Gemini API key?')) {
      ApiKeyManager.removeApiKey('gemini');
      setApiKeyStatus(ApiKeyManager.getApiKeyStatus());
      setMessage({ type: 'success', text: 'Đã xóa Gemini API key' });
      
      if (onApiKeyUpdated) {
        onApiKeyUpdated();
      }
    }
  };

  const getGeminiKeyDisplay = () => {
    const key = ApiKeyManager.getApiKey('gemini');
    return key ? ApiKeyManager.maskApiKey(key) : 'Chưa có';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xl mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">⚙️ Cài đặt AI API Keys</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">🔐 Bảo mật API Key</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• API keys được lưu trữ cục bộ trên máy tính của bạn</li>
              <li>• Không được gửi lên server hay chia sẻ với ai khác</li>
              <li>• Được mã hóa trước khi lưu vào localStorage</li>
              <li>• Bạn có thể xóa bất cứ lúc nào</li>
            </ul>
          </div>

          {/* Gemini API Key Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">🤖 Google Gemini API</h3>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  apiKeyStatus.gemini.hasKey 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {apiKeyStatus.gemini.hasKey ? '✅ Đã cấu hình' : '❌ Chưa cấu hình'}
                </span>
              </div>
            </div>

            {/* Current Key Status */}
            {apiKeyStatus.gemini.hasKey && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-700">API Key hiện tại:</p>
                    <p className="text-sm text-gray-600 font-mono">{getGeminiKeyDisplay()}</p>
                    {apiKeyStatus.gemini.lastUpdated && (
                      <p className="text-xs text-gray-500">
                        Cập nhật: {new Date(apiKeyStatus.gemini.lastUpdated).toLocaleString('vi-VN')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleTestGeminiKey}
                      disabled={testing}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {testing ? 'Testing...' : 'Test'}
                    </button>
                    <button
                      onClick={handleRemoveGeminiKey}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Add/Update Key */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                {apiKeyStatus.gemini.hasKey ? 'Cập nhật' : 'Thêm'} Gemini API Key
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showGeminiKey ? 'text' : 'password'}
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="w-full p-3 border border-gray-300 rounded-md font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showGeminiKey ? '🙈' : '👁️'}
                  </button>
                </div>
                <button
                  onClick={handleSaveGeminiKey}
                  disabled={loading || !geminiApiKey.trim()}
                  className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Lấy API key tại: <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Google AI Studio
                </a>
              </p>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-3 rounded-md ${
              message.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' :
              message.type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' :
              'bg-blue-100 border border-blue-400 text-blue-700'
            }`}>
              {message.text}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-yellow-800 mb-2">📝 Hướng dẫn lấy API Key</h4>
            <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
              <li>Truy cập <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
              <li>Đăng nhập với tài khoản Google</li>
              <li>Click "Create API Key" → "Create API key in new project"</li>
              <li>Copy API key và paste vào ô trên</li>
              <li>Click "Lưu" để test và lưu API key</li>
            </ol>
          </div>

          {/* Future: OpenAI Section */}
          <div className="space-y-4 opacity-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">🤖 OpenAI API (Sắp có)</h3>
              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                🚧 Đang phát triển
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Tính năng sử dụng OpenAI GPT sẽ được thêm trong phiên bản tiếp theo.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-center gap-4 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeySettings;