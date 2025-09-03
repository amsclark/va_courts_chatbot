const fs = require('fs');

const csv = fs.readFileSync('pruned_feedback.csv', 'utf-8');
const lines = csv.split('\n').filter(line => line.trim());

// Parse CSV and find failing tests
const failingTests = [];
const passedTestsData = JSON.parse(fs.readFileSync('passed_tests.json', 'utf-8'));
const passedTests = passedTestsData.passed || [];

for (let i = 1; i < lines.length; i++) {
    if (!passedTests.includes(i)) {
        const parts = lines[i].split(',');
        if (parts.length >= 3) {
            const prompt = parts[0].replace(/"/g, '');
            const expectedIntent = parts[1].replace(/"/g, '');
            failingTests.push({
                testNum: i,
                prompt: prompt,
                expectedIntent: expectedIntent
            });
        }
    }
}

console.log('=== REMAINING ' + failingTests.length + ' FAILING TESTS ===');
failingTests.forEach(test => {
    console.log('Test ' + test.testNum + ': "' + test.prompt + '" -> Expected: ' + test.expectedIntent);
});

// Group by intent to see patterns
const intentGroups = {};
failingTests.forEach(test => {
    if (!intentGroups[test.expectedIntent]) {
        intentGroups[test.expectedIntent] = [];
    }
    intentGroups[test.expectedIntent].push(test);
});

console.log('\n=== FAILURES BY INTENT ===');
Object.keys(intentGroups).forEach(intent => {
    console.log('\n' + intent + ' (' + intentGroups[intent].length + ' failures):');
    intentGroups[intent].forEach(test => {
        console.log('  Test ' + test.testNum + ': "' + test.prompt + '"');
    });
});
