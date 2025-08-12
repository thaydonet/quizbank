
import React, { useState } from 'react';
import { generateQuizQuestions } from '../services/geminiService';

const AIGeneratorPage: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('Tạo 3 câu hỏi trắc nghiệm và 2 câu hỏi đúng/sai về sự đồng biến, nghịch biến của hàm số bậc ba, mức độ nhận biết.');
    const [generatedJson, setGeneratedJson] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('dong-bien-nghich-bien.json');

    const handleGenerate = async () => {
        if (!prompt) {
            setError('Vui lòng nhập yêu cầu để tạo câu hỏi.');
            return;
        }
        if (!process.env.API_KEY) {
            setError('Lỗi cấu hình: API_KEY chưa được thiết lập. Không thể gọi AI.');
            setGeneratedJson(JSON.stringify({ error: "API_KEY is not configured. Please set the environment variable." }, null, 2));
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedJson('');

        const result = await generateQuizQuestions(prompt);
        setGeneratedJson(result);

        // Check if there was an error in the returned JSON
        try {
            const parsedResult = JSON.parse(result);
            if (parsedResult.error) {
                setError(parsedResult.details || parsedResult.error);
            }
        } catch (e) {
            // This is not an error, just a check. The string is still valid.
        }

        setIsLoading(false);
    };

    const handleDownload = () => {
        if (!generatedJson) {
            setError('Không có nội dung JSON để tải xuống.');
            return;
        }
        try {
            // Validate JSON before downloading
            JSON.parse(generatedJson);
            const blob = new Blob([generatedJson], { type: 'application/json' });
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

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Trình tạo câu hỏi bằng AI</h1>
                <p className="text-gray-600 mb-6">Nhập yêu cầu chi tiết, AI sẽ tạo bộ câu hỏi theo định dạng JSON cho bạn.</p>
                
                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert"><p>{error}</p></div>}
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* --- Input Column --- */}
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">Yêu cầu (Prompt)</label>
                            <textarea
                                id="prompt"
                                rows={8}
                                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Ví dụ: Tạo 5 câu trắc nghiệm về cực trị hàm số, trong đó có 1 câu chứa tham số m."
                            />
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                    <span>Đang tạo...</span>
                                </>
                            ) : (
                                'Tạo câu hỏi'
                            )}
                        </button>
                    </div>

                    {/* --- Output Column --- */}
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="json-output" className="block text-sm font-medium text-gray-700 mb-1">Kết quả JSON (có thể chỉnh sửa)</label>
                            <textarea
                                id="json-output"
                                rows={18}
                                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 font-mono text-sm bg-gray-50"
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
                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                    value={fileName}
                                    onChange={(e) => setFileName(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleDownload}
                                disabled={!generatedJson || isLoading}
                                className="px-5 py-2 text-base font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
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

export default AIGeneratorPage;
