import React from 'react';
import QuestionCard from '../QuestionCard';
import type { Question } from '../../types';

interface QuestionGridProps {
  filteredQuestions: Question[];
  handleQuestionToggle: (questionId: string) => void;
  selectedQuestionIds: string[];
}

const QuestionGrid: React.FC<QuestionGridProps> = ({
  filteredQuestions,
  handleQuestionToggle,
  selectedQuestionIds
}) => {
  return (
    <div className="grid gap-6">
      {filteredQuestions.map((question, index) => {
        return (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            onSelect={handleQuestionToggle}
            isSelected={selectedQuestionIds.includes(question.id)}
          />
        );
      })}
    </div>
  );
};

export default QuestionGrid;