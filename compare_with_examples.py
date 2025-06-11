#!/usr/bin/env python3
"""
Compare our intent structure with the examples to ensure compatibility.
"""

import json
from pathlib import Path

def compare_with_examples():
    """Compare our structure with the examples."""
    examples_dir = Path("examples")
    intents_dir = Path("KLS_Chatbot_Public-main/intents")
    
    if not examples_dir.exists():
        print("❌ Examples directory not found!")
        return
    
    if not intents_dir.exists():
        print("❌ Intents directory not found!")
        return
    
    # Load example files
    example_main = examples_dir / "Covid.json"
    example_fallback = examples_dir / "Covid - fallback.json"
    example_yes = examples_dir / "Covid - yes.json"
    
    print("🔍 Analyzing example structure...")
    
    # Analyze main intent structure
    with open(example_main, 'r') as f:
        main_example = json.load(f)
    
    print("\n📋 Main Intent Structure (from example):")
    print(f"  - Keys: {list(main_example.keys())}")
    print(f"  - Action field: '{main_example['responses'][0]['action']}'")
    print(f"  - Auto field: {main_example.get('auto')}")
    
    # Analyze fallback intent structure
    with open(example_fallback, 'r') as f:
        fallback_example = json.load(f)
    
    print("\n📋 Fallback Intent Structure (from example):")
    print(f"  - Keys: {list(fallback_example.keys())}")
    print(f"  - Has 'auto' field: {'auto' in fallback_example}")
    print(f"  - Action field: '{fallback_example['responses'][0]['action']}'")
    
    # Check a few of our files
    print("\n🔍 Checking our files...")
    
    our_main = intents_dir / "Abuse.json"
    our_fallback = intents_dir / "Abuse - fallback.json"
    
    if our_main.exists():
        with open(our_main, 'r') as f:
            our_main_data = json.load(f)
        print(f"\n✅ Our main intent (Abuse.json):")
        print(f"  - Action field: '{our_main_data['responses'][0]['action']}'")
        print(f"  - Auto field: {our_main_data.get('auto')}")
        print(f"  - Matches example: {our_main_data['responses'][0]['action'] == main_example['responses'][0]['action'] and our_main_data.get('auto') == main_example.get('auto')}")
    
    if our_fallback.exists():
        with open(our_fallback, 'r') as f:
            our_fallback_data = json.load(f)
        print(f"\n✅ Our fallback intent (Abuse - fallback.json):")
        print(f"  - Has 'auto' field: {'auto' in our_fallback_data}")
        print(f"  - Action field: '{our_fallback_data['responses'][0]['action']}'")
        print(f"  - Matches example: {'auto' not in our_fallback_data and 'auto' not in fallback_example}")
    
    print("\n🎯 Structure Analysis Complete!")

if __name__ == "__main__":
    compare_with_examples()
