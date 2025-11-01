// Test file to verify the fix for multiple {tinh:} expressions
import { DynamicQuestionEngine } from './services/dynamicQuestionEngine.ts';

const engine = new DynamicQuestionEngine();

// Test case: Multiple {tinh:} expressions in one string
const testQuestion = {
  question: "Cho hàm số $f(x) = !a#1#5#integer!x^2 + !b#1#10#integer!x + !c#-5#5#integer!$",
  option_a: "$f'(x) = {tinh: 2*!a!}x + {tinh: 2*!b!}$",
  option_b: "$f'(x) = {tinh: 2*!a!}x + !b!$",
  option_c: "$f'(x) = !a!x + !b!$",
  option_d: "$f'(x) = {tinh: !a!}x + {tinh: !b!}$",
  correct_option: "B",
  explanation: "Đạo hàm của $ax^2 + bx + c$ là $2ax + b$. Với $a = !a!$, $b = !b!$, ta có $f'(x) = {tinh: 2*!a!}x + !b!$.",
  type: "mcq",
  isDynamic: true
};

console.log("=== Testing Multiple {tinh:} Expressions ===\n");

// Generate 3 variations
const variations = engine.generateVariations(testQuestion, 3);

variations.forEach((variation, index) => {
  console.log(`\n--- Variation ${index + 1} ---`);
  console.log(`Variables: ${JSON.stringify(variation.variables)}`);
  console.log(`Question: ${variation.question}`);
  console.log(`Option A: ${variation.option_a}`);
  console.log(`Option B: ${variation.option_b}`);
  console.log(`Option C: ${variation.option_c}`);
  console.log(`Option D: ${variation.option_d}`);
  console.log(`Explanation: ${variation.explanation}`);
  
  // Check if option A has both expressions evaluated
  const hasError = variation.option_a?.includes('[ERROR]') || 
                   variation.option_a?.includes('{tinh:');
  
  if (hasError) {
    console.log("❌ ERROR: Option A still contains unevaluated expressions!");
  } else {
    console.log("✅ SUCCESS: All expressions in Option A were evaluated!");
  }
});
