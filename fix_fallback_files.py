#!/usr/bin/env python3
"""
Add missing 'auto' field to fallback intent files.
"""

import json
import os
from pathlib import Path

def fix_fallback_files():
    """Add missing 'auto' field to fallback intent files."""
    intents_dir = Path("KLS_Chatbot_Public-main/intents")
    if not intents_dir.exists():
        print("❌ Intents directory not found!")
        return
    
    fallback_files = [f for f in intents_dir.glob("*fallback.json")]
    fixed_count = 0
    
    print(f"Checking {len(fallback_files)} fallback files...")
    
    for file_path in fallback_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Skip if it's a usersays file (array)
            if isinstance(data, list):
                continue
            
            # Add 'auto' field if missing
            if 'auto' not in data:
                print(f"Fixing {file_path.name} - adding 'auto' field")
                # Insert 'auto' field after 'name' field
                new_data = {}
                for key, value in data.items():
                    new_data[key] = value
                    if key == 'name':
                        new_data['auto'] = True
                
                # Write back to file
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(new_data, f, indent=2, ensure_ascii=False)
                
                print(f"✅ Fixed {file_path.name}")
                fixed_count += 1
            
        except Exception as e:
            print(f"❌ Error processing {file_path.name}: {e}")
    
    print(f"\n✅ Fixed {fixed_count} fallback files.")

if __name__ == "__main__":
    fix_fallback_files()
