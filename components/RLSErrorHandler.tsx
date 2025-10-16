import React, { useState, useEffect } from 'react';
import { RLSPolicyFixer } from '../utils/fixRLSPolicies';

interface RLSErrorHandlerProps {
  error?: string;
  onRetry?: () => void;
  showDiagnostics?: boolean;
}

const RLSErrorHandler: React.FC<RLSErrorHandlerProps> = ({ 
  error, 
  onRetry, 
  showDiagnostics = false 
}) => {
  const [diagnosticReport, setDiagnosticReport] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const isRLSError = error?.includes('row-level security policy') || 
                    error?.includes('RLS') || 
                    error?.includes('policy');

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const report = await RLSPolicyFixer.generateDiagnosticReport();
      setDiagnosticReport(report);
      setShowReport(true);
    } catch (err) {
      console.error('Error running diagnostics:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyReportToClipboard = () => {
    navigator.clipboard.writeText(diagnosticReport);
    alert('Đã copy báo cáo vào clipboard');
  };

  if (!isRLSError && !showDiagnostics) {
    return null;
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Lỗi bảo mật cơ sở dữ liệu (RLS Policy)
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p className="mb-3">
              Hệ thống không thể nộp bài do cấu hình bảo mật. Đây là lỗi kỹ thuật cần admin xử lý.
            </p>
            
            {error && (
              <div className="bg-red-100 border border-red-300 rounded p-3 mb-3">
                <p className="font-mono text-xs">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <p><strong>Nguyên nhân:</strong> Row Level Security (RLS) policies chưa được cấu hình đúng cho bảng quiz_submissions.</p>
              
              <p><strong>Giải pháp cho Admin:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Mở Supabase Dashboard → SQL Editor</li>
                <li>Chạy file <code className="bg-red-200 px-1 rounded">supabase/fix_quiz_submissions_rls.sql</code></li>
                <li>Kiểm tra lại bằng cách test nộp bài</li>
              </ol>

              <p><strong>Giải pháp tạm thời:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Thử nộp bài lại sau vài phút</li>
                <li>Đăng nhập/đăng xuất và thử lại</li>
                <li>Liên hệ admin nếu vấn đề tiếp tục</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium"
              >
                Thử lại
              </button>
            )}
            
            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Đang kiểm tra...' : 'Chạy chẩn đoán'}
            </button>

            {showReport && (
              <button
                onClick={copyReportToClipboard}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm font-medium"
              >
                Copy báo cáo
              </button>
            )}
          </div>

          {showReport && diagnosticReport && (
            <div className="mt-4">
              <details className="bg-gray-50 border border-gray-200 rounded p-3">
                <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                  Báo cáo chẩn đoán chi tiết
                </summary>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto">
                  {diagnosticReport}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RLSErrorHandler;