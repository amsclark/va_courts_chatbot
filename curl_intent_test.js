const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Read and parse CSV manually with a simple parser for the pruned feedback format
const csvContent = fs.readFileSync('pruned_feedback.csv', 'utf8');
const rawLines = csvContent.split(/\r?\n/);

function parseCSVLine(line) {
  const cols = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      // lookahead for escaped quote
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        cur += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cols.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  cols.push(cur);
  return cols.map(c => c.trim());
}

const lines = rawLines.filter(line => line.trim() !== ''); // Remove empty lines
const headers = parseCSVLine(lines[0] || '');

// Find column indices - pruned_feedback.csv has simple structure: Intent,Test Prompt
const intentIndex = 0; // Intent column is first
const promptIndex = 1; // Test Prompt column is second

console.log(`Processing pruned_feedback.csv with ${lines.length - 1} test prompts`);

const results = [];
const passedFile = 'passed_tests.json';
let passedTests = { passed: [] };
try {
  passedTests = JSON.parse(fs.readFileSync(passedFile, 'utf8'));
} catch (e) {
  // file will be created later
}

// No need for intent mapping - we'll use the Intent column directly from CSV

async function testPrompt(index, prompt, expectedIntent) {
  try {
    // Create the JSON payload first
    const payload = {
      queryInput: {
        text: {
          text: prompt,
          languageCode: "en"
        }
      }
    };
    
    // Write payload to temp file to avoid shell escaping issues
    const tempFile = `/tmp/payload_${index}.json`;
    fs.writeFileSync(tempFile, JSON.stringify(payload));
    
    const curlCommand = `curl -s 'https://dialogflow.cloud.google.com/v1/integrations/messenger/webhook/9a6751d7-5b0c-4bd3-8d17-5a3dd3222658/sessions/dfMessenger-${Date.now()}-${index}' -X POST -H 'Content-Type: application/json' -H 'Origin: https://clarkmanagementconsulting.com' --data @${tempFile}`;

    const { stdout, stderr } = await execAsync(curlCommand);
    
    // Clean up temp file
    fs.unlinkSync(tempFile);
    
    if (stderr) {
      console.error(`Error for prompt ${index}:`, stderr);
      return { index, prompt, result: 'ERROR', response: stderr, expectedIntent };
    }

    // Parse response (remove the )]}' prefix if present)
    let cleanResponse = stdout;
    if (cleanResponse.startsWith(")]}'")) {
      cleanResponse = cleanResponse.substring(5);
    }
    const responseData = JSON.parse(cleanResponse || '{}');
    
    let actualResponse = 'N/A';
    let intentName = 'Unknown';
    
    if (responseData.queryResult) {
      // Get intent name
      if (responseData.queryResult.intent && responseData.queryResult.intent.displayName) {
        intentName = responseData.queryResult.intent.displayName;
      }
      
      // Get fulfillment text
      if (responseData.queryResult.fulfillmentText) {
        actualResponse = responseData.queryResult.fulfillmentText;
      }
      else if (responseData.queryResult.fulfillmentMessages) {
        const textMessages = responseData.queryResult.fulfillmentMessages
          .filter(m => m.text && m.text.text)
          .flatMap(m => m.text.text);
        if (textMessages.length > 0) {
          actualResponse = textMessages[0];
        }
      }
    }

    // Determine test result based on intent matching
    let result = 'FAIL';
    
    if (expectedIntent && expectedIntent !== '???' && expectedIntent.trim() !== '') {
      // Check if the matched intent is what we expect
      if (intentName === expectedIntent) {
        result = 'PASS';
      } else {
        result = 'WRONG_INTENT';
      }
    } else {
      // If intent is not specified or is '???', check that some intent was matched (not fallback)
      if (intentName && intentName !== 'Default Fallback Intent' && intentName !== 'Unknown') {
        result = 'PASS_NO_EXPECTED';
      } else {
        result = 'NO_INTENT';
      }
    }

    return {
      index,
      prompt,
      result,
      intentName,
      response: actualResponse,
      expectedIntent
    };

  } catch (error) {
    console.error(`Error processing prompt ${index}:`, error);
    return { index, prompt, result: 'ERROR', response: error.message, expectedIntent };
  }
}

async function runTests() {
  const testPromises = [];
  console.log(`Starting tests for ${lines.length - 1} prompts...`);
  
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length >= 2 && cols[promptIndex] && cols[promptIndex].trim() !== '') {
      const index = i;
      
      // Skip tests that are already passing - DISABLED FOR FULL TEST RUN
      // if (passedTests.passed && passedTests.passed.includes(index)) {
      //   console.log(`Skipping test ${index} (already passed)`);
      //   continue;
      // }
      
      const expectedIntent = cols[intentIndex];
      const prompt = cols[promptIndex];
      
      testPromises.push(testPrompt(index, prompt, expectedIntent));
      
      // Add delay between requests to avoid rate limiting - run in smaller batches
      if (testPromises.length % 3 === 0) {
        console.log(`Queued ${testPromises.length} tests so far...`);
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds every 3 requests
      }
    }
  }
  
  const testResults = await Promise.all(testPromises);
  
  let passCount = 0;
  let failCount = 0;
  let wrongIntentCount = 0;
  let noIntentCount = 0;
  let passNoExpectedCount = 0;
  const outputLines = [];
  const newlyPassed = [];
  
  for (const result of testResults) {
    if (result.result === 'PASS') {
      passCount++;
      newlyPassed.push(result.index);
      outputLines.push(`Test ${result.index}: PASS`);
      outputLines.push(`  Prompt: ${result.prompt}`);
      outputLines.push(`  Expected Intent: ${result.expectedIntent}`);
      outputLines.push(`  Actual Intent: ${result.intentName}`);
      outputLines.push(`  Response: ${result.response}`);
      outputLines.push('');
    } else if (result.result === 'PASS_NO_EXPECTED') {
      passNoExpectedCount++;
      outputLines.push(`Test ${result.index}: PASS_NO_EXPECTED`);
      outputLines.push(`  Prompt: ${result.prompt}`);
      outputLines.push(`  Expected Intent: ${result.expectedIntent || 'Not specified'}`);
      outputLines.push(`  Actual Intent: ${result.intentName}`);
      outputLines.push(`  Response: ${result.response}`);
      outputLines.push('');
    } else if (result.result === 'WRONG_INTENT') {
      wrongIntentCount++;
      outputLines.push(`Test ${result.index}: WRONG_INTENT`);
      outputLines.push(`  Prompt: ${result.prompt}`);
      outputLines.push(`  Expected Intent: ${result.expectedIntent}`);
      outputLines.push(`  Actual Intent: ${result.intentName}`);
      outputLines.push(`  Response: ${result.response}`);
      outputLines.push('');
    } else if (result.result === 'NO_INTENT') {
      noIntentCount++;
      outputLines.push(`Test ${result.index}: NO_INTENT`);
      outputLines.push(`  Prompt: ${result.prompt}`);
      outputLines.push(`  Expected Intent: ${result.expectedIntent || 'Not specified'}`);
      outputLines.push(`  Actual Intent: ${result.intentName}`);
      outputLines.push(`  Response: ${result.response}`);
      outputLines.push('');
    } else {
      failCount++;
      outputLines.push(`Test ${result.index}: ${result.result}`);
      outputLines.push(`  Prompt: ${result.prompt}`);
      outputLines.push(`  Expected Intent: ${result.expectedIntent || 'Not specified'}`);
      outputLines.push(`  Actual Intent: ${result.intentName}`);
      outputLines.push(`  Response: ${result.response}`);
      outputLines.push('');
    }
  }
  
  // Write results to file
  fs.writeFileSync('curl_results.txt', outputLines.join('\n'));
  
  // Update passed tests (only include exact matches)
  if (newlyPassed.length > 0) {
    passedTests.passed.push(...newlyPassed);
    passedTests.passed = [...new Set(passedTests.passed)]; // Remove duplicates
    passedTests.passed.sort((a, b) => a - b); // Sort numerically
    fs.writeFileSync(passedFile, JSON.stringify(passedTests, null, 2));
  }
  
  console.log(`\nSummary:`);
  console.log(`Total tests: ${testResults.length}`);
  console.log(`Exact Intent Match (PASS): ${passCount}`);
  console.log(`Intent Matched but No Expected (PASS_NO_EXPECTED): ${passNoExpectedCount}`);
  console.log(`Wrong Intent: ${wrongIntentCount}`);
  console.log(`No Intent Matched: ${noIntentCount}`);
  console.log(`Other Failures: ${failCount}`);
  
  if (newlyPassed.length > 0) {
    console.log(`Newly passed tests: ${newlyPassed.join(', ')}`);
  }
  
  console.log(`\nIntent matching accuracy: ${((passCount / testResults.length) * 100).toFixed(2)}%`);
}

runTests().catch(console.error);
