
import React, { useState } from 'react';
import type { Question, MultipleChoiceQuestion, TrueFalseQuestion, ShortAnswerQuestion } from '../types';
import { QuestionType } from '../types';

interface QuestionCardProps {
  question: Question;
  index: number;
  type: QuestionType;
}

const isMultipleChoice = (q: Question, type: QuestionType): q is MultipleChoiceQuestion => type === QuestionType.MultipleChoice;
const isTrueFalse = (q: Question, type: QuestionType): q is TrueFalseQuestion => type === QuestionType.TrueFalse;
const isShortAnswer = (q: Question, type: QuestionType): q is ShortAnswerQuestion => type === QuestionType.ShortAnswer;

const QuestionCard: React.FC<QuestionCardProps> = ({ question, index, type }) => {
  const [showAnswer, setShowAnswer] = useState(false);

  const renderQuestionBody = () => {
    if (isMultipleChoice(question, type)) {
      return (
        <div>
          <p className="font-medium text-gray-800 mb-4">{`Câu ${index + 1}: ${question.question}`}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {question.options.map((option, i) => (
              <div key={i} className="p-3 bg-gray-50 border rounded-md">
                {String.fromCharCode(65 + i)}. {option}
              </div>
            ))}
          </div>
          {showAnswer && (
             <div className="mt-4 p-3 bg-green-100 border border-green-300 text-green-800 rounded-md">
                <strong>Đáp án đúng:</strong> {question.answer}
             </div>
          )}
        </div>
      );
    }
    if (isTrueFalse(question, type)) {
        return (
            <div>
                <p className="font-medium text-gray-800 mb-4">{`Câu ${index + 1}: ${question.statement}`}</p>
                 {showAnswer && (
                    <div className="mt-4 p-3 bg-green-100 border border-green-300 text-green-800 rounded-md">
                        <strong>Đáp án:</strong> {question.answer ? 'Đúng' : 'Sai'}
                    </div>
                 )}
            </div>
        );
    }
    if (isShortAnswer(question, type)) {
        return (
            <div>
                <p className="font-medium text-gray-800 mb-4">{`Câu ${index + 1}: ${question.question}`}</p>
                 {showAnswer && (
                    <div className="mt-4 p-3 bg-green-100 border border-green-300 text-green-800 rounded-md">
                        <strong>Đáp án:</strong> {question.answer}
                    </div>
                 )}
            </div>
        );
    }
    return null;
  };
  
  return (
     <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
        {renderQuestionBody()}
        <div className="mt-4 text-right">
             <button
                onClick={() => setShowAnswer(!showAnswer)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                {showAnswer ? 'Ẩn đáp án' : 'Xem đáp án'}
            </button>
        </div>
     </div>
  );
};

export default QuestionCard;
