import { GoogleGenAI, Type } from "@google/genai";
import { ApiKeyManager } from "./apiKeyManager";

// Fallback API key từ environment (optional)
const fallbackApiKey = import.meta.env.VITE_API_KEY;

/**
 * Lấy API key theo thứ tự ưu tiên:
 * 1. API key cá nhân của giáo viên (localStorage)
 * 2. Fallback API key từ environment
 */
const getApiKey = (): string | null => {
    // Ưu tiên API key cá nhân của giáo viên
    const personalApiKey = ApiKeyManager.getApiKey('gemini');
    if (personalApiKey) {
        return personalApiKey;
    }
    
    // Fallback to environment API key
    if (fallbackApiKey) {
        return fallbackApiKey;
    }
    
    return null;
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
            const hasPersonalKey = ApiKeyManager.hasApiKey('gemini');
            const hasFallbackKey = !!fallbackApiKey;
            
            let errorMessage = "API Key chưa được cấu hình";
            let details = "";
            
            if (!hasPersonalKey && !hasFallbackKey) {
                details = "Vui lòng thêm API Key Gemini cá nhân trong phần Cài đặt AI";
            } else if (hasPersonalKey) {
                details = "API Key cá nhân không hợp lệ. Vui lòng kiểm tra lại trong Cài đặt AI";
            } else {
                details = "Không thể kết nối với Gemini AI. Vui lòng thử lại sau";
            }
            
            return JSON.stringify({ 
                error: errorMessage,
                details: details,
                hasPersonalKey,
                hasFallbackKey
            }, null, 2);
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "Bạn là một giáo viên Toán THPT chuyên nghiệp ở Việt Nam. Nhiệm vụ của bạn là tạo ra các câu hỏi Toán học chất lượng cao bằng tiếng Việt, bao gồm 3 dạng: trắc nghiệm một lựa chọn (mcq), trắc nghiệm nhiều lựa chọn (msq), và trả lời ngắn (sa). Luôn tuân thủ nghiêm ngặt cấu trúc JSON được yêu cầu cho từng loại.\n\n- Dạng 'mcq': câu hỏi có 4 phương án và chỉ có MỘT đáp án đúng. `correct_option` là một ký tự duy nhất ('A', 'B', 'C', hoặc 'D').\n- Dạng 'msq': câu hỏi có 4 phương án và có MỘT hoặc NHIỀU đáp án đúng. `correct_option` là một chuỗi các ký tự đáp án đúng, cách nhau bởi dấu phẩy (ví dụ: 'A,C').\n- Dạng 'sa': câu hỏi điền đáp án. Không có các phương án `option_a, b, c, d`. `correct_option` là đáp án dạng chuỗi (ví dụ: '12.5' hoặc '42').\n\nToàn bộ công thức toán học phải được bao quanh bởi cú pháp LaTeX (ví dụ: $y = x^2$ hoặc $$\\int_0^1 x\\,dx$$). Cung cấp lời giải chi tiết và rõ ràng cho mỗi câu hỏi.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: {
                            type: Type.STRING,
                            description: "Tiêu đề của bộ câu hỏi, ví dụ: 'Bài 3: Giá trị lớn nhất và nhỏ nhất của hàm số'."
                        },
                        questions: {
                            type: Type.ARRAY,
                            description: "Danh sách các câu hỏi.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING, description: "ID duy nhất, ví dụ 'mcq1'." },
                                    type: { type: Type.STRING, description: "Loại câu hỏi: 'mcq', 'msq', hoặc 'sa'." },
                                    question: { type: Type.STRING, description: "Nội dung câu hỏi (dùng LaTeX)." },
                                    option_a: { type: Type.STRING, description: "Phương án A (chỉ cho mcq/msq)." },
                                    option_b: { type: Type.STRING, description: "Phương án B (chỉ cho mcq/msq)." },
                                    option_c: { type: Type.STRING, description: "Phương án C (chỉ cho mcq/msq)." },
                                    option_d: { type: Type.STRING, description: "Phương án D (chỉ cho mcq/msq)." },
                                    correct_option: { type: Type.STRING, description: "Đáp án đúng. Dạng 'A' cho mcq; 'A,C' cho msq; 'câu trả lời' cho sa." },
                                    explanation: { type: Type.STRING, description: "Lời giải chi tiết (dùng LaTeX)." }
                                },
                                required: ["id", "type", "question", "correct_option", "explanation"]
                            }
                        }
                    },
                    required: ["title", "questions"]
                }
            }
        });

        const jsonString = response.text.trim();
        JSON.parse(jsonString); // Basic validation
        return JSON.stringify(JSON.parse(jsonString), null, 2);

    } catch (error) {
        console.error("Error generating quiz questions:", error);
        if (error instanceof Error) {
            return JSON.stringify({ error: "Không thể tạo câu hỏi từ AI", details: error.message }, null, 2);
        }
        return JSON.stringify({ error: "Đã xảy ra lỗi không xác định" }, null, 2);
    }
};
