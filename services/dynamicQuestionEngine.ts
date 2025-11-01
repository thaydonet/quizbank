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
   * Apply mathematical rules for coefficients 0 and 1
   * Examples:
   * - "1x" -> "x" (coefficient 1)
   * - "0x^2" -> remove term (coefficient 0)
   * - "x^1" -> "x" (exponent 1)
   * - "x^0" -> "1" (exponent 0)
   * - "-1x" -> "-x"
   * Supports any power: x, x^2, x^3, x^4, etc.
   */
  private applyMathRules(text: string): string {
    let result = text;

    // Rule 1: Remove exponent 1 first (before handling coefficients)
    // "x^1" -> "x", "y^1" -> "y"
    result = result.replace(/([a-zA-Z])\^1\b/g, '$1');

    // Rule 2: Replace variable^0 with 1
    // "x^0" -> "1", "y^0" -> "1"
    result = result.replace(/([a-zA-Z])\^0\b/g, '1');

    // Rule 3: Handle coefficient 0 - remove entire term with variable
    // "0x^3" -> "", "0x^2" -> "", "0x" -> ""
    // Match: optional +/-, optional space, 0, variable, optional ^power
    result = result.replace(/([+\-])\s*0([a-zA-Z])(\^\d+)?/g, '');

    // Handle leading 0 term (at start of expression)
    result = result.replace(/^\s*0([a-zA-Z])(\^\d+)?\s*([+\-])/g, '');
    result = result.replace(/^\s*0([a-zA-Z])(\^\d+)?\s*$/g, '0');

    // Rule 4: Remove coefficient 1 (but NOT -1)
    // "1x" -> "x", "1x^2" -> "x^2", "1x^3" -> "x^3"
    // Match: space or + followed by 1 and variable
    result = result.replace(/([+\s])1([a-zA-Z])/g, '$1$2');

    // Handle leading 1 (at start of expression)
    result = result.replace(/^1([a-zA-Z])/g, '$1');

    // Rule 5: Handle -1 coefficient
    // "-1x" -> "-x", "-1x^2" -> "-x^2", "-1x^3" -> "-x^3"
    result = result.replace(/([+\-\s])-1([a-zA-Z])/g, '$1-$2');

    // Handle leading -1
    result = result.replace(/^-1([a-zA-Z])/g, '-$1');

    // Rule 6: Clean up standalone "+ 0" or "- 0" at the end (constant term)
    result = result.replace(/\s*[+\-]\s*0\s*$/g, '');

    // Rule 7: Clean up "+ 0 +" or "- 0 +" in the middle
    result = result.replace(/\s*[+\-]\s*0\s*([+\-])/g, ' $1');

    // Rule 8: Clean up leading "+ " at the start
    result = result.replace(/^\s*\+\s*/, '');

    // Rule 9: Handle cases like "= 0 + 5" -> "= 5"
    result = result.replace(/=\s*0\s*\+\s*/g, '= ');
    result = result.replace(/=\s*0\s*-\s*/g, '= -');

    // Rule 10: Clean up empty expressions or just operators
    result = result.replace(/=\s*[+\-]\s*$/g, '= 0');

    // Rule 11: If expression becomes empty or just spaces, return 0
    if (result.trim() === '' || result.trim() === '=' || /^[+\-\s]*$/.test(result)) {
      return '0';
    }

    return result;
  }

  /**
   * Normalize mathematical signs in text
   * Converts patterns like "+ -5" to "- 5" and "- -3" to "+ 3"
   */
  private normalizeMathSigns(text: string): string {
    let result = text;

    // Replace "+ -" with "- " (e.g., "x^2 + -5x" -> "x^2 - 5x")
    result = result.replace(/\+\s*-/g, '- ');

    // Replace "- -" with "+ " (e.g., "x^2 - -5x" -> "x^2 + 5x")
    result = result.replace(/-\s*-/g, '+ ');

    // Clean up extra spaces around operators
    result = result.replace(/\s*([+\-*/=])\s*/g, ' $1 ');

    // Remove space before/after in specific contexts (like in exponents or LaTeX)
    result = result.replace(/\^\s+/g, '^');
    result = result.replace(/\s+\^/g, '^');

    return result;
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

    // Normalize mathematical signs after substitution
    result = this.normalizeMathSigns(result);

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
    // Use matchAll to avoid regex lastIndex issues when replacing
    const expressionRegex = /\{tinh:\s*([^}]+)\}/g;
    const matches = Array.from(result.matchAll(expressionRegex));

    // Process matches in reverse order to avoid index shifting issues
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i];
      const [fullMatch, expression] = match;
      const matchIndex = match.index!;

      try {
        // Replace variables in expression
        let evalExpression = expression.trim();
        for (const [name, value] of Object.entries(values)) {
          const regex = new RegExp(`!${name}!`, 'g');
          evalExpression = evalExpression.replace(regex, value.toString());
        }

        // Evaluate using math.js for advanced mathematical functions
        const result_value = evaluate(evalExpression);

        // Replace the match at the specific index
        result = result.substring(0, matchIndex) +
          result_value.toString() +
          result.substring(matchIndex + fullMatch.length);
      } catch (error) {
        console.error('Error evaluating expression:', expression, error);
        result = result.substring(0, matchIndex) +
          '[ERROR]' +
          result.substring(matchIndex + fullMatch.length);
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
      // Apply mathematical rules for 0 and 1
      processed = this.applyMathRules(processed);
      // Final normalization after all processing
      processed = this.normalizeMathSigns(processed);
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