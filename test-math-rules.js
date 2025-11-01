// Test file to verify mathematical rules for 0 and 1
import { DynamicQuestionEngine } from './services/dynamicQuestionEngine.ts';

const engine = new DynamicQuestionEngine();

console.log("=== Test Mathematical Rules for 0 and 1 ===\n");

// Test case 1: Coefficient 1
const test1 = {
  question: "Cho hàm số $f(x) = !a(1)!x^2 + !b(1)!x + !c#-5#5#integer!$",
  option_a: "$f'(x) = {tinh: 2*!a!}x + !b!$",
  correct_option: "A",
  explanation: "Đạo hàm là $f'(x) = {tinh: 2*!a!}x + !b!$",
  type: "mcq",
  isDynamic: true
};

console.log("--- Test 1: Coefficient 1 ---");
const result1 = engine.processQuestion(test1);
console.log(`Variables: a=${result1.variables.a}, b=${result1.variables.b}, c=${result1.variables.c}`);
console.log(`Question: ${result1.question}`);
console.log(`Option A: ${result1.option_a}`);
console.log(`Expected: Should show "x^2 + x" not "1x^2 + 1x"`);
console.log(`✓ ${!result1.question.includes('1x') ? 'PASS' : 'FAIL'}\n`);

// Test case 2: Coefficient 0
const test2 = {
  question: "Cho hàm số $f(x) = !a(0)!x^2 + !b#1#5#integer!x + !c#-5#5#integer!$",
  option_a: "$f'(x) = {tinh: 2*!a!}x + !b!$",
  correct_option: "A",
  explanation: "Đạo hàm là $f'(x) = {tinh: 2*!a!}x + !b!$",
  type: "mcq",
  isDynamic: true
};

console.log("--- Test 2: Coefficient 0 ---");
const result2 = engine.processQuestion(test2);
console.log(`Variables: a=${result2.variables.a}, b=${result2.variables.b}, c=${result2.variables.c}`);
console.log(`Question: ${result2.question}`);
console.log(`Option A: ${result2.option_a}`);
console.log(`Expected: Should show "bx + c" not "0x^2 + bx + c"`);
console.log(`✓ ${!result2.question.includes('0x') ? 'PASS' : 'FAIL'}\n`);

// Test case 3: Coefficient -1
const test3 = {
  question: "Cho hàm số $f(x) = !a(-1)!x^2 + !b(-1)!x + !c#-5#5#integer!$",
  option_a: "$f'(x) = {tinh: 2*!a!}x + !b!$",
  correct_option: "A",
  explanation: "Đạo hàm là $f'(x) = {tinh: 2*!a!}x + !b!$",
  type: "mcq",
  isDynamic: true
};

console.log("--- Test 3: Coefficient -1 ---");
const result3 = engine.processQuestion(test3);
console.log(`Variables: a=${result3.variables.a}, b=${result3.variables.b}, c=${result3.variables.c}`);
console.log(`Question: ${result3.question}`);
console.log(`Option A: ${result3.option_a}`);
console.log(`Expected: Should show "-x^2 - x" not "-1x^2 - 1x"`);
console.log(`✓ ${!result3.question.includes('-1x') ? 'PASS' : 'FAIL'}\n`);

// Test case 4: Exponent 1 and 0
const test4 = {
  question: "Tính giá trị: $P = !a#2#5#integer!x^!n(1)! + !b#1#3#integer!x^!m(0)!$",
  option_a: "$P = !a!x + !b!$",
  correct_option: "A",
  explanation: "Ta có $P = !a!x^!n! + !b!x^!m! = !a!x + !b!$",
  type: "mcq",
  isDynamic: true
};

console.log("--- Test 4: Exponent 1 and 0 ---");
const result4 = engine.processQuestion(test4);
console.log(`Variables: a=${result4.variables.a}, b=${result4.variables.b}, n=${result4.variables.n}, m=${result4.variables.m}`);
console.log(`Question: ${result4.question}`);
console.log(`Option A: ${result4.option_a}`);
console.log(`Expected: Should show "ax + b" not "ax^1 + bx^0"`);
console.log(`✓ ${!result4.question.includes('^1') && !result4.question.includes('^0') ? 'PASS' : 'FAIL'}\n`);

// Test case 5: Mixed scenario
const test5 = {
  question: "Cho $f(x) = !a(0,1,2)!x^2 + !b(0,1,-1)!x + !c#-3#3#integer!$",
  option_a: "$f'(x) = {tinh: 2*!a!}x + !b!$",
  correct_option: "A",
  explanation: "Đạo hàm: $f'(x) = {tinh: 2*!a!}x + !b!$",
  type: "mcq",
  isDynamic: true
};

console.log("--- Test 5: Mixed Scenarios (Random 0, 1, -1, 2) ---");
for (let i = 0; i < 5; i++) {
  const result5 = engine.processQuestion(test5);
  console.log(`\nVariation ${i + 1}:`);
  console.log(`Variables: a=${result5.variables.a}, b=${result5.variables.b}, c=${result5.variables.c}`);
  console.log(`Question: ${result5.question}`);
  console.log(`Option A: ${result5.option_a}`);
  
  const hasIssue = result5.question.includes('1x') || 
                   result5.question.includes('0x') ||
                   result5.question.includes('-1x');
  console.log(`✓ ${!hasIssue ? 'PASS - Properly formatted' : 'FAIL - Found formatting issue'}`);
}

console.log("\n=== All Tests Complete ===");
