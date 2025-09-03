const fs = require('fs');
const path = require('path');

console.log('📋 Extracting all payload links from intent files...');

const intentFiles = fs.readdirSync('intents').filter(f => f.endsWith('.json') && !f.includes('_usersays_en'));
const linkData = [];

for (const file of intentFiles) {
  try {
    const content = fs.readFileSync(path.join('intents', file), 'utf8');
    const intent = JSON.parse(content);
    
    // Look for responses with payloads containing links
    if (intent.responses && intent.responses.length > 0) {
      for (const response of intent.responses) {
        if (response.messages) {
          for (const message of response.messages) {
            if (message.payload && message.payload.richContent) {
              for (const richSection of message.payload.richContent) {
                for (const element of richSection) {
                  if (element.link && element.text) {
                    linkData.push({
                      intentName: intent.name || file.replace('.json', ''),
                      linkText: element.text,
                      linkUrl: element.link,
                      file: file
                    });
                  }
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.log('⚠️  Error processing', file, ':', error.message);
  }
}

console.log(`Found ${linkData.length} links across ${new Set(linkData.map(l => l.intentName)).size} intents`);

// Sort by intent name for organized output
linkData.sort((a, b) => a.intentName.localeCompare(b.intentName));

// Create markdown table
let markdown = '# Virginia Courts Chatbot - Payload Links Audit\n\n';
markdown += 'Generated on: ' + new Date().toLocaleDateString() + '\n\n';
markdown += '## Summary\n';
markdown += `- Total Links: ${linkData.length}\n`;
markdown += `- Total Intents with Links: ${new Set(linkData.map(l => l.intentName)).size}\n\n`;

markdown += '## Link Inventory\n\n';
markdown += '| Intent Name | Link Text | Link URL | Comments |\n';
markdown += '|-------------|-----------|----------|----------|\n';

for (const link of linkData) {
  // Escape pipe characters in text
  const escapedText = link.linkText.replace(/\|/g, '\\|');
  const escapedUrl = link.linkUrl.replace(/\|/g, '\\|');
  const escapedIntent = link.intentName.replace(/\|/g, '\\|');
  
  markdown += `| ${escapedIntent} | ${escapedText} | ${escapedUrl} | TODO: Verify |\n`;
}

markdown += '\n## URL Domains Summary\n\n';
const domains = {};
for (const link of linkData) {
  try {
    const domain = new URL(link.linkUrl).hostname;
    domains[domain] = (domains[domain] || 0) + 1;
  } catch (e) {
    domains['Invalid URL'] = (domains['Invalid URL'] || 0) + 1;
  }
}

for (const [domain, count] of Object.entries(domains)) {
  markdown += `- ${domain}: ${count} links\n`;
}

markdown += '\n## Next Steps\n\n';
markdown += '1. **Verify Links**: Test each URL to ensure it\'s accessible and returns the expected content\n';
markdown += '2. **Check Relevance**: Ensure each link is appropriate for its intent context\n';
markdown += '3. **Update Comments**: Add validation status and any issues found\n';
markdown += '4. **Fix Issues**: Update any broken or incorrect links\n';
markdown += '5. **Document Changes**: Track any modifications made\n';

fs.writeFileSync('payload_links_audit.md', markdown);
console.log('✅ Created payload_links_audit.md with all link information');

// Also output a summary to console
console.log('\n📊 Summary:');
console.log('Intent Name -> Link Count');
const intentCounts = {};
for (const link of linkData) {
  intentCounts[link.intentName] = (intentCounts[link.intentName] || 0) + 1;
}
for (const [intent, count] of Object.entries(intentCounts)) {
  console.log(`  ${intent}: ${count} links`);
}
