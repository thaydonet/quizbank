import React from 'react';

interface SelectionStatsProps {
  getTotalSelectedCount: () => number;
  globalSelectedCounts: {
    all: number;
    mcq: number;
    msq: number;
    sa: number;
  };
}

const SelectionStats: React.FC<SelectionStatsProps> = ({
  getTotalSelectedCount,
  globalSelectedCounts
}) => {
  if (getTotalSelectedCount() === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <p className="text-blue-800 font-medium">
        Bạn đã chọn được{' '}
        <span className="font-bold">{globalSelectedCounts.mcq} câu trắc nghiệm</span>;{' '}
        <span className="font-bold">{globalSelectedCounts.msq} câu đúng sai</span>;{' '}
        <span className="font-bold">{globalSelectedCounts.sa} câu TLN</span>
      </p>
    </div>
  );
};

export default SelectionStats;