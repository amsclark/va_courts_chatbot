#!/usr/bin/env python3
"""
Script to replace ALL Kansas Legal Services URLs in ALL intent files 
with appropriate Virginia Courts URLs.
"""

import json
import os
import re
from pathlib import Path

# Define base paths
INTENTS_DIR = "/home/alex/va_courts_chatbot/KLS_Chatbot_Public-main/intents"
EXTRACTED_CONTENT_FILE = "/home/alex/va_courts_chatbot/extracted_content.json"

def create_comprehensive_url_mapping():
    """Create comprehensive mapping of Kansas URLs to Virginia URLs."""
    url_mapping = {
        # Kansas Legal Services URLs -> Virginia equivalents
        'https://www.kansaslegalservices.org/node/63/get-help': 'https://selfhelp.vacourts.gov/node/5/find-lawyer.html',
        'https://www.kansaslegalservices.org/node/2/about-us': 'https://selfhelp.vacourts.gov/',
        'https://www.kansaslegalservices.org/node/809/online-application': 'https://selfhelp.vacourts.gov/node/5/find-lawyer.html',
        'https://www.kansaslegalservices.org/node/2080/need-help-guide-legal-resources': 'https://selfhelp.vacourts.gov/node/18/faqs.html',
        'https://www.kansaslegalservices.org/topics': 'https://selfhelp.vacourts.gov/',
        'https://www.kansaslegalservices.org/node/1680/what-do-i-do-if': 'https://selfhelp.vacourts.gov/node/18/faqs.html',
        'https://www.kansaslegalservices.org/node/65/contact-us-office-locations': 'https://selfhelp.vacourts.gov/node/4/find-your-court.html',
        'https://www.kansaslegalservices.org/node/1963/civil-legal-aid-101-what-legal-aid-and-how-can-it-help-me': 'https://selfhelp.vacourts.gov/node/5/find-lawyer.html',
        
        # Abuse-specific Kansas URLs -> Virginia domestic violence resources
        'https://www.kansaslegalservices.org/topics/145/abuse-and-neglect': 'https://selfhelp.vacourts.gov/node/21/types-protective-orders.html',
        'https://www.kansaslegalservices.org/topics/2017/abuse-and-stalking': 'https://selfhelp.vacourts.gov/node/63/family-abuse-protective-order-information-checklist.html',
        'https://www.kansaslegalservices.org/node/2036/pfa-tips-tricks-part-1-preparing-your-pfa-or-pfs': 'https://selfhelp.vacourts.gov/node/63/family-abuse-protective-order-information-checklist.html',
    }
    
    return url_mapping

def update_intent_file(file_path):
    """Update all Kansas URLs in a single intent file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        url_mapping = create_comprehensive_url_mapping()
        
        # Replace each Kansas URL with Virginia equivalent
        for kansas_url, virginia_url in url_mapping.items():
            if kansas_url in content:
                content = content.replace(kansas_url, virginia_url)
                print(f"  Replaced: {kansas_url}")
                print(f"       with: {virginia_url}")
        
        # Only write back if changes were made
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        
        return False
        
    except Exception as e:
        print(f"Error processing {file_path}: {str(e)}")
        return False

def main():
    """Main function to replace all Kansas URLs in all intent files."""
    print("Replacing ALL Kansas Legal Services URLs with Virginia Courts URLs...")
    
    # Get all JSON files
    intent_files = []
    for file in os.listdir(INTENTS_DIR):
        if file.endswith('.json'):
            intent_files.append(os.path.join(INTENTS_DIR, file))
    
    print(f"Found {len(intent_files)} intent files to check")
    
    files_updated = 0
    
    for file_path in intent_files:
        filename = os.path.basename(file_path)
        
        # Check if file contains any Kansas URLs
        contains_kansas = False
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                if 'kansaslegalservices.org' in content:
                    contains_kansas = True
        except Exception as e:
            print(f"Error reading {file_path}: {str(e)}")
            continue
        
        if contains_kansas:
            print(f"\nUpdating {filename}:")
            if update_intent_file(file_path):
                files_updated += 1
            else:
                print("  No changes made (URLs already up to date)")
    
    print(f"\nCompleted! Updated {files_updated} files")
    
    # Verify no Kansas URLs remain
    print("\nVerifying all Kansas URLs have been replaced...")
    remaining_kansas_files = []
    
    for file_path in intent_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                if 'kansaslegalservices.org' in content:
                    remaining_kansas_files.append(os.path.basename(file_path))
        except Exception as e:
            print(f"Error checking {file_path}: {str(e)}")
    
    if remaining_kansas_files:
        print(f"⚠️  WARNING: {len(remaining_kansas_files)} files still contain Kansas URLs:")
        for filename in remaining_kansas_files:
            print(f"  - {filename}")
    else:
        print("✅ SUCCESS: All Kansas Legal Services URLs have been replaced!")

if __name__ == "__main__":
    main()
