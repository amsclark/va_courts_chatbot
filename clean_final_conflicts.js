const fs = require('fs');

// Clean FamilyLaw of remaining ChildSupport and Custody conflicts
function cleanFamilyLaw() {
    const familyLawPath = './intents/FamilyLaw_usersays_en.json';
    const data = JSON.parse(fs.readFileSync(familyLawPath, 'utf8'));
    
    // Remove specific conflicting entries
    const conflictingIds = [
        'child-support-2', // "I want my ex to pay for his kids. What can I do?"
        '42d6d11b-03ad-410e-92ea-1e0f46820418', // The smoking pot custody question
        'absent-parent-support-1' // "absent parent provide money"
    ];
    
    const cleaned = data.filter(entry => !conflictingIds.includes(entry.id));
    
    // Also remove any entries with problematic text patterns
    const finalCleaned = cleaned.filter(entry => {
        const text = entry.data[0].text.toLowerCase();
        return !text.includes('ex to pay for his kids') &&
               !text.includes('ex-husband smok') &&
               !text.includes('absent parent provide money');
    });
    
    fs.writeFileSync(familyLawPath, JSON.stringify(finalCleaned, null, 2));
    console.log(`FamilyLaw cleaned: Removed ${data.length - finalCleaned.length} conflicting entries`);
}

// Add the missing entries to their proper intents
function addMissingEntries() {
    // Add to ChildSupport
    const childSupportPath = './intents/ChildSupport_usersays_en.json';
    const childSupportData = JSON.parse(fs.readFileSync(childSupportPath, 'utf8'));
    
    const newChildSupportEntry = {
        "id": "missing-child-support-1",
        "data": [
            {
                "text": "I want my ex to pay for his kids. What can I do?",
                "userDefined": false
            }
        ],
        "isTemplate": false,
        "count": 0,
        "lang": "en",
        "updated": 0
    };
    
    // Check if already exists
    const hasEntry = childSupportData.some(entry => 
        entry.data[0].text.includes("I want my ex to pay for his kids"));
    
    if (!hasEntry) {
        childSupportData.push(newChildSupportEntry);
        fs.writeFileSync(childSupportPath, JSON.stringify(childSupportData, null, 2));
        console.log('Added missing entry to ChildSupport');
    }
    
    // Add to Custody
    const custodyPath = './intents/Custody_usersays_en.json';
    const custodyData = JSON.parse(fs.readFileSync(custodyPath, 'utf8'));
    
    const newCustodyEntry = {
        "id": "missing-custody-1",
        "data": [
            {
                "text": "My ex-husband smokes pot while around our teenage son. I've asked him to not do that, but according to my son, he still smokes. What should I do?",
                "userDefined": false
            }
        ],
        "isTemplate": false,
        "count": 0,
        "lang": "en",
        "updated": 0
    };
    
    // Check if already exists
    const hasCustodyEntry = custodyData.some(entry => 
        entry.data[0].text.includes("ex-husband smokes pot"));
    
    if (!hasCustodyEntry) {
        custodyData.push(newCustodyEntry);
        fs.writeFileSync(custodyPath, JSON.stringify(custodyData, null, 2));
        console.log('Added missing entry to Custody');
    }
}

// Fix ConservatorOfThePeace to be more law enforcement specific
function fixConservatorOfThePeace() {
    const conservatorPath = './intents/ConservatorOfThePeace_usersays_en.json';
    const data = JSON.parse(fs.readFileSync(conservatorPath, 'utf8'));
    
    // Remove the generic "What is a conservator" entry that conflicts with Guardianship
    const filtered = data.filter(entry => entry.id !== 'new-cop-4');
    
    // Add more specific law enforcement focused entries
    const newEntries = [
        {
            "id": "law-enforcement-conservator-1",
            "data": [
                {
                    "text": "What is a law enforcement conservator of the peace?",
                    "userDefined": false
                }
            ],
            "isTemplate": false,
            "count": 0,
            "lang": "en",
            "updated": 0
        },
        {
            "id": "law-enforcement-conservator-2",
            "data": [
                {
                    "text": "peace officer conservator definition",
                    "userDefined": false
                }
            ],
            "isTemplate": false,
            "count": 0,
            "lang": "en",
            "updated": 0
        },
        {
            "id": "law-enforcement-conservator-3",
            "data": [
                {
                    "text": "special conservator of the peace law enforcement",
                    "userDefined": false
                }
            ],
            "isTemplate": false,
            "count": 0,
            "lang": "en",
            "updated": 0
        }
    ];
    
    const finalData = [...filtered, ...newEntries];
    fs.writeFileSync(conservatorPath, JSON.stringify(finalData, null, 2));
    console.log('Fixed ConservatorOfThePeace to be more law enforcement specific');
}

// Run all cleanup functions
cleanFamilyLaw();
addMissingEntries();
fixConservatorOfThePeace();
console.log('All conflicts cleaned up!');