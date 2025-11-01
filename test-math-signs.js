// Test file to verify math sign normalization
import { DynamicQuestionEngine } from './services/dynamicQuestionEngine.ts';

const engine = new DynamicQuestionEngine();

// Test case 1: Negative coefficients
const testQuestion1 = {
  question: "Cho hàm số $f(x) = !a#1#3#integer!x^2 + !b#-10#-1#integer!x + !c#-5#-1#integer!$. Tìm đạo hàm.",
  option_a: "$f'(x) = {tinh: 2*!a!}x + !b!$",
  option_b: "$f'(x) = {tinh: 2*!a!}x + {tinh: 2*!b!}$",
  option_c: "$f'(x) = !a!x + !b!$",
  option_d: "$f'(x) = {tinh: !a!}x + {tinh: !b!}$",
  correct_option: "A",
  explanation: "Đạo hàm của $ax^2 + bx + c$ là $2ax + b$. Với $a = !a!$, $b = !b!$, $c = !c!$, ta có $f'(x) = {tinh: 2*!a!}x + !b!$.",
  type: "mcq",
  isDynamic: true
};

// Test case 2: Mixed positive and negative
const testQuestion2 = {
  question: "Tính giá trị của biểu thức $P = !x#1#5#integer! + !y#-8#-2#integer! + !z#-5#-1#integer!$",
  option_a: "$P = {tinh: !x! + !y! + !z!}$",
  option_b: "$P = {tinh: !x! + !y!}$",
  option_c: "$P = {tinh: !x! - !y!}$",
  option_d: "$P = {tinh: !x! * !y!}$",
  correct_option: "A",
  explanation: "Ta có $P = !x! + !y! + !z! = {tinh: !x! + !y! + !z!}$",
  type: "mcq",
  isDynamic: true
};

console.log("=== Test 1: Negative Coefficients in Polynomial ===\n");

const variations1 = engine.generateVariations(testQuestion1, 3);

variations1.forEach((variation, index) => {
  console.log(`\n--- Variation ${index + 1} ---`);
  console.log(`Variables: a=${variation.variables.a}, b=${variation.variables.b}, c=${variation.variables.c}`);
  console.log(`Question: ${variation.question}`);
  console.log(`Option A: ${variation.option_a}`);
  console.log(`Explanation: ${variation.explanation}`);
  
  // Check for "+ -" pattern (should not exist)
  const hasBadPattern = variation.question.includes('+ -') || 
                        variation.option_a?.includes('+ -') ||
                        variation.explanation.includes('+ -');
  
  if (hasBadPattern) {
    console.log("❌ ERROR: Found '+ -' pattern that should be normalized!");
  } else {
    console.log("✅ SUCCESS: Math signs properly normalized!");
  }
});

console.log("\n\n=== Test 2: Mixed Positive and Negative Numbers ===\n");

const variations2 = engine.generateVariations(testQuestion2, 3);

variations2.forEach((variation, index) => {
  console.log(`\n--- Variation ${index + 1} ---`);
  console.log(`Variables: x=${variation.variables.x}, y=${variation.variables.y}, z=${variation.variables.z}`);
  console.log(`Question: ${variation.question}`);
  console.log(`Option A: ${variation.option_a}`);
  console.log(`Explanation: ${variation.explanation}`);
  
  const hasBadPattern = variation.question.includes('+ -') || 
                        variation.option_a?.includes('+ -') ||
                        variation.explanation.includes('+ -');
  
  if (hasBadPattern) {
    console.log("❌ ERROR: Found '+ -' pattern!");
  } else {
    console.log("✅ SUCCESS: Signs normalized!");
  }
});
