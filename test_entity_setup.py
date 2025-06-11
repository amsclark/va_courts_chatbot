#!/usr/bin/env python3

import json

def test_entity_setup():
    """Test that the NonVirginiaState entity is properly configured"""
    
    # Load the entity definition
    with open('KLS_Chatbot_Public-main/entities/NonVirginiaState.json', 'r') as f:
        entity_def = json.load(f)
    
    # Load the entity entries
    with open('KLS_Chatbot_Public-main/entities/NonVirginiaState_entries_en.json', 'r') as f:
        entity_entries = json.load(f)
    
    # Check entity name
    assert entity_def['name'] == 'NonVirginiaState', f"Expected entity name 'NonVirginiaState', got '{entity_def['name']}'"
    
    # Get all state names
    states = [entry['value'] for entry in entity_entries]
    
    # Check that Virginia is NOT in the list (but West Virginia should be)
    assert 'Virginia' not in states, "Virginia should not be in NonVirginiaState entity"
    assert 'West Virginia' in states, "West Virginia should be in NonVirginiaState entity (it's a different state)"
    
    # Check that Kansas IS in the list
    assert 'Kansas' in states, "Kansas should be in NonVirginiaState entity"
    
    # Check that we have the expected number of states (50 - 1 = 49)
    # Original had 50 states, we removed 1 (Virginia only)
    assert len(states) == 49, f"Expected 49 states, got {len(states)}"
    
    print("✅ Entity setup test passed!")
    print(f"   - Entity name: {entity_def['name']}")
    print(f"   - Total states: {len(states)}")
    print(f"   - Kansas included: {'Kansas' in states}")
    print(f"   - Virginia excluded: {'Virginia' not in states}")
    print(f"   - West Virginia included: {'West Virginia' in states}")
    
    # Load and test the OtherStates intent
    with open('KLS_Chatbot_Public-main/intents/OtherStates.json', 'r') as f:
        intent = json.load(f)
    
    # Check that parameter references are updated
    params = intent['responses'][0]['parameters']
    assert len(params) == 1, "Should have exactly one parameter"
    assert params[0]['name'] == 'nonvirginiastate', f"Expected parameter name 'nonvirginiastate', got '{params[0]['name']}'"
    assert params[0]['dataType'] == '@NonVirginiaState', f"Expected dataType '@NonVirginiaState', got '{params[0]['dataType']}'"
    
    # Check speech text
    speech = intent['responses'][0]['messages'][0]['speech'][0]
    assert '$nonvirginiastate' in speech, "Speech should reference $nonvirginiastate parameter"
    assert 'Virginia' in speech, "Speech should mention Virginia as the state this bot serves"
    
    print("✅ Intent setup test passed!")
    print("   - Parameter name updated to 'nonvirginiastate'")
    print("   - Parameter dataType updated to '@NonVirginiaState'")
    print("   - Speech text properly references Virginia")

if __name__ == "__main__":
    test_entity_setup()
    print("\n🎉 All tests passed! The OtherStates mechanism is now properly configured for Virginia.")
