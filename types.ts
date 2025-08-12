
export enum QuestionType {
  MultipleChoice = 'multipleChoice',
  TrueFalse = 'trueFalse',
  ShortAnswer = 'shortAnswer',
}

export interface MultipleChoiceQuestion {
  id: string;
  question: string;
  options: string[];
  answer: string;
}

export interface TrueFalseQuestion {
  id: string;
  statement: string;
  answer: boolean;
}

export interface ShortAnswerQuestion {
  id: string;
  question: string;
  answer: string;
}

export type Question = MultipleChoiceQuestion | TrueFalseQuestion | ShortAnswerQuestion;

export interface QuizData {
  title: string;
  questions: {
    multipleChoice: MultipleChoiceQuestion[];
    trueFalse: TrueFalseQuestion[];
    shortAnswer: ShortAnswerQuestion[];
  };
}

export interface Lesson {
  name: string;
  path: string;
}

export interface Grade {
  name: string;
  lessons: Lesson[];
}
