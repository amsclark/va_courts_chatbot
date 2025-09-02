const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function testSinglePrompt(prompt, expectedIntent) {
  try {
    console.log(`Testing: "${prompt}"`);
    console.log(`Expected Intent: ${expectedIntent}`);
    
    const payload = {
      queryInput: {
        text: {
          text: prompt,
          languageCode: "en"
        }
      }
    };
    
    const tempFile = `/tmp/payload_test.json`;
    fs.writeFileSync(tempFile, JSON.stringify(payload));
    
    const curlCommand = `curl -s 'https://dialogflow.cloud.google.com/v1/integrations/messenger/webhook/9a6751d7-5b0c-4bd3-8d17-5a3dd3222658/sessions/dfMessenger-${Date.now()}' -X POST -H 'Content-Type: application/json' -H 'Origin: https://clarkmanagementconsulting.com' --data @${tempFile}`;

    const { stdout, stderr } = await execAsync(curlCommand);
    
    fs.unlinkSync(tempFile);
    
    if (stderr) {
      console.error(`Error:`, stderr);
      return;
    }

    // Parse response
    let cleanResponse = stdout;
    if (cleanResponse.startsWith(")]}'")) {
      cleanResponse = cleanResponse.substring(5);
    }
    
    console.log('Raw response:', cleanResponse);
    
    const responseData = JSON.parse(cleanResponse || '{}');
    
    let actualResponse = 'N/A';
    let intentName = 'Unknown';
    
    if (responseData.queryResult) {
      if (responseData.queryResult.intent && responseData.queryResult.intent.displayName) {
        intentName = responseData.queryResult.intent.displayName;
      }
      
      if (responseData.queryResult.fulfillmentText) {
        actualResponse = responseData.queryResult.fulfillmentText;
      }
    }

    console.log(`Actual Intent: ${intentName}`);
    console.log(`Response: ${actualResponse}`);
    console.log(`Match: ${intentName === expectedIntent ? 'YES' : 'NO'}`);
    console.log('---');

  } catch (error) {
    console.error(`Error:`, error);
  }
}

async function runTest() {
  // Test first few prompts from pruned_feedback.csv
  await testSinglePrompt("My boyfriend is beating me up. What can I do?", "Abuse");
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
  
  await testSinglePrompt("Where can I go to get legal information?", "AccessLegalInformationThroughOLIR");
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testSinglePrompt("How do I make my kids' father pay for them?", "ChildSupport");
}

runTest().catch(console.error);