
export interface Question {
  id: string;
  type: 'mcq' | 'msq' | 'sa'; // mcq: single-choice, msq: multi-choice, sa: short-answer
  question: string; // Will contain LaTeX
  option_a?: string; // Will contain LaTeX
  option_b?: string; // Will contain LaTeX
  option_c?: string; // Will contain LaTeX
  option_d?: string; // Will contain LaTeX
  correct_option: string; // 'A' for mcq, 'A,C' for msq, 'the answer' for sa
  explanation: string; // Will contain LaTeX
}

export type MultipleChoiceQuestion = Question;

export interface QuizData {
  title: string;
  questions: Question[];
}

export interface Lesson {
  name: string;
  path: string;
}

export interface Grade {
  name: string;
  lessons: Lesson[];
}
