// Dynamic Question Engine
// Handles variable substitution and mathematical calculations for dynamic questions
import { evaluate } from 'mathjs';

export interface DynamicVariable {
  name: string;
  min: number;
  max: number;
  type: 'integer' | 'decimal';
  decimals?: number;
  excludeZero?: boolean;
  choices?: (string | number)[];
}

export interface DynamicExpression {
  expression: string;
  variables: { [key: string]: number };
}

export interface ProcessedQuestion {
  question: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_option: string;
  explanation: string;
  variables: { [key: string]: string | number };
}

export class DynamicQuestionEngine {
  
  /**
   * Generate random number within range
   */
  private generateRandomNumber(min: number, max: number, type: 'integer' | 'decimal', decimals: number = 2, excludeZero: boolean = false): number {
    let random;
    do {
      random = Math.random() * (max - min) + min;
      if (type === 'integer') {
        random = Math.floor(random);
      } else {
        random = Math.round(random * Math.pow(10, decimals)) / Math.pow(10, decimals);
      }
    } while (excludeZero && random === 0);
    
    return random;
  }

  /**
   * Select random choice from array
   */
  private selectRandomChoice(choices: (string | number)[]): string | number {
    const randomIndex = Math.floor(Math.random() * choices.length);
    return choices[randomIndex];
  }

  /**
   * Parse variable definitions from text
   * Supports multiple formats:
   * !a! - variable a from -10 to 10
   * !a#0! - variable a from -10 to 10 excluding 0
   * !b:2:35! - variable b from 2 to 35
   * !q(2,4,6)! - variable q randomly chooses from 2,4,6
   * !q(may,tue,mon)! - variable q randomly chooses from may,tue,mon
   */
  private parseVariableDefinitions(text: string): DynamicVariable[] {
    const variables: DynamicVariable[] = [];
    const variableMap = new Map<string, DynamicVariable>();
    
    // Pattern 1: !a! - simple variable (-10 to 10)
    const simpleRegex = /!([a-zA-Z_][a-zA-Z0-9_]*)!/g;
    let match;
    
    // Pattern 2: !a#0! - exclude zero
    const excludeZeroRegex = /!([a-zA-Z_][a-zA-Z0-9_]*)#0!/g;
    
    // Pattern 3: !b:2:35! - range
    const rangeRegex = /!([a-zA-Z_][a-zA-Z0-9_]*):(-?\d+):(-?\d+)!/g;
    
    // Pattern 4: !q(...)! - choices
    const choicesRegex = /!([a-zA-Z_][a-zA-Z0-9_]*)\(([^)]+)\)!/g;
    
    // Parse exclude zero pattern
    while ((match = excludeZeroRegex.exec(text)) !== null) {
      const [, name] = match;
      if (!variableMap.has(name)) {
        variableMap.set(name, {
          name,
          min: -10,
          max: 10,
          type: 'integer',
          excludeZero: true
        });
      }
    }
    
    // Parse range pattern
    while ((match = rangeRegex.exec(text)) !== null) {
      const [, name, minStr, maxStr] = match;
      if (!variableMap.has(name)) {
        variableMap.set(name, {
          name,
          min: parseInt(minStr),
          max: parseInt(maxStr),
          type: 'integer'
        });
      }
    }
    
    // Parse choices pattern
    while ((match = choicesRegex.exec(text)) !== null) {
      const [, name, choicesStr] = match;
      if (!variableMap.has(name)) {
        const choices = choicesStr.split(',').map(choice => {
          choice = choice.trim();
          // Try to parse as number, otherwise keep as string
          const numChoice = parseFloat(choice);
          return !isNaN(numChoice) ? numChoice : choice;
        });
        
        variableMap.set(name, {
          name,
          min: 0,
          max: 0,
          type: 'integer',
          choices
        });
      }
    }
    
    // Parse simple pattern (only if not already defined)
    while ((match = simpleRegex.exec(text)) !== null) {
      const [, name] = match;
      if (!variableMap.has(name)) {
        variableMap.set(name, {
          name,
          min: -10,
          max: 10,
          type: 'integer'
        });
      }
    }
    
    return Array.from(variableMap.values());
  }

  /**
   * Generate variable values
   */
  private generateVariableValues(variables: DynamicVariable[]): { [key: string]: string | number } {
    const values: { [key: string]: string | number } = {};
    
    for (const variable of variables) {
      if (variable.choices && variable.choices.length > 0) {
        // Select from choices
        values[variable.name] = this.selectRandomChoice(variable.choices);
      } else {
        // Generate random number
        values[variable.name] = this.generateRandomNumber(
          variable.min, 
          variable.max, 
          variable.type, 
          variable.decimals || 0,
          variable.excludeZero || false
        );
      }
    }
    
    return values;
  }

  /**
   * Substitute variables in text
   * Supports all variable formats and removes the pattern definitions
   */
  private substituteVariables(text: string, values: { [key: string]: string | number }): string {
    let result = text;
    
    // Remove variable definitions patterns
    result = result.replace(/!([a-zA-Z_][a-zA-Z0-9_]*)#0!/g, '!$1!');
    result = result.replace(/!([a-zA-Z_][a-zA-Z0-9_]*):(-?\d+):(-?\d+)!/g, '!$1!');
    result = result.replace(/!([a-zA-Z_][a-zA-Z0-9_]*)\([^)]+\)!/g, '!$1!');
    
    // Substitute variable values
    for (const [name, value] of Object.entries(values)) {
      const regex = new RegExp(`!${name}!`, 'g');
      result = result.replace(regex, value.toString());
    }
    
    return result;
  }

  /**
   * Evaluate mathematical expressions
   * Format: {tinh: expression}
   * Also supports conditional expressions: iff(condition, true_value, false_value)
   */
  private evaluateExpressions(text: string, values: { [key: string]: string | number }): string {
    let result = text;
    
    // First handle iff() conditional expressions
    result = this.evaluateConditionals(result, values);
    
    // Then handle {tinh: expression}
    const expressionRegex = /\{tinh:\s*([^}]+)\}/g;
    let match;

    while ((match = expressionRegex.exec(result)) !== null) {
      const [fullMatch, expression] = match;
      
      try {
        // Replace variables in expression
        let evalExpression = expression.trim();
        for (const [name, value] of Object.entries(values)) {
          const regex = new RegExp(`!${name}!`, 'g');
          evalExpression = evalExpression.replace(regex, value.toString());
        }

        // Evaluate using math.js for advanced mathematical functions
        const result_value = evaluate(evalExpression);
        result = result.replace(fullMatch, result_value.toString());
      } catch (error) {
        console.error('Error evaluating expression:', expression, error);
        result = result.replace(fullMatch, '[ERROR]');
      }
    }

    return result;
  }

  /**
   * Evaluate conditional expressions
   * Format: iff(condition, true_value, false_value)
   * Similar to Excel's IF function
   */
  private evaluateConditionals(text: string, values: { [key: string]: string | number }): string {
    let result = text;
    const conditionalRegex = /iff\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/g;
    let match;

    while ((match = conditionalRegex.exec(text)) !== null) {
      const [fullMatch, condition, trueValue, falseValue] = match;
      
      try {
        // Replace variables in condition
        let evalCondition = condition.trim();
        for (const [name, value] of Object.entries(values)) {
          const regex = new RegExp(`!${name}!`, 'g');
          evalCondition = evalCondition.replace(regex, value.toString());
        }

        // Evaluate condition using math.js
        const conditionResult = evaluate(evalCondition);
        
        // Select true or false value
        let selectedValue = conditionResult ? trueValue.trim() : falseValue.trim();
        
        // Replace variables in selected value
        for (const [name, value] of Object.entries(values)) {
          const regex = new RegExp(`!${name}!`, 'g');
          selectedValue = selectedValue.replace(regex, value.toString());
        }
        
        result = result.replace(fullMatch, selectedValue);
      } catch (error) {
        console.error('Error evaluating conditional:', condition, error);
        result = result.replace(fullMatch, '[ERROR]');
      }
    }

    return result;
  }

  /**
   * Safe mathematical expression evaluation (deprecated - now using math.js)
   * Kept for backward compatibility
   */
  private safeEvaluate(expression: string): number {
    try {
      const result = evaluate(expression);
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('Invalid result');
      }
      return result;
    } catch (error) {
      throw new Error('Invalid mathematical expression');
    }
  }

  /**
   * Process a dynamic question template
   */
  public processQuestion(template: {
    question: string;
    option_a?: string;
    option_b?: string;
    option_c?: string;
    option_d?: string;
    correct_option: string;
    explanation: string;
    [key: string]: any;
  }): ProcessedQuestion {
    
    // Extract all variable definitions from all text fields
    const allText = [
      template.question,
      template.option_a || '',
      template.option_b || '',
      template.option_c || '',
      template.option_d || '',
      template.correct_option,
      template.explanation
    ].join(' ');

    const variables = this.parseVariableDefinitions(allText);
    const values = this.generateVariableValues(variables);
    
    console.log('Dynamic variables found:', variables);
    console.log('Generated values:', values);

    // Process each field
    const processField = (text: string): string => {
      if (!text) return '';
      let processed = this.substituteVariables(text, values);
      processed = this.evaluateExpressions(processed, values);
      return processed;
    };

    return {
      question: processField(template.question),
      option_a: template.option_a ? processField(template.option_a) : undefined,
      option_b: template.option_b ? processField(template.option_b) : undefined,
      option_c: template.option_c ? processField(template.option_c) : undefined,
      option_d: template.option_d ? processField(template.option_d) : undefined,
      correct_option: processField(template.correct_option),
      explanation: processField(template.explanation),
      variables: values
    };
  }

  /**
   * Check if a question template contains dynamic elements
   */
  public isDynamicQuestion(template: {
    question: string;
    option_a?: string;
    option_b?: string;
    option_c?: string;
    option_d?: string;
    correct_option: string;
    explanation: string;
    isDynamic?: boolean;
  }): boolean {
    // Check for explicit isDynamic flag first
    if (template.isDynamic === true) {
      return true;
    }
    
    const allText = [
      template.question,
      template.option_a || '',
      template.option_b || '',
      template.option_c || '',
      template.option_d || '',
      template.correct_option,
      template.explanation
    ].join(' ');

    // Check for variable definitions, expressions, or conditionals
    return /!([a-zA-Z_][a-zA-Z0-9_]*)(?:#0|:[-\d]+:[-\d]+|\([^)]+\))?!/.test(allText) || 
           /\{tinh:\s*[^}]+\}/.test(allText) ||
           /iff\s*\([^)]+\)/.test(allText);
  }

  /**
   * Generate multiple variations of a dynamic question
   */
  public generateVariations(template: any, count: number): ProcessedQuestion[] {
    const variations: ProcessedQuestion[] = [];
    
    for (let i = 0; i < count; i++) {
      variations.push(this.processQuestion(template));
    }
    
    return variations;
  }
}