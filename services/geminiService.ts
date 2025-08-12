
import { GoogleGenAI, Type } from "@google/genai";

if (!process.env.API_KEY) {
    // In a real app, this would be a fatal error.
    // Here we console.warn for development purposes.
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
                systemInstruction: "Bạn là một giáo viên Toán THPT chuyên nghiệp ở Việt Nam. Nhiệm vụ của bạn là tạo ra các câu hỏi trắc nghiệm Toán học chất lượng cao bằng tiếng Việt dựa trên yêu cầu của người dùng. Hãy tuân thủ nghiêm ngặt cấu trúc JSON được yêu cầu.",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: {
                            type: Type.STRING,
                            description: "Tiêu đề của bài kiểm tra, ví dụ: 'Bài 3: Giá trị lớn nhất và nhỏ nhất của hàm số'."
                        },
                        questions: {
                            type: Type.OBJECT,
                            properties: {
                                multipleChoice: {
                                    type: Type.ARRAY,
                                    description: "Danh sách các câu hỏi trắc nghiệm nhiều lựa chọn.",
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            id: { type: Type.STRING, description: "ID duy nhất cho câu hỏi, ví dụ 'mcq1'." },
                                            question: { type: Type.STRING, description: "Nội dung câu hỏi." },
                                            options: {
                                                type: Type.ARRAY,
                                                description: "Danh sách 4 phương án trả lời A, B, C, D.",
                                                items: { type: Type.STRING }
                                            },
                                            answer: { type: Type.STRING, description: "Đáp án đúng, phải là một trong các phương án trong 'options'." }
                                        },
                                        required: ["id", "question", "options", "answer"]
                                    }
                                },
                                trueFalse: {
                                    type: Type.ARRAY,
                                    description: "Danh sách các câu hỏi dạng Đúng/Sai.",
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            id: { type: Type.STRING, description: "ID duy nhất cho câu hỏi, ví dụ 'tf1'." },
                                            statement: { type: Type.STRING, description: "Mệnh đề cần xác định Đúng hay Sai." },
                                            answer: { type: Type.BOOLEAN, description: "Đáp án đúng (true) hoặc sai (false)." }
                                        },
                                        required: ["id", "statement", "answer"]
                                    }
                                },
                                shortAnswer: {
                                    type: Type.ARRAY,
                                    description: "Danh sách các câu hỏi dạng trả lời ngắn.",
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            id: { type: Type.STRING, description: "ID duy nhất cho câu hỏi, ví dụ 'sa1'." },
                                            question: { type: Type.STRING, description: "Nội dung câu hỏi." },
                                            answer: { type: Type.STRING, description: "Đáp án ngắn gọn." }
                                        },
                                        required: ["id", "question", "answer"]
                                    }
                                }
                            }
                        }
                    },
                    required: ["title", "questions"]
                }
            }
        });

        const jsonString = response.text.trim();
        // Basic validation, pretty print for readability in the UI
        JSON.parse(jsonString);
        return JSON.stringify(JSON.parse(jsonString), null, 2);

    } catch (error) {
        console.error("Error generating quiz questions:", error);
        if (error instanceof Error) {
            return JSON.stringify({ error: "Không thể tạo câu hỏi từ AI", details: error.message }, null, 2);
        }
        return JSON.stringify({ error: "Đã xảy ra lỗi không xác định" }, null, 2);
    }
};
