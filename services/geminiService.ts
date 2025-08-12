
import { GoogleGenAI, Type } from "@google/genai";

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. AI features will not work.");
}

let ai: GoogleGenAI | null = null;
if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const generateQuizQuestions = async (prompt: string): Promise<string> => {
    try {
        if (!ai) {
            return JSON.stringify({ 
                error: "API Key chưa được cấu hình", 
                details: "Vui lòng thiết lập API_KEY để sử dụng tính năng AI" 
            }, null, 2);
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "Bạn là một giáo viên Toán THPT chuyên nghiệp ở Việt Nam. Nhiệm vụ của bạn là tạo ra các câu hỏi trắc nghiệm Toán học chất lượng cao bằng tiếng Việt. Tất cả các công thức toán phải được bao quanh bởi cú pháp LaTeX (ví dụ: $y = x^2 + 1$ hoặc $$ \\int_0^1 x \\,dx $$). Cung cấp lời giải chi tiết và rõ ràng cho mỗi câu hỏi. Hãy tuân thủ nghiêm ngặt cấu trúc JSON được yêu cầu.",
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
                            description: "Danh sách các câu hỏi trắc nghiệm.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING, description: "ID duy nhất cho câu hỏi, ví dụ 'mcq1'." },
                                    question: { type: Type.STRING, description: "Nội dung câu hỏi, định dạng bằng LaTeX." },
                                    option_a: { type: Type.STRING, description: "Phương án A, định dạng bằng LaTeX." },
                                    option_b: { type: Type.STRING, description: "Phương án B, định dạng bằng LaTeX." },
                                    option_c: { type: Type.STRING, description: "Phương án C, định dạng bằng LaTeX." },
                                    option_d: { type: Type.STRING, description: "Phương án D, định dạng bằng LaTeX." },
                                    correct_option: { type: Type.STRING, description: "Đáp án đúng, là một trong các ký tự 'A', 'B', 'C', 'D'." },
                                    explanation: { type: Type.STRING, description: "Lời giải chi tiết cho câu hỏi, định dạng bằng LaTeX." }
                                },
                                required: ["id", "question", "option_a", "option_b", "option_c", "option_d", "correct_option", "explanation"]
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
