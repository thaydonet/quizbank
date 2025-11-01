import { GoogleGenAI } from "@google/genai";
import { ApiKeyManager } from "./apiKeyManager";

/**
 * Lấy API key từ localStorage (bắt buộc)
 */
const getApiKey = (): string | null => {
    return ApiKeyManager.getApiKey('gemini');
};

/**
 * Tạo instance GoogleGenAI với API key hiện tại
 */
const createGeminiInstance = (): GoogleGenAI | null => {
    const apiKey = getApiKey();
    if (!apiKey) {
        return null;
    }
    
    try {
        return new GoogleGenAI({ apiKey });
    } catch (error) {
        console.error('Error creating Gemini instance:', error);
        return null;
    }
};

export const generateQuizQuestions = async (prompt: string): Promise<string> => {
    try {
        const ai = createGeminiInstance();
        
        if (!ai) {
            return JSON.stringify({ 
                error: "API Key chưa được cấu hình",
                details: "Vui lòng thêm API Key Gemini trong phần Cài đặt AI"
            }, null, 2);
        }

        // Sử dụng SDK để tránh CORS
        const apiKey = getApiKey();
        
        if (!apiKey) {
            throw new Error('API key not found');
        }
        
        const genAI = new GoogleGenAI({ apiKey });
        
        const systemInstruction = "Bạn là một giáo viên Toán THPT chuyên nghiệp ở Việt Nam. Nhiệm vụ của bạn là tạo ra các câu hỏi Toán học chất lượng cao bằng tiếng Việt, bao gồm 3 dạng: trắc nghiệm một lựa chọn (mcq), trắc nghiệm nhiều lựa chọn (msq), và trả lời ngắn (sa). Luôn tuân thủ nghiêm ngặt cấu trúc JSON được yêu cầu cho từng loại.\n\n- Dạng 'mcq': câu hỏi có 4 phương án và chỉ có MỘT đáp án đúng. `correct_option` là một ký tự duy nhất ('A', 'B', 'C', hoặc 'D').\n- Dạng 'msq': câu hỏi có 4 phương án và có MỘT hoặc NHIỀU đáp án đúng. `correct_option` là một chuỗi các ký tự đáp án đúng, cách nhau bởi dấu phẩy (ví dụ: 'A,C').\n- Dạng 'sa': câu hỏi điền đáp án. Không có các phương án `option_a, b, c, d`. `correct_option` là đáp án dạng chuỗi (ví dụ: '12.5' hoặc '42').\n\nToàn bộ công thức toán học phải được bao quanh bởi cú pháp LaTeX (ví dụ: $y = x^2$ hoặc $\\int_0^1 x\\,dx$). Cung cấp lời giải chi tiết và rõ ràng cho mỗi câu hỏi.\n\nTrả về kết quả dưới dạng JSON với cấu trúc:\n{\n  \"title\": \"Tiêu đề bộ câu hỏi\",\n  \"questions\": [\n    {\n      \"id\": \"mcq1\",\n      \"type\": \"mcq\",\n      \"question\": \"Nội dung câu hỏi\",\n      \"option_a\": \"Phương án A\",\n      \"option_b\": \"Phương án B\",\n      \"option_c\": \"Phương án C\",\n      \"option_d\": \"Phương án D\",\n      \"correct_option\": \"A\",\n      \"explanation\": \"Lời giải chi tiết\"\n    }\n  ]\n}";

        // Thử các model khác nhau dựa trên danh sách có sẵn
        const modelsToTry = [
            'gemini-2.5-flash-preview-05-20',
            'gemini-2.5-pro-preview-03-25', 
            'gemini-1.5-flash',
            'gemini-1.5-pro',
            'gemini-pro'
        ];
        
        let lastError = '';
        
        for (const modelName of modelsToTry) {
            try {
                const result = await genAI.models.generateContent({
                    model: modelName,
                    contents: systemInstruction + "\n\n" + prompt,
                    config: {
                        temperature: 0.7,
                        maxOutputTokens: 8192,
                        responseMimeType: "application/json"
                    }
                });
                
                const jsonString = result.text?.trim() || '';
                
                if (jsonString) {
                    console.log(`✅ Generated content with model: ${modelName}`);
                    // Basic validation
                    JSON.parse(jsonString);
                    return JSON.stringify(JSON.parse(jsonString), null, 2);
                }
            } catch (error) {
                lastError = error instanceof Error ? error.message : 'Unknown error';
                
                // Nếu là lỗi model không tồn tại, thử model tiếp theo
                if (lastError.includes('not found') || lastError.includes('not supported')) {
                    continue;
                }
                
                // Các lỗi khác (API key sai, quota, etc.) thì throw ngay
                if (lastError.includes('API_KEY_INVALID') || lastError.includes('invalid api key')) {
                    throw new Error('API key không hợp lệ');
                } else if (lastError.includes('quota') || lastError.includes('limit')) {
                    throw new Error('Đã vượt quá giới hạn API');
                } else if (lastError.includes('permission') || lastError.includes('forbidden')) {
                    throw new Error('Không có quyền truy cập API');
                }
                
                // Lỗi khác thì thử model tiếp theo
                continue;
            }
        }
        
        // Nếu tất cả model đều fail
        throw new Error(`Không thể tạo nội dung với bất kỳ model nào. Lỗi cuối: ${lastError}`);
        
        // Nếu không có response từ bất kỳ model nào
        throw new Error('Không nhận được response từ API');

    } catch (error) {
        console.error("Error generating quiz questions:", error);
        
        // Xử lý các lỗi cụ thể
        if (error instanceof Error) {
            const errorMessage = error.message.toLowerCase();
            
            if (errorMessage.includes('api key not valid') || errorMessage.includes('invalid api key')) {
                return JSON.stringify({ 
                    error: "API Key không hợp lệ", 
                    details: "Vui lòng kiểm tra lại API Key trong phần Cài đặt" 
                }, null, 2);
            } else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
                return JSON.stringify({ 
                    error: "Đã vượt quá giới hạn API", 
                    details: "Vui lòng thử lại sau hoặc kiểm tra quota API Key" 
                }, null, 2);
            } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                return JSON.stringify({ 
                    error: "Lỗi kết nối mạng", 
                    details: "Vui lòng kiểm tra kết nối internet và thử lại" 
                }, null, 2);
            }
            
            return JSON.stringify({ 
                error: "Không thể tạo câu hỏi từ AI", 
                details: error.message 
            }, null, 2);
        }
        
        return JSON.stringify({ 
            error: "Đã xảy ra lỗi không xác định",
            details: "Vui lòng thử lại sau"
        }, null, 2);
    }
};