
export interface MultipleChoiceQuestion {
  id: string;
  question: string; // Will contain LaTeX
  option_a: string; // Will contain LaTeX
  option_b: string; // Will contain LaTeX
  option_c: string; // Will contain LaTeX
  option_d: string; // Will contain LaTeX
  correct_option: 'A' | 'B' | 'C' | 'D';
  explanation: string; // Will contain LaTeX
}

export type Question = MultipleChoiceQuestion;

export interface QuizData {
  title: string;
  questions: MultipleChoiceQuestion[];
}

export interface Lesson {
  name: string;
  path: string;
}

export interface Grade {
  name: string;
  lessons: Lesson[];
}
