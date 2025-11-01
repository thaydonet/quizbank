import React, { useState } from 'react';
import { generateQuizQuestions } from '../services/geminiService';
import { ApiKeyManager } from '../services/apiKeyManager';
import SparklesIcon from '../components/icons/SparklesIcon';

interface QuizBankGeneratorProps {
  onBack: () => void;
}

const QuizBankGenerator: React.FC<QuizBankGeneratorProps> = ({ onBack }) => {
    const [prompt, setPrompt] = useState<string>('Tạo 10 câu hỏi về chủ đề "CHỦ ĐỀ TOÁN CỦA BẠN" cho lớp 12. Trong đó:\n- 6 câu dạng trắc nghiệm một lựa chọn (mcq) MỨC ĐỘ NHẬN BIẾT.\n- 2 câu dạng trắc nghiệm nhiều lựa chọn (msq) mức độ thông hiểu.\n- 2 câu dạng trả lời ngắn (sa) là toán thực tế mức độ Vận dụng. Định dạng tất cả công thức bằng LaTeX. Cung cấp lời giải chi tiết cho mỗi câu.');
    const [generatedJson, setGeneratedJson] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('ten-chu-de-bai-hoc.json');

    const handleGenerate = async () => {
        if (!prompt) {
            setError('Vui lòng nhập yêu cầu để tạo câu hỏi.');
            return;
        }

        // Kiểm tra API key (bắt buộc)
        const hasPersonalKey = ApiKeyManager.hasApiKey('gemini');
        
        if (!hasPersonalKey) {
            setError('Chưa có API key. Vui lòng cấu hình API key Gemini để sử dụng tính năng AI.');
            setGeneratedJson(JSON.stringify({ 
                error: "Chưa có API key", 
                details: "Vui lòng quay lại và cài đặt API Key" 
            }, null, 2));
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedJson('');

        try {
            const result = await generateQuizQuestions(prompt);
            setGeneratedJson(result);

            // Kiểm tra kết quả có lỗi không
            try {
                const parsedResult = JSON.parse(result);
                if (parsedResult.error) {
                    setError(parsedResult.details || parsedResult.error);
                }
            } catch (e) {
                // Không phải lỗi, chỉ là kiểm tra
            }
        } catch (error) {
            console.error('Error generating questions:', error);
            setError('Có lỗi xảy ra khi tạo câu hỏi. Vui lòng thử lại.');
            setGeneratedJson(JSON.stringify({ 
                error: "Lỗi tạo câu hỏi", 
                details: error instanceof Error ? error.message : 'Unknown error' 
            }, null, 2));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!generatedJson) {
            setError('Không có nội dung JSON để tải xuống.');
            return;
        }
        try {
            JSON.parse(generatedJson);
            const blob = new Blob([generatedJson], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            setError('Nội dung không phải là JSON hợp lệ. Vui lòng sửa lại trước khi tải.');
        }
    };

    const baseInputClasses = "w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition";

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header with Back Button */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        ← Quay lại
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Tạo câu hỏi cho Quiz Bank</h1>
                </div>

                <div className="text-center mb-8">
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        Nhập yêu cầu chi tiết. AI sẽ tạo bộ câu hỏi theo định dạng JSON chuẩn, hỗ trợ 3 dạng câu hỏi, LaTeX và lời giải chi tiết.
                    </p>
                </div>
                
                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert"><p className="font-bold">Đã xảy ra lỗi</p><p>{error}</p></div>}
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* --- Input Column --- */}
                    <div className="space-y-6 bg-white p-6 rounded-xl border border-gray-200">
                        <div>
                            <label htmlFor="prompt" className="block text-base font-semibold text-gray-700 mb-2">Yêu cầu (Prompt)</label>
                            <textarea
                                id="prompt"
                                rows={12}
                                className={baseInputClasses}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Ví dụ: Tạo 5 câu trắc nghiệm về cực trị hàm số, trong đó có 1 câu thực tế. Tất cả công thức toán phải dùng LaTeX. Cung cấp lời giải chi tiết."
                            />
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 px-6 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-indigo-500/20"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                                    <span>Đang tạo...</span>
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-6 h-6"/>
                                    <span>Tạo câu hỏi</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* --- Output Column --- */}
                    <div className="space-y-6 bg-white p-6 rounded-xl border border-gray-200">
                        <div>
                            <label htmlFor="json-output" className="block text-base font-semibold text-gray-700 mb-2">Kết quả JSON (có thể chỉnh sửa)</label>
                            <textarea
                                id="json-output"
                                rows={16}
                                className={`${baseInputClasses} font-mono text-sm bg-gray-50/70 focus:ring-green-500/50 focus:border-green-500`}
                                value={generatedJson}
                                onChange={(e) => setGeneratedJson(e.target.value)}
                                placeholder="Kết quả JSON sẽ xuất hiện ở đây..."
                            />
                        </div>
                        <div className="flex items-end gap-4">
                            <div className="flex-grow">
                                <label htmlFor="file-name" className="block text-sm font-medium text-gray-700 mb-1">Tên file</label>
                                <input
                                    type="text"
                                    id="file-name"
                                    className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
                                    value={fileName}
                                    onChange={(e) => setFileName(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleDownload}
                                disabled={!generatedJson || isLoading}
                                className="px-5 py-2 text-base font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500 disabled:bg-green-400 disabled:cursor-not-allowed transition shadow-sm"
                            >
                                Tải file .json
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizBankGenerator;