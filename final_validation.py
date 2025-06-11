#!/usr/bin/env python3

import json
import os
import glob
import requests
from urllib.parse import urlparse

def final_validation():
    """Comprehensive validation before Dialogflow upload"""
    
    print("🔍 FINAL VALIDATION BEFORE DIALOGFLOW UPLOAD")
    print("=" * 50)
    
    issues_found = []
    
    # 1. Check entity files exist and are properly named
    print("\n1. 📁 Entity Files Validation:")
    entity_files = [
        "KLS_Chatbot_Public-main/entities/NonVirginiaState.json",
        "KLS_Chatbot_Public-main/entities/NonVirginiaState_entries_en.json"
    ]
    
    for file_path in entity_files:
        if os.path.exists(file_path):
            print(f"   ✅ {file_path}")
        else:
            print(f"   ❌ {file_path} - MISSING!")
            issues_found.append(f"Missing entity file: {file_path}")
    
    # Check for old entity files that should be removed
    old_entity_files = [
        "KLS_Chatbot_Public-main/entities/NonKansasState.json",
        "KLS_Chatbot_Public-main/entities/NonKansasState_entries_en.json"
    ]
    
    for file_path in old_entity_files:
        if os.path.exists(file_path):
            print(f"   ⚠️  {file_path} - OLD FILE STILL EXISTS!")
            issues_found.append(f"Old entity file should be removed: {file_path}")
    
    # 2. Validate entity configuration
    print("\n2. 🏷️  Entity Configuration:")
    try:
        with open("KLS_Chatbot_Public-main/entities/NonVirginiaState.json", 'r') as f:
            entity_def = json.load(f)
        
        with open("KLS_Chatbot_Public-main/entities/NonVirginiaState_entries_en.json", 'r') as f:
            entity_entries = json.load(f)
        
        # Check entity name
        if entity_def['name'] == 'NonVirginiaState':
            print("   ✅ Entity name: NonVirginiaState")
        else:
            print(f"   ❌ Entity name: {entity_def['name']} (should be NonVirginiaState)")
            issues_found.append(f"Entity name is incorrect: {entity_def['name']}")
        
        # Check states
        states = [entry['value'] for entry in entity_entries]
        print(f"   ✅ Total states: {len(states)}")
        
        if 'Virginia' not in states:
            print("   ✅ Virginia properly excluded")
        else:
            print("   ❌ Virginia should not be in NonVirginiaState entity")
            issues_found.append("Virginia found in NonVirginiaState entity")
        
        if 'West Virginia' in states:
            print("   ✅ West Virginia properly included")
        else:
            print("   ❌ West Virginia missing from NonVirginiaState entity")
            issues_found.append("West Virginia missing from NonVirginiaState entity")
        
        if 'Kansas' in states:
            print("   ✅ Kansas properly included")
        else:
            print("   ❌ Kansas missing from NonVirginiaState entity")
            issues_found.append("Kansas missing from NonVirginiaState entity")
            
    except Exception as e:
        print(f"   ❌ Error validating entity: {e}")
        issues_found.append(f"Entity validation error: {e}")
    
    # 3. Check for Kansas references in intents
    print("\n3. 🔍 Kansas References Check:")
    kansas_refs = []
    json_files = glob.glob("KLS_Chatbot_Public-main/intents/*.json")
    
    for file_path in json_files:
        try:
            with open(file_path, 'r') as f:
                content = f.read()
            
            if 'Kansas' in content and 'nonvirginiastate' not in content:
                # Check if it's a technical reference we should ignore
                if '@NonVirginiaState' not in content and 'nonvirginiastate' not in content:
                    kansas_refs.append(file_path)
        except:
            pass
    
    if not kansas_refs:
        print("   ✅ No inappropriate Kansas references found")
    else:
        print("   ⚠️  Kansas references found in:")
        for ref in kansas_refs:
            print(f"      - {ref}")
    
    # 4. Check entity references in intents
    print("\n4. 🔗 Entity References Check:")
    old_entity_refs = []
    new_entity_refs = []
    
    for file_path in json_files:
        try:
            with open(file_path, 'r') as f:
                content = f.read()
            
            if 'NonKansasState' in content or 'nonkansasstate' in content:
                old_entity_refs.append(file_path)
            
            if 'NonVirginiaState' in content or 'nonvirginiastate' in content:
                new_entity_refs.append(file_path)
        except:
            pass
    
    if not old_entity_refs:
        print("   ✅ No old entity references (NonKansasState) found")
    else:
        print("   ❌ Old entity references found in:")
        for ref in old_entity_refs:
            print(f"      - {ref}")
        issues_found.append("Old entity references still exist")
    
    if new_entity_refs:
        print(f"   ✅ New entity references found in {len(new_entity_refs)} files")
    
    # 5. Validate key intent files exist
    print("\n5. 📋 Key Intent Files:")
    key_intents = [
        "OtherStates.json",
        "OtherStates_usersays_en.json",
        "Default Welcome Intent.json",
        "Default Fallback Intent.json"
    ]
    
    for intent in key_intents:
        file_path = f"KLS_Chatbot_Public-main/intents/{intent}"
        if os.path.exists(file_path):
            print(f"   ✅ {intent}")
        else:
            print(f"   ❌ {intent} - MISSING!")
            issues_found.append(f"Missing key intent: {intent}")
    
    # 6. Quick URL validation on a few key URLs
    print("\n6. 🔗 URL Validation (Sample):")
    sample_urls = [
        "https://selfhelp.vacourts.gov/",
        "https://selfhelp.vacourts.gov/node/13/divorce-virginia",
        "https://www.lsc.gov/about-lsc/what-legal-aid/i-need-legal-help"
    ]
    
    for url in sample_urls:
        try:
            response = requests.head(url, timeout=5, allow_redirects=True)
            if response.status_code == 200:
                print(f"   ✅ {url}")
            else:
                print(f"   ⚠️  {url} - Status: {response.status_code}")
        except Exception as e:
            print(f"   ⚠️  {url} - Error: {str(e)[:50]}...")
    
    # 7. File structure validation
    print("\n7. 📁 File Structure:")
    required_dirs = [
        "KLS_Chatbot_Public-main/intents",
        "KLS_Chatbot_Public-main/entities"
    ]
    
    for dir_path in required_dirs:
        if os.path.exists(dir_path):
            file_count = len(glob.glob(f"{dir_path}/*.json"))
            print(f"   ✅ {dir_path} ({file_count} JSON files)")
        else:
            print(f"   ❌ {dir_path} - MISSING!")
            issues_found.append(f"Missing directory: {dir_path}")
    
    # 8. JSON syntax validation
    print("\n8. 📝 JSON Syntax Validation:")
    all_json_files = glob.glob("KLS_Chatbot_Public-main/**/*.json", recursive=True)
    json_errors = []
    
    for file_path in all_json_files:
        try:
            with open(file_path, 'r') as f:
                json.load(f)
        except json.JSONDecodeError as e:
            json_errors.append(f"{file_path}: {e}")
    
    if not json_errors:
        print(f"   ✅ All {len(all_json_files)} JSON files valid")
    else:
        print(f"   ❌ JSON syntax errors in {len(json_errors)} files:")
        for error in json_errors[:5]:  # Show first 5 errors
            print(f"      - {error}")
        issues_found.extend(json_errors)
    
    # Final summary
    print("\n" + "=" * 50)
    if not issues_found:
        print("🎉 VALIDATION PASSED! Ready for Dialogflow upload.")
        print("\n📦 To create the zip file:")
        print("   cd KLS_Chatbot_Public-main")
        print("   zip -r ../va_courts_chatbot.zip .")
        print("\n📤 Upload instructions:")
        print("   1. Go to Dialogflow Console")
        print("   2. Create new agent or go to existing agent")
        print("   3. Go to Settings (gear icon)")
        print("   4. Click 'Export and Import' tab")
        print("   5. Click 'Import from ZIP' and select va_courts_chatbot.zip")
    else:
        print(f"❌ VALIDATION FAILED! {len(issues_found)} issues found:")
        for i, issue in enumerate(issues_found, 1):
            print(f"   {i}. {issue}")
        print("\n🛠️  Please fix these issues before uploading to Dialogflow.")
    
    return len(issues_found) == 0

if __name__ == "__main__":
    final_validation()
