const fs = require('fs');

// Read the CSV to get test details
const csv = fs.readFileSync('pruned_feedback.csv', 'utf8').split('\n');

// The failing tests are those NOT in the newly passed list
const passedTests = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 45, 46, 47, 48, 50, 51, 52, 53, 57, 58, 59, 60, 61, 62, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 75, 76, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 95, 96, 97, 98, 99, 103, 104, 105, 106, 107, 108, 109, 110, 111, 113, 114, 115, 116, 119, 120, 121, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 146, 147, 149, 150, 151, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 190, 191, 192, 193, 194, 195, 196, 197, 199, 200, 201, 202, 203, 204, 205, 206, 208, 209, 210]);

const failingTests = [];
for (let i = 1; i <= 210; i++) {
  if (!passedTests.has(i) && csv[i]) {
    const cols = csv[i].split(',');
    if (cols.length >= 2) {
      failingTests.push({
        test: i,
        expectedIntent: cols[0].replace(/"/g, '').trim(),
        prompt: cols[1].replace(/"/g, '').trim()
      });
    }
  }
}

console.log('=== FAILING TESTS ANALYSIS ===');
console.log('Total failing tests:', failingTests.length);
console.log('Success rate: 176/210 = 83.81%');
console.log();

// Group by expected intent to find patterns
const intentGroups = {};
failingTests.forEach(test => {
  if (!intentGroups[test.expectedIntent]) {
    intentGroups[test.expectedIntent] = [];
  }
  intentGroups[test.expectedIntent].push(test);
});

console.log('=== FAILING TESTS BY EXPECTED INTENT ===');
Object.keys(intentGroups).sort().forEach(intent => {
  console.log(`${intent}: ${intentGroups[intent].length} failures`);
  intentGroups[intent].forEach(test => {
    console.log(`  Test ${test.test}: ${test.prompt.substring(0, 70)}...`);
  });
  console.log();
});

console.log('=== SUMMARY BY INTENT ===');
Object.keys(intentGroups).sort().forEach(intent => {
  console.log(`${intent}: ${intentGroups[intent].length} failures`);
});
