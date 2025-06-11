#!/usr/bin/env python3
"""
Fix intent structure to match Dialogflow examples format.
"""

import json
import os
from pathlib import Path

def fix_intent_structure():
    """Fix intent structure to match the examples."""
    intents_dir = Path("KLS_Chatbot_Public-main/intents")
    if not intents_dir.exists():
        print("❌ Intents directory not found!")
        return
    
    # Get all intent files (excluding usersays files)
    intent_files = [f for f in intents_dir.glob("*.json") if not f.name.endswith("_usersays_en.json") and not f.name.endswith("_usersays_en-au.json") and not f.name.endswith("_usersays_en-ca.json") and not f.name.endswith("_usersays_en-gb.json") and not f.name.endswith("_usersays_en-us.json")]
    
    print(f"Processing {len(intent_files)} intent files...")
    
    fixed_count = 0
    
    for file_path in intent_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Skip if it's a usersays file (array)
            if isinstance(data, list):
                continue
            
            changes_made = False
            
            # Fix fallback intents - remove 'auto' field
            if "fallback" in file_path.name and "auto" in data:
                del data["auto"]
                changes_made = True
                print(f"Removed 'auto' field from {file_path.name}")
            
            # Fix main intents - ensure action field is empty
            if "fallback" not in file_path.name and " - " not in file_path.name:
                if "responses" in data and len(data["responses"]) > 0:
                    if data["responses"][0].get("action") != "":
                        data["responses"][0]["action"] = ""
                        changes_made = True
                        print(f"Cleared action field in {file_path.name}")
            
            # Write back to file if changes were made
            if changes_made:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                fixed_count += 1
            
        except Exception as e:
            print(f"❌ Error processing {file_path.name}: {e}")
    
    print(f"\n✅ Fixed {fixed_count} intent files.")

if __name__ == "__main__":
    fix_intent_structure()
