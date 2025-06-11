#!/usr/bin/env python3
"""
Validate main intent files (not usersays files) for Dialogflow structure.
"""

import json
import os
import uuid
import re
from pathlib import Path

def is_valid_uuid(uuid_string):
    """Check if a string is a valid UUID."""
    try:
        uuid.UUID(uuid_string)
        return True
    except ValueError:
        return False

def validate_intent_file(file_path):
    """Validate a single intent file."""
    issues = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Skip usersays files (they are arrays)
        if isinstance(data, list):
            return []
            
        # Check required fields
        required_fields = ['id', 'name', 'auto', 'contexts', 'responses', 'priority', 
                          'webhookUsed', 'webhookForSlotFilling', 'fallbackIntent', 
                          'events', 'conditionalResponses', 'condition', 'conditionalFollowupEvents']
        
        for field in required_fields:
            if field not in data:
                issues.append(f"Missing required field: {field}")
        
        # Validate UUID fields
        if 'id' in data and not is_valid_uuid(data['id']):
            issues.append(f"Invalid UUID in 'id': {data['id']}")
            
        if 'parentId' in data and not is_valid_uuid(data['parentId']):
            issues.append(f"Invalid UUID in 'parentId': {data['parentId']}")
            
        if 'rootParentId' in data and not is_valid_uuid(data['rootParentId']):
            issues.append(f"Invalid UUID in 'rootParentId': {data['rootParentId']}")
        
        # Check contexts is array
        if 'contexts' in data and not isinstance(data['contexts'], list):
            issues.append("'contexts' should be an array")
        
        # Check responses structure
        if 'responses' in data:
            if not isinstance(data['responses'], list):
                issues.append("'responses' should be an array")
            else:
                for i, response in enumerate(data['responses']):
                    if not isinstance(response, dict):
                        issues.append(f"Response {i} should be an object")
                        continue
                    
                    # Check for action field in main intent files (not followup)
                    if ('parentId' not in data and 'rootParentId' not in data and 
                        'action' not in response):
                        issues.append(f"Response {i} missing 'action' field for main intent")
                    
                    if 'affectedContexts' in response and not isinstance(response['affectedContexts'], list):
                        issues.append(f"Response {i} 'affectedContexts' should be an array")
                    
                    if 'parameters' in response and not isinstance(response['parameters'], list):
                        issues.append(f"Response {i} 'parameters' should be an array")
                    
                    if 'messages' in response and not isinstance(response['messages'], list):
                        issues.append(f"Response {i} 'messages' should be an array")
        
    except json.JSONDecodeError as e:
        issues.append(f"JSON decode error: {e}")
    except Exception as e:
        issues.append(f"Other error: {e}")
    
    return issues

def main():
    intents_dir = Path("KLS_Chatbot_Public-main/intents")
    if not intents_dir.exists():
        print("❌ Intents directory not found!")
        return
    
    intent_files = [f for f in intents_dir.glob("*.json") if not f.name.endswith("_usersays_en.json")]
    total_issues = 0
    
    print(f"Checking {len(intent_files)} main intent files for structure...")
    
    for file_path in sorted(intent_files):
        issues = validate_intent_file(file_path)
        if issues:
            print(f"\n❌ {file_path.name}:")
            for issue in issues:
                print(f"  - {issue}")
            total_issues += len(issues)
    
    if total_issues == 0:
        print("✅ All main intent files are structurally valid!")
    else:
        print(f"\n❌ Found {total_issues} issues in main intent files.")

if __name__ == "__main__":
    main()
