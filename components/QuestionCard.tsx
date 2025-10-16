import React, { useState, useMemo, useCallback } from 'react';
import type { Question } from '../types';
import MathContent from './MathContent';
import { DynamicQuestionEngine } from '../services/dynamicQuestionEngine';
import SparklesIcon from './icons/SparklesIcon';

interface QuestionCardProps {
  question: Question;
  index: number;
  onSelect: (id: string) => void;
  isSelected: boolean;
  showAnswer?: boolean;
  onToggleAnswer?: (id: string) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  index, 
  onSelect, 
  isSelected,
  showAnswer: externalShowAnswer,
  onToggleAnswer
}) => {
  const [internalShowAnswer, setInternalShowAnswer] = useState(false);
  const [processedQuestion, setProcessedQuestion] = useState<any>(null);
  
  // Use external or internal show answer state
  const showAnswer = externalShowAnswer !== undefined ? externalShowAnswer : internalShowAnswer;
  
  const engine = useMemo(() => new DynamicQuestionEngine(), []);
  const isDynamic = useMemo(() => engine.isDynamicQuestion(question), [engine, question]);

  // Generate a processed version for dynamic questions
  React.useEffect(() => {
    if (isDynamic && !processedQuestion) {
      try {
        const processed = engine.processQuestion(question);
        setProcessedQuestion(processed);
      } catch (error) {
        console.error('Error processing dynamic question:', error);
      }
    }
  }, [question, isDynamic, engine, processedQuestion]);

  // Use processed question for display if available
  const displayQuestion = useMemo(() => 
    isDynamic && processedQuestion ? processedQuestion : question,
    [isDynamic, processedQuestion, question]
  );

  const options = useMemo((): { key: string; value: string }[] => {
    if (displayQuestion.type === 'sa') return [];
    
    const baseOptions = displayQuestion.type === 'msq'
      ? [
          { key: 'a', value: displayQuestion.option_a || '' },
          { key: 'b', value: displayQuestion.option_b || '' },
          { key: 'c', value: displayQuestion.option_c || '' },
          { key: 'd', value: displayQuestion.option_d || '' },
        ]
      : [
          { key: 'A', value: displayQuestion.option_a || '' },
          { key: 'B', value: displayQuestion.option_b || '' },
          { key: 'C', value: displayQuestion.option_c || '' },
          { key: 'D', value: displayQuestion.option_d || '' },
        ];
    
    return baseOptions.filter(opt => opt.value);
  }, [displayQuestion]);

  const getOptionClasses = useCallback((optionKey: string) => {
    if (!showAnswer) {
      return "border-gray-200 bg-gray-50 hover:bg-gray-100";
    }
    // Đáp án đúng cho msq có thể là a,b,c,d hoặc A,B,C,D
    const correctOptions = displayQuestion.correct_option.split(',').map(x => x.trim().toLowerCase());
    if (correctOptions.includes(optionKey.toLowerCase())) {
      return "border-green-300 bg-green-100 ring-2 ring-green-200";
    }
    return "border-gray-200 bg-gray-50";
  }, [showAnswer, displayQuestion.correct_option]);

  const getQuestionTypeBadge = useCallback(() => {
    const baseClasses = "text-xs font-semibold px-2.5 py-1 rounded-full";
    switch (displayQuestion.type) {
      case 'mcq':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Trắc nghiệm</span>;
      case 'msq':
        return <span className={`${baseClasses} bg-purple-100 text-purple-800`}>Đúng - Sai</span>;
      case 'sa':
        return <span className={`${baseClasses} bg-amber-100 text-amber-800`}>Trả lời ngắn</span>;
      default:
        return null;
    }
  }, [displayQuestion.type]);

  const regenerateDynamic = useCallback(() => {
    if (isDynamic) {
      try {
        const newProcessed = engine.processQuestion(question);
        setProcessedQuestion(newProcessed);
      } catch (error) {
        console.error('Error regenerating dynamic question:', error);
      }
    }
  }, [isDynamic, engine, question]);
  
  // Xử lý click checkbox - cách chính để chọn câu hỏi
  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect(question.id);
  }, [onSelect, question.id]);

  // Xử lý click button "Xem đáp án"
  const handleButtonClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleAnswer) {
      onToggleAnswer(question.id);
    } else {
      setInternalShowAnswer(!showAnswer);
    }
  }, [onToggleAnswer, question.id, showAnswer]);

  // Xử lý click vào card (không bao gồm checkbox và button)
  const handleCardClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    
    // Ngăn click khi click vào các element interactive
    if (target.closest('input') || 
        target.closest('button') || 
        target.closest('a') ||
        target.closest('[role="button"]')) {
      return;
    }
    
    // Click vào card sẽ toggle selection
    onSelect(question.id);
  }, [onSelect, question.id]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onSelect(question.id);
    }
  }, [onSelect, question.id]);

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
      aria-pressed={isSelected}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start gap-4 flex-grow">
          <div className="flex-shrink-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxChange}
              className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
              aria-label={`Chọn câu hỏi ${index + 1}`}
              onClick={(e) => e.stopPropagation()} // Ngăn bubble up
            />
          </div>
          <div className="flex-grow">
            <p className="font-semibold text-gray-900">
              <span className="text-indigo-600 mr-2">{`Câu ${index + 1}:`}</span>
              <MathContent content={displayQuestion.question} />
              {isDynamic && (
                <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full inline-flex items-center gap-1">
                  <SparklesIcon className="w-3 h-3" />
                  Động
                </span>
              )}
              {isSelected && (
                <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                  ✓ Đã chọn
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          {getQuestionTypeBadge()}
        </div>
      </div>

      <div className="pl-9 space-y-4">
        {question.type !== 'sa' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {options.map((option) => (
              <div 
                key={option.key} 
                className={`p-3 border rounded-lg text-gray-800 transition-all ${getOptionClasses(option.key)} flex items-start gap-2`}
              >
                <strong className="font-semibold">
                  {displayQuestion.type === 'msq' ? `${option.key})` : `${option.key}.`}
                </strong>
                <MathContent content={option.value} />
              </div>
            ))}
          </div>
        )}

        {showAnswer && (
          <div className="mt-6 p-4 bg-gray-50/70 border-t border-gray-200 rounded-b-lg -m-5 mt-5 pt-5">
            {displayQuestion.type === 'sa' && (
                 <div className="mb-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Đáp án đúng:</h4>
                    <div className="p-3 bg-white rounded-md border border-gray-200 text-green-700 font-bold">
                        <MathContent content={displayQuestion.correct_option} />
                    </div>
                 </div>
            )}
            {isDynamic && processedQuestion && (
              <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-semibold text-purple-700 mb-2 flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4" />
                  Biến số đã sinh:
                </h4>
                <div className="text-sm text-purple-600">
                  {Object.entries(processedQuestion.variables).map(([name, value]) => (
                    <span key={name} className="inline-block mr-3 mb-1">
                      {name} = {String(value)}
                    </span>
                  ))}
                </div>
                <button
                  onClick={regenerateDynamic}
                  className="mt-2 px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                >
                  Tạo lại biến số
                </button>
              </div>
            )}
            <h4 className="font-semibold text-gray-700 mb-2">Lời giải chi tiết:</h4>
            <div className="text-gray-600 leading-relaxed prose prose-sm max-w-none">
                <MathContent content={displayQuestion.explanation} />
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