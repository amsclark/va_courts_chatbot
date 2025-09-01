const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Read and parse CSV manually with a small quoted-field-aware parser
const csvContent = fs.readFileSync('customerfeedback.csv', 'utf8');
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

const lines = rawLines;
const headers = parseCSVLine(lines[0] || '');

// Find column indices
const promptIndex = headers.findIndex(h => h.includes('Prompt'));
const responseIndex = headers.findIndex(h => h.includes('Response'));
const incorrectPageIndex = headers.findIndex(h => h.includes('Incorrect or incomplete page directs'));
const incorrectLinksIndex = headers.findIndex(h => h.includes('Incorrect hyperlinks'));
const notesIndex = headers.findIndex(h => h.includes('notes'));

console.log(`Found columns: Prompt=${promptIndex}, Response=${responseIndex}, IncorrectPage=${incorrectPageIndex}, IncorrectLinks=${incorrectLinksIndex}, Notes=${notesIndex}`);

const results = [];
const passedFile = 'passed_tests.json';
let passedTests = { passed: [] };
try {
  passedTests = JSON.parse(fs.readFileSync(passedFile, 'utf8'));
} catch (e) {
  // file will be created later
}

// Intent mapping based on expected responses
const intentMap = {
  'abuse': 'Abuse',
  'stalking': 'Abuse', 
  'neglect': 'Abuse',
  'child support': 'ChildSupport',
  'custody': 'Custody',
  'divorce': 'Divorce',
  'family law': 'FamilyLaw',
  'guardianship': 'Guardianship_Conservatorship',
  'conservatorship': 'Guardianship_Conservatorship',
  'senior': 'Seniors',
  'elderly': 'Seniors',
  'name change': 'NameChange',
  'expungement': 'Expungement',
  'driver license': 'DriverLicense',
  'small claims': 'SmallClaims',
  'housing': 'Housing',
  'legal help': 'GetHelp',
  'find lawyer': 'FindALawyer',
  'legal information': 'AccessLegalInformationThroughOLIR'
};

function getExpectedIntent(prompt, expectedResponse) {
  const lowerPrompt = prompt.toLowerCase();
  const lowerResponse = expectedResponse.toLowerCase();
  
  // Try to match based on prompt keywords first
  for (const [keyword, intent] of Object.entries(intentMap)) {
    if (lowerPrompt.includes(keyword) || lowerResponse.includes(keyword)) {
      return intent;
    }
  }
  
  // If no clear match, return null (we'll just check that some intent was matched)
  return null;
}

async function testPrompt(index, prompt, expectedResponse) {
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
      return { index, prompt, result: 'ERROR', response: stderr, expected: expectedResponse };
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

    // Determine expected intent
    const expectedIntent = getExpectedIntent(prompt, expectedResponse);
    
    // Check if intent matches (for first-level intents, we expect the standardized response pattern)
    let result = 'FAIL';
    
    if (expectedIntent) {
      // Check if the matched intent is what we expect
      if (intentName === expectedIntent) {
        // For first-level intents, check if response matches the pattern
        const expectedPattern = `It sounds like you are having issues relating to ${expectedIntent}. Is this correct?`;
        if (actualResponse === expectedPattern) {
          result = 'PASS';
        } else {
          result = 'INTENT_MATCH_RESPONSE_MISMATCH';
        }
      } else {
        result = 'WRONG_INTENT';
      }
    } else {
      // If we can't determine expected intent, just check that some intent was matched (not fallback)
      if (intentName && intentName !== 'Default Fallback Intent' && intentName !== 'Unknown') {
        result = 'PASS';
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
      expected: expectedResponse,
      expectedIntent
    };

  } catch (error) {
    console.error(`Error processing prompt ${index}:`, error);
    return { index, prompt, result: 'ERROR', response: error.message, expected: expectedResponse };
  }
}

async function runTests() {
  const testPromises = [];
  
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length > Math.max(promptIndex, responseIndex) && cols[promptIndex] && cols[responseIndex]) {
      const index = i;
      
      // Run all tests - don't skip any for this comprehensive run
      // if (passedTests.passed && passedTests.passed.includes(index)) {
      //   console.log(`Skipping test ${index} (already passed)`);
      //   continue;
      // }
      
      const prompt = cols[promptIndex];
      const expectedResponse = cols[responseIndex];
      
      testPromises.push(testPrompt(index, prompt, expectedResponse));
      
      // Add delay between requests to avoid rate limiting
      if (testPromises.length % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  const testResults = await Promise.all(testPromises);
  
  let passCount = 0;
  let failCount = 0;
  const outputLines = [];
  const newlyPassed = [];
  
  for (const result of testResults) {
    if (result.result === 'PASS') {
      passCount++;
      newlyPassed.push(result.index);
      outputLines.push(`Test ${result.index}: PASS`);
      outputLines.push(`  Prompt: ${result.prompt}`);
      outputLines.push(`  Intent: ${result.intentName}`);
      outputLines.push(`  Response: ${result.response}`);
      outputLines.push('');
    } else {
      failCount++;
      outputLines.push(`Test ${result.index}: ${result.result}`);
      outputLines.push(`  Prompt: ${result.prompt}`);
      outputLines.push(`  Expected Intent: ${result.expectedIntent || 'Unknown'}`);
      outputLines.push(`  Actual Intent: ${result.intentName}`);
      outputLines.push(`  Expected: ${result.expected}`);
      outputLines.push(`  Actual: ${result.response}`);
      outputLines.push('');
    }
  }
  
  // Write results to file
  fs.writeFileSync('curl_results.txt', outputLines.join('\n'));
  
  // Update passed tests
  if (newlyPassed.length > 0) {
    passedTests.passed.push(...newlyPassed);
    passedTests.passed = [...new Set(passedTests.passed)]; // Remove duplicates
    passedTests.passed.sort((a, b) => a - b); // Sort numerically
    fs.writeFileSync(passedFile, JSON.stringify(passedTests, null, 2));
  }
  
  console.log(`\nSummary:`);
  console.log(`Total tests: ${testResults.length}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  
  if (newlyPassed.length > 0) {
    console.log(`Newly passed tests: ${newlyPassed.join(', ')}`);
  }
}

runTests().catch(console.error);
