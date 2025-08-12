
import React, { useState } from 'react';
import type { Question } from '../types';
import MathContent from './MathContent';

interface QuestionCardProps {
  question: Question;
  index: number;
  onSelect: (id: string) => void;
  isSelected: boolean;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, index, onSelect, isSelected }) => {
  const [showAnswer, setShowAnswer] = useState(false);

  const options: { key: string; value: string }[] =
    question.type === 'sa'
      ? []
      : [
          { key: 'A', value: question.option_a || '' },
          { key: 'B', value: question.option_b || '' },
          { key: 'C', value: question.option_c || '' },
          { key: 'D', value: question.option_d || '' },
        ];

  const getOptionClasses = (optionKey: string) => {
    if (!showAnswer) {
      return "border-gray-200 bg-gray-50";
    }
    const correctOptions = question.correct_option.split(',');
    if (correctOptions.includes(optionKey)) {
      return "border-green-400 bg-green-100 ring-2 ring-green-300";
    }
    return "border-gray-200 bg-gray-50";
  };

  const getQuestionTypeBadge = () => {
    switch (question.type) {
      case 'mcq':
        return <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">1 Đáp án</span>;
      case 'msq':
        return <span className="text-xs font-medium bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">Nhiều đáp án</span>;
      case 'sa':
        return <span className="text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Trả lời ngắn</span>;
      default:
        return null;
    }
  };


  return (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 relative">
      <div className="absolute top-4 left-4">
        <input
          type="checkbox"
          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          checked={isSelected}
          onChange={() => onSelect(question.id)}
          aria-label={`Select question ${index + 1}`}
        />
      </div>
      <div className="pl-8">
        <div className="font-semibold text-gray-800 mb-4 flex items-start gap-2">
          <span className="mt-1">{`Câu ${index + 1}:`}</span>
          <div className="flex-grow">
            <MathContent content={question.question} />
            <div className="mt-2">{getQuestionTypeBadge()}</div>
          </div>
        </div>

        {question.type !== 'sa' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {options.map((option) => (
              <div key={option.key} className={`p-3 border rounded-md text-gray-700 transition-all ${getOptionClasses(option.key)}`}>
                <strong className="mr-2">{option.key}.</strong>
                <MathContent content={option.value} />
              </div>
            ))}
          </div>
        )}

        {showAnswer && (
          <div className="mt-4 p-4 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-md">
            {question.type === 'sa' && (
                 <div className="mb-3">
                    <h4 className="font-semibold text-indigo-800 mb-1">Đáp án đúng:</h4>
                    <div className="p-2 bg-white rounded-md border border-indigo-200">
                        <MathContent content={question.correct_option} />
                    </div>
                 </div>
            )}
            <h4 className="font-semibold text-indigo-800 mb-2">Lời giải chi tiết:</h4>
            <div className="text-gray-700 leading-relaxed">
                <MathContent content={question.explanation} />
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 text-right">
        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {showAnswer ? 'Ẩn đáp án & Lời giải' : 'Xem đáp án & Lời giải'}
        </button>
      </div>
    </div>
  );
};

export default QuestionCard;
