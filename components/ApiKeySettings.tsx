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

  const handleSaveGeminiKey = async (skipTest: boolean = false) => {
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
      if (!skipTest) {
        // Test API key trước khi lưu
        setMessage({ type: 'info', text: 'Đang kiểm tra API key...' });
        const testResult = await ApiKeyManager.testApiKey('gemini', geminiApiKey);
        
        if (!testResult.valid) {
          setMessage({ 
            type: 'error', 
            text: `API key không hợp lệ: ${testResult.error || 'Không thể kết nối'}. Bạn có muốn lưu mà không test không?` 
          });
          setLoading(false);
          return;
        }
      }

      // Lưu API key
      ApiKeyManager.saveApiKey('gemini', geminiApiKey);
      setApiKeyStatus(ApiKeyManager.getApiKeyStatus());
      setGeminiApiKey('');
      setMessage({ 
        type: 'success', 
        text: skipTest ? 'Đã lưu API key (chưa test)!' : 'Đã lưu và test API key thành công!' 
      });
      
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">⚙️ Cài đặt API Key</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">

          {/* Gemini API Key Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">🤖 Gemini API Key</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${
                apiKeyStatus.gemini.hasKey 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {apiKeyStatus.gemini.hasKey ? '✅ Có' : '❌ Bắt buộc'}
              </span>
            </div>

            {/* Current Key Status */}
            {apiKeyStatus.gemini.hasKey && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-600 font-mono">{getGeminiKeyDisplay()}</p>
                  </div>
                  <button
                    onClick={handleRemoveGeminiKey}
                    className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            )}

            {/* Add/Update Key */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showGeminiKey ? 'text' : 'password'}
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="Nhập Gemini API Key (AIza...)"
                    className="w-full p-2 border border-gray-300 rounded-md font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showGeminiKey ? '🙈' : '👁️'}
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleSaveGeminiKey(false)}
                    disabled={loading || !geminiApiKey.trim()}
                    className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Lưu...' : 'Lưu & Test'}
                  </button>
                  <button
                    onClick={() => handleSaveGeminiKey(true)}
                    disabled={loading || !geminiApiKey.trim()}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Lưu không test
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Lấy tại: <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Google AI Studio
                </a>
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                💡 Free tier có giới hạn 15 requests/phút. Nếu test fail do rate limit, hãy dùng "Lưu không test".
              </p>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-2 rounded-md text-sm ${
              message.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' :
              message.type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' :
              'bg-blue-100 border border-blue-400 text-blue-700'
            }`}>
              {message.text}
              {message.type === 'error' && message.text.includes('giới hạn API') && (
                <div className="mt-2">
                  <button
                    onClick={() => handleSaveGeminiKey(true)}
                    disabled={loading || !geminiApiKey.trim()}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Lưu không test
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-center gap-2 p-3 border-t">
          <button
            onClick={onClose}
            className="px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeySettings;