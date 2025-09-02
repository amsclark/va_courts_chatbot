const fs = require('fs');

// Read FamilyLaw intent file
const familyLawContent = fs.readFileSync('intents/FamilyLaw_usersays_en.json', 'utf8');
let familyLawData = JSON.parse(familyLawContent);

// Child support phrases that should be removed from FamilyLaw
const childSupportPhrases = [
  "Does my ex-wife owe money for her children?",
  "how do i get support for my kids?", 
  "how do i get money for my kids from their mom?",
  "How do I make my kids' father pay for them?",
  "How do I get money for my kids from their mom?",
  "How do I get support for my kids?",
  "How do I get money from my baby daddy for his kids?",
  "Does my ex have to cover expenses for his kids?",
  "Does an absent parent need to provide money for a son or daughter?",
  // Add variations with different case/punctuation
  "how do i get money for my kids from their mom",
  "how do i get support for my kids",
];

console.log(`Original FamilyLaw entries: ${familyLawData.length}`);

// Filter out child support phrases
const filteredData = familyLawData.filter(entry => {
  if (entry.data && entry.data[0] && entry.data[0].text) {
    const text = entry.data[0].text.toLowerCase();
    
    // Check if this entry contains child support related phrases
    const isChildSupport = childSupportPhrases.some(phrase => 
      text.includes(phrase.toLowerCase()) ||
      text.includes('baby daddy') ||
      text.includes('make') && (text.includes('pay') && text.includes('father')) ||
      text.includes('make') && (text.includes('pay') && text.includes('ex')) ||
      (text.includes('money') && text.includes('kids') && text.includes('from')) ||
      (text.includes('support') && text.includes('kids')) ||
      (text.includes('owe money') && text.includes('children'))
    );
    
    if (isChildSupport) {
      console.log(`Removing from FamilyLaw: "${entry.data[0].text}"`);
      return false;
    }
    return true;
  }
  return true;
});

console.log(`Filtered FamilyLaw entries: ${filteredData.length}`);
console.log(`Removed: ${familyLawData.length - filteredData.length} entries`);

// Write back the cleaned data
fs.writeFileSync('intents/FamilyLaw_usersays_en.json', JSON.stringify(filteredData, null, 2));
console.log('FamilyLaw cleaned successfully!');