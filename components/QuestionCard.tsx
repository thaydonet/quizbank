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
      : question.type === 'msq'
        ? [
            { key: 'a', value: question.option_a || '' },
            { key: 'b', value: question.option_b || '' },
            { key: 'c', value: question.option_c || '' },
            { key: 'd', value: question.option_d || '' },
          ].filter(opt => opt.value)
        : [
            { key: 'A', value: question.option_a || '' },
            { key: 'B', value: question.option_b || '' },
            { key: 'C', value: question.option_c || '' },
            { key: 'D', value: question.option_d || '' },
          ].filter(opt => opt.value);

  const getOptionClasses = (optionKey: string) => {
    if (!showAnswer) {
      return "border-gray-200 bg-gray-50 hover:bg-gray-100";
    }
    // Đáp án đúng cho msq có thể là a,b,c,d hoặc A,B,C,D
    const correctOptions = question.correct_option.split(',').map(x => x.trim().toLowerCase());
    if (correctOptions.includes(optionKey.toLowerCase())) {
      return "border-green-300 bg-green-100 ring-2 ring-green-200";
    }
    return "border-gray-200 bg-gray-50";
  };

  const getQuestionTypeBadge = () => {
    const baseClasses = "text-xs font-semibold px-2.5 py-1 rounded-full";
    switch (question.type) {
      case 'mcq':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Trắc nghiệm</span>;
      case 'msq':
        return <span className={`${baseClasses} bg-purple-100 text-purple-800`}>Đúng - Sai</span>;
      case 'sa':
        return <span className={`${baseClasses} bg-amber-100 text-amber-800`}>Trả lời ngắn</span>;
      default:
        return null;
    }
  };
  
  // Sửa lại: Đơn giản hóa logic xử lý click
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    
    // Ngăn click khi click vào button "Xem đáp án" hoặc checkbox
    if (target.closest('button') || target.closest('input[type="checkbox"]')) {
      return;
    }
    
    onSelect(question.id);
  };
  
  // Xử lý click button riêng biệt
  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setShowAnswer(!showAnswer);
  };

  // Xử lý click checkbox riêng biệt
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect(question.id);
  };

  // Sửa lại keyboard handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onSelect(question.id);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
        isSelected 
          ? 'border-indigo-500 shadow-lg ring-2 ring-indigo-200 bg-indigo-50/30' 
          : 'border-transparent hover:border-indigo-300 shadow-sm'
      }`}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`Câu hỏi ${index + 1}`}
    >
      <div className="flex justify-between items-start mb-4">
          <div className="flex items-start gap-4 flex-grow">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxChange}
              className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 mr-2"
              aria-label={`Chọn câu hỏi ${index + 1}`}
            />
            <p className="font-semibold text-gray-900 flex-grow">
              <span className="text-indigo-600 mr-2">{`Câu ${index + 1}:`}</span>
              <MathContent content={question.question} />
              {isSelected && (
                <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                  ✓ Đã chọn
                </span>
              )}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            {getQuestionTypeBadge()}
          </div>
      </div>

      <div className="pl-9 space-y-4">
        {question.type !== 'sa' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {options.map((option, idx) => (
              <div key={option.key} className={`p-3 border rounded-lg text-gray-800 transition-all ${getOptionClasses(option.key)} flex items-start gap-2`}>
                <strong className="font-semibold">
                  {question.type === 'msq' ? `${option.key})` : `${option.key}.`}
                </strong>
                <MathContent content={option.value} />
              </div>
            ))}
          </div>
        )}

        {showAnswer && (
          <div className="mt-6 p-4 bg-gray-50/70 border-t border-gray-200 rounded-b-lg -m-5 mt-5 pt-5">
            {question.type === 'sa' && (
                 <div className="mb-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Đáp án đúng:</h4>
                    <div className="p-3 bg-white rounded-md border border-gray-200 text-green-700 font-bold">
                        <MathContent content={question.correct_option} />
                    </div>
                 </div>
            )}
            <h4 className="font-semibold text-gray-700 mb-2">Lời giải chi tiết:</h4>
            <div className="text-gray-600 leading-relaxed prose prose-sm max-w-none">
                <MathContent content={question.explanation} />
            </div>
          </div>
        )}
      </div>
      
      <div className={`flex justify-end ${showAnswer ? 'mt-0' : 'mt-4'}`}>
        <button
          onClick={handleButtonClick}
          className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
        >
          {showAnswer ? 'Ẩn đáp án & Lời giải' : 'Xem đáp án & Lời giải'}
        </button>
      </div>
    </div>
  );
};

export default QuestionCard;