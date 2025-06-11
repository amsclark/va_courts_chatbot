#!/usr/bin/env python3
"""
Debug fallback file fix.
"""

import json
from pathlib import Path

def debug_fallback():
    file_path = Path("KLS_Chatbot_Public-main/intents/Abuse - fallback.json")
    
    if not file_path.exists():
        print(f"File {file_path} does not exist")
        return
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"File type: {type(data)}")
    print(f"Keys: {list(data.keys()) if isinstance(data, dict) else 'N/A (not a dict)'}")
    print(f"Has 'auto' field: {'auto' in data if isinstance(data, dict) else 'N/A'}")

if __name__ == "__main__":
    debug_fallback()
