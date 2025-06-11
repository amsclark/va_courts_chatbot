#!/usr/bin/env python3

import json
import glob
import os
import re
import uuid

def generate_valid_uuid():
    """Generate a valid UUID v4"""
    return str(uuid.uuid4())

def is_valid_uuid(uuid_str):
    """Check if a string is a valid UUID"""
    if not uuid_str:
        return False
    try:
        uuid.UUID(uuid_str)
        return True
    except ValueError:
        return False

def fix_invalid_uuids():
    """Find and fix all invalid UUIDs in intent files"""
    
    intents_dir = 'KLS_Chatbot_Public-main/intents'
    json_files = glob.glob(os.path.join(intents_dir, '*.json'))
    
    # First, collect all parent intent IDs
    parent_intents = {}
    
    print("Step 1: Collecting parent intent IDs...")
    
    for file_path in json_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            filename = os.path.basename(file_path)
            
            # Skip _usersays files
            if '_usersays_' in filename:
                continue
            
            intent_name = data.get('name', '')
            intent_id = data.get('id', '')
            
            # If this is a main intent (no " - " in name), record its ID
            if ' - ' not in intent_name and intent_id:
                parent_intents[intent_name] = intent_id
                print(f"  Found parent: {intent_name} -> {intent_id}")
        
        except Exception as e:
            print(f"Error reading {filename}: {e}")
    
    print(f"\\nStep 2: Fixing child intent UUIDs...")
    
    fixed_count = 0
    
    for file_path in json_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            filename = os.path.basename(file_path)
            
            # Skip _usersays files
            if '_usersays_' in filename:
                continue
            
            intent_name = data.get('name', '')
            changed = False
            
            # If this is a child intent (has " - " in name)
            if ' - ' in intent_name:
                # Extract parent name (everything before the first " - ")
                parent_name = intent_name.split(' - ')[0]
                
                # Check if we have a valid parent ID
                if parent_name in parent_intents:
                    correct_parent_id = parent_intents[parent_name]
                    
                    # Fix parentId if invalid
                    current_parent_id = data.get('parentId', '')
                    if not is_valid_uuid(current_parent_id) or current_parent_id != correct_parent_id:
                        data['parentId'] = correct_parent_id
                        changed = True
                        print(f"  Fixed parentId in {filename}: {current_parent_id} -> {correct_parent_id}")
                    
                    # Fix rootParentId if invalid
                    current_root_id = data.get('rootParentId', '')
                    if not is_valid_uuid(current_root_id) or current_root_id != correct_parent_id:
                        data['rootParentId'] = correct_parent_id
                        changed = True
                        print(f"  Fixed rootParentId in {filename}: {current_root_id} -> {correct_parent_id}")
                else:
                    print(f"  Warning: No parent found for {intent_name} (looking for {parent_name})")
            
            # Fix main intent ID if invalid
            current_id = data.get('id', '')
            if not is_valid_uuid(current_id):
                new_id = generate_valid_uuid()
                data['id'] = new_id
                changed = True
                print(f"  Fixed main ID in {filename}: {current_id} -> {new_id}")
            
            # Write back if changed
            if changed:
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False, separators=(',', ': '))
                fixed_count += 1
        
        except Exception as e:
            print(f"Error processing {filename}: {e}")
    
    print(f"\\n✅ Fixed {fixed_count} intent files")

if __name__ == "__main__":
    fix_invalid_uuids()
