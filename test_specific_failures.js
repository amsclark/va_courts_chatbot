const fs = require('fs');
const https = require('https');

// Test specific test numbers to see current status
const testNumbers = [27, 28, 49, 142, 143, 144, 145];

async function testSinglePrompt(prompt, expectedIntent, testNum) {
    return new Promise((resolve) => {
        const postData = JSON.stringify({
            queryInput: {
                text: {
                    text: prompt,
                    languageCode: 'en-US'
                }
            }
        });

        const options = {
            hostname: 'clarkmanagementconsulting.com',
            path: '/va_testing.html',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    const detectedIntent = response.queryResult?.intent?.displayName || 'No Intent Detected';
                    
                    const match = detectedIntent.toLowerCase().includes(expectedIntent.toLowerCase()) ||
                                expectedIntent.toLowerCase().includes(detectedIntent.toLowerCase());
                    
                    console.log(`Test ${testNum}: "${prompt}"`);
                    console.log(`  Expected: ${expectedIntent}`);
                    console.log(`  Got: ${detectedIntent}`);
                    console.log(`  Status: ${match ? 'PASS' : 'FAIL'}`);
                    console.log('');
                    
                    resolve({ testNum, match });
                } catch (e) {
                    console.log(`Test ${testNum}: ERROR - ${e.message}`);
                    resolve({ testNum, match: false });
                }
            });
        });

        req.on('error', (e) => {
            console.log(`Test ${testNum}: ERROR - ${e.message}`);
            resolve({ testNum, match: false });
        });

        req.write(postData);
        req.end();
    });
}

async function main() {
    // Read CSV to get test data
    const csv = fs.readFileSync('pruned_feedback.csv', 'utf-8');
    const lines = csv.trim().split('\n');
    
    console.log('=== TESTING SPECIFIC FAILING TESTS ===\n');
    
    for (const testNum of testNumbers) {
        if (testNum < lines.length) {
            const line = lines[testNum];
            const parts = line.match(/^"?([^"]*?)"?,\s*"?([^"]*?)"?,/);
            
            if (parts) {
                const prompt = parts[1].trim();
                const expectedIntent = parts[2].trim();
                
                await testSinglePrompt(prompt, expectedIntent, testNum);
                await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
            }
        }
    }
}

main();
