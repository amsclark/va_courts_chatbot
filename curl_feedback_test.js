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
    if (responseData.queryResult) {
      // Try fulfillmentText first
      if (responseData.queryResult.fulfillmentText) {
        actualResponse = responseData.queryResult.fulfillmentText;
      }
      // Fallback to fulfillmentMessages
      else if (responseData.queryResult.fulfillmentMessages) {
        const textMessages = responseData.queryResult.fulfillmentMessages
          .filter(m => m.text && m.text.text)
          .map(m => m.text.text.join(' '));
        
        if (textMessages.length > 0) {
          actualResponse = textMessages.join(' ');
        }
      }
    }

    // Normalize and compare more tolerant: lowercase, trim, and check substring both ways
    const norm = s => (s || '').toString().replace(/\s+/g, ' ').trim().toLowerCase();
    const actualNorm = norm(actualResponse);
    const expectedNorm = norm(expectedResponse.replace(/^"|"$/g, ''));
    const match = actualNorm.includes(expectedNorm) || expectedNorm.includes(actualNorm);
    const result = match ? 'PASS' : 'FAIL';
    
    console.log(`[${index}] ${result}: "${prompt.substring(0, 50)}..." -> "${actualResponse.substring(0, 100)}..."`);
    
    return { index, prompt, result, response: actualResponse, expected: expectedResponse };
    
  } catch (error) {
    console.error(`Error testing prompt ${index}:`, error.message);
    return { index, prompt, result: 'ERROR', response: error.message, expected: expectedResponse };
  }
}

async function runTests() {
  console.log('Starting feedback tests for items with issues noted...\n');
  
  const testPromises = [];
  
  for (let i = 1; i < lines.length && lines[i].trim(); i++) {
    const columns = lines[i].split(',');
    
    if (columns.length < Math.max(promptIndex, responseIndex, incorrectPageIndex, incorrectLinksIndex, notesIndex)) {
      continue;
    }
    
    const prompt = columns[promptIndex]?.trim();
    const response = columns[responseIndex]?.trim();
    const incorrectPage = columns[incorrectPageIndex]?.trim();
    const incorrectLinks = columns[incorrectLinksIndex]?.trim();
    const notes = columns[notesIndex]?.trim();
    
    // Only test if there's feedback in the issue columns
    const hasIssues = (incorrectPage && incorrectPage !== '') || 
                     (incorrectLinks && incorrectLinks !== '') || 
                     (notes && notes !== '');
    
    if (prompt && prompt !== '???' && response && hasIssues) {
      // Skip tests that already passed previously
      if (passedTests.passed.includes(i)) {
        console.log(`Skipping test ${i}: previously passed`);
        continue;
      }

      console.log(`Queuing test ${i}: ${prompt.substring(0, 50)}... (has issues noted)`);
      testPromises.push(testPrompt(i, prompt, response));
      
      // Add small delay to avoid overwhelming the API
      if (testPromises.length % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  console.log(`\nRunning ${testPromises.length} tests...\n`);
  
  const results = await Promise.all(testPromises);
  
  // Write results
  const output = results.map(r => 
    `${r.index}\t${r.result}\t${r.prompt}\t${r.response}\t${r.expected}`
  ).join('\n');
  
  fs.writeFileSync('curl_results.txt', output);
  
  // Summary
  const passed = results.filter(r => r.result === 'PASS').length;
  const failed = results.filter(r => r.result === 'FAIL').length;
  const errors = results.filter(r => r.result === 'ERROR').length;
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Errors: ${errors}`);
  console.log(`\nResults written to curl_results.txt`);

  // Update passed_tests.json with any new passes
  const newPasses = results.filter(r => r.result === 'PASS').map(r => r.index);
  passedTests.passed = Array.from(new Set(passedTests.passed.concat(newPasses)));
  fs.writeFileSync(passedFile, JSON.stringify(passedTests, null, 2));
}

runTests().catch(console.error);
