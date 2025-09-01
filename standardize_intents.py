#!/usr/bin/env python3
import json
import os
import re

def standardize_intent(intent_name, file_path):
    """Standardize a first-level intent to have only the pattern response"""
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        # Standard response pattern
        standard_response = f"It sounds like you are having issues relating to {intent_name}. Is this correct?"
        
        # Update the speech array in the first message
        if 'responses' in data and len(data['responses']) > 0:
            if 'messages' in data['responses'][0] and len(data['responses'][0]['messages']) > 0:
                if 'speech' in data['responses'][0]['messages'][0]:
                    data['responses'][0]['messages'][0]['speech'] = [standard_response]
                    
                    # Write back to file
                    with open(file_path, 'w') as f:
                        json.dump(data, f, indent=2)
                    
                    print(f"Updated {intent_name}")
                    return True
        
        print(f"Skipped {intent_name} - structure not as expected")
        return False
        
    except Exception as e:
        print(f"Error processing {intent_name}: {e}")
        return False

def main():
    intents_dir = "intents"
    
    # Get all first-level intent files (exclude usersays, fallback, yes, no, default, smalltalk)
    intent_files = []
    for filename in os.listdir(intents_dir):
        if (filename.endswith('.json') and 
            ' - ' not in filename and 
            '_usersays_en' not in filename and
            not filename.startswith('Default') and
            not filename.startswith('smalltalk')):
            intent_files.append(filename)
    
    print(f"Found {len(intent_files)} first-level intent files")
    
    updated_count = 0
    for filename in sorted(intent_files):
        intent_name = filename.replace('.json', '')
        file_path = os.path.join(intents_dir, filename)
        if standardize_intent(intent_name, file_path):
            updated_count += 1
    
    print(f"Updated {updated_count} intent files")

if __name__ == "__main__":
    main()
