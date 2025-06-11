#!/usr/bin/env python3

import json
import glob
import os

def validate_dialogflow_structure():
    """Check all intent files for Dialogflow-required structure"""
    
    issues = []
    intents_dir = 'KLS_Chatbot_Public-main/intents'
    json_files = glob.glob(os.path.join(intents_dir, '*.json'))
    
    print(f'Checking {len(json_files)} intent files for structure...')
    
    for file_path in json_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            filename = os.path.basename(file_path)
            
            # Check contexts format
            contexts = data.get('contexts', [])
            if contexts and not all(isinstance(c, str) for c in contexts):
                issues.append(f'{filename}: contexts should be array of strings')
            
            # Check responses structure
            responses = data.get('responses', [])
            if responses:
                response = responses[0]
                
                # Check for action field (should be present in most intents)
                if 'action' not in response and not filename.startswith('Default'):
                    issues.append(f'{filename}: missing action field in response')
                
                # Check messages structure
                messages = response.get('messages', [])
                if messages:
                    message = messages[0]
                    if 'condition' not in message:
                        issues.append(f'{filename}: missing condition field in message')
                    
                    # Check type field
                    if 'type' in message and not isinstance(message['type'], (str, int)):
                        issues.append(f'{filename}: type field should be string or number')
        
        except json.JSONDecodeError as e:
            issues.append(f'{filename}: JSON decode error: {e}')
        except Exception as e:
            issues.append(f'{filename}: Other error: {e}')
    
    if issues:
        print(f'❌ Found {len(issues)} structural issues:')
        for issue in issues[:20]:  # Show first 20
            print(f'  - {issue}')
        if len(issues) > 20:
            print(f'  ... and {len(issues) - 20} more')
    else:
        print('✅ All files have correct structure')
    
    return issues

if __name__ == "__main__":
    issues = validate_dialogflow_structure()
    print(f'\\nTotal issues found: {len(issues)}')
