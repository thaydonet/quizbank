import type { Question } from '../types';

/**
 * Enhanced text cleaning for WordPress shortcodes
 * Handles various edge cases and special characters
 */
export function cleanText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    // Basic HTML entity encoding
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    
    // WordPress shortcode specific escaping
    .replace(/\[/g, '&#91;')
    .replace(/\]/g, '&#93;')
    
    // Math notation preservation
    .replace(/\$/g, '&#36;') // Preserve $ for LaTeX
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;')
    
    // Line breaks and whitespace normalization
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n+/g, ' ') // Convert line breaks to spaces
    .replace(/\s+/g, ' ') // Normalize multiple spaces
    
    // Vietnamese specific characters that might cause issues
    .replace(/₫/g, 'dong') // Vietnamese currency
    
    // Remove or escape problematic characters
    .replace(/\|/g, '&#124;') // Pipe character
    .replace(/\\/g, '&#92;') // Backslash
    .replace(/`/g, '&#96;') // Backtick
    
    // Trim whitespace
    .trim();
}

/**
 * Clean and format mathematical expressions
 */
export function cleanMathExpression(text: string): string {
  if (!text) return '';
  
  return cleanText(text)
    // Preserve common math symbols
    .replace(/×/g, '&times;')
    .replace(/÷/g, '&divide;')
    .replace(/±/g, '&plusmn;')
    .replace(/≤/g, '&le;')
    .replace(/≥/g, '&ge;')
    .replace(/≠/g, '&ne;')
    .replace(/∞/g, '&infin;')
    .replace(/π/g, '&pi;')
    .replace(/√/g, '&radic;')
    .replace(/∑/g, '&sum;')
    .replace(/∫/g, '&int;')
    .replace(/°/g, '&deg;')
    
    // Fractions
    .replace(/½/g, '&frac12;')
    .replace(/⅓/g, '&frac13;')
    .replace(/¼/g, '&frac14;')
    .replace(/¾/g, '&frac34;')
    
    // Superscript and subscript (basic)
    .replace(/²/g, '&sup2;')
    .replace(/³/g, '&sup3;')
    .replace(/¹/g, '&sup1;');
}

/**
 * Generate WordPress shortcode for a single question
 */
export function generateQuestionShortcode(question: Question, questionNumber: number): string {
  const cleanQuestion = cleanMathExpression(question.question);
  const cleanExplanation = cleanMathExpression(question.explanation || '');
  
  switch (question.type) {
    case 'mcq':
      return `[quiz_question question="Câu ${questionNumber}: ${cleanQuestion}" option_a="${cleanText(question.option_a || '')}" option_b="${cleanText(question.option_b || '')}" option_c="${cleanText(question.option_c || '')}" option_d="${cleanText(question.option_d || '')}" correct="${question.correct_option}" explanation="${cleanExplanation}"]`;
    
    case 'msq':
      return `[quiz_question_T_F question="Câu ${questionNumber}: ${cleanQuestion}" option_a="${cleanText(question.option_a || '')}" option_b="${cleanText(question.option_b || '')}" option_c="${cleanText(question.option_c || '')}" option_d="${cleanText(question.option_d || '')}" correct="${question.correct_option}" explanation="${cleanExplanation}"]`;
    
    case 'sa':
      return `[quiz_question_TLN question="Câu ${questionNumber}: ${cleanQuestion}" correct="${cleanText(question.correct_option || '')}" explanation="${cleanExplanation}"]`;
    
    default:
      return '';
  }
}

/**
 * Generate organized WordPress shortcodes for multiple questions
 */
export function generateWordPressShortcodes(questions: Question[]): string {
  if (!questions || questions.length === 0) {
    return '';
  }

  // Separate questions by type
  const mcqQuestions = questions.filter(q => q.type === 'mcq');
  const msqQuestions = questions.filter(q => q.type === 'msq');
  const saQuestions = questions.filter(q => q.type === 'sa');
  
  const sections: string[] = [];
  let questionCounter = 1;
  
  // Header with statistics
  sections.push(`<!-- Quiz Generated: ${new Date().toLocaleString('vi-VN')} -->`);
  sections.push(`<!-- Total Questions: ${questions.length} (MCQ: ${mcqQuestions.length}, MSQ: ${msqQuestions.length}, SA: ${saQuestions.length}) -->`);
  sections.push('');
  
  // Phần I: Trắc nghiệm (MCQ)
  if (mcqQuestions.length > 0) {
    sections.push('<!-- PHẦN I: TRẮC NGHIỆM -->');
    sections.push('[quiz_section title="PHẦN I: TRẮC NGHIỆM"]');
    sections.push('');
    
    mcqQuestions.forEach((question) => {
      sections.push(generateQuestionShortcode(question, questionCounter));
      questionCounter++;
    });
    
    sections.push('');
    sections.push('[/quiz_section]');
    sections.push('');
  }
  
  // Phần II: Đúng - sai (MSQ)
  if (msqQuestions.length > 0) {
    sections.push('<!-- PHẦN II: ĐÚNG - SAI -->');
    sections.push('[quiz_section title="PHẦN II: ĐÚNG - SAI"]');
    sections.push('');
    
    msqQuestions.forEach((question) => {
      sections.push(generateQuestionShortcode(question, questionCounter));
      questionCounter++;
    });
    
    sections.push('');
    sections.push('[/quiz_section]');
    sections.push('');
  }
  
  // Phần III: Trả lời ngắn (SA)
  if (saQuestions.length > 0) {
    sections.push('<!-- PHẦN III: TRẢ LỜI NGẮN -->');
    sections.push('[quiz_section title="PHẦN III: TRẢ LỜI NGẮN"]');
    sections.push('');
    
    saQuestions.forEach((question) => {
      sections.push(generateQuestionShortcode(question, questionCounter));
      questionCounter++;
    });
    
    sections.push('');
    sections.push('[/quiz_section]');
  }

  return sections.join('\n');
}

/**
 * Generate shortcodes with custom formatting options
 */
export interface ShortcodeOptions {
  includeComments?: boolean;
  includeSections?: boolean;
  customPrefix?: string;
  numberingStart?: number;
  groupByType?: boolean;
}

export function generateCustomWordPressShortcodes(
  questions: Question[], 
  options: ShortcodeOptions = {}
): string {
  const {
    includeComments = true,
    includeSections = true,
    customPrefix = '',
    numberingStart = 1,
    groupByType = true
  } = options;

  if (!questions || questions.length === 0) {
    return '';
  }

  const sections: string[] = [];
  let questionCounter = numberingStart;

  // Header
  if (includeComments) {
    sections.push(`<!-- ${customPrefix}Quiz Generated: ${new Date().toLocaleString('vi-VN')} -->`);
    sections.push(`<!-- Total Questions: ${questions.length} -->`);
    sections.push('');
  }

  if (groupByType) {
    // Group by question type
    const mcqQuestions = questions.filter(q => q.type === 'mcq');
    const msqQuestions = questions.filter(q => q.type === 'msq');
    const saQuestions = questions.filter(q => q.type === 'sa');

    // Process each type
    [
      { questions: mcqQuestions, title: 'TRẮC NGHIỆM', comment: 'MCQ' },
      { questions: msqQuestions, title: 'ĐÚNG - SAI', comment: 'MSQ' },
      { questions: saQuestions, title: 'TRẢ LỜI NGẮN', comment: 'SA' }
    ].forEach(({ questions: typeQuestions, title, comment }) => {
      if (typeQuestions.length > 0) {
        if (includeComments) {
          sections.push(`<!-- ${comment} SECTION -->`);
        }
        
        if (includeSections) {
          sections.push(`[quiz_section title="${title}"]`);
          sections.push('');
        }

        typeQuestions.forEach((question) => {
          sections.push(generateQuestionShortcode(question, questionCounter));
          questionCounter++;
        });

        if (includeSections) {
          sections.push('');
          sections.push('[/quiz_section]');
        }
        
        sections.push('');
      }
    });
  } else {
    // Process questions in original order
    questions.forEach((question) => {
      sections.push(generateQuestionShortcode(question, questionCounter));
      questionCounter++;
    });
  }

  return sections.join('\n');
}

/**
 * Validate shortcode output
 */
export function validateShortcodes(shortcodes: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalShortcodes: number;
    mcqCount: number;
    msqCount: number;
    saCount: number;
  };
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Count shortcodes
  const mcqMatches = shortcodes.match(/\[quiz_question\s/g) || [];
  const msqMatches = shortcodes.match(/\[quiz_question_T_F\s/g) || [];
  const saMatches = shortcodes.match(/\[quiz_question_TLN\s/g) || [];
  
  const stats = {
    totalShortcodes: mcqMatches.length + msqMatches.length + saMatches.length,
    mcqCount: mcqMatches.length,
    msqCount: msqMatches.length,
    saCount: saMatches.length
  };

  // Check for common issues
  if (shortcodes.includes('[quiz_question') && !shortcodes.includes('question=')) {
    errors.push('Missing question attribute in shortcodes');
  }

  if (shortcodes.includes('correct=""')) {
    warnings.push('Empty correct answers detected');
  }

  if (shortcodes.includes('explanation=""')) {
    warnings.push('Empty explanations detected');
  }

  // Check for unescaped characters
  if (shortcodes.includes('"[') || shortcodes.includes(']"')) {
    warnings.push('Potentially unescaped brackets in attributes');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats
  };
}