import React, { useState } from 'react';
import { ApiKeyManager } from '../services/apiKeyManager';
import SparklesIcon from '../components/icons/SparklesIcon';
import ApiKeySettings from '../components/ApiKeySettings';
import QuizBankGenerator from './QuizBankGenerator';
import MatrixGenerator from './MatrixGenerator';
import SimilarExamGenerator from './SimilarExamGenerator';

const AIGeneratorPage: React.FC = () => {
    const [selectedMode, setSelectedMode] = useState<'quiz-bank' | 'matrix' | 'similar' | null>(null);
    const [showApiKeySettings, setShowApiKeySettings] = useState<boolean>(false);
    const [apiKeyStatus, setApiKeyStatus] = useState(ApiKeyManager.getApiKeyStatus());

    const handleApiKeyUpdated = () => {
        setApiKeyStatus(ApiKeyManager.getApiKeyStatus());
    };

    const handleModeSelect = (mode: 'quiz-bank' | 'matrix' | 'similar') => {
        // Kiểm tra API key trước khi chuyển trang
        const hasPersonalKey = ApiKeyManager.hasApiKey('gemini');
        if (!hasPersonalKey) {
            setShowApiKeySettings(true);
            return;
        }
        setSelectedMode(mode);
    };

    // Render specific mode component
    if (selectedMode === 'quiz-bank') {
        return <QuizBankGenerator onBack={() => setSelectedMode(null)} />;
    }
    if (selectedMode === 'matrix') {
        return <MatrixGenerator onBack={() => setSelectedMode(null)} />;
    }
    if (selectedMode === 'similar') {
        return <SimilarExamGenerator onBack={() => setSelectedMode(null)} />;
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <h1 className="text-4xl font-bold text-gray-900">Trình tạo câu hỏi bằng AI</h1>
                        <button
                            onClick={() => setShowApiKeySettings(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                        >
                            ⚙️ Cài đặt API Key
                        </button>
                    </div>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-4">
                        Chọn phương thức tạo câu hỏi phù hợp với nhu cầu của bạn
                    </p>

                    {/* API Key Status */}
                    <div className="flex justify-center">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm ${apiKeyStatus.gemini.hasKey
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                            {apiKeyStatus.gemini.hasKey ? (
                                <>
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    API Key: Đã cấu hình
                                </>
                            ) : (
                                <>
                                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                    API Key: Chưa cấu hình (Bắt buộc)
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mode Selection Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Quiz Bank Generator */}
                    <div
                        onClick={() => handleModeSelect('quiz-bank')}
                        className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-indigo-200 group"
                    >
                        <div className="text-center">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-200 transition-colors">
                                <SparklesIcon className="w-8 h-8 text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Tạo câu hỏi cho Quiz Bank</h3>
                            <p className="text-gray-600 text-sm mb-4">
                                Tạo câu hỏi theo yêu cầu tự do, hỗ trợ 3 dạng câu hỏi với LaTeX và lời giải chi tiết
                            </p>
                            <div className="text-indigo-600 font-semibold text-sm">
                                Bắt đầu tạo →
                            </div>
                        </div>
                    </div>

                    {/* Matrix Generator */}
                    <div
                        onClick={() => handleModeSelect('matrix')}
                        className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-purple-200 group"
                    >
                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0v10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Tạo đề theo ma trận</h3>
                            <p className="text-gray-600 text-sm mb-4">
                                Nhập ma trận đề thi, AI sẽ tạo đề thi theo cấu trúc và yêu cầu cụ thể
                            </p>
                            <div className="text-purple-600 font-semibold text-sm">
                                Tạo theo ma trận →
                            </div>
                        </div>
                    </div>

                    {/* Similar Exam Generator */}
                    <div
                        onClick={() => handleModeSelect('similar')}
                        className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-green-200 group"
                    >
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Tạo đề tương tự</h3>
                            <p className="text-gray-600 text-sm mb-4">
                                Upload file Word/PDF mẫu, AI sẽ tạo đề thi tương tự với cấu trúc và độ khó tương đương
                            </p>
                            <div className="text-green-600 font-semibold text-sm">
                                Upload và tạo →
                            </div>
                        </div>
                    </div>
                </div>

                {/* API Key Settings Modal */}
                {showApiKeySettings && (
                    <ApiKeySettings
                        onClose={() => setShowApiKeySettings(false)}
                        onApiKeyUpdated={handleApiKeyUpdated}
                    />
                )}
            </div>
        </div>
    );
};

export default AIGeneratorPage;