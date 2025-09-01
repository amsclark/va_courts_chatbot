// playwright_customer_feedback_simple.spec.js
// Automated test using the simple approach from the recording

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const parse = require('csv-parse/lib/sync');

const FEEDBACK_CSV = 'customerfeedback.csv';
const TEST_URL = 'https://clarkmanagementconsulting.com/va_testing.html';

// Read and parse the feedback CSV
function getFeedbackItems() {
  const csv = fs.readFileSync(FEEDBACK_CSV, 'utf8');
  const records = parse(csv, { columns: true });
  return records;
}

test.describe('Customer Feedback Coverage - Simple Approach', () => {
  const feedbackItems = getFeedbackItems();
  
  // Run all valid feedback items in parallel
  const validItems = feedbackItems
    .map((item, idx) => ({ ...item, idx }))
    .filter(item => item.Prompt && item.Prompt.trim() !== '???');

  test.describe.configure({ mode: 'parallel' });

  for (const item of validItems) {
    test(`Test prompt [${item.idx}]: ${item.Prompt.slice(0, 60)}...`, async ({ page }) => {
      // Set viewport size like in recording
      await page.setViewportSize({
        width: 1264,
        height: 599
      });
      
      await page.goto(TEST_URL);
      
      // Wait for df-messenger to be attached and chatbot to load
      await page.waitForSelector('df-messenger', { state: 'attached', timeout: 10000 });
      await page.waitForTimeout(3000); // Let the chatbot fully load
      
      // Look for the chat bubble button in the lower right corner
      const chatButton = page.locator('df-messenger').locator('visible=true').first();
      
      try {
        // Try to click the visible chat button
        await chatButton.click({ timeout: 5000 });
      } catch (e) {
        // If that fails, try clicking at a specific position (lower right)
        await page.click('body', { position: { x: 1200, y: 550 } });
      }
      
      // Wait a bit for chat to open
      await page.waitForTimeout(2000);
      
      // Type the message (like in recording)
      await page.locator("df-messenger").type(item.Prompt);
      
      // Press Enter to send
      await page.keyboard.press('Enter');
      
      // Wait for response
      await page.waitForTimeout(5000);
      
      // Try to get the response text from the df-messenger
      const responseText = await page.locator('df-messenger').textContent();
      
      // Normalize function for comparison
      function normalize(s) { 
        return s ? s.replace(/\s+/g, ' ').trim().toLowerCase() : ''; 
      }
      
      const normActual = normalize(responseText);
      const normExpected = normalize(item.Response);
      
      // Check if we have a meaningful expected response
      const hasExpectedResponse = item.Response && item.Response.trim().length > 0;
      const found = hasExpectedResponse ? normActual.includes(normExpected) : true;
      
      // Log results
      const status = found ? 'PASS' : 'FAIL';
      console.log(`${status} - Prompt [${item.idx}]: ${item.Prompt.slice(0, 40)}...`);
      
      // Log to file with detailed info
      fs.appendFileSync('playwright_simple_results.txt', 
        `${item.idx}\t${status}\t${item.Prompt}\t${responseText}\t${item.Response}\n`);
      
      // For analysis purposes, don't fail the test - we want to see all results
      console.log(`Expected: ${item.Response || 'N/A'}`);
      console.log(`Got: ${responseText || 'N/A'}`);
    });
  }
});
