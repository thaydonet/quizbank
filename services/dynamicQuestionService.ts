/**
 * Enhanced Dynamic Question Management Service
 * Handles dynamic questions with advanced features
 */

import { supabase } from './supabaseClient';
import type { Question } from '../types';

export interface DynamicQuestion extends Question {
  isDynamic: true;
  template: {
    variableDefinitions: { [key: string]: { min: number; max: number; step?: number } };
    template_question: string;
    template_option_a?: string;
    template_option_b?: string;
    template_option_c?: string;
    template_option_d?: string;
    template_correct_option: string;
    template_explanation: string;
  };
  generated_variations?: Question[];
}

export interface DynamicQuizTemplate {
  id?: string;
  title: string;
  template_questions: DynamicQuestion[];
  created_by: string;
  created_at?: string;
  is_active: boolean;
}

export class DynamicQuestionService {
  /**
   * Save dynamic question template to Supabase
   */
  static async saveDynamicQuestionTemplate(template: DynamicQuizTemplate): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      const { data, error } = await supabase
        .from('dynamic_question_templates')
        .insert([template])
        .select()
        .single();

      if (error) {
        console.error('Error saving dynamic template:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Exception saving dynamic template:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Get dynamic question templates by user
   */
  static async getDynamicTemplatesByUser(userId: string): Promise<{ success: boolean; data?: DynamicQuizTemplate[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('dynamic_question_templates')
        .select('*')
        .eq('created_by', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching dynamic templates:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Exception fetching dynamic templates:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Generate quiz from dynamic template
   */
  static async generateQuizFromTemplate(templateId: string, variationCount: number = 1): Promise<{ success: boolean; data?: Question[]; error?: string }> {
    try {
      // Get template
      const { data: template, error } = await supabase
        .from('dynamic_question_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) {
        console.error('Error fetching template:', error);
        return { success: false, error: error.message };
      }

      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      // Generate variations
      const { DynamicQuestionEngine } = await import('./dynamicQuestionEngine');
      const engine = new DynamicQuestionEngine();
      const generatedQuestions: Question[] = [];

      for (const templateQuestion of template.template_questions) {
        const variations = engine.generateVariations(templateQuestion, variationCount);
        generatedQuestions.push(...variations);
      }

      return { success: true, data: generatedQuestions };
    } catch (error: any) {
      console.error('Exception generating quiz from template:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Save generated quiz with dynamic questions
   */
  static async saveGeneratedQuiz(
    title: string,
    questions: Question[],
    templateId: string,
    userId: string,
    maxAttempts: number = 1
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      // Mark questions as generated from template
      const questionsWithMeta = questions.map(q => ({
        ...q,
        source_template_id: templateId,
        generated_at: new Date().toISOString()
      }));

      // Use existing QuizManagementService to save
      const { QuizManagementService } = await import('./quizManagementService');
      
      const result = await QuizManagementService.saveQuiz({
        title,
        max_attempts: maxAttempts,
        questions: questionsWithMeta,
        created_by: userId
      });

      if (result.success) {
        // Log generation event
        await this.logQuizGeneration(result.data.id, templateId, questions.length);
      }

      return result;
    } catch (error: any) {
      console.error('Exception saving generated quiz:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Log quiz generation for analytics
   */
  private static async logQuizGeneration(quizId: string, templateId: string, questionCount: number): Promise<void> {
    try {
      await supabase
        .from('quiz_generation_logs')
        .insert([{
          quiz_id: quizId,
          template_id: templateId,
          question_count: questionCount,
          generated_at: new Date().toISOString()
        }]);
    } catch (error) {
      console.warn('Failed to log quiz generation:', error);
    }
  }

  /**
   * Get quiz generation statistics
   */
  static async getGenerationStats(userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('quiz_generation_logs')
        .select(`
          *,
          quiz:quizzes(title, created_at),
          template:dynamic_question_templates(title)
        `)
        .eq('quiz.created_by', userId)
        .order('generated_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching generation stats:', error);
        return { success: false, error: error.message };
      }

      const stats = {
        total_generated: data?.length || 0,
        recent_generations: data || [],
        total_questions_generated: data?.reduce((sum, log) => sum + (log.question_count || 0), 0) || 0
      };

      return { success: true, data: stats };
    } catch (error: any) {
      console.error('Exception fetching generation stats:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }
}