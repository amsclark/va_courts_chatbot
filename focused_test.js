const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Test specific previously failed prompts to see if our improvements worked
const testCases = [
  // ChildSupport cases that were going to FamilyLaw
  { prompt: "How do I make my kids' father pay for them?", expected: "ChildSupport" },
  { prompt: "How do I make my ex-husband pay child support?", expected: "ChildSupport" },
  { prompt: "I want my ex to pay for his kids. What can I do?", expected: "ChildSupport" },
  { prompt: "How do I get money for my kids from their mom?", expected: "ChildSupport" },
  { prompt: "How do I get money from my baby daddy for his kids?", expected: "ChildSupport" },
  { prompt: "Does my ex-wife owe money for her children?", expected: "ChildSupport" },
  { prompt: "Does my ex have to cover expenses for his kids?", expected: "ChildSupport" },
  
  // Custody cases that were going to FamilyLaw
  { prompt: "What if my ex moves away with my kids?", expected: "Custody" },
  { prompt: "My son-in-law is mean to his kids. Can I as a grandparent get custody?", expected: "Custody" },
  { prompt: "I'm getting remarried and want my new husband to also have legal custody. What do I need to do?", expected: "Custody" },
  { prompt: "My ex-husband smokes pot while around our teenage son. I've asked him to not do that, but according to my son, he still smokes. What should I do?", expected: "Custody" },
  
  // ConservatorOfThePeace vs Guardianship_Conservatorship
  { prompt: "What is a conservator?", expected: "ConservatorOfThePeace" },
  { prompt: "What is a person called who is appointed by the court to help someone?", expected: "ConservatorOfThePeace" },
  
  // SmallClaims cases
  { prompt: "Which court handles small claims?", expected: "SmallClaims" },
  { prompt: "How do I recover $3000 someone owes me?", expected: "SmallClaims" },
  { prompt: "I've taken my car to a mechanic to get it fixed. He had it three times and it still isn't fixed. I've paid him over $500. What can I do?", expected: "SmallClaims" },
  
  // Veterans cases
  { prompt: "Can I get credit for my army service?", expected: "Veterans" },
  { prompt: "I think asbestos was on my Navy ship. How do I check?", expected: "Veterans" },
  { prompt: "What happened to the GI bill?", expected: "Veterans" },
  
  // Seniors cases
  { prompt: "I am an elderly person and my caretaker is not bathing me. What can I do?", expected: "Seniors" },
  { prompt: "How do I get on Medicaid?", expected: "Seniors" },
  { prompt: "I've heard I need to sign up for Medicare. Where do I do that?", expected: "Seniors" }
];

async function testPrompt(prompt, expectedIntent, index) {
  try {
    const payload = {
      queryInput: {
        text: {
          text: prompt,
          languageCode: "en"
        }
      }
    };
    
    const tempFile = `/tmp/payload_test_${index}.json`;
    fs.writeFileSync(tempFile, JSON.stringify(payload));
    
    const curlCommand = `curl -s 'https://dialogflow.cloud.google.com/v1/integrations/messenger/webhook/9a6751d7-5b0c-4bd3-8d17-5a3dd3222658/sessions/dfMessenger-${Date.now()}-${index}' -X POST -H 'Content-Type: application/json' -H 'Origin: https://clarkmanagementconsulting.com' --data @${tempFile}`;

    const { stdout, stderr } = await execAsync(curlCommand);
    
    fs.unlinkSync(tempFile);
    
    if (stderr) {
      return { prompt, expected: expectedIntent, result: 'ERROR', actual: stderr };
    }

    // Parse response
    let cleanResponse = stdout;
    if (cleanResponse.startsWith(")]}'")) {
      cleanResponse = cleanResponse.substring(5);
    }
    
    const responseData = JSON.parse(cleanResponse || '{}');
    let actualIntent = 'Unknown';
    
    if (responseData.queryResult && responseData.queryResult.intent && responseData.queryResult.intent.displayName) {
      actualIntent = responseData.queryResult.intent.displayName;
    }

    const success = actualIntent === expectedIntent;
    return {
      prompt,
      expected: expectedIntent,
      actual: actualIntent,
      result: success ? 'PASS' : 'FAIL',
      success
    };

  } catch (error) {
    return { prompt, expected: expectedIntent, result: 'ERROR', actual: error.message };
  }
}

async function runFocusedTest() {
  console.log(`Testing ${testCases.length} previously failed cases to check improvements...`);
  
  const results = [];
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`Testing ${i+1}/${testCases.length}: "${testCase.prompt.substring(0, 50)}..."`);
    
    const result = await testPrompt(testCase.prompt, testCase.expected, i);
    results.push(result);
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`\n=== FOCUSED TEST RESULTS ===`);
  console.log(`Passed: ${passed}/${total} (${((passed/total)*100).toFixed(1)}%)`);
  
  console.log(`\n=== DETAILED RESULTS ===`);
  results.forEach((result, index) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${result.prompt}`);
    console.log(`   Expected: ${result.expected} | Actual: ${result.actual}`);
    if (!result.success && result.result !== 'ERROR') {
      console.log(`   🔄 Still needs improvement`);
    }
    console.log('');
  });
  
  // Group by category for analysis
  const byCategory = {};
  results.forEach(result => {
    const category = result.expected;
    if (!byCategory[category]) byCategory[category] = { passed: 0, total: 0 };
    byCategory[category].total++;
    if (result.success) byCategory[category].passed++;
  });
  
  console.log(`=== BY CATEGORY ===`);
  Object.keys(byCategory).forEach(category => {
    const stats = byCategory[category];
    const pct = ((stats.passed/stats.total)*100).toFixed(1);
    console.log(`${category}: ${stats.passed}/${stats.total} (${pct}%)`);
  });
}

runFocusedTest().catch(console.error);