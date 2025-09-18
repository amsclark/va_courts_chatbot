#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

// Function to check if a string is a valid UUID
function isValidUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Function to process a single file
function fixUserSaysFile(filePath) {
  console.log(`Processing: ${filePath}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    let changesCount = 0;
    
    // Process each training phrase
    data.forEach((phrase, index) => {
      if (phrase.id && !isValidUUID(phrase.id)) {
        const oldId = phrase.id;
        phrase.id = randomUUID();
        console.log(`  [${index}] Fixed ID: ${oldId} → ${phrase.id}`);
        changesCount++;
      }
    });
    
    if (changesCount > 0) {
      // Write back to file with proper formatting
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
      console.log(`  ✅ Fixed ${changesCount} invalid IDs in ${path.basename(filePath)}`);
    } else {
      console.log(`  ✅ No issues found in ${path.basename(filePath)}`);
    }
    
    return changesCount;
  } catch (error) {
    console.error(`  ❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

// Main function
function main() {
  console.log('🔧 Fixing invalid UUIDs in usersays files...\n');
  
  const intentsDir = './intents';
  const files = fs.readdirSync(intentsDir)
    .filter(file => file.includes('_usersays_') && file.endsWith('.json'))
    .map(file => path.join(intentsDir, file));
  
  console.log(`Found ${files.length} usersays files to check\n`);
  
  let totalChanges = 0;
  let filesFixed = 0;
  
  files.forEach(file => {
    const changes = fixUserSaysFile(file);
    totalChanges += changes;
    if (changes > 0) filesFixed++;
  });
  
  console.log('\n📊 Summary:');
  console.log(`- Files checked: ${files.length}`);
  console.log(`- Files fixed: ${filesFixed}`);
  console.log(`- Total invalid IDs fixed: ${totalChanges}`);
  
  if (totalChanges > 0) {
    console.log('\n🎉 All invalid UUIDs have been fixed!');
    console.log('💡 Next steps:');
    console.log('   1. git add intents/');
    console.log('   2. git commit -m "Fix invalid UUIDs in training phrases"');
    console.log('   3. git push');
  } else {
    console.log('\n✅ No invalid UUIDs found - all files are clean!');
  }
}

// Run the script
main();