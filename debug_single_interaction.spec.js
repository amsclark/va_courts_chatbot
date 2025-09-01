// Simple debug test to understand why responses are empty
const { test, expect } = require('@playwright/test');
const fs = require('fs');

const TEST_URL = 'https://clarkmanagementconsulting.com/va_testing.html';

test('Debug single interaction', async ({ page }) => {
  console.log('Starting debug test...');
  
  await page.goto(TEST_URL);
  await page.waitForSelector('df-messenger', { state: 'attached', timeout: 8000 });
  const dfMessenger = await page.$('df-messenger');
  
  console.log('Opening chat...');
  // Click to open chat
  await dfMessenger.evaluate(el => {
    const btn = el.shadowRoot.querySelector('df-messenger-toggle-button');
    if (btn) btn.click();
  });
  
  await page.waitForTimeout(2000);
  
  console.log('Finding input...');
  // Get input using discovered structure
  const inputHandle = await dfMessenger.evaluateHandle((el) => {
    const wrapper = el.shadowRoot.querySelector('.df-messenger-wrapper');
    const chatComponent = wrapper.children[1];
    const chatWrapper = chatComponent.shadowRoot.querySelector('.chat-wrapper');
    const userInput = chatWrapper.children[2];
    const inputContainer = userInput.shadowRoot.querySelector('.input-container');
    const input = inputContainer.children[0].children[0];
    return input;
  });
  
  console.log('Typing message...');
  const testMessage = "My boyfriend is beating me up. What can I do?";
  await page.evaluate(({ input, value }) => {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, { input: inputHandle, value: testMessage });
  
  console.log('Sending message...');
  // Click send button
  const sendButtonClicked = await dfMessenger.evaluate(el => {
    try {
      const wrapper = el.shadowRoot.querySelector('.df-messenger-wrapper');
      const chatComponent = wrapper.children[1];
      const chatWrapper = chatComponent.shadowRoot.querySelector('.chat-wrapper');
      const userInput = chatWrapper.children[2];
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
  
  console.log('Send button clicked:', sendButtonClicked);
  
  // Wait a bit longer for response
  console.log('Waiting for response...');
  await page.waitForTimeout(8000);
  
  // Check message count before extracting
  const messageInfo = await dfMessenger.evaluate(el => {
    try {
      const wrapper = el.shadowRoot.querySelector('.df-messenger-wrapper');
      const chatComponent = wrapper.children[1];
      const chatWrapper = chatComponent.shadowRoot.querySelector('.chat-wrapper');
      const messageList = chatWrapper.children[1];
      const messageListWrapper = messageList.shadowRoot.querySelector('.message-list-wrapper');
      const messages = messageListWrapper.querySelectorAll('df-message');
      
      return {
        messageCount: messages.length,
        messageListHTML: messageListWrapper.innerHTML.substring(0, 500)
      };
    } catch (e) {
      return { error: e.toString() };
    }
  });
  
  console.log('Message info:', JSON.stringify(messageInfo, null, 2));
  
  // Try to extract actual messages
  const responseText = await dfMessenger.evaluate(el => {
    try {
      const wrapper = el.shadowRoot.querySelector('.df-messenger-wrapper');
      const chatComponent = wrapper.children[1];
      const chatWrapper = chatComponent.shadowRoot.querySelector('.chat-wrapper');
      const messageList = chatWrapper.children[1];
      const messageListWrapper = messageList.shadowRoot.querySelector('.message-list-wrapper');
      const messages = messageListWrapper.querySelectorAll('df-message');
      
      const messageTexts = [];
      messages.forEach((msg, idx) => {
        // Try multiple selectors to extract text
        const shadowContent = msg.shadowRoot.innerHTML;
        console.log(`Message ${idx} shadow content:`, shadowContent.substring(0, 200));
        
        const textNodes = msg.shadowRoot.querySelectorAll('*');
        textNodes.forEach(node => {
          if (node.textContent && node.textContent.trim()) {
            messageTexts.push(node.textContent.trim());
          }
        });
      });
      
      return messageTexts.join(' | ');
    } catch (e) {
      return `Error: ${e.toString()}`;
    }
  });
  
  console.log('Extracted response text:', responseText);
  
  // Write debug info to file
  fs.writeFileSync('debug_single_interaction.txt', 
    `Test Message: ${testMessage}\n` +
    `Message Info: ${JSON.stringify(messageInfo, null, 2)}\n` +
    `Response Text: ${responseText}\n`
  );
  
  console.log('Debug complete. See debug_single_interaction.txt');
});
