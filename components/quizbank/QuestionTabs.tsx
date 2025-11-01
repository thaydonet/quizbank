import React from 'react';
import type { Question } from '../../types';

interface QuestionTabsProps {
  counts: {
    all: number;
    mcq: number;
    msq: number;
    sa: number;
  };
  globalSelectedCounts: {
    all: number;
    mcq: number;
    msq: number;
    sa: number;
  };
  activeTab: 'all' | 'mcq' | 'msq' | 'sa';
  setActiveTab: (tab: 'all' | 'mcq' | 'msq' | 'sa') => void;
  filteredQuestions: Question[];
  selectedQuestionIds: string[];
  handleSelectAll: () => void;
  handleDeselectAll: () => void;
}

const QuestionTabs: React.FC<QuestionTabsProps> = ({
  counts,
  globalSelectedCounts,
  activeTab,
  setActiveTab,
  filteredQuestions,
  selectedQuestionIds,
  handleSelectAll,
  handleDeselectAll
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'Tất cả', count: counts.all, selectedCount: globalSelectedCounts.all },
          { key: 'mcq', label: 'Trắc nghiệm', count: counts.mcq, selectedCount: globalSelectedCounts.mcq },
          { key: 'msq', label: 'Đúng/Sai', count: counts.msq, selectedCount: globalSelectedCounts.msq },
          { key: 'sa', label: 'Trả lời ngắn', count: counts.sa, selectedCount: globalSelectedCounts.sa }
        ].map(({ key, label, count, selectedCount }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === key
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
          >
            {label} ({selectedCount}/{count})
          </button>
        ))}
      </div>

      {/* Select All / Deselect All buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSelectAll}
          disabled={filteredQuestions.length === 0 || filteredQuestions.every(q => selectedQuestionIds.includes(q.id))}
          className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ✓ Chọn tất cả
        </button>
        <button
          onClick={handleDeselectAll}
          disabled={selectedQuestionIds.length === 0}
          className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ✗ Bỏ chọn tất cả
        </button>
      </div>
    </div>
  );
};

export default QuestionTabs;