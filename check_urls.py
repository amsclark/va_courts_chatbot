#!/usr/bin/env python3
"""
Script to extract URLs from Dialogflow intent JSON files and check their HTTP status.
"""

import json
import os
import requests
import re
from pathlib import Path
from urllib.parse import urlparse
import time

# Define base path
INTENTS_DIR = "/home/alex/va_courts_chatbot/KLS_Chatbot_Public-main/intents"

def extract_urls_from_intent(file_path):
    """Extract all URLs from a single intent file."""
    urls = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            intent_data = json.load(f)
        
        # Convert to string and use regex to find all URLs
        content_str = json.dumps(intent_data)
        
        # Find all HTTP/HTTPS URLs
        url_pattern = r'https?://[^\s"\'\]},]+'
        found_urls = re.findall(url_pattern, content_str)
        
        for url in found_urls:
            # Clean up any trailing characters that might have been captured
            url = url.rstrip('",}]')
            if url not in urls:
                urls.append(url)
    
    except Exception as e:
        print(f"Error reading {file_path}: {str(e)}")
    
    return urls

def check_url_status(url, timeout=10):
    """Check the HTTP status of a URL using HEAD request."""
    try:
        # Use HEAD request to check status without downloading content
        response = requests.head(url, timeout=timeout, allow_redirects=True)
        return response.status_code
    except requests.exceptions.Timeout:
        return "TIMEOUT"
    except requests.exceptions.ConnectionError:
        return "CONNECTION_ERROR"
    except requests.exceptions.RequestException as e:
        return f"ERROR: {str(e)}"

def main():
    """Main function to extract URLs and check their status."""
    print("Extracting URLs from chatbot intent files...")
    
    # Get all JSON files
    intent_files = []
    for file in os.listdir(INTENTS_DIR):
        if file.endswith('.json'):
            intent_files.append(os.path.join(INTENTS_DIR, file))
    
    print(f"Found {len(intent_files)} intent files to process")
    
    # Extract all URLs
    all_urls = set()
    url_to_files = {}  # Track which files contain which URLs
    
    for file_path in intent_files:
        filename = os.path.basename(file_path)
        urls = extract_urls_from_intent(file_path)
        
        for url in urls:
            all_urls.add(url)
            if url not in url_to_files:
                url_to_files[url] = []
            url_to_files[url].append(filename)
    
    print(f"\nFound {len(all_urls)} unique URLs across all intent files")
    
    # Check status of each URL
    print("\nChecking URL status...")
    print("=" * 80)
    
    results = {
        '200': [],
        '404': [],
        '403': [],
        'other_errors': [],
        'timeouts': [],
        'connection_errors': []
    }
    
    for i, url in enumerate(sorted(all_urls), 1):
        print(f"[{i}/{len(all_urls)}] Checking: {url}")
        
        status = check_url_status(url)
        
        # Categorize results
        if status == 200:
            results['200'].append((url, status))
            print(f"  ✅ Status: {status}")
        elif status == 404:
            results['404'].append((url, status))
            print(f"  ❌ Status: {status}")
        elif status == 403:
            results['403'].append((url, status))
            print(f"  🚫 Status: {status}")
        elif status == "TIMEOUT":
            results['timeouts'].append((url, status))
            print(f"  ⏰ Status: {status}")
        elif status == "CONNECTION_ERROR":
            results['connection_errors'].append((url, status))
            print(f"  🔌 Status: {status}")
        else:
            results['other_errors'].append((url, status))
            print(f"  ⚠️  Status: {status}")
        
        # Small delay to be respectful to servers
        time.sleep(0.5)
    
    # Print summary
    print("\n" + "=" * 80)
    print("SUMMARY REPORT")
    print("=" * 80)
    
    print(f"\n✅ Working URLs (200): {len(results['200'])}")
    for url, status in results['200']:
        files = url_to_files[url]
        print(f"  {url}")
        print(f"    Found in: {', '.join(files[:3])}{'...' if len(files) > 3 else ''}")
    
    if results['404']:
        print(f"\n❌ Not Found (404): {len(results['404'])}")
        for url, status in results['404']:
            files = url_to_files[url]
            print(f"  {url}")
            print(f"    Found in: {', '.join(files[:3])}{'...' if len(files) > 3 else ''}")
    
    if results['403']:
        print(f"\n🚫 Forbidden (403): {len(results['403'])}")
        for url, status in results['403']:
            files = url_to_files[url]
            print(f"  {url}")
            print(f"    Found in: {', '.join(files[:3])}{'...' if len(files) > 3 else ''}")
    
    if results['timeouts']:
        print(f"\n⏰ Timeouts: {len(results['timeouts'])}")
        for url, status in results['timeouts']:
            files = url_to_files[url]
            print(f"  {url}")
            print(f"    Found in: {', '.join(files[:3])}{'...' if len(files) > 3 else ''}")
    
    if results['connection_errors']:
        print(f"\n🔌 Connection Errors: {len(results['connection_errors'])}")
        for url, status in results['connection_errors']:
            files = url_to_files[url]
            print(f"  {url}")
            print(f"    Found in: {', '.join(files[:3])}{'...' if len(files) > 3 else ''}")
    
    if results['other_errors']:
        print(f"\n⚠️  Other Errors: {len(results['other_errors'])}")
        for url, status in results['other_errors']:
            files = url_to_files[url]
            print(f"  {url} - {status}")
            print(f"    Found in: {', '.join(files[:3])}{'...' if len(files) > 3 else ''}")
    
    # Overall statistics
    total_working = len(results['200'])
    total_broken = len(results['404']) + len(results['403']) + len(results['other_errors'])
    total_unreachable = len(results['timeouts']) + len(results['connection_errors'])
    
    print(f"\n📊 OVERALL STATISTICS:")
    print(f"   Total URLs checked: {len(all_urls)}")
    print(f"   Working (200): {total_working} ({total_working/len(all_urls)*100:.1f}%)")
    print(f"   Broken (404/403/errors): {total_broken} ({total_broken/len(all_urls)*100:.1f}%)")
    print(f"   Unreachable (timeout/connection): {total_unreachable} ({total_unreachable/len(all_urls)*100:.1f}%)")

if __name__ == "__main__":
    main()
