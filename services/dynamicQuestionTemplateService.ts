import { supabase } from './supabaseClient';

export interface DynamicQuestionTemplate {
  id?: string;
  created_by?: string;
  title: string;
  type: 'mcq' | 'msq' | 'sa';
  question: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_option: string;
  explanation?: string;
  variables?: Record<string, any>;
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  subject?: string;
  grade_level?: string;
  chapter?: string;
  lesson?: string;
  type_category?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DynamicTemplateSearchOptions {
  type?: 'mcq' | 'msq' | 'sa';
  subject?: string;
  grade_level?: string;
  chapter?: string;
  lesson?: string;
  type_category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
  search_text?: string;
  limit?: number;
  offset?: number;
}

export class DynamicQuestionTemplateService {
  
  /**
   * Initialize the database table if it doesn't exist
   * This method should be called once during app initialization
   */
  static async initializeTable(): Promise<{ success: boolean; error?: string }> {
    try {
      // First, check if table exists by attempting a simple query
      const { error: testError } = await supabase
        .from('dynamic_question_templates')
        .select('id')
        .limit(1);

      if (!testError) {
        return { success: true }; // Table already exists
      }

      console.log('Table does not exist, needs to be created manually in Supabase dashboard');
      return { 
        success: false, 
        error: 'Table dynamic_question_templates does not exist. Please run the SQL migration script in your Supabase dashboard.' 
      };
    } catch (error: any) {
      console.error('Error checking table existence:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }
  
  /**
   * Save a new dynamic question template to Supabase
   */
  static async saveTemplate(template: Omit<DynamicQuestionTemplate, 'id' | 'created_by' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: DynamicQuestionTemplate; error?: string }> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Prepare template data
      const templateData = {
        ...template,
        created_by: user.id,
        // Extract variables from question content for better searchability
        variables: this.extractVariablesFromQuestion(template.question, template.option_a, template.option_b, template.option_c, template.option_d, template.correct_option, template.explanation)
      };

      const { data, error } = await supabase
        .from('dynamic_question_templates')
        .insert([templateData])
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
   * Get dynamic question templates for current user
   */
  static async getUserTemplates(options: DynamicTemplateSearchOptions = {}): Promise<{ success: boolean; data?: DynamicQuestionTemplate[]; error?: string }> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      let query = supabase
        .from('dynamic_question_templates')
        .select('*')
        .eq('created_by', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Apply filters
      if (options.type) {
        query = query.eq('type', options.type);
      }
      
      if (options.subject) {
        query = query.eq('subject', options.subject);
      }
      
      if (options.grade_level) {
        query = query.eq('grade_level', options.grade_level);
      }
      
      if (options.chapter) {
        query = query.eq('chapter', options.chapter);
      }
      
      if (options.lesson) {
        query = query.eq('lesson', options.lesson);
      }
      
      if (options.type_category) {
        query = query.eq('type_category', options.type_category);
      }
      
      if (options.difficulty) {
        query = query.eq('difficulty', options.difficulty);
      }
      
      if (options.tags && options.tags.length > 0) {
        query = query.overlaps('tags', options.tags);
      }
      
      if (options.search_text) {
        query = query.or(`title.ilike.%${options.search_text}%,question.ilike.%${options.search_text}%`);
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching user templates:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Exception fetching user templates:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Get a specific dynamic question template by ID
   */
  static async getTemplateById(id: string): Promise<{ success: boolean; data?: DynamicQuestionTemplate; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('dynamic_question_templates')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching template by ID:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Exception fetching template by ID:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Update a dynamic question template
   */
  static async updateTemplate(id: string, updates: Partial<DynamicQuestionTemplate>): Promise<{ success: boolean; data?: DynamicQuestionTemplate; error?: string }> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Update variables if question content changed
      if (updates.question || updates.option_a || updates.option_b || updates.option_c || updates.option_d || updates.correct_option || updates.explanation) {
        const currentTemplate = await this.getTemplateById(id);
        if (currentTemplate.success && currentTemplate.data) {
          const merged = { ...currentTemplate.data, ...updates };
          updates.variables = this.extractVariablesFromQuestion(
            merged.question,
            merged.option_a,
            merged.option_b,
            merged.option_c,
            merged.option_d,
            merged.correct_option,
            merged.explanation
          );
        }
      }

      const { data, error } = await supabase
        .from('dynamic_question_templates')
        .update(updates)
        .eq('id', id)
        .eq('created_by', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating template:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Exception updating template:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Delete a dynamic question template (soft delete)
   */
  static async deleteTemplate(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('dynamic_question_templates')
        .update({ is_active: false })
        .eq('id', id)
        .eq('created_by', user.id);

      if (error) {
        console.error('Error deleting template:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Exception deleting template:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Get all public templates (if sharing feature is added later)
   */
  static async getPublicTemplates(options: DynamicTemplateSearchOptions = {}): Promise<{ success: boolean; data?: DynamicQuestionTemplate[]; error?: string }> {
    try {
      let query = supabase
        .from('dynamic_question_templates')
        .select(`
          id,
          title,
          type,
          question,
          option_a,
          option_b,
          option_c,
          option_d,
          correct_option,
          explanation,
          variables,
          tags,
          difficulty,
          subject,
          grade_level,
          chapter,
          lesson,
          type_category,
          created_at
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Apply same filters as getUserTemplates
      if (options.type) query = query.eq('type', options.type);
      if (options.subject) query = query.eq('subject', options.subject);
      if (options.grade_level) query = query.eq('grade_level', options.grade_level);
      if (options.chapter) query = query.eq('chapter', options.chapter);
      if (options.lesson) query = query.eq('lesson', options.lesson);
      if (options.type_category) query = query.eq('type_category', options.type_category);
      if (options.difficulty) query = query.eq('difficulty', options.difficulty);
      if (options.tags && options.tags.length > 0) query = query.overlaps('tags', options.tags);
      if (options.search_text) {
        query = query.or(`title.ilike.%${options.search_text}%,question.ilike.%${options.search_text}%`);
      }

      if (options.limit) query = query.limit(options.limit);
      if (options.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching public templates:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Exception fetching public templates:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Extract variables from question content for better searchability
   */
  private static extractVariablesFromQuestion(...texts: (string | undefined)[]): Record<string, any> {
    const variables: Record<string, any> = {};
    const variablePattern = /!(\w+)#(-?\d*\.?\d+)#(-?\d*\.?\d+)#(\w+)(?:#(\d+))?!/g;
    
    texts.forEach(text => {
      if (!text) return;
      
      let match;
      while ((match = variablePattern.exec(text)) !== null) {
        const [, name, min, max, type, decimals] = match;
        variables[name] = {
          min: parseFloat(min),
          max: parseFloat(max),
          type,
          decimals: decimals ? parseInt(decimals) : undefined
        };
      }
    });
    
    return variables;
  }

  /**
   * Get statistics about user's dynamic templates
   */
  static async getUserTemplateStats(): Promise<{ success: boolean; data?: { total: number; byType: Record<string, number>; byDifficulty: Record<string, number> }; error?: string }> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('dynamic_question_templates')
        .select('type, difficulty')
        .eq('created_by', user.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching template stats:', error);
        return { success: false, error: error.message };
      }

      const stats = {
        total: data?.length || 0,
        byType: {} as Record<string, number>,
        byDifficulty: {} as Record<string, number>
      };

      data?.forEach(template => {
        stats.byType[template.type] = (stats.byType[template.type] || 0) + 1;
        stats.byDifficulty[template.difficulty || 'medium'] = (stats.byDifficulty[template.difficulty || 'medium'] || 0) + 1;
      });

      return { success: true, data: stats };
    } catch (error: any) {
      console.error('Exception fetching template stats:', error);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }
}