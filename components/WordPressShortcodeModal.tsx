import React, { useState, useEffect } from 'react';

interface WordPressShortcodeModalProps {
  onClose: () => void;
  generateShortcodes: () => Promise<string>;
}

const WordPressShortcodeModal: React.FC<WordPressShortcodeModalProps> = ({
  onClose,
  generateShortcodes
}) => {
  const [shortcodes, setShortcodes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    handleGenerateShortcodes();
  }, []);

  const handleGenerateShortcodes = async () => {
    setLoading(true);
    try {
      const generated = await generateShortcodes();
      setShortcodes(generated);
    } catch (error) {
      console.error('Error generating shortcodes:', error);
      alert('Có lỗi xảy ra khi tạo shortcode.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shortcodes);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Không thể copy vào clipboard. Vui lòng copy thủ công.');
    }
  };

  const handleDownloadFile = () => {
    const blob = new Blob([shortcodes], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wordpress-quiz-shortcodes.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">WordPress Quiz Shortcodes</h2>
            <p className="text-sm text-gray-600 mt-1">
              Shortcodes cho plugin quiz WordPress
            </p>
          </div>
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
        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tạo shortcodes...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Info Section */}
              <div className="p-6 bg-orange-50 border-b">
                <h3 className="font-semibold text-orange-900 mb-2">📋 Hướng dẫn sử dụng</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-orange-800">
                  <div>
                    <strong>Trắc nghiệm (MCQ):</strong>
                    <code className="block text-xs bg-orange-100 p-1 rounded mt-1">
                      [quiz_question question="..." option_a="..." correct="A" explanation="..."]
                    </code>
                  </div>
                  <div>
                    <strong>Đúng/Sai (MSQ):</strong>
                    <code className="block text-xs bg-orange-100 p-1 rounded mt-1">
                      [quiz_question_T_F question="..." correct="A,B" explanation="..."]
                    </code>
                  </div>
                  <div>
                    <strong>Trả lời ngắn (SA):</strong>
                    <code className="block text-xs bg-orange-100 p-1 rounded mt-1">
                      [quiz_question_TLN question="..." correct="1234" explanation="..."]
                    </code>
                  </div>
                </div>
              </div>

              {/* Shortcode Content */}
              <div className="flex-1 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">Generated Shortcodes</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyToClipboard}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        copied
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                      }`}
                    >
                      {copied ? '✓ Đã copy' : '📋 Copy'}
                    </button>
                    <button
                      onClick={handleDownloadFile}
                      className="px-3 py-1.5 text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-md transition-colors"
                    >
                      💾 Tải file
                    </button>
                  </div>
                </div>

                <textarea
                  value={shortcodes}
                  onChange={(e) => setShortcodes(e.target.value)}
                  className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Shortcodes sẽ hiển thị ở đây..."
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {shortcodes && (
              <span>
                📊 Đã tạo {shortcodes.split('\n\n').filter(s => s.trim()).length} shortcodes
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleGenerateShortcodes}
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang tạo...' : '🔄 Tạo lại'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordPressShortcodeModal;