#!/usr/bin/env python3

import os
import json
import glob

def update_entity_references():
    """Update all references from NonKansasState to NonVirginiaState"""
    
    intents_dir = "KLS_Chatbot_Public-main/intents"
    
    # Find all JSON files in the intents directory
    json_files = glob.glob(os.path.join(intents_dir, "*.json"))
    
    for file_path in json_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Track if changes were made
            original_content = content
            
            # Replace all entity references
            content = content.replace("@NonKansasState", "@NonVirginiaState")
            content = content.replace("nonkansasstate", "nonvirginiastate")
            
            # Write back if changes were made
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated: {file_path}")
            
        except Exception as e:
            print(f"Error processing {file_path}: {e}")

if __name__ == "__main__":
    update_entity_references()
    print("Entity reference updates completed!")
