import React, { useState } from 'react';
import { generateQuizQuestions } from '../services/geminiService';
import { ApiKeyManager } from '../services/apiKeyManager';
import SparklesIcon from '../components/icons/SparklesIcon';

interface MatrixGeneratorProps {
    onBack: () => void;
}

const MatrixGenerator: React.FC<MatrixGeneratorProps> = ({ onBack }) => {
    const [matrixText, setMatrixText] = useState<string>('');
    const [generatedJson, setGeneratedJson] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('de-thi-theo-ma-tran.json');

    const handleGenerate = async () => {
        if (!matrixText.trim()) {
            setError('Vui lòng nhập ma trận đề thi.');
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
            // Tạo prompt từ ma trận
            const prompt = `Dựa trên ma trận đề thi sau, hãy tạo một bộ câu hỏi toán học hoàn chỉnh:

MA TRẬN ĐỀ THI:
${matrixText}

YÊU CẦU:
- Tạo câu hỏi theo đúng cấu trúc và số lượng trong ma trận
- Sử dụng 3 dạng câu hỏi: mcq (trắc nghiệm 1 lựa chọn), msq (đúng/sai), sa (trả lời ngắn)
- Tất cả công thức toán học phải dùng LaTeX
- Cung cấp lời giải chi tiết cho mỗi câu
- Đảm bảo độ khó phù hợp với từng mức độ trong ma trận
- Câu hỏi phải phù hợp với chương trình toán THPT Việt Nam`;

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

    const baseInputClasses = "w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition";

    const sampleMatrix = `MA TRẬN ĐỀ THI TOÁN 12 - ỨNG DỤNG ĐẠO HÀM

PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn (3.0 điểm)

Câu 1. [NB] Tìm khoảng đơn điệu của hàm số khi cho bằng bảng biến thiên hoặc ĐỒ THỊ.

Câu 2. [NB] Tìm điểm cực trị, giá trị cực trị của hàm số khi cho bằng BẢNG BIẾN THIÊN hoặc ĐỒ THỊ.

Câu 3. [NB] Tìm giá trị lớn nhất, giá trị nhỏ nhất của hàm số trên đoạn khi cho bằng BẢNG BIẾN THIÊN hoặc ĐỒ THỊ.

Câu 4. [NB] Tìm tiệm cận đứng, tiệm cận ngang của hàm nhất biến bằng công thức hoặc BẢNG BIẾN THIÊN, ĐỒ THỊ.

Câu 5. [NB] Nhận biết đồ thị hàm bậc ba, nhất biến, bậc hai/bậc nhất.

Câu 6. [NB] Nhận biết tương giao bằng đồ thị.

Câu 7. [NB] Nhận biết cho bảng số liệu ghép nhóm, hỏi các số liệu của bảng.

Câu 8. [NB] Nhận biết cho bảng số liệu ghép nhóm, hỏi phương sai.

Câu 9. [TH] Tìm khoảng đơn điệu hoặc cực trị của hàm số cho bằng công thức (hàm bậc 3, hàm trùng phương, nhất biến, bậc hai/bậc nhất).

Câu 10. [TH] Xác định đồ thị hàm bậc ba, nhất biến, bậc hai/bậc nhất.

Câu 11. [TH] Nhận biết cho bảng số liệu ghép nhóm, hỏi Q1.

Câu 12. [TH] Nhận biết cho bảng số liệu ghép nhóm, hỏi Q3.

PHẦN II. Câu trắc nghiệm đúng sai (4.0 điểm)

Câu 1. Cho hàm số bậc ba bằng công thức.
a. [NB] Tính đạo hàm của hàm số hoặc tìm tập xác định của hàm số.
b. [TH] Tìm khoảng đơn điệu của hàm số.
c. [TH] Tìm cực trị của hàm số.
d. [TH] Xác định bảng biến thiên hoặc đồ thị hàm số.

Câu 2. Cho hàm số bậc hai/bậc nhất bằng BẢNG BIẾN THIÊN, ĐỒ THỊ.
a. [NB] Tìm khoảng đơn điệu của hàm số.
b. [NB] Tìm cực trị hoặc tiệm cận của hàm số.
c. [TH] So sánh các giá trị của hàm số dựa vào tính đơn hoặc tìm GTLN, GTNN, cực trị.
d. [TH] Xác định các hệ số hoặc dấu của các hệ số trong hàm số, hoặc xác định hàm số.

Câu 3. Cho hàm số y=f(x) chứa hàm lượng giác hoặc mũ, logarit.
a. [NB] Tìm f(a) hoặc f(b).
b. [NB] Tính f'(x).
c. [TH] Tìm nghiệm, số nghiệm của phương trình trên đoạn [a;b].
d. [TH] Tìm GTLN hoặc GTNN của hàm số trên [a;b].

Câu 4. Nhận biết cho bảng số liệu ghép nhóm.
a. [NB] Khoảng biến thiên.
b. [NB] Giá trị trung bình.
c. [TH] Độ lệch chuẩn của dữ liệu.
d. [TH] Tứ phân vị.

PHẦN III. Trả lời ngắn (3.0 điểm)

Câu 1. [VD] Tìm cực trị của hàm số khi cho bằng công thức hoặc đếm số cực trị của hàm số khi cho bằng đồ thị f'(x) hoặc công thức f'(x).

Câu 2. [VD] Tìm tâm đối xứng của đồ thị hàm bậc hai/trên bậc nhất.

Câu 3. [VD] Tìm cực trị của hàm chứa căn, hoặc chứa mũ, log.

Câu 4. [VD] Bài toán thực tiễn liên quan GTLN-GTNN.

Câu 5. [VD] Bài toán thực tiễn ứng dụng đạo hàm.

Câu 6. [VD] Bài toán thực tiễn trong thống kê.

Ghi chú:
[NB] - Nhận biết
[TH] - Thông hiểu
[VD] - Vận dụng
[VDC] - Vận dụng cao`;

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
                    <h1 className="text-3xl font-bold text-gray-900">Tạo đề theo ma trận</h1>
                </div>

                <div className="text-center mb-8">
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        Nhập ma trận đề thi chi tiết. AI sẽ tạo bộ câu hỏi theo đúng cấu trúc và yêu cầu trong ma trận.
                    </p>
                </div>

                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md" role="alert"><p className="font-bold">Đã xảy ra lỗi</p><p>{error}</p></div>}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* --- Input Column --- */}
                    <div className="space-y-6 bg-white p-6 rounded-xl border border-gray-200">
                        <div>
                            <label htmlFor="matrix-text" className="block text-base font-semibold text-gray-700 mb-2">Ma trận đề thi</label>
                            <textarea
                                id="matrix-text"
                                rows={16}
                                className={baseInputClasses}
                                value={matrixText}
                                onChange={(e) => setMatrixText(e.target.value)}
                                placeholder="Nhập ma trận đề thi chi tiết..."
                            />
                        </div>

                        {/* Sample Matrix Button */}
                        <button
                            onClick={() => setMatrixText(sampleMatrix)}
                            className="w-full px-4 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors border border-purple-200"
                        >
                            📋 Sử dụng ma trận mẫu
                        </button>

                        <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-3 px-6 py-3 text-lg font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500 disabled:bg-purple-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-lg hover:shadow-purple-500/20"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                                    <span>Đang tạo theo ma trận...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0v10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2z" />
                                    </svg>
                                    <span>Tạo đề theo ma trận</span>
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
                                    className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition"
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
                <div className="mt-8 bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-purple-800 mb-3">💡 Hướng dẫn sử dụng</h3>
                    <ul className="text-sm text-purple-700 space-y-2">
                        <li>• <strong>Ma trận chi tiết:</strong> Mô tả rõ số lượng câu hỏi, mức độ nhận thức, chủ đề cụ thể</li>
                        <li>• <strong>Cấu trúc rõ ràng:</strong> Chia thành các phần, chương, mức độ (Nhận biết, Thông hiểu, Vận dụng)</li>
                        <li>• <strong>Dạng câu hỏi:</strong> Chỉ định rõ dạng mcq, msq, sa cho từng phần</li>
                        <li>• <strong>Ví dụ:</strong> Click "Sử dụng ma trận mẫu" để xem cấu trúc chuẩn</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default MatrixGenerator;