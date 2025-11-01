import React from 'react';
import PrinterIcon from '../icons/PrinterIcon';
import PlayCircleIcon from '../icons/PlayCircleIcon';

interface ActionButtonsProps {
  getTotalSelectedCount: () => number;
  handleOfflineExam: () => void;
  handleOnlineExam: () => void;
  setShowWordPressModal: (show: boolean) => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  getTotalSelectedCount,
  handleOfflineExam,
  handleOnlineExam,
  setShowWordPressModal
}) => {
  if (getTotalSelectedCount() === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 flex gap-3">
      <button
        onClick={() => setShowWordPressModal(true)}
        className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 shadow-lg"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21.469 6.825c.84 1.537 1.318 3.3 1.318 5.175 0 3.979-2.156 7.456-5.363 9.325l3.295-9.527c.615-1.54.82-2.771.82-3.864 0-.405-.026-.78-.07-1.11m-7.981.105c.647-.03 1.232-.105 1.232-.105.582-.075.514-.93-.067-.899 0 0-1.755.135-2.88.135-1.064 0-2.85-.135-2.85-.135-.584-.031-.661.854-.082.899 0 0 .541.075 1.115.105l1.65 4.53-2.31 6.92-3.85-11.45c.645-.03 1.231-.105 1.231-.105.582-.075.516-.93-.065-.899 0 0-1.755.135-2.88.135-.202 0-.438-.008-.69-.015C4.911 2.015 8.235 0 12.001 0c2.756 0 5.27 1.055 7.13 2.78-.045-.003-.087-.008-.125-.008-.202 0-.438-.008-.69-.015-.647.03-1.232.105-1.232.105-.582.075-.514.93.067.899 0 0 .541-.075 1.115-.105l1.65-4.53 2.31-6.92 3.85 11.45z"/>
        </svg>
        <span className="hidden sm:inline">Tạo shortcode WP</span>
        <span className="sm:hidden">WP</span>
      </button>

      <button
        onClick={handleOfflineExam}
        disabled={getTotalSelectedCount() === 0}
        className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed shadow-lg"
      >
        <PrinterIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Tải đề</span>
        <span className="sm:hidden">Tải</span>
        <span className="ml-1 px-1.5 py-0.5 bg-green-200 text-green-700 rounded text-[10px] font-bold">
          {getTotalSelectedCount()}
        </span>
      </button>

      <button
        onClick={handleOnlineExam}
        disabled={getTotalSelectedCount() === 0}
        className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed shadow-lg"
      >
        <PlayCircleIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Thi online</span>
        <span className="sm:hidden">Thi</span>
        <span className="ml-1 px-1.5 py-0.5 bg-indigo-200 text-indigo-700 rounded text-[10px] font-bold">
          {getTotalSelectedCount()}
        </span>
      </button>
    </div>
  );
};

export default ActionButtons;