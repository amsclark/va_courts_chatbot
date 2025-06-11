#!/usr/bin/env python3

import json
import glob
import os

def fix_intent_structure():
    """Fix structure issues in intent files"""
    
    intents_dir = 'KLS_Chatbot_Public-main/intents'
    # Only check main intent files, not _usersays_en.json files
    json_files = [f for f in glob.glob(os.path.join(intents_dir, '*.json')) 
                  if not f.endswith('_usersays_en.json') and not f.endswith('_usersays_en-us.json') 
                  and not f.endswith('_usersays_en-gb.json') and not f.endswith('_usersays_en-ca.json')
                  and not f.endswith('_usersays_en-au.json')]
    
    print(f'Checking {len(json_files)} main intent files...')
    
    fixed_count = 0
    
    for file_path in json_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            filename = os.path.basename(file_path)
            changed = False
            
            # Fix contexts format - should be array of strings
            contexts = data.get('contexts', [])
            if contexts and any(isinstance(c, dict) for c in contexts):
                # Convert object contexts to string contexts
                new_contexts = []
                for c in contexts:
                    if isinstance(c, dict) and 'name' in c:
                        new_contexts.append(c['name'])
                    elif isinstance(c, str):
                        new_contexts.append(c)
                data['contexts'] = new_contexts
                changed = True
                print(f'Fixed contexts in {filename}')
            
            # Fix responses structure
            responses = data.get('responses', [])
            if responses:
                response = responses[0]
                
                # Add action field if missing (except for Default intents)
                if 'action' not in response and not filename.startswith('Default'):
                    # Generate action name from file name
                    base_name = filename.replace('.json', '').replace(' - ', '.')
                    response['action'] = base_name
                    changed = True
                    print(f'Added action to {filename}')
                
                # Fix messages structure
                messages = response.get('messages', [])
                if messages:
                    message = messages[0]
                    if 'condition' not in message:
                        message['condition'] = ""
                        changed = True
                        print(f'Added condition to {filename}')
                    
                    # Ensure type is correct format
                    if 'type' in message:
                        if message['type'] == "0":
                            message['type'] = 0
                            changed = True
            
            # Write back if changed
            if changed:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False, separators=(',', ': '))
                fixed_count += 1
        
        except Exception as e:
            print(f'❌ Error processing {filename}: {e}')
    
    print(f'✅ Fixed {fixed_count} files')

if __name__ == "__main__":
    fix_intent_structure()
