import React, { useState } from 'react';
import { AdminService } from '../../services/adminService';
import type { CreateQuestionData } from '../../services/adminService';

/**
 * Bulk import UI for Admin: supports JSON array, NDJSON, or simple TXT (one question per line)
 * - JSON array: [{...}, {...}]
 * - NDJSON: one JSON object per line
 * - TXT: plain text where each line becomes a short-answer question
 */

const parseInput = (text: string): CreateQuestionData[] => {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Try parse as full JSON array
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed as CreateQuestionData[];
    }
  } catch (e) {
    // ignore
  }

  // Try NDJSON
  const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const ndjsonResults: CreateQuestionData[] = [];
  let ndjsonOk = true;
  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      ndjsonResults.push(obj as CreateQuestionData);
    } catch (e) {
      ndjsonOk = false;
      break;
    }
  }
  if (ndjsonOk && ndjsonResults.length > 0) return ndjsonResults;

  // Fallback: treat each line as a short-answer question text
  return lines.map(line => ({
    question_type_id: '', // admin must pick/replace before import
    type: 'sa',
    question_text: line,
    correct_option: '',
    difficulty_level: 'easy'
  } as CreateQuestionData));
};

const BulkImport: React.FC = () => {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<CreateQuestionData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleParse = () => {
    try {
      const results = parseInput(input);
      setParsed(results);
      setMessage(`${results.length} items parsed`);
    } catch (error) {
      setParsed(null);
      setMessage('Không thể phân tích đầu vào');
    }
  };

  const handleImport = async () => {
    if (!parsed || parsed.length === 0) {
      setMessage('Không có mục nào để import');
      return;
    }

    // Ensure question_type_id is provided
    const missing = parsed.some(p => !p.question_type_id);
    if (missing) {
      setMessage('Một số mục chưa có `question_type_id`. Vui lòng điền trước khi import.');
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await AdminService.createQuestionsBulk(parsed);
      setMessage('Đã import thành công');
      setParsed(null);
      setInput('');
    } catch (error: any) {
      console.error('Bulk import error', error);
      setMessage('Lỗi khi import: ' + (error?.message || String(error)));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFromGemini = async () => {
    setLoading(true);
    setMessage('Đang gọi Gemini để sinh câu hỏi...');
    try {
      // Lazy load service to avoid circular imports in some bundlers
      const { generateQuizQuestions } = await import('../../services/geminiService');
      const resultStr = await generateQuizQuestions(input);
      setInput(resultStr);
      setMessage('Đã nhận kết quả từ Gemini - nhấn Phân tích để xem');
    } catch (error: any) {
      console.error('Gemini generation error', error);
      setMessage('Lỗi khi gọi Gemini: ' + (error?.message || String(error)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Dán JSON / NDJSON / TXT ở đây</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={12}
          className="w-full p-3 border rounded-md font-mono text-sm"
        />
      </div>

      <div className="flex gap-2">
        <button onClick={handleParse} className="px-4 py-2 bg-indigo-600 text-white rounded">Phân tích</button>
        <button onClick={handleGenerateFromGemini} disabled={!input.trim() || loading} className="px-4 py-2 bg-blue-600 text-white rounded">Sinh bằng Gemini</button>
        <button onClick={handleImport} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded">Import vào DB</button>
      </div>

      {message && <div className="p-3 bg-gray-100 rounded">{message}</div>}

      {parsed && (
        <div className="bg-white border rounded p-3">
          <h4 className="font-semibold mb-2">Xem trước ({parsed.length})</h4>
          <div className="space-y-2 max-h-64 overflow-auto">
            {parsed.map((p, i) => (
              <div key={i} className="p-2 border rounded">
                <div className="text-xs text-gray-500">{p.type} {p.question_type_id ? `| typeId: ${p.question_type_id}` : '| MISSING typeId'}</div>
                <div className="font-medium">{p.question_text || p.question}</div>
                {p.option_a && <div className="text-sm">A. {p.option_a}</div>}
                {p.option_b && <div className="text-sm">B. {p.option_b}</div>}
                {p.option_c && <div className="text-sm">C. {p.option_c}</div>}
                {p.option_d && <div className="text-sm">D. {p.option_d}</div>}
                <div className="text-sm text-gray-600">Đáp án: {p.correct_option}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkImport;
