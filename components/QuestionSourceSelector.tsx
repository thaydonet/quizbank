import React, { useState } from 'react';

interface QuestionSourceSelectorProps {
  activeSource: 'json' | 'database';
  onSourceChange: (source: 'json' | 'database') => void;
  selectedCount: number;
}

const QuestionSourceSelector: React.FC<QuestionSourceSelectorProps> = ({
  activeSource,
  onSourceChange,
  selectedCount
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Chọn nguồn câu hỏi</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* JSON Source */}
        <button
          onClick={() => onSourceChange('json')}
          className={`p-6 rounded-lg border-2 transition-all text-left ${
            activeSource === 'json'
              ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center mb-3">
            <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
              activeSource === 'json'
                ? 'border-indigo-500 bg-indigo-500'
                : 'border-gray-300'
            }`}>
              {activeSource === 'json' && (
                <div className="w-full h-full rounded-full bg-white scale-50"></div>
              )}
            </div>
            <div className="text-2xl mr-3">📄</div>
            <h3 className="text-lg font-semibold text-gray-900">File JSON</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Sử dụng câu hỏi từ file JSON có sẵn trong hệ thống. Phù hợp cho demo và test nhanh.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Sẵn có</span>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Nhanh chóng</span>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Demo</span>
          </div>
        </button>

        {/* Database Source */}
        <button
          onClick={() => onSourceChange('database')}
          className={`p-6 rounded-lg border-2 transition-all text-left ${
            activeSource === 'database'
              ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center mb-3">
            <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
              activeSource === 'database'
                ? 'border-indigo-500 bg-indigo-500'
                : 'border-gray-300'
            }`}>
              {activeSource === 'database' && (
                <div className="w-full h-full rounded-full bg-white scale-50"></div>
              )}
            </div>
            <div className="text-2xl mr-3">🗄️</div>
            <h3 className="text-lg font-semibold text-gray-900">Database Supabase</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Sử dụng câu hỏi từ database Supabase. Có thể quản lý, tạo mới và phân loại theo cấu trúc.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">Quản lý</span>
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Phân cấp</span>
            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Mở rộng</span>
          </div>
        </button>
      </div>

      {/* Selected Count Display */}
      {selectedCount > 0 && (
        <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-indigo-800 font-medium">
              Đã chọn {selectedCount} câu hỏi từ nguồn {activeSource === 'json' ? 'JSON' : 'Database'}
            </span>
          </div>
        </div>
      )}


    </div>
  );
};

export default QuestionSourceSelector;