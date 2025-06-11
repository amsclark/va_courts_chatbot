#!/usr/bin/env python3
import os
import json
import re
import uuid
import glob

def generate_random_uuid():
    """Generate a truly random UUID"""
    return str(uuid.uuid4())

def is_sequential_uuid(uuid_str):
    """Check if a UUID appears to be sequential/predictable"""
    # Look for patterns like consecutive numbers or predictable sequences
    patterns = [
        r'[0-9a-f]{8}-[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9a-f]{12}',  # Has all numeric segments
        r'[0-9]+[a-f]*-[0-9]+[a-f]*-[0-9]+[a-f]*-[0-9]+[a-f]*-[0-9a-f]+',  # Sequential-like
    ]
    
    for pattern in patterns:
        if re.match(pattern, uuid_str):
            return True
    
    # Additional check for obvious patterns
    predictable_patterns = [
        '12345', '67890', '01234', '23456', '34567', '45678', '56789',
        'abcdef', 'cdefab', 'defabc', 'efabcd', 'fabcde', 'bcdefg',
        'a1b2c3', 'b2c3d4', 'c3d4e5', 'd4e5f6', 'e5f6a7', 'f6a7b8',
        'g1h2i3', 'h2i3j4', 'i3j4k5', 'j4k5l6', 'k5l6m7', 'l6m7n8'
    ]
    
    for pattern in predictable_patterns:
        if pattern in uuid_str.lower():
            return True
    
    return False

def update_usersays_file(file_path):
    """Update UUIDs in a usersays file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        updated = False
        
        # Find all UUID patterns and replace sequential ones
        def replace_uuid(match):
            nonlocal updated
            old_uuid = match.group(1)
            if is_sequential_uuid(old_uuid):
                updated = True
                return f'"id": "{generate_random_uuid()}",'
            return match.group(0)
        
        new_content = re.sub(r'"id": "([0-9a-f-]{36})",', replace_uuid, content)
        
        if updated:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated: {file_path}")
            return True
        else:
            print(f"No updates needed: {file_path}")
            return False
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    # Find all usersays files in the intents directory
    usersays_files = glob.glob('/home/alex/va_courts_chatbot/KLS_Chatbot_Public-main/intents/*_usersays_en.json')
    
    total_files = len(usersays_files)
    updated_files = 0
    
    print(f"Found {total_files} usersays files to process")
    print("=" * 50)
    
    for file_path in usersays_files:
        if update_usersays_file(file_path):
            updated_files += 1
    
    print("=" * 50)
    print(f"Summary: Updated {updated_files} out of {total_files} files")

if __name__ == "__main__":
    main()
