#!/usr/bin/env python3
"""
Script to fix broken URLs in chatbot intent files based on URL check results.
"""

import json
import os
import re
from pathlib import Path

# Define base path
INTENTS_DIR = "/home/alex/va_courts_chatbot/KLS_Chatbot_Public-main/intents"

# Mapping of broken URLs to working replacements
URL_FIXES = {
    # Taxonomy URLs that return 404 - replace with direct topic pages
    'https://selfhelp.vacourts.gov/taxonomy/term/21.html': 'https://selfhelp.vacourts.gov/topics.html',  # Domestic Violence -> Topics
    'https://selfhelp.vacourts.gov/taxonomy/term/11.html': 'https://selfhelp.vacourts.gov/node/5/find-lawyer.html',  # Legal Aid -> Find Lawyer
    'https://selfhelp.vacourts.gov/taxonomy/term/10.html': 'https://selfhelp.vacourts.gov/node/5/find-lawyer.html',  # Mediator -> Find Lawyer
    
    # News page that returns 404 - replace with working news page
    'https://selfhelp.vacourts.gov/news.html': 'https://selfhelp.vacourts.gov/',  # News -> Homepage
    
    # Topics page that returns 404 - replace with homepage
    'https://selfhelp.vacourts.gov/topics.html': 'https://selfhelp.vacourts.gov/',  # Topics -> Homepage
    
    # LSC URL with trailing period causing 404
    'https://www.lsc.gov/what-legal-aid/find-legal-aid.': 'https://www.lsc.gov/what-legal-aid/find-legal-aid',  # Remove trailing period
}

def fix_urls_in_file(file_path):
    """Fix broken URLs in a single intent file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Replace each broken URL with its fix
        for broken_url, fixed_url in URL_FIXES.items():
            if broken_url in content:
                content = content.replace(broken_url, fixed_url)
                print(f"  Fixed: {broken_url} -> {fixed_url}")
        
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
    """Main function to fix URLs in intent files."""
    print("Fixing broken URLs in chatbot intent files...")
    
    # Get all JSON files
    intent_files = []
    for file in os.listdir(INTENTS_DIR):
        if file.endswith('.json'):
            intent_files.append(os.path.join(INTENTS_DIR, file))
    
    print(f"Found {len(intent_files)} intent files to check")
    
    files_updated = 0
    
    for file_path in intent_files:
        filename = os.path.basename(file_path)
        
        # Check if file contains any broken URLs
        contains_broken = False
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                for broken_url in URL_FIXES.keys():
                    if broken_url in content:
                        contains_broken = True
                        break
        except Exception as e:
            print(f"Error reading {file_path}: {str(e)}")
            continue
        
        if contains_broken:
            print(f"\nUpdating {filename}:")
            if fix_urls_in_file(file_path):
                files_updated += 1
    
    print(f"\nCompleted! Updated {files_updated} files with URL fixes")
    
    if files_updated > 0:
        print("\nFixed the following URL mappings:")
        for broken_url, fixed_url in URL_FIXES.items():
            print(f"  {broken_url}")
            print(f"  -> {fixed_url}")

if __name__ == "__main__":
    main()
