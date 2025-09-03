const fs = require('fs');
const passedData = JSON.parse(fs.readFileSync('passed_tests.json', 'utf-8'));
const passed = passedData.passed || [];

// Total tests should be 210, find what's not in passed array
const failingTests = [];
for(let i = 1; i <= 210; i++) {
    if(!passed.includes(i)) {
        failingTests.push(i);
    }
}
console.log('Tests not in passed_tests.json:', failingTests);
console.log('Count of failing tests:', failingTests.length);
console.log('Passed tests count:', passed.length);
console.log('Total should be 210, actual coverage:', passed.length + failingTests.length);
