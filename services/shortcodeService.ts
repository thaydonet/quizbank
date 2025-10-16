import type { Question } from '../types';
import { 
  generateWordPressShortcodes, 
  generateCustomWordPressShortcodes,
  validateShortcodes,
  type ShortcodeOptions 
} from '../utils/wordpressShortcodeGenerator';

export interface ShortcodeGenerationOptions extends ShortcodeOptions {
  template?: 'standard' | 'minimal' | 'detailed' | 'custom';
  metadata?: {
    author?: string;
    course?: string;
    chapter?: string;
    difficulty?: string;
    timeLimit?: number;
  };
  formatting?: {
    indentation?: number;
    lineSpacing?: 'single' | 'double';
    codeStyle?: 'compact' | 'readable';
  };
}

export interface ShortcodeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalShortcodes: number;
    mcqCount: number;
    msqCount: number;
    saCount: number;
  };
  suggestions: string[];
}

export class ShortcodeService {
  /**
   * Generate shortcodes with template support
   */
  static generateShortcodes(questions: Question[], options: ShortcodeGenerationOptions = {}): string {
    if (!questions || questions.length === 0) {
      throw new Error('Không có câu hỏi nào để tạo shortcode');
    }

    const template = options.template || 'standard';
    
    switch (template) {
      case 'minimal':
        return this.generateMinimalShortcodes(questions, options);
      case 'detailed':
        return this.generateDetailedShortcodes(questions, options);
      case 'custom':
        return generateCustomWordPressShortcodes(questions, options);
      case 'standard':
      default:
        return generateWordPressShortcodes(questions);
    }
  }

  /**
   * Generate minimal shortcodes (no sections, no comments)
   */
  private static generateMinimalShortcodes(questions: Question[], options: ShortcodeGenerationOptions): string {
    const customOptions: ShortcodeOptions = {
      includeComments: false,
      includeSections: false,
      groupByType: false,
      ...options
    };

    return generateCustomWordPressShortcodes(questions, customOptions);
  }

  /**
   * Generate detailed shortcodes with metadata
   */
  private static generateDetailedShortcodes(questions: Question[], options: ShortcodeGenerationOptions): string {
    const sections: string[] = [];
    const metadata = options.metadata || {};

    // Header with detailed metadata
    sections.push(`<!-- WordPress Quiz Shortcodes -->`);
    sections.push(`<!-- Generated: ${new Date().toLocaleString('vi-VN')} -->`);
    sections.push(`<!-- Total Questions: ${questions.length} -->`);
    
    if (metadata.author) sections.push(`<!-- Author: ${metadata.author} -->`);
    if (metadata.course) sections.push(`<!-- Course: ${metadata.course} -->`);
    if (metadata.chapter) sections.push(`<!-- Chapter: ${metadata.chapter} -->`);
    if (metadata.difficulty) sections.push(`<!-- Difficulty: ${metadata.difficulty} -->`);
    if (metadata.timeLimit) sections.push(`<!-- Time Limit: ${metadata.timeLimit} minutes -->`);
    
    sections.push('');

    // Quiz container with metadata
    const quizAttributes = [];
    if (metadata.timeLimit) quizAttributes.push(`time_limit="${metadata.timeLimit}"`);
    if (metadata.difficulty) quizAttributes.push(`difficulty="${metadata.difficulty}"`);
    
    if (quizAttributes.length > 0) {
      sections.push(`[quiz_container ${quizAttributes.join(' ')}]`);
      sections.push('');
    }

    // Generate questions with enhanced formatting
    const customOptions: ShortcodeOptions = {
      includeComments: true,
      includeSections: true,
      groupByType: true,
      ...options
    };

    const questionShortcodes = generateCustomWordPressShortcodes(questions, customOptions);
    sections.push(questionShortcodes);

    // Close quiz container
    if (quizAttributes.length > 0) {
      sections.push('');
      sections.push('[/quiz_container]');
    }

    // Footer
    sections.push('');
    sections.push(`<!-- End of Quiz: ${questions.length} questions -->`);

    return sections.join('\n');
  }

  /**
   * Validate shortcodes with enhanced checking
   */
  static validateShortcodes(shortcodes: string): ShortcodeValidationResult {
    const baseValidation = validateShortcodes(shortcodes);
    const suggestions: string[] = [];

    // Additional validation checks
    const lines = shortcodes.split('\n');
    
    // Check for common issues
    if (shortcodes.includes('question=""')) {
      baseValidation.errors.push('Empty question text detected');
    }

    if (shortcodes.includes('option_a=""') && shortcodes.includes('[quiz_question ')) {
      baseValidation.warnings.push('Empty option A detected in MCQ questions');
    }

    // Check for unbalanced brackets
    const openBrackets = (shortcodes.match(/\[/g) || []).length;
    const closeBrackets = (shortcodes.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      baseValidation.errors.push('Unbalanced brackets detected');
    }

    // Performance suggestions
    if (baseValidation.stats.totalShortcodes > 100) {
      suggestions.push('Consider splitting large quizzes into smaller sections for better performance');
    }

    if (baseValidation.stats.saCount > baseValidation.stats.mcqCount + baseValidation.stats.msqCount) {
      suggestions.push('High number of short answer questions may require manual grading');
    }

    // Formatting suggestions
    if (!shortcodes.includes('<!-- ')) {
      suggestions.push('Consider adding comments for better organization');
    }

    if (!shortcodes.includes('[quiz_section')) {
      suggestions.push('Consider organizing questions into sections');
    }

    return {
      ...baseValidation,
      suggestions
    };
  }

  /**
   * Format shortcodes for better readability
   */
  static formatShortcodes(shortcodes: string, options: ShortcodeGenerationOptions = {}): string {
    const formatting = options.formatting || {};
    const indentation = formatting.indentation || 0;
    const lineSpacing = formatting.lineSpacing || 'single';
    const codeStyle = formatting.codeStyle || 'readable';

    let formatted = shortcodes;

    // Apply indentation
    if (indentation > 0) {
      const indent = ' '.repeat(indentation);
      formatted = formatted
        .split('\n')
        .map(line => line.trim() ? indent + line : line)
        .join('\n');
    }

    // Apply line spacing
    if (lineSpacing === 'double') {
      formatted = formatted.replace(/\n/g, '\n\n');
    }

    // Apply code style
    if (codeStyle === 'compact') {
      // Remove extra whitespace and comments
      formatted = formatted
        .split('\n')
        .filter(line => !line.trim().startsWith('<!--'))
        .filter(line => line.trim() !== '')
        .join('\n');
    }

    return formatted;
  }

  /**
   * Generate shortcodes for specific question types
   */
  static generateShortcodesByType(
    questions: Question[], 
    type: 'mcq' | 'msq' | 'sa',
    options: ShortcodeGenerationOptions = {}
  ): string {
    const filteredQuestions = questions.filter(q => q.type === type);
    
    if (filteredQuestions.length === 0) {
      throw new Error(`Không có câu hỏi loại ${type.toUpperCase()} nào`);
    }

    return this.generateShortcodes(filteredQuestions, {
      ...options,
      groupByType: false // Don't group since we're already filtering
    });
  }

  /**
   * Generate shortcodes with custom question numbering
   */
  static generateShortcodesWithCustomNumbering(
    questions: Question[],
    startNumber: number = 1,
    prefix: string = 'Câu',
    options: ShortcodeGenerationOptions = {}
  ): string {
    const customOptions: ShortcodeOptions = {
      ...options,
      numberingStart: startNumber,
      customPrefix: prefix
    };

    return generateCustomWordPressShortcodes(questions, customOptions);
  }

  /**
   * Convert shortcodes to different formats
   */
  static convertShortcodes(shortcodes: string, targetFormat: 'moodle' | 'blackboard' | 'canvas'): string {
    switch (targetFormat) {
      case 'moodle':
        return this.convertToMoodleFormat(shortcodes);
      case 'blackboard':
        return this.convertToBlackboardFormat(shortcodes);
      case 'canvas':
        return this.convertToCanvasFormat(shortcodes);
      default:
        throw new Error(`Unsupported target format: ${targetFormat}`);
    }
  }

  /**
   * Convert to Moodle XML format
   */
  private static convertToMoodleFormat(shortcodes: string): string {
    // Basic conversion - would need more sophisticated parsing
    let moodleXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    moodleXml += '<quiz>\n';
    
    // Parse shortcodes and convert to Moodle format
    const questionMatches = shortcodes.match(/\[quiz_question[^\]]+\]/g) || [];
    
    questionMatches.forEach((match, index) => {
      moodleXml += `  <question type="multichoice">\n`;
      moodleXml += `    <name><text>Question ${index + 1}</text></name>\n`;
      // Add more Moodle-specific XML here
      moodleXml += `  </question>\n`;
    });
    
    moodleXml += '</quiz>';
    return moodleXml;
  }

  /**
   * Convert to Blackboard format
   */
  private static convertToBlackboardFormat(shortcodes: string): string {
    // Placeholder for Blackboard conversion
    return `// Blackboard format conversion not yet implemented\n${shortcodes}`;
  }

  /**
   * Convert to Canvas format
   */
  private static convertToCanvasFormat(shortcodes: string): string {
    // Placeholder for Canvas conversion
    return `// Canvas format conversion not yet implemented\n${shortcodes}`;
  }

  /**
   * Get shortcode statistics
   */
  static getShortcodeStatistics(shortcodes: string): {
    totalLines: number;
    totalCharacters: number;
    totalShortcodes: number;
    questionTypes: { mcq: number; msq: number; sa: number };
    estimatedRenderTime: string;
    complexity: 'low' | 'medium' | 'high';
  } {
    const lines = shortcodes.split('\n');
    const totalLines = lines.length;
    const totalCharacters = shortcodes.length;
    
    const mcqCount = (shortcodes.match(/\[quiz_question\s/g) || []).length;
    const msqCount = (shortcodes.match(/\[quiz_question_T_F\s/g) || []).length;
    const saCount = (shortcodes.match(/\[quiz_question_TLN\s/g) || []).length;
    const totalShortcodes = mcqCount + msqCount + saCount;
    
    // Estimate render time (rough calculation)
    const baseTime = totalShortcodes * 0.1; // 0.1 seconds per question
    const complexityMultiplier = totalCharacters > 10000 ? 1.5 : 1;
    const estimatedSeconds = Math.ceil(baseTime * complexityMultiplier);
    
    const estimatedRenderTime = estimatedSeconds > 60 
      ? `${Math.ceil(estimatedSeconds / 60)} phút`
      : `${estimatedSeconds} giây`;
    
    // Determine complexity
    let complexity: 'low' | 'medium' | 'high' = 'low';
    if (totalShortcodes > 50 || totalCharacters > 20000) {
      complexity = 'medium';
    }
    if (totalShortcodes > 100 || totalCharacters > 50000) {
      complexity = 'high';
    }

    return {
      totalLines,
      totalCharacters,
      totalShortcodes,
      questionTypes: {
        mcq: mcqCount,
        msq: msqCount,
        sa: saCount
      },
      estimatedRenderTime,
      complexity
    };
  }

  /**
   * Optimize shortcodes for performance
   */
  static optimizeShortcodes(shortcodes: string): string {
    return shortcodes
      // Remove excessive whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // Remove trailing spaces
      .replace(/[ \t]+$/gm, '')
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      // Remove empty comments
      .replace(/<!--\s*-->/g, '')
      .trim();
  }
}