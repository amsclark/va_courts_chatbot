#!/usr/bin/env python3

import json
import glob
import os

def clean_all_json_files():
    """Clean and standardize all JSON files for Dialogflow compatibility"""
    
    intents_dir = 'KLS_Chatbot_Public-main/intents'
    entities_dir = 'KLS_Chatbot_Public-main/entities'
    
    all_dirs = [intents_dir, entities_dir]
    total_cleaned = 0
    
    for directory in all_dirs:
        if not os.path.exists(directory):
            continue
            
        json_files = glob.glob(os.path.join(directory, '*.json'))
        print(f'Cleaning {len(json_files)} files in {directory}...')
        
        for file_path in json_files:
            try:
                # Read the file
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Write it back with standardized formatting
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False, separators=(',', ': '))
                
                total_cleaned += 1
                
            except Exception as e:
                print(f'❌ Error processing {file_path}: {e}')
    
    print(f'✅ Cleaned {total_cleaned} JSON files')
    
    # Also clean the main agent.json
    try:
        with open('KLS_Chatbot_Public-main/agent.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        with open('KLS_Chatbot_Public-main/agent.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False, separators=(',', ': '))
        
        print('✅ Cleaned agent.json')
        
    except Exception as e:
        print(f'❌ Error cleaning agent.json: {e}')

if __name__ == "__main__":
    clean_all_json_files()
