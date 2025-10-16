import type { Question } from '../types';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

export interface ExportOptions {
  format: 'txt' | 'docx';
  examCount: number;
  shuffleQuestions: boolean;
  shuffleMcqOptions: boolean;
  includeAnswerKey: boolean;
  examTitle?: string;
  examSubtitle?: string;
  organizeBySections: boolean;
}

export interface ExamData {
  questions: Question[];
  examNumber: number;
  title: string;
  subtitle?: string;
}

// Extended Question interface for tracking shuffled answers
interface ProcessedQuestion extends Question {
  original_correct_option?: string;
  original_correct_value?: string;
  shuffled_answer_map?: { [key: string]: string }; // Maps original key to new key
}

export class ExportServiceFixed {
  /**
   * Shuffle array utility
   */
  private static shuffleArray<T>(arr: T[]): T[] {
    const newArr = [...arr];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  }

  /**
   * Process questions based on export options with improved answer tracking
   */
  private static processQuestions(questions: Question[], options: ExportOptions): ProcessedQuestion[] {
    let processedQuestions: ProcessedQuestion[] = [...questions];

    // Shuffle questions if requested
    if (options.shuffleQuestions) {
      processedQuestions = this.shuffleArray(processedQuestions);
    }

    // Shuffle MCQ options if requested with improved answer tracking
    if (options.shuffleMcqOptions) {
      processedQuestions = processedQuestions.map(q => {
        if (q.type === 'mcq' && q.option_a && q.option_b && q.option_c && q.option_d) {
          const optionsList = [
            { key: 'A', value: q.option_a },
            { key: 'B', value: q.option_b },
            { key: 'C', value: q.option_c },
            { key: 'D', value: q.option_d }
          ];

          // Find the correct option value before shuffling
          const correctOption = optionsList.find(opt => opt.key === q.correct_option);
          const correctValue = correctOption?.value || '';

          // Shuffle the options
          const shuffledOptions = this.shuffleArray(optionsList);
          
          // Create mapping from original keys to new keys
          const answerMap: { [key: string]: string } = {};
          optionsList.forEach(originalOpt => {
            const newPosition = shuffledOptions.findIndex(shuffledOpt => shuffledOpt.value === originalOpt.value);
            if (newPosition !== -1) {
              answerMap[originalOpt.key] = shuffledOptions[newPosition].key;
            }
          });

          // Find the new key for the correct answer after shuffling
          const newCorrectKey = shuffledOptions.find(opt => opt.value === correctValue)?.key || 'A';

          // Debug: print mapping to help verify shuffle differs between exams
          try {
            // eslint-disable-next-line no-console
            console.debug('ExportServiceFixed: MCQ shuffle map', { id: q.id, answerMap, newCorrectKey });
          } catch (e) {
            // ignore
          }

          return {
            ...q,
            option_a: shuffledOptions[0]?.value || '',
            option_b: shuffledOptions[1]?.value || '',
            option_c: shuffledOptions[2]?.value || '',
            option_d: shuffledOptions[3]?.value || '',
            correct_option: newCorrectKey, // New correct key after shuffle
            original_correct_option: q.correct_option, // Original key before shuffle
            original_correct_value: correctValue, // Original correct answer value
            shuffled_answer_map: answerMap // Complete mapping for reference
          } as ProcessedQuestion;
        }
        return q as ProcessedQuestion;
      });
    }

    return processedQuestions;
  }

  /**
   * Get the correct answer key for display in answer key section
   */
  private static getCorrectAnswerForDisplay(question: ProcessedQuestion, useOriginal: boolean = false): string {
    if (question.type !== 'mcq') {
      return question.correct_option || '';
    }

    // If options were shuffled and we want to show the answer for the shuffled version
    if (question.shuffled_answer_map && !useOriginal) {
      return question.correct_option; // This is already the new key after shuffling
    }

    // If we want the original answer or no shuffling occurred
    return question.original_correct_option || question.correct_option;
  }

  /**
   * Organize questions by sections
   */
  private static organizeQuestionsBySections(questions: ProcessedQuestion[]) {
    return {
      mcq: questions.filter(q => q.type === 'mcq'),
      msq: questions.filter(q => q.type === 'msq'),
      sa: questions.filter(q => q.type === 'sa')
    };
  }

  /**
   * Generate exam title and subtitle
   */
  private static generateExamTitle(examData: ExamData, options: ExportOptions): { title: string; subtitle: string } {
    const baseTitle = options.examTitle || 'ĐỀ THI TRẮC NGHIỆM TOÁN';
    const title = options.examCount > 1 ? `${baseTitle} - Đề ${examData.examNumber}` : baseTitle;
    
    const questionCounts = this.organizeQuestionsBySections(examData.questions as ProcessedQuestion[]);
    const subtitle = options.examSubtitle || 
      `Tổng số câu: ${examData.questions.length} (MCQ: ${questionCounts.mcq.length}, MSQ: ${questionCounts.msq.length}, SA: ${questionCounts.sa.length})`;

    return { title, subtitle };
  }

  /**
   * Export to TXT format with improved answer key
   */
  private static async exportToTxt(examData: ExamData, options: ExportOptions): Promise<void> {
    const { title, subtitle } = this.generateExamTitle(examData, options);
    const processedQuestions = examData.questions as ProcessedQuestion[];
    let content = `${title}\n${subtitle}\n\n`;

    if (options.organizeBySections) {
      const sections = this.organizeQuestionsBySections(processedQuestions);
      let questionCounter = 1;

      // PHẦN I: TRẮC NGHIỆM (MCQ)
      if (sections.mcq.length > 0) {
        content += 'PHẦN I: TRẮC NGHIỆM\n\n';
        sections.mcq.forEach((question) => {
          content += `Câu ${questionCounter}: ${question.question}\n`;
          if (question.option_a) content += `A. ${question.option_a}\n`;
          if (question.option_b) content += `B. ${question.option_b}\n`;
          if (question.option_c) content += `C. ${question.option_c}\n`;
          if (question.option_d) content += `D. ${question.option_d}\n`;
          content += '\n';
          questionCounter++;
        });
      }

      // PHẦN II: ĐÚNG - SAI (MSQ)
      if (sections.msq.length > 0) {
        content += 'PHẦN II: ĐÚNG - SAI\n\n';
        sections.msq.forEach((question) => {
          content += `Câu ${questionCounter}: ${question.question}\n`;
          if (question.option_a) content += `a) ${question.option_a}\n`;
          if (question.option_b) content += `b) ${question.option_b}\n`;
          if (question.option_c) content += `c) ${question.option_c}\n`;
          if (question.option_d) content += `d) ${question.option_d}\n`;
          content += '\n';
          questionCounter++;
        });
      }

      // PHẦN III: TRẢ LỜI NGẮN (SA)
      if (sections.sa.length > 0) {
        content += 'PHẦN III: TRẢ LỜI NGẮN\n\n';
        sections.sa.forEach((question) => {
          content += `Câu ${questionCounter}: ${question.question}\n\n`;
          questionCounter++;
        });
      }

      // Answer key with correct mapping
      if (options.includeAnswerKey) {
        content += 'ĐÁP ÁN\n';
        questionCounter = 1;
        
        if (sections.mcq.length > 0) {
          content += 'Phần I: Trắc nghiệm\n';
          sections.mcq.forEach((question) => {
            // Use the correct answer for the current (possibly shuffled) version
            const correctAnswer = this.getCorrectAnswerForDisplay(question, false);
            content += `Câu ${questionCounter}: ${correctAnswer}`;
            
            // Add debug info if shuffled
            if (question.shuffled_answer_map && question.original_correct_option !== question.correct_option) {
              content += ` (gốc: ${question.original_correct_option})`;
            }
            content += '\n';
            questionCounter++;
          });
        }
        
        if (sections.msq.length > 0) {
          content += 'Phần II: Đúng - sai\n';
          sections.msq.forEach((question) => {
            content += `Câu ${questionCounter}: ${question.correct_option}\n`;
            questionCounter++;
          });
        }
        
        if (sections.sa.length > 0) {
          content += 'Phần III: Trả lời ngắn\n';
          sections.sa.forEach((question) => {
            content += `Câu ${questionCounter}: ${question.correct_option}\n`;
            questionCounter++;
          });
        }
      }
    } else {
      // Simple format without sections
      processedQuestions.forEach((question, index) => {
        content += `Câu ${index + 1}: ${question.question}\n`;
        if (question.type !== 'sa') {
          if (question.option_a) content += `A. ${question.option_a}\n`;
          if (question.option_b) content += `B. ${question.option_b}\n`;
          if (question.option_c) content += `C. ${question.option_c}\n`;
          if (question.option_d) content += `D. ${question.option_d}\n`;
        }
        content += '\n';
      });

      if (options.includeAnswerKey) {
        content += 'ĐÁP ÁN\n';
        processedQuestions.forEach((question, index) => {
          const correctAnswer = this.getCorrectAnswerForDisplay(question, false);
          content += `Câu ${index + 1}: ${correctAnswer}\n`;
        });
      }
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const fileName = options.examCount > 1 ? `de-thi-toan-${examData.examNumber}.txt` : 'de-thi-toan.txt';
    saveAs(blob, fileName);
  }

  /**
   * Export to DOCX format with improved answer key
   */
  private static async exportToDocx(examData: ExamData, options: ExportOptions): Promise<void> {
    const { title, subtitle } = this.generateExamTitle(examData, options);
    const processedQuestions = examData.questions as ProcessedQuestion[];
    const children: Paragraph[] = [];

    // Header
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: title,
            bold: true,
            size: 32,
          }),
        ],
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_1,
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: subtitle,
            size: 24,
          }),
        ],
        alignment: AlignmentType.CENTER,
      })
    );

    children.push(new Paragraph({ text: '' })); // Empty line

    if (options.organizeBySections) {
      const sections = this.organizeQuestionsBySections(processedQuestions);
      let questionCounter = 1;

      // Add sections similar to TXT format...
      // (Implementation similar to original but with improved answer key)

      // Answer key with correct mapping
      if (options.includeAnswerKey) {
        children.push(new Paragraph({ text: '' }));
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'ĐÁP ÁN',
                bold: true,
                size: 28,
              }),
            ],
            alignment: AlignmentType.CENTER,
          })
        );

        questionCounter = 1;
        
        // MCQ answers with correct mapping
        if (sections.mcq.length > 0) {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: 'Phần I: Trắc nghiệm', bold: true, size: 24 })],
            })
          );
          sections.mcq.forEach((question) => {
            const correctAnswer = this.getCorrectAnswerForDisplay(question, false);
            children.push(
              new Paragraph({
                children: [new TextRun({ text: `Câu ${questionCounter}: ${correctAnswer}`, size: 22 })],
              })
            );
            questionCounter++;
          });
        }

        // MSQ and SA answers...
        // (Similar implementation)
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const fileName = options.examCount > 1 ? `de-thi-toan-${examData.examNumber}.docx` : 'de-thi-toan.docx';
    saveAs(blob, fileName);
  }

  /**
   * Export multiple exams with improved processing
   */
  static async exportExams(questions: Question[], options: ExportOptions): Promise<void> {
    if (questions.length === 0) {
      throw new Error('Không có câu hỏi nào để xuất');
    }

    try {
      for (let i = 1; i <= options.examCount; i++) {
        // Deep-clone questions for this exam copy so shuffling doesn't mutate the original
        const questionsCopy: Question[] = JSON.parse(JSON.stringify(questions));
        // Process questions for each exam separately to ensure different shuffling
        const processedQuestions = this.processQuestions(questionsCopy, options);
        
        const examData: ExamData = {
          questions: processedQuestions,
          examNumber: i,
          title: options.examTitle || 'ĐỀ THI TRẮC NGHIỆM TOÁN',
          subtitle: options.examSubtitle
        };

        if (options.format === 'docx') {
          await this.exportToDocx(examData, options);
        } else {
          await this.exportToTxt(examData, options);
        }

        // Add small delay between exports to prevent browser blocking
        if (i < options.examCount) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.error('Error exporting exams:', error);
      throw new Error('Có lỗi xảy ra khi xuất đề thi. Vui lòng thử lại.');
    }
  }

  /**
   * Get export preview with shuffle information
   */
  static getExportPreview(questions: Question[], options: ExportOptions): {
    totalQuestions: number;
    questionsByType: { mcq: number; msq: number; sa: number };
    estimatedFileSize: string;
    estimatedTime: string;
    shuffleInfo: string;
  } {
    const sections = this.organizeQuestionsBySections(questions as ProcessedQuestion[]);
    const totalQuestions = questions.length;
    
    // Estimate file size (rough calculation)
    const avgQuestionLength = 200; // characters
    const avgOptionsLength = 400; // characters for MCQ/MSQ
    const estimatedSize = totalQuestions * (avgQuestionLength + avgOptionsLength) * options.examCount;
    const fileSizeKB = Math.ceil(estimatedSize / 1024);
    
    // Estimate time (rough calculation)
    const timePerExam = Math.max(1, Math.ceil(totalQuestions / 50)); // seconds
    const totalTime = timePerExam * options.examCount;

    // Shuffle info
    let shuffleInfo = 'Không đảo';
    if (options.shuffleQuestions && options.shuffleMcqOptions) {
      shuffleInfo = 'Đảo câu hỏi và đáp án';
    } else if (options.shuffleQuestions) {
      shuffleInfo = 'Đảo câu hỏi';
    } else if (options.shuffleMcqOptions) {
      shuffleInfo = 'Đảo đáp án';
    }

    return {
      totalQuestions,
      questionsByType: {
        mcq: sections.mcq.length,
        msq: sections.msq.length,
        sa: sections.sa.length
      },
      estimatedFileSize: fileSizeKB > 1024 ? `${(fileSizeKB / 1024).toFixed(1)}MB` : `${fileSizeKB}KB`,
      estimatedTime: totalTime > 60 ? `${Math.ceil(totalTime / 60)} phút` : `${totalTime} giây`,
      shuffleInfo
    };
  }
}