import React, { useState } from 'react';
import { generateQuizQuestions } from '../services/geminiService';
import { ApiKeyManager } from '../services/apiKeyManager';

interface SimilarExamGeneratorProps {
  onBack: () => void;
}

const SimilarExamGenerator: React.FC<SimilarExamGeneratorProps> = ({ onBack }) => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [extractedText, setExtractedText] = useState<string>('');
    const [generatedJson, setGeneratedJson] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isExtracting, setIsExtracting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('de-thi-tuong-tu.json');

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Kiểm tra định dạng file - mở rộng hỗ trợ .tex
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.tex'];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        
        if (!allowedExtensions.includes(fileExtension)) {
            setError('Chỉ hỗ trợ file PDF, Word (.docx, .doc), Text (.txt) và LaTeX (.tex)');
            return;
        }

        setUploadedFile(file);
        setError(null);
        setIsExtracting(true);

        try {
            let text = '';
            
            // Đọc file text hoặc .tex
            if (file.type === 'text/plain' || fileExtension === '.tex') {
                text = await file.text();
                
                // Nếu là file .tex, thêm ghi chú
                if (fileExtension === '.tex') {
                    text = `[File LaTeX đã upload: ${file.name}]\n\n${text}`;
                }
            } 
            // Đối với PDF, Word - sử dụng Gemini Vision API để phân tích
            else if (file.type === 'application/pdf' || 
                     file.type.includes('word') || 
                     file.type.includes('document')) {
                
                // Kiểm tra API key
                const hasApiKey = ApiKeyManager.hasApiKey('gemini');
                
                if (!hasApiKey) {
                    text = `[File ${file.name} đã upload]

⚠️ Cần API Key Gemini để phân tích file PDF/Word tự động.

Vui lòng:
1. Cấu hình API Key Gemini trong phần cài đặt
2. Hoặc copy nội dung đề thi từ file và paste vào ô bên dưới

Bạn cũng có thể mô tả cấu trúc đề thi:
- Số lượng câu hỏi từng loại
- Chủ đề và mức độ khó
- Cấu trúc đề thi
- Ví dụ một vài câu hỏi mẫu`;
                } else {
                    // Chuyển file thành base64 để gửi cho Gemini
                    const reader = new FileReader();
                    
                    const fileContent = await new Promise<string>((resolve, reject) => {
                        reader.onload = () => {
                            const base64 = reader.result as string;
                            resolve(base64.split(',')[1]); // Lấy phần base64
                        };
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });

                    // Gọi Gemini API để phân tích file
                    text = `[Đang phân tích file ${file.name} bằng Gemini AI...]

Vui lòng đợi trong giây lát...

Sau khi phân tích xong, nội dung sẽ xuất hiện ở đây.
Bạn có thể chỉnh sửa trước khi tạo đề tương tự.`;
                    
                    setExtractedText(text);
                    
                    // Gọi API phân tích (sẽ được xử lý trong handleGenerate)
                    // Tạm thời lưu file để xử lý sau
                    (window as any).__uploadedFileForAnalysis = {
                        name: file.name,
                        type: file.type,
                        content: fileContent
                    };
                    
                    text = `[File ${file.name} đã sẵn sàng để phân tích]

📄 File: ${file.name}
📊 Loại: ${file.type.includes('pdf') ? 'PDF' : 'Word'}

Nhấn nút "Tạo đề tương tự" để AI phân tích file và tạo đề thi mới.

Hoặc bạn có thể copy-paste nội dung đề thi vào đây để chỉnh sửa trước khi tạo.`;
                }
            }

            setExtractedText(text);
        } catch (error) {
            console.error('Error reading file:', error);
            setError('Có lỗi xảy ra khi đọc file. Vui lòng thử lại.');
        } finally {
            setIsExtracting(false);
        }
    };

    const handleGenerate = async () => {
        if (!extractedText.trim()) {
            setError('Vui lòng upload file hoặc nhập nội dung đề thi mẫu.');
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
            // Kiểm tra xem có file đã upload để phân tích không
            const uploadedFileData = (window as any).__uploadedFileForAnalysis;
            let contentToAnalyze = extractedText;
            
            // Nếu có file PDF/Word đã upload, thêm thông tin vào prompt
            if (uploadedFileData && extractedText.includes('[File') && extractedText.includes('đã sẵn sàng')) {
                contentToAnalyze = `[Phân tích file ${uploadedFileData.name}]

Đây là file ${uploadedFileData.type.includes('pdf') ? 'PDF' : 'Word'} chứa đề thi mẫu.
Vui lòng phân tích nội dung và trích xuất:
- Cấu trúc đề thi (số phần, số câu)
- Các câu hỏi và đáp án
- Mức độ khó của từng câu
- Chủ đề và nội dung kiến thức

Sau đó tạo đề thi mới tương tự.`;
            }
            
            // Tạo prompt từ đề thi mẫu
            const prompt = `Dựa trên đề thi mẫu sau, hãy tạo một đề thi toán học tương tự với cấu trúc và độ khó tương đương:

ĐỀ THI MẪU:
${contentToAnalyze}

YÊU CẦU:
- Phân tích và hiểu cấu trúc đề thi mẫu
- Tạo đề thi mới với cấu trúc tương tự đề mẫu
- Giữ nguyên số lượng câu hỏi và phân bố theo từng dạng
- Độ khó tương đương với đề mẫu
- Đổi số liệu trong các bài toán (nếu có thể), giữ nguyên nếu câu hỏi khó thay đổi
- Sử dụng 3 dạng câu hỏi: mcq (trắc nghiệm 1 lựa chọn), msq (đúng/sai), sa (trả lời ngắn)
- Tất cả công thức toán học phải dùng LaTeX (ví dụ: $x^2 + 2x + 1$)
- Nếu có hình vẽ trong đề mẫu, mô tả bằng lời hoặc chuyển sang code TikZ (LaTeX)
- Cung cấp lời giải chi tiết cho mỗi câu
- Đảm bảo câu hỏi phù hợp với chương trình toán THPT Việt Nam
- Nội dung câu hỏi phải khác với đề mẫu nhưng cùng chủ đề và mức độ

LƯU Ý VỀ HÌNH VẼ:
- Nếu đề mẫu có hình vẽ hình học, hãy tạo code TikZ để vẽ lại
- Nếu là đồ thị hàm số, mô tả rõ đặc điểm hoặc tạo code TikZ
- Nếu không thể tạo code TikZ, mô tả chi tiết hình vẽ bằng văn bản`;

            const result = await generateQuizQuestions(prompt);
            
            // Xóa file data sau khi xử lý
            delete (window as any).__uploadedFileForAnalysis;
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

    const baseInputClasses = "w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition";

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
                    <h1 className="text-3xl font-bold text-gray-900">Tạo đề tương tự</h1>
                </div>

                <div className="text-center mb-8">
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        Upload file đề thi mẫu (Word/PDF) hoặc nhập nội dung. AI sẽ tạo đề thi mới với cấu trúc và độ khó tương tự.
                    </p>
                </div>
                
                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert"><p className="font-bold">Đã xảy ra lỗi</p><p>{error}</p></div>}
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* --- Input Column --- */}
                    <div className="space-y-6 bg-white p-6 rounded-xl border border-gray-200">
                        {/* File Upload */}
                        <div>
                            <label className="block text-base font-semibold text-gray-700 mb-2">Upload đề thi mẫu</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.txt,.tex"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <div className="text-gray-400 mb-2">
                                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Click để chọn file hoặc kéo thả file vào đây
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Hỗ trợ: PDF, Word (.docx, .doc), Text (.txt), LaTeX (.tex)
                                    </p>
                                </label>
                            </div>
                            
                            {uploadedFile && (
                                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                                    ✅ Đã upload: {uploadedFile.name}
                                </div>
                            )}
                        </div>

                        {/* Extracted/Manual Text */}
                        <div>
                            <label htmlFor="extracted-text" className="block text-base font-semibold text-gray-700 mb-2">
                                Nội dung đề thi mẫu {isExtracting && <span className="text-sm text-blue-600">(Đang xử lý...)</span>}
                            </label>
                            <textarea
                                id="extracted-text"
                                rows={12}
                                className={baseInputClasses}
                                value={extractedText}
                                onChange={(e) => setExtractedText(e.target.value)}
                                placeholder="Nội dung đề thi sẽ xuất hiện ở đây sau khi upload file, hoặc bạn có thể nhập trực tiếp..."
                                disabled={isExtracting}
                            />
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || isExtracting}
                            className="w-full flex items-center justify-center gap-3 px-6 py-3 text-lg font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500 disabled:bg-green-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-green-500/20"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                                    <span>Đang tạo đề tương tự...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span>Tạo đề tương tự</span>
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
                                rows={20}
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
                                    className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition"
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

                {/* Instructions */}
                <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-green-800 mb-3">💡 Hướng dẫn sử dụng</h3>
                    <ul className="text-sm text-green-700 space-y-2">
                        <li>• <strong>Upload file:</strong> Chọn file PDF, Word, Text hoặc LaTeX (.tex) chứa đề thi mẫu</li>
                        <li>• <strong>Nhập trực tiếp:</strong> Copy-paste nội dung đề thi vào ô text (khuyến nghị cho PDF/Word)</li>
                        <li>• <strong>Cấu trúc rõ ràng:</strong> Đề mẫu nên có cấu trúc rõ ràng với các phần, số câu hỏi</li>
                        <li>• <strong>Chất lượng:</strong> Đề mẫu càng chi tiết, đề thi tạo ra càng chính xác</li>
                        <li>• <strong>Đổi số liệu:</strong> AI sẽ tự động đổi số liệu trong bài toán, giữ nguyên câu hỏi khó thay đổi</li>
                        <li>• <strong>Hình vẽ:</strong> AI sẽ cố gắng chuyển hình vẽ sang code TikZ (LaTeX) hoặc mô tả chi tiết</li>
                        <li>• <strong>File .tex:</strong> Hỗ trợ đọc trực tiếp file LaTeX, giữ nguyên định dạng toán học</li>
                    </ul>
                </div>
                
                {/* TikZ Example */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3">📐 Về code TikZ cho hình vẽ</h3>
                    <p className="text-sm text-blue-700 mb-2">
                        TikZ là công cụ vẽ hình trong LaTeX. AI sẽ tạo code TikZ cho các hình vẽ hình học, đồ thị hàm số.
                    </p>
                    <div className="bg-white p-3 rounded border border-blue-200 mt-2">
                        <p className="text-xs font-mono text-gray-700">
                            Ví dụ code TikZ vẽ tam giác:<br/>
                            <code className="text-blue-600">
                                \begin{'{'}tikzpicture{'}'}<br/>
                                &nbsp;&nbsp;\draw (0,0) -- (4,0) -- (2,3) -- cycle;<br/>
                                &nbsp;&nbsp;\node at (0,-0.3) {'{'}A{'}'};<br/>
                                \end{'{'}tikzpicture{'}'}
                            </code>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SimilarExamGenerator;