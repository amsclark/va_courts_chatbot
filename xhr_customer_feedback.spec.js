const { test, expect } = require('@playwright/test');
const fs = require('fs');
const { parse } = require('csv-parse');
const axios = require('axios');

const customerFeedback = fs.readFileSync('customerfeedback.csv');

const DIALOGFLOW_URL = 'https://dialogflow.cloud.google.com/v1/integrations/messenger/webhook/9a6751d7-5b0c-4bd3-8d17-5a3dd3222658/sessions/dfMessenger-json-tester';

const results = [];

function getRecords() {
  return new Promise((resolve, reject) => {
    parse(customerFeedback, { columns: true, skip_empty_lines: true }, (err, records) => {
      if (err) {
        return reject(err);
      }
      resolve(records);
    });
  });
}

test.describe('Customer Feedback XHR Tests', () => {
  let records;

  test.beforeAll(async () => {
    records = await getRecords();
  });

  for (let i = 0; i < 207; i++) { // Just a sample, will run all in reality
    test(`Test prompt [${i}]:`, async () => {
        const feedback = records[i];
        if (feedback.Prompt && feedback.Prompt.trim() !== '???') {
            let result = 'FAIL';
            let gotResponse = 'N/A';

            try {
            const response = await axios.post(DIALOGFLOW_URL, {
                queryInput: {
                text: {
                    text: feedback.Prompt,
                    languageCode: 'en'
                }
                }
            }, {
                headers: {
                'Content-Type': 'application/json'
                }
            });

            // The actual response is buried in a JSON string inside the response body.
            // The body starts with ')]}\'' which needs to be removed.
            const responseData = JSON.parse(response.data.substring(5));
            
            if (responseData.queryResult.responseMessages && responseData.queryResult.responseMessages.length > 0) {
                const textResponses = responseData.queryResult.responseMessages
                .filter(m => m.text)
                .map(m => m.text.text.join(' '));
                
                if (textResponses.length > 0) {
                    gotResponse = textResponses.join(' ');
                }
            }

            if (gotResponse.includes(feedback.Response)) {
                result = 'PASS';
            }
            } catch (error) {
            console.error(`Error during test for prompt [${i}]:`, error);
            gotResponse = `Error: ${error.message}`;
            }

            results.push(`${i}\t${result}\t${feedback.Prompt}\t${gotResponse}\t${feedback.Response}`);
        }
    });
  }
});

test.afterAll(() => {
  fs.writeFileSync('xhr_results.txt', results.join('\n'));
});
