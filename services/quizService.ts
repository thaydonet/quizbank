import type { Question } from '../types';

export interface SavedQuiz {
  id: string;
  title: string;
  slug: string;
  questions: Question[];
  createdAt: string;
  questionCount: number;
  mcqCount: number;
  msqCount: number;
  saCount: number;
}

const STORAGE_KEY = 'saved_quizzes';

export class QuizService {
  static getAllQuizzes(): SavedQuiz[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static saveQuiz(title: string, questions: Question[]): SavedQuiz {
    const quizzes = this.getAllQuizzes();
    
    // Tạo slug từ title
    const slug = this.generateSlug(title);
    
    // Đếm số câu hỏi theo loại
    const mcqCount = questions.filter(q => q.type === 'mcq').length;
    const msqCount = questions.filter(q => q.type === 'msq').length;
    const saCount = questions.filter(q => q.type === 'sa').length;
    
    const newQuiz: SavedQuiz = {
      id: this.generateId(),
      title,
      slug,
      questions,
      createdAt: new Date().toISOString(),
      questionCount: questions.length,
      mcqCount,
      msqCount,
      saCount
    };
    
    quizzes.unshift(newQuiz); // Thêm vào đầu danh sách
    
    // Giới hạn số lượng quiz lưu trữ (tối đa 50)
    if (quizzes.length > 50) {
      quizzes.splice(50);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quizzes));
    return newQuiz;
  }

  static getQuizById(id: string): SavedQuiz | null {
    const quizzes = this.getAllQuizzes();
    return quizzes.find(quiz => quiz.id === id) || null;
  }

  static deleteQuiz(id: string): boolean {
    const quizzes = this.getAllQuizzes();
    const index = quizzes.findIndex(quiz => quiz.id === id);
    
    if (index !== -1) {
      quizzes.splice(index, 1);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(quizzes));
      return true;
    }
    
    return false;
  }

  static clearAllQuizzes(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
      .replace(/[^a-z0-9\s-]/g, '') // Chỉ giữ chữ, số, space, dấu gạch ngang
      .replace(/\s+/g, '-') // Thay space bằng dấu gạch ngang
      .replace(/-+/g, '-') // Loại bỏ dấu gạch ngang liên tiếp
      .trim()
      .substring(0, 50); // Giới hạn độ dài
  }
}