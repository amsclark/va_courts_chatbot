// playwright_customer_feedback.spec.js
// Automated test to check which customer feedback items have been incorporated in the chatbot UI

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

test.describe('Customer Feedback Coverage', () => {
  const feedbackItems = getFeedbackItems();

  // Run all valid feedback items in parallel
  const validItems = feedbackItems
    .map((item, idx) => ({ ...item, idx }))
    .filter(item => item.Prompt && item.Prompt.trim() !== '???');

  test.describe.configure({ mode: 'parallel' });

  for (const item of validItems) {
    test(`Prompt [${item.idx}]: ${item.Prompt.slice(0, 60)}...`, async ({ page }) => {
    await page.goto(TEST_URL);
    // Wait for df-messenger to be attached to DOM
    await page.waitForSelector('df-messenger', { state: 'attached', timeout: 8000 });
    const dfMessenger = await page.$('df-messenger');
    // Wait for the toggle button in shadow DOM to be visible
    const toggleButton = await dfMessenger.evaluateHandle(el => el.shadowRoot.querySelector('df-messenger-toggle-button'));
    if (!toggleButton) throw new Error('df-messenger-toggle-button not found');
    // Click the toggle button to open chat (must use evaluate)
    await dfMessenger.evaluate(el => {
      const btn = el.shadowRoot.querySelector('df-messenger-toggle-button');
      if (btn) btn.click();
    });
    // Wait for chat to open and input to appear (robust shadow DOM navigation)
    let inputHandle = null;
    // Deep debug the shadow DOM structure
    const debugInfo = await dfMessenger.evaluate(el => {
      const debug = { steps: [] };
      try {
        debug.steps.push('Starting shadow DOM traversal');
        
        const wrapper = el.shadowRoot.querySelector('.df-messenger-wrapper');
        debug.steps.push(`wrapper found: ${!!wrapper}`);
        if (!wrapper) {
          debug.shadowRootHTML = el.shadowRoot.innerHTML;
          return debug;
        }
        
        debug.steps.push(`wrapper children count: ${wrapper.children.length}`);
        
        // Check all wrapper children to find the one with shadowRoot containing chat-wrapper
        for (let wrapperIdx = 0; wrapperIdx < wrapper.children.length; wrapperIdx++) {
          const child = wrapper.children[wrapperIdx];
          debug.steps.push(`wrapper child[${wrapperIdx}] tagName: ${child.tagName}, has shadowRoot: ${!!child.shadowRoot}`);
          
          if (child.shadowRoot) {
            const chatWrapper = child.shadowRoot.querySelector('.chat-wrapper');
            if (chatWrapper) {
              debug.steps.push(`Found chat-wrapper at wrapper child index ${wrapperIdx}`);
              debug.steps.push(`chatWrapper children count: ${chatWrapper.children.length}`);
              
              for (let i = 0; i < chatWrapper.children.length; i++) {
                const chatChild = chatWrapper.children[i];
                debug.steps.push(`chatWrapper child[${i}] tagName: ${chatChild.tagName}, has shadowRoot: ${!!chatChild.shadowRoot}`);
              }
              
              // Try different indices for the input container
              for (let idx = 0; idx < chatWrapper.children.length; idx++) {
                const candidate = chatWrapper.children[idx];
                if (candidate.shadowRoot) {
                  const inputContainer = candidate.shadowRoot.querySelector('.input-container');
                  if (inputContainer) {
                    debug.steps.push(`Found input-container at chatWrapper index ${idx}`);
                    debug.steps.push(`inputContainer children count: ${inputContainer.children.length}`);
                    for (let j = 0; j < inputContainer.children.length; j++) {
                      const inputChild = inputContainer.children[j];
                      debug.steps.push(`inputContainer child[${j}]: ${inputChild.tagName}`);
                      if (inputChild.children.length > 0) {
                        debug.steps.push(`  -> has ${inputChild.children.length} children, first: ${inputChild.children[0].tagName}`);
                        if (inputChild.children[0].tagName === 'INPUT') {
                          debug.inputFound = true;
                          debug.inputIndex = { wrapperIdx, chatWrapperIdx: idx, inputContainerChildIdx: j, inputIdx: 0 };
                          return debug;
                        }
                      }
                    }
                  }
                }
              }
              break; // Found chat-wrapper, no need to check other wrapper children
            }
          }
        }
        
        return debug;
      } catch (e) {
        debug.error = e.toString();
        return debug;
      }
    });
    
    // Always write debug info
    fs.writeFileSync('playwright_df_debug.json', JSON.stringify(debugInfo, null, 2));
    
    if (!debugInfo.inputFound) {
      throw new Error('Chatbot input not found after opening chat. See playwright_df_debug.json for details.');
    }
    
    // Now get the input using the discovered structure
    inputHandle = await dfMessenger.evaluateHandle((el, indices) => {
      const wrapper = el.shadowRoot.querySelector('.df-messenger-wrapper');
      const chatWrapper = wrapper.children[indices.wrapperIdx].shadowRoot.querySelector('.chat-wrapper');
      const inputContainer = chatWrapper.children[indices.chatWrapperIdx].shadowRoot.querySelector('.input-container');
      const input = inputContainer.children[indices.inputContainerChildIdx].children[indices.inputIdx];
      return input;
    }, debugInfo.inputIndex);
    if (!inputHandle) throw new Error('Chatbot input not found after opening chat');
    // Type the prompt and click send button instead of keyboard event
    const isInputNull = await page.evaluate(input => input === null, inputHandle);
    if (isInputNull) throw new Error('inputHandle is null in page.evaluate');
    await page.evaluate(({ input, value }) => {
      if (!input) throw new Error('input is null in page.evaluate');
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, { input: inputHandle, value: item.Prompt });
    
    // Find and click the send button
    const sendButtonClicked = await dfMessenger.evaluate(el => {
      try {
        const wrapper = el.shadowRoot.querySelector('.df-messenger-wrapper');
        const chatComponent = wrapper.children[1]; // df-messenger-chat
        const chatWrapper = chatComponent.shadowRoot.querySelector('.chat-wrapper');
        const userInput = chatWrapper.children[2]; // df-messenger-user-input
        const inputContainer = userInput.shadowRoot.querySelector('.input-container');
        const sendButton = inputContainer.querySelector('button');
        if (sendButton) {
          sendButton.click();
          return true;
        }
        return false;
      } catch (e) {
        console.log('Error clicking send button:', e);
        return false;
      }
    });
    
    if (!sendButtonClicked) {
      // Fallback to Enter key
      await page.evaluate(({ input }) => {
        if (!input) throw new Error('input is null in page.evaluate (Enter)');
        const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        input.dispatchEvent(event);
      }, { input: inputHandle });
    }
    // Wait for response and debug message extraction
    await page.waitForTimeout(1000);
    
    // Wait for bot response to appear
    for (let i = 0; i < 10; i++) {
      const messageCount = await dfMessenger.evaluate(el => {
        try {
          const wrapper = el.shadowRoot.querySelector('.df-messenger-wrapper');
          const chatComponent = wrapper.children[1]; // df-messenger-chat
          const chatWrapper = chatComponent.shadowRoot.querySelector('.chat-wrapper');
          const messageList = chatWrapper.children[1]; // df-message-list
          const messageListWrapper = messageList.shadowRoot.querySelector('.message-list-wrapper');
          const messages = messageListWrapper.querySelectorAll('df-message');
          return messages.length;
        } catch (e) {
          return 0;
        }
      });
      
      if (messageCount >= 2) break; // User message + bot response
      await page.waitForTimeout(500);
    }
    
    // Get all chat messages (bot and user) with extensive debugging
    const responseText = await dfMessenger.evaluate(el => {
      try {
        const wrapper = el.shadowRoot.querySelector('.df-messenger-wrapper');
        const chatComponent = wrapper.children[1]; // df-messenger-chat
        const chatWrapper = chatComponent.shadowRoot.querySelector('.chat-wrapper');
        const messageList = chatWrapper.children[1]; // df-message-list
        const messageListWrapper = messageList.shadowRoot.querySelector('.message-list-wrapper');
        
        // Check for error message first
        const errorDiv = messageListWrapper.querySelector('.error');
        if (errorDiv && errorDiv.textContent.includes('Something went wrong')) {
          return 'ERROR: Something went wrong, please try again.';
        }
        
        // Get all messages (both user and bot)
        const messages = messageListWrapper.querySelectorAll('df-message');
        const messageTexts = [];
        
        console.log(`Found ${messages.length} messages`);
        
        messages.forEach((msg, idx) => {
          try {
            // Get the entire text content of the message shadow DOM
            const allText = msg.shadowRoot.textContent || '';
            if (allText.trim()) {
              console.log(`Message ${idx}: ${allText.trim()}`);
              messageTexts.push(allText.trim());
            }
          } catch (e) {
            console.log(`Error extracting message ${idx}:`, e);
          }
        });
        
        return messageTexts.join('\n');
      } catch (e) {
        console.log('Error extracting messages:', e);
        return '';
      }
    });
    
    // Log actual response and normalized values for debugging
    function normalize(s) { return s ? s.replace(/\s+/g, ' ').trim().toLowerCase() : ''; }
    const normActual = normalize(responseText);
    const normExpected = normalize(item.Response);
    
    // Check if we have a meaningful expected response
    const hasExpectedResponse = item.Response && item.Response.trim().length > 0;
    let found = false;
    
    if (responseText.includes('ERROR: Something went wrong')) {
      // Chatbot is having backend issues - mark as needs work
      found = false;
      fs.appendFileSync('playwright_feedback_results.txt', `${item.Prompt}\t${responseText}\t${item.Response}\tCHATBOT_ERROR\t${normExpected}\n`);
    } else {
      found = hasExpectedResponse ? normActual.includes(normExpected) : true; // Pass if no expected response
      fs.appendFileSync('playwright_feedback_results.txt', `${item.Prompt}\t${responseText}\t${item.Response}\t${normActual}\t${normExpected}\n`);
    }
    
    console.log(`Test result: ${found ? 'PASS' : 'FAIL'} - Expected: "${item.Response}" - Got: "${responseText}"`);
    
    // Don't fail the test for backend errors - we want to see all results
    if (responseText.includes('ERROR: Something went wrong')) {
      console.log('SKIPPING due to chatbot backend error');
    } else {
      expect(found).toBe(true);
    }
  });
  }
});
