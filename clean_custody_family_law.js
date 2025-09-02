const fs = require('fs');

// Read FamilyLaw intent file
const familyLawContent = fs.readFileSync('intents/FamilyLaw_usersays_en.json', 'utf8');
let familyLawData = JSON.parse(familyLawContent);

console.log(`Original FamilyLaw entries: ${familyLawData.length}`);

// Filter out custody-related phrases that should be in Custody intent
const filteredData = familyLawData.filter(entry => {
  if (entry.data && entry.data[0] && entry.data[0].text) {
    const text = entry.data[0].text.toLowerCase();
    
    // Check if this entry contains custody-related phrases
    const isCustody = 
      text.includes('remarried') && text.includes('custody') ||
      text.includes('remarried') && text.includes('husband') && text.includes('legal') ||
      text.includes('ex moves away') && text.includes('kids') ||
      text.includes('moves away') && text.includes('kids') ||
      text.includes('smokes pot') ||
      text.includes('ex-husband smokes');
    
    if (isCustody) {
      console.log(`Removing custody phrase from FamilyLaw: "${entry.data[0].text}"`);
      return false;
    }
    return true;
  }
  return true;
});

console.log(`Filtered FamilyLaw entries: ${filteredData.length}`);
console.log(`Removed: ${familyLawData.length - filteredData.length} custody entries`);

// Write back the cleaned data
fs.writeFileSync('intents/FamilyLaw_usersays_en.json', JSON.stringify(filteredData, null, 2));
console.log('FamilyLaw custody phrases cleaned successfully!');