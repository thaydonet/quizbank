import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Question } from '../types';
import QuestionCard from './QuestionCard';

interface VirtualQuestionListProps {
  questions: Question[];
  selectedQuestionIds: string[];
  onQuestionToggle: (questionId: string) => void;
  itemHeight?: number;
  containerHeight?: number;
  overscan?: number;
}

const VirtualQuestionList: React.FC<VirtualQuestionListProps> = ({
  questions,
  selectedQuestionIds,
  onQuestionToggle,
  itemHeight = 300, // Estimated height per question card
  containerHeight = 600,
  overscan = 5
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerRect, setContainerRect] = useState({ height: containerHeight });
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Update container dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerRect({ height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const height = containerRect.height;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      questions.length - 1,
      Math.ceil((scrollTop + height) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, containerRect.height, itemHeight, overscan, questions.length]);

  // Calculate total height and visible items
  const totalHeight = questions.length * itemHeight;
  const visibleItems = useMemo(() => {
    const items = [];
    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
      if (questions[i]) {
        items.push({
          index: i,
          question: questions[i],
          top: i * itemHeight
        });
      }
    }
    return items;
  }, [visibleRange, questions, itemHeight]);

  // Scroll to specific question
  const scrollToQuestion = useCallback((index: number) => {
    if (scrollElementRef.current) {
      const targetScrollTop = index * itemHeight;
      scrollElementRef.current.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }
  }, [itemHeight]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full"
      style={{ height: containerHeight }}
    >
      <div
        ref={scrollElementRef}
        className="w-full h-full overflow-auto"
        onScroll={handleScroll}
      >
        <div
          className="relative"
          style={{ height: totalHeight }}
        >
          {visibleItems.map(({ index, question, top }) => (
            <div
              key={question.id}
              className="absolute w-full px-4"
              style={{
                top,
                height: itemHeight,
                transform: 'translateZ(0)' // Force GPU acceleration
              }}
            >
              <div className="h-full pb-4">
                <QuestionCard
                  question={question}
                  index={index}
                  onSelect={onQuestionToggle}
                  isSelected={selectedQuestionIds.includes(question.id)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Scroll indicator */}
      {questions.length > 0 && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          {visibleRange.startIndex + 1}-{Math.min(visibleRange.endIndex + 1, questions.length)} / {questions.length}
        </div>
      )}
    </div>
  );
};

export default VirtualQuestionList;