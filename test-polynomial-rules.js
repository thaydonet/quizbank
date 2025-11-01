// Test file for polynomial mathematical rules with higher degrees
import { DynamicQuestionEngine } from './services/dynamicQuestionEngine.ts';

const engine = new DynamicQuestionEngine();

console.log("=== Test Polynomial Rules (Including Higher Degrees) ===\n");

// Test case 1: Cubic polynomial with coefficient 0
const test1 = {
  question: "Cho hàm số $f(x) = !a#-2#2#integer!x^3 + !b#-5#5#integer!x^2 + !c#-5#5#integer!x + !d#-5#5#integer!$",
  option_a: "$f'(x) = {tinh: 3*!a!}x^2 + {tinh: 2*!b!}x + !c!$",
  correct_option: "A",
  explanation: "Đạo hàm của đa thức bậc 3",
  type: "mcq",
  isDynamic: true
};

console.log("--- Test 1: Cubic Polynomial (x^3) ---");
for (let i = 0; i < 3; i++) {
  const result = engine.processQuestion(test1);
  console.log(`\nVariation ${i + 1}:`);
  console.log(`Variables: a=${result.variables.a}, b=${result.variables.b}, c=${result.variables.c}, d=${result.variables.d}`);
  console.log(`Question: ${result.question}`);
  console.log(`Option A: ${result.option_a}`);
  
  // Check for issues
  const hasIssue = result.question.includes('1x') || 
                   result.question.includes('0x') ||
                   result.question.includes('-1x') ||
                   result.question.includes('+ 0$') ||
                   result.question.includes('- 0$');
  console.log(`Status: ${!hasIssue ? '✅ PASS' : '❌ FAIL - Found formatting issue'}`);
}

// Test case 2: Quartic polynomial (x^4)
const test2 = {
  question: "Cho $P(x) = !a(0,1,-1,2)!x^4 + !b(0,1,-1)!x^3 + !c#-3#3#integer!x^2 + !d(0,1,-1)!x + !e#-5#5#integer!$",
  option_a: "Bậc của đa thức là 4",
  correct_option: "A",
  explanation: "Đa thức bậc 4",
  type: "mcq",
  isDynamic: true
};

console.log("\n\n--- Test 2: Quartic Polynomial (x^4) with Random 0, 1, -1 ---");
for (let i = 0; i < 3; i++) {
  const result = engine.processQuestion(test2);
  console.log(`\nVariation ${i + 1}:`);
  console.log(`Variables: a=${result.variables.a}, b=${result.variables.b}, c=${result.variables.c}, d=${result.variables.d}, e=${result.variables.e}`);
  console.log(`Question: ${result.question}`);
  
  const hasIssue = result.question.includes('1x') || 
                   result.question.includes('0x') ||
                   result.question.includes('-1x');
  console.log(`Status: ${!hasIssue ? '✅ PASS' : '❌ FAIL'}`);
}

// Test case 3: All coefficients are 0 except constant
const test3 = {
  question: "Cho $f(x) = !a(0)!x^3 + !b(0)!x^2 + !c(0)!x + !d#1#10#integer!$",
  option_a: "$f'(x) = 0$",
  correct_option: "A",
  explanation: "Đạo hàm của hằng số là 0",
  type: "mcq",
  isDynamic: true
};

console.log("\n\n--- Test 3: All Zero Coefficients (Constant Function) ---");
const result3 = engine.processQuestion(test3);
console.log(`Variables: a=${result3.variables.a}, b=${result3.variables.b}, c=${result3.variables.c}, d=${result3.variables.d}`);
console.log(`Question: ${result3.question}`);
console.log(`Expected: Should show just the constant, like "f(x) = 5"`);
console.log(`Status: ${!result3.question.includes('0x') ? '✅ PASS' : '❌ FAIL'}`);

// Test case 4: All coefficients are 1
const test4 = {
  question: "Cho $f(x) = !a(1)!x^3 + !b(1)!x^2 + !c(1)!x + !d#-5#5#integer!$",
  option_a: "$f'(x) = 3x^2 + 2x + 1$",
  correct_option: "A",
  explanation: "Đạo hàm",
  type: "mcq",
  isDynamic: true
};

console.log("\n\n--- Test 4: All Coefficients are 1 ---");
const result4 = engine.processQuestion(test4);
console.log(`Variables: a=${result4.variables.a}, b=${result4.variables.b}, c=${result4.variables.c}, d=${result4.variables.d}`);
console.log(`Question: ${result4.question}`);
console.log(`Expected: Should show "x^3 + x^2 + x + d" not "1x^3 + 1x^2 + 1x + d"`);
console.log(`Status: ${!result4.question.includes('1x') ? '✅ PASS' : '❌ FAIL'}`);

// Test case 5: All coefficients are -1
const test5 = {
  question: "Cho $f(x) = !a(-1)!x^3 + !b(-1)!x^2 + !c(-1)!x + !d#-5#5#integer!$",
  option_a: "$f'(x) = -3x^2 - 2x - 1$",
  correct_option: "A",
  explanation: "Đạo hàm",
  type: "mcq",
  isDynamic: true
};

console.log("\n\n--- Test 5: All Coefficients are -1 ---");
const result5 = engine.processQuestion(test5);
console.log(`Variables: a=${result5.variables.a}, b=${result5.variables.b}, c=${result5.variables.c}, d=${result5.variables.d}`);
console.log(`Question: ${result5.question}`);
console.log(`Expected: Should show "-x^3 - x^2 - x + d" not "-1x^3 - 1x^2 - 1x + d"`);
console.log(`Status: ${!result5.question.includes('-1x') ? '✅ PASS' : '❌ FAIL'}`);

// Test case 6: Polynomial degree 5
const test6 = {
  question: "Cho $P(x) = !a#1#3#integer!x^5 + !b(0)!x^4 + !c#-2#2#integer!x^3 + !d(0)!x^2 + !e(1)!x + !f#-10#10#integer!$",
  option_a: "Bậc 5",
  correct_option: "A",
  explanation: "Đa thức bậc 5",
  type: "mcq",
  isDynamic: true
};

console.log("\n\n--- Test 6: Polynomial Degree 5 (x^5) ---");
const result6 = engine.processQuestion(test6);
console.log(`Variables: a=${result6.variables.a}, b=${result6.variables.b}, c=${result6.variables.c}, d=${result6.variables.d}, e=${result6.variables.e}, f=${result6.variables.f}`);
console.log(`Question: ${result6.question}`);
console.log(`Expected: Should handle x^5 correctly and remove 0 terms`);
const hasIssue6 = result6.question.includes('1x') || 
                  result6.question.includes('0x') ||
                  result6.question.includes('-1x');
console.log(`Status: ${!hasIssue6 ? '✅ PASS' : '❌ FAIL'}`);

console.log("\n\n=== All Polynomial Tests Complete ===");
