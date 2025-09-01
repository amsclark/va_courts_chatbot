// Debug script to understand the chatbot structure after sending a message
const { test, expect } = require('@playwright/test');
const fs = require('fs');

const TEST_URL = 'https://clarkmanagementconsulting.com/va_testing.html';

test('Debug chatbot structure', async ({ page }) => {
  await page.goto(TEST_URL);
  await page.waitForSelector('df-messenger', { state: 'attached', timeout: 8000 });
  const dfMessenger = await page.$('df-messenger');
  
  // Click to open chat
  await dfMessenger.evaluate(el => {
    const btn = el.shadowRoot.querySelector('df-messenger-toggle-button');
    if (btn) btn.click();
  });
  
  await page.waitForTimeout(2000);
  
  // Send a test message
  const inputHandle = await dfMessenger.evaluateHandle((el) => {
    const wrapper = el.shadowRoot.querySelector('.df-messenger-wrapper');
    const chatWrapper = wrapper.children[1].shadowRoot.querySelector('.chat-wrapper');
    const inputContainer = chatWrapper.children[2].shadowRoot.querySelector('.input-container');
    const input = inputContainer.children[0].children[0];
    return input;
  });
  
  await page.evaluate(({ input, value }) => {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, { input: inputHandle, value: "test message" });
  
  await page.evaluate(({ input }) => {
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    input.dispatchEvent(event);
  }, { input: inputHandle });
  
  // Wait and then dump the entire structure
  await page.waitForTimeout(5000);
  
  const structure = await dfMessenger.evaluate(el => {
    function dumpElement(elem, depth = 0) {
      const indent = '  '.repeat(depth);
      let result = `${indent}${elem.tagName || 'TEXT'}: ${elem.textContent?.slice(0, 100) || ''}\n`;
      
      if (elem.shadowRoot) {
        result += `${indent}  [SHADOW ROOT]\n`;
        for (const child of elem.shadowRoot.children) {
          result += dumpElement(child, depth + 2);
        }
      }
      
      for (const child of elem.children || []) {
        result += dumpElement(child, depth + 1);
      }
      
      return result;
    }
    
    return dumpElement(el);
  });
  
  fs.writeFileSync('chatbot_structure_debug.txt', structure);
  console.log('Structure dumped to chatbot_structure_debug.txt');
});
