import React from 'react';

interface PrintDialogProps {
  showPrintDialog: boolean;
  setShowPrintDialog: (show: boolean) => void;
  getTotalSelectedCount: () => number;
  printCount: number;
  setPrintCount: (count: number) => void;
  shuffleQuestions: boolean;
  setShuffleQuestions: (shuffle: boolean) => void;
  shuffleMcqOptions: boolean;
  setShuffleMcqOptions: (shuffle: boolean) => void;
  exportFormat: 'docx' | 'xlsx' | 'tex';
  setExportFormat: (format: 'docx' | 'xlsx' | 'tex') => void;
  handlePrintConfirm: () => void;
}

const PrintDialog: React.FC<PrintDialogProps> = ({
  showPrintDialog,
  setShowPrintDialog,
  getTotalSelectedCount,
  printCount,
  setPrintCount,
  shuffleQuestions,
  setShuffleQuestions,
  shuffleMcqOptions,
  setShuffleMcqOptions,
  exportFormat,
  setExportFormat,
  handlePrintConfirm
}) => {
  if (!showPrintDialog) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Tùy chọn in đề</h2>
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700 font-medium">
            Tổng số câu hỏi: <span className="font-bold text-indigo-600">{getTotalSelectedCount()}</span>
          </p>
          <p className="text-xs text-gray-600 mt-1">Nguồn: Ngân hàng Toán Thầy Đồ</p>
        </div>
        <div className="mb-3">
          <label className="block font-medium mb-1">Số đề cần in:</label>
          <input
            type="number"
            min={1}
            max={20}
            value={printCount}
            onChange={e => setPrintCount(Number(e.target.value))}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div className="mb-3 flex items-center gap-2">
          <input
            type="checkbox"
            id="shuffleQuestions"
            checked={shuffleQuestions}
            onChange={e => setShuffleQuestions(e.target.checked)}
          />
          <label htmlFor="shuffleQuestions">Trộn câu hỏi</label>
        </div>
        <div className="mb-3 flex items-center gap-2">
          <input
            type="checkbox"
            id="shuffleMcqOptions"
            checked={shuffleMcqOptions}
            onChange={e => setShuffleMcqOptions(e.target.checked)}
          />
          <label htmlFor="shuffleMcqOptions">Trộn đáp án trắc nghiệm</label>
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-2">Định dạng file:</label>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="exportFormat"
                value="docx"
                checked={exportFormat === 'docx'}
                onChange={e => setExportFormat(e.target.value as 'docx')}
              />
              <span>File .docx (Đề thi + Đáp án)</span>
            </label>
            {/* Removed xlsx option as requested */}
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="exportFormat"
                value="tex"
                checked={exportFormat === 'tex'}
                onChange={e => setExportFormat(e.target.value as 'tex')}
              />
              <span>File .tex (Đề thi LaTeX)</span>
            </label>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrintConfirm}
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Tải {exportFormat === 'docx' ? 'DOCX' : exportFormat === 'xlsx' ? 'XLSX' : 'TEX'}
          </button>
          <button
            onClick={() => setShowPrintDialog(false)}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintDialog;