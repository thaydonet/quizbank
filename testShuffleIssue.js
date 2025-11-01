// Shuffle array utility
function shuffleArray(arr) {
    const newArr = [...arr];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}
// Process questions with shuffling (current implementation)
function processQuestions(questions, shuffleMcqOptions) {
    let processedQuestions = [...questions];
    // Shuffle MCQ options if requested
    if (shuffleMcqOptions) {
        processedQuestions = processedQuestions.map(q => {
            var _a, _b, _c, _d;
            if (q.type === 'mcq' && q.option_a && q.option_b && q.option_c && q.option_d) {
                const optionsList = [
                    { key: 'A', value: q.option_a },
                    { key: 'B', value: q.option_b },
                    { key: 'C', value: q.option_c },
                    { key: 'D', value: q.option_d }
                ];
                // Find the correct option value before shuffling
                const correctOption = optionsList.find(opt => opt.key === q.correct_option);
                const correctValue = (correctOption === null || correctOption === void 0 ? void 0 : correctOption.value) || '';
                // Shuffle the options
                const shuffledOptions = shuffleArray(optionsList);
                // Create mapping from original keys to new keys
                const answerMap = {};
                optionsList.forEach(originalOpt => {
                    const newPosition = shuffledOptions.findIndex(shuffledOpt => shuffledOpt.value === originalOpt.value);
                    if (newPosition !== -1) {
                        answerMap[originalOpt.key] = shuffledOptions[newPosition].key;
                    }
                });
                // Find the new key for the correct answer after shuffling
                // The correct approach is to find the new position of the correct option in the shuffled array
                const correctOptionIndex = optionsList.findIndex(opt => opt.key === q.correct_option);
                const newCorrectKey = correctOptionIndex !== -1 ? shuffledOptions[correctOptionIndex].key : 'A';
                return Object.assign(Object.assign({}, q), { option_a: ((_a = shuffledOptions[0]) === null || _a === void 0 ? void 0 : _a.value) || '', option_b: ((_b = shuffledOptions[1]) === null || _b === void 0 ? void 0 : _b.value) || '', option_c: ((_c = shuffledOptions[2]) === null || _c === void 0 ? void 0 : _c.value) || '', option_d: ((_d = shuffledOptions[3]) === null || _d === void 0 ? void 0 : _d.value) || '', correct_option: newCorrectKey, original_correct_option: q.correct_option, original_correct_value: correctValue, shuffled_answer_map: answerMap // Complete mapping for reference
                 });
            }
            return q;
        });
    }
    return processedQuestions;
}
// Test with multiple exam generations
function testMultipleExams() {
    // Create a sample question
    const originalQuestion = {
        id: 'test-1',
        type: 'mcq',
        question: 'What is 2+2?',
        option_a: '3',
        option_b: '4',
        option_c: '5',
        option_d: '6',
        correct_option: 'B' // Correct answer is "4"
    };
    console.log('Original question:', originalQuestion);
    console.log('Expected correct answer: B (4)\n');
    // Generate multiple exams
    const examCount = 6;
    const examResults = [];
    for (let i = 1; i <= examCount; i++) {
        // Deep-clone questions for this exam copy
        const questionsCopy = JSON.parse(JSON.stringify([originalQuestion]));
        // Process questions for this exam
        const processedQuestions = processQuestions(questionsCopy, true);
        examResults.push(processedQuestions);
        console.log(`Exam ${i}:`);
        console.log(`  Options: A="${processedQuestions[0].option_a}" B="${processedQuestions[0].option_b}" C="${processedQuestions[0].option_c}" D="${processedQuestions[0].option_d}"`);
        console.log(`  Correct answer key: ${processedQuestions[0].correct_option}`);
        // Verify correctness
        const correctValue = processedQuestions[0][`option_${processedQuestions[0].correct_option.toLowerCase()}`];
        console.log(`  Correct answer value: "${correctValue}"`);
        if (correctValue === '4') {
            console.log('  ✅ CORRECT');
        }
        else {
            console.log('  ❌ INCORRECT');
        }
        console.log('');
    }
    // Count incorrect exams
    const incorrectCount = examResults.filter(exam => {
        const correctValue = exam[0][`option_${exam[0].correct_option.toLowerCase()}`];
        return correctValue !== '4';
    }).length;
    console.log(`Summary: ${incorrectCount} out of ${examCount} exams have incorrect answers`);
    return incorrectCount;
}
// Run the test
testMultipleExams();
