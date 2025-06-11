#!/usr/bin/env python3
"""
Script to update payload links in Dialogflow intent " - yes.json" files.
Replaces Kansas Legal Services links with appropriate Virginia Courts links.
"""

import json
import os
import re
from pathlib import Path

# Define base paths
INTENTS_DIR = "/home/alex/va_courts_chatbot/KLS_Chatbot_Public-main/intents"
EXTRACTED_CONTENT_FILE = "/home/alex/va_courts_chatbot/extracted_content.json"

def load_extracted_content():
    """Load the extracted content JSON with Virginia Courts URLs."""
    with open(EXTRACTED_CONTENT_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def create_url_mapping():
    """Create a mapping of legal topics to relevant Virginia Courts URLs."""
    extracted_content = load_extracted_content()
    
    # Create comprehensive topic-to-URL mapping based on available content
    url_mapping = {
        'FamilyLaw': [
            'https://selfhelp.vacourts.gov/node/13/custody-visitation-support.html',
            'https://selfhelp.vacourts.gov/node/8/divorce.html',
            'https://selfhelp.vacourts.gov/taxonomy/term/21.html',  # Domestic Violence
            'https://selfhelp.vacourts.gov/node/21/types-protective-orders.html',
            'https://selfhelp.vacourts.gov/node/5/find-lawyer.html'
        ],
        'Divorce': [
            'https://selfhelp.vacourts.gov/node/8/divorce.html',
            'https://selfhelp.vacourts.gov/node/13/custody-visitation-support.html',
            'https://selfhelp.vacourts.gov/node/5/find-lawyer.html'
        ],
        'Custody': [
            'https://selfhelp.vacourts.gov/node/13/custody-visitation-support.html',
            'https://selfhelp.vacourts.gov/node/8/divorce.html',
            'https://selfhelp.vacourts.gov/node/5/find-lawyer.html'
        ],
        'ChildSupport': [
            'https://selfhelp.vacourts.gov/node/13/custody-visitation-support.html',
            'https://selfhelp.vacourts.gov/node/5/find-lawyer.html'
        ],
        'Abuse': [
            'https://selfhelp.vacourts.gov/taxonomy/term/21.html',  # Domestic Violence
            'https://selfhelp.vacourts.gov/node/21/types-protective-orders.html',
            'https://selfhelp.vacourts.gov/node/63/family-abuse-protective-order-information-checklist.html',
            'https://selfhelp.vacourts.gov/node/5/find-lawyer.html'
        ],
        'SmallClaims': [
            'https://selfhelp.vacourts.gov/node/4/find-your-court.html',
            'https://selfhelp.vacourts.gov/node/52/district-court-forms.html',
            'https://selfhelp.vacourts.gov/node/18/faqs.html'
        ],
        'LandlordTenant': [
            'https://selfhelp.vacourts.gov/node/10/landlord-tenant.html',
            'https://selfhelp.vacourts.gov/node/48/landlord-tenant-forms.html',
            'https://selfhelp.vacourts.gov/node/5/find-lawyer.html'
        ],
        'Probate': [
            'https://selfhelp.vacourts.gov/node/20/probate-virginia.html',
            'https://selfhelp.vacourts.gov/node/37/probate-forms.html',
            'https://selfhelp.vacourts.gov/node/5/find-lawyer.html'
        ],
        'Guardianship_Conservatorship': [
            'https://selfhelp.vacourts.gov/node/36/new-online-resources-guardians-and-conservators.html',
            'https://selfhelp.vacourts.gov/node/60/new-publication-options-virginia-help-another-person-make-decisions.html',
            'https://selfhelp.vacourts.gov/node/5/find-lawyer.html'
        ],
        'FindALawyer': [
            'https://selfhelp.vacourts.gov/node/5/find-lawyer.html',
            'https://selfhelp.vacourts.gov/taxonomy/term/11.html',
            'https://selfhelp.vacourts.gov/node/31/what-do-when-you-cant-afford-attorney.html'
        ],
        'FindAMediator': [
            'https://selfhelp.vacourts.gov/taxonomy/term/10.html',
            'https://selfhelp.vacourts.gov/node/5/find-lawyer.html'
        ],
        'Mediation': [
            'https://selfhelp.vacourts.gov/taxonomy/term/10.html',
            'https://selfhelp.vacourts.gov/node/5/find-lawyer.html'
        ],
        'CourtGlossaryInfo': [
            'https://selfhelp.vacourts.gov/node/17/glossaries.html',
            'https://selfhelp.vacourts.gov/node/18/faqs.html'
        ],
        'VirginiaProbateHelp': [
            'https://selfhelp.vacourts.gov/node/20/probate-virginia.html',
            'https://selfhelp.vacourts.gov/node/37/probate-forms.html'
        ],
        'UpdateAddressForCourtCasesVirginia': [
            'https://selfhelp.vacourts.gov/node/4/find-your-court.html',
            'https://selfhelp.vacourts.gov/node/18/faqs.html'
        ],
        'ObtainVirginiaAdultBirthCertificateGuide': [
            'https://selfhelp.vacourts.gov/news.html',  # Birth certificate info mentioned in news
            'https://selfhelp.vacourts.gov/node/18/faqs.html'
        ],
        'SelfRepresentationCourtOfAppeals': [
            'https://selfhelp.vacourts.gov/node/76/guide-self-representation-court-appeals-virginia.html',
            'https://selfhelp.vacourts.gov/node/5/find-lawyer.html'
        ],
        'ConservatorOfThePeace': [
            'https://selfhelp.vacourts.gov/node/28/find-form.html',
            'https://selfhelp.vacourts.gov/node/4/find-your-court.html'
        ],
        'VotingRights': [
            'https://selfhelp.vacourts.gov/node/28/find-form.html',
            'https://selfhelp.vacourts.gov/node/18/faqs.html'
        ],
        'MentalHealth': [
            'https://selfhelp.vacourts.gov/node/28/find-form.html',
            'https://selfhelp.vacourts.gov/node/5/find-lawyer.html'
        ],
        'PublicBenefits': [
            'https://selfhelp.vacourts.gov/node/33/statewide-senior-legal-helpline.html',
            'https://selfhelp.vacourts.gov/node/5/find-lawyer.html'
        ],
        'Health': [
            'https://selfhelp.vacourts.gov/node/25/general-information-individuals-disabilities.html',
            'https://selfhelp.vacourts.gov/node/5/find-lawyer.html'
        ],
        'FreedomOfInformationAct': [
            'https://selfhelp.vacourts.gov/node/28/find-form.html',
            'https://selfhelp.vacourts.gov/node/5/find-lawyer.html'
        ],
        'LegalQA': [
            'https://selfhelp.vacourts.gov/node/18/faqs.html',
            'https://selfhelp.vacourts.gov/node/5/find-lawyer.html'
        ],
        'FamMobileCrisis': [
            'https://selfhelp.vacourts.gov/taxonomy/term/21.html',
            'https://selfhelp.vacourts.gov/node/33/statewide-senior-legal-helpline.html'
        ],
        # Generic/fallback URLs for any intent not specifically mapped
        'default': [
            'https://selfhelp.vacourts.gov/',
            'https://selfhelp.vacourts.gov/topics.html',
            'https://selfhelp.vacourts.gov/node/5/find-lawyer.html',
            'https://selfhelp.vacourts.gov/node/18/faqs.html'
        ]
    }
    
    return url_mapping

def extract_intent_base_name(filename):
    """Extract the base intent name from filename (e.g., 'FamilyLaw - yes.json' -> 'FamilyLaw')."""
    if ' - yes.json' in filename:
        return filename.replace(' - yes.json', '')
    return None

def create_button_item(text, url, icon_color="#00CC8D"):
    """Create a button item for the rich content payload."""
    return {
        "type": "button",
        "text": text,
        "link": url,
        "icon": {
            "type": "info",
            "color": icon_color
        }
    }

def create_divider():
    """Create a divider item for the rich content payload."""
    return {"type": "divider"}

def update_payload_content(intent_name, urls):
    """Create updated payload content with Virginia-specific information and URLs."""
    
    # Define intent-specific descriptions and button texts
    content_mapping = {
        'FamilyLaw': {
            'description': "Here are helpful resources for family law matters in Virginia. Family law generally deals with things like Child Custody, Child Support, Divorce, Domestic Violence, Protective Orders, Visitation, Paternity, and other related topics. If you need help with something specific, feel free to ask for a particular area. You can also check the links below!",
            'buttons': [
                ("Family Law - Custody, Visitation & Support", urls[0] if len(urls) > 0 else ""),
                ("Divorce Information", urls[1] if len(urls) > 1 else ""),
                ("Domestic Violence & Protective Orders", urls[2] if len(urls) > 2 else ""),
                ("Types of Protective Orders", urls[3] if len(urls) > 3 else ""),
                ("Find a Lawyer", urls[4] if len(urls) > 4 else "")
            ]
        },
        'Divorce': {
            'description': "Here are resources to help you understand divorce proceedings in Virginia. These resources cover the divorce process, custody and support matters, and finding legal assistance.",
            'buttons': [
                ("Divorce Information", urls[0] if len(urls) > 0 else ""),
                ("Custody, Visitation & Support", urls[1] if len(urls) > 1 else ""),
                ("Find a Lawyer", urls[2] if len(urls) > 2 else "")
            ]
        },
        'Custody': {
            'description': "Here are resources for child custody, visitation, and support matters in Virginia. These resources will help you understand the process and requirements.",
            'buttons': [
                ("Custody, Visitation & Support", urls[0] if len(urls) > 0 else ""),
                ("Divorce Information", urls[1] if len(urls) > 1 else ""),
                ("Find a Lawyer", urls[2] if len(urls) > 2 else "")
            ]
        },
        'ChildSupport': {
            'description': "Here are resources for child support matters in Virginia, including information about establishing and modifying child support orders.",
            'buttons': [
                ("Custody, Visitation & Support", urls[0] if len(urls) > 0 else ""),
                ("Find a Lawyer", urls[1] if len(urls) > 1 else "")
            ]
        },
        'Abuse': {
            'description': "Here are resources for domestic violence and abuse situations in Virginia, including information about protective orders and getting help.",
            'buttons': [
                ("Domestic Violence Information", urls[0] if len(urls) > 0 else ""),
                ("Types of Protective Orders", urls[1] if len(urls) > 1 else ""),
                ("Protective Order Information Checklist", urls[2] if len(urls) > 2 else ""),
                ("Find a Lawyer", urls[3] if len(urls) > 3 else "")
            ]
        },
        'SmallClaims': {
            'description': "Here are resources for small claims court procedures in Virginia, including finding the right court and necessary forms.",
            'buttons': [
                ("Find Your Court", urls[0] if len(urls) > 0 else ""),
                ("District Court Forms", urls[1] if len(urls) > 1 else ""),
                ("Frequently Asked Questions", urls[2] if len(urls) > 2 else "")
            ]
        },
        'LandlordTenant': {
            'description': "Here are resources for landlord-tenant matters in Virginia, including eviction procedures, tenant rights, and required forms.",
            'buttons': [
                ("Landlord - Tenant Information", urls[0] if len(urls) > 0 else ""),
                ("Landlord - Tenant Forms", urls[1] if len(urls) > 1 else ""),
                ("Find a Lawyer", urls[2] if len(urls) > 2 else "")
            ]
        },
        'Probate': {
            'description': "Here are resources for probate matters in Virginia, including information about the probate process and required forms.",
            'buttons': [
                ("Probate in Virginia", urls[0] if len(urls) > 0 else ""),
                ("Probate Forms", urls[1] if len(urls) > 1 else ""),
                ("Find a Lawyer", urls[2] if len(urls) > 2 else "")
            ]
        },
        'Guardianship_Conservatorship': {
            'description': "Here are resources for guardianship and conservatorship matters in Virginia, including alternatives to guardianship and conservatorship.",
            'buttons': [
                ("Resources for Guardians and Conservators", urls[0] if len(urls) > 0 else ""),
                ("Options to Help Another Person Make Decisions", urls[1] if len(urls) > 1 else ""),
                ("Find a Lawyer", urls[2] if len(urls) > 2 else "")
            ]
        },
        'FindALawyer': {
            'description': "Here are resources to help you find legal assistance in Virginia, including information about free and low-cost legal services.",
            'buttons': [
                ("Find a Lawyer", urls[0] if len(urls) > 0 else ""),
                ("Legal Aid Information", urls[1] if len(urls) > 1 else ""),
                ("What to Do When You Can't Afford an Attorney", urls[2] if len(urls) > 2 else "")
            ]
        },
        'FindAMediator': {
            'description': "Here are resources to help you find mediation services in Virginia for resolving disputes outside of court.",
            'buttons': [
                ("Mediator Information", urls[0] if len(urls) > 0 else ""),
                ("Find a Lawyer", urls[1] if len(urls) > 1 else "")
            ]
        },
        'Mediation': {
            'description': "Here are resources about mediation services in Virginia as an alternative way to resolve legal disputes.",
            'buttons': [
                ("Mediation Information", urls[0] if len(urls) > 0 else ""),
                ("Find a Lawyer", urls[1] if len(urls) > 1 else "")
            ]
        },
        'CourtGlossaryInfo': {
            'description': "Here are resources for understanding legal terms and court procedures, including glossaries and frequently asked questions.",
            'buttons': [
                ("Legal Glossaries", urls[0] if len(urls) > 0 else ""),
                ("Frequently Asked Questions", urls[1] if len(urls) > 1 else "")
            ]
        },
        'VirginiaProbateHelp': {
            'description': "Here are specific resources for probate matters in Virginia, including step-by-step information and forms.",
            'buttons': [
                ("Probate in Virginia", urls[0] if len(urls) > 0 else ""),
                ("Probate Forms", urls[1] if len(urls) > 1 else "")
            ]
        },
        'UpdateAddressForCourtCasesVirginia': {
            'description': "Here are resources for updating your address with Virginia courts and finding court contact information.",
            'buttons': [
                ("Find Your Court", urls[0] if len(urls) > 0 else ""),
                ("Frequently Asked Questions", urls[1] if len(urls) > 1 else "")
            ]
        },
        'ObtainVirginiaAdultBirthCertificateGuide': {
            'description': "Here are resources with information about obtaining vital records and other legal documents in Virginia.",
            'buttons': [
                ("News and Publications", urls[0] if len(urls) > 0 else ""),
                ("Frequently Asked Questions", urls[1] if len(urls) > 1 else "")
            ]
        },
        'SelfRepresentationCourtOfAppeals': {
            'description': "Here are resources for representing yourself in the Virginia Court of Appeals, including the official self-representation guide.",
            'buttons': [
                ("Guide to Self-Representation in Court of Appeals", urls[0] if len(urls) > 0 else ""),
                ("Find a Lawyer", urls[1] if len(urls) > 1 else "")
            ]
        },
        'ConservatorOfThePeace': {
            'description': "Here are resources for conservator of the peace matters, including forms and court information.",
            'buttons': [
                ("Find a Form", urls[0] if len(urls) > 0 else ""),
                ("Find Your Court", urls[1] if len(urls) > 1 else "")
            ]
        },
        'VotingRights': {
            'description': "Here are resources for voting rights matters in Virginia, including forms and general information.",
            'buttons': [
                ("Voting Rights Forms", urls[0] if len(urls) > 0 else ""),
                ("Frequently Asked Questions", urls[1] if len(urls) > 1 else "")
            ]
        },
        'MentalHealth': {
            'description': "Here are resources for mental health legal matters in Virginia, including forms and legal assistance.",
            'buttons': [
                ("Mental Health Forms", urls[0] if len(urls) > 0 else ""),
                ("Find a Lawyer", urls[1] if len(urls) > 1 else "")
            ]
        },
        'PublicBenefits': {
            'description': "Here are resources for public benefits and assistance programs in Virginia, including specialized helplines.",
            'buttons': [
                ("Statewide Senior Legal Helpline", urls[0] if len(urls) > 0 else ""),
                ("Find a Lawyer", urls[1] if len(urls) > 1 else "")
            ]
        },
        'Health': {
            'description': "Here are resources for health-related legal matters and disability accommodations in Virginia courts.",
            'buttons': [
                ("Information for Individuals with Disabilities", urls[0] if len(urls) > 0 else ""),
                ("Find a Lawyer", urls[1] if len(urls) > 1 else "")
            ]
        },
        'FreedomOfInformationAct': {
            'description': "Here are resources for Freedom of Information Act matters in Virginia, including forms and legal assistance.",
            'buttons': [
                ("FOIA Forms", urls[0] if len(urls) > 0 else ""),
                ("Find a Lawyer", urls[1] if len(urls) > 1 else "")
            ]
        },
        'LegalQA': {
            'description': "Here are resources for general legal questions and information about Virginia courts and legal processes.",
            'buttons': [
                ("Frequently Asked Questions", urls[0] if len(urls) > 0 else ""),
                ("Find a Lawyer", urls[1] if len(urls) > 1 else "")
            ]
        },
        'FamMobileCrisis': {
            'description': "Here are resources for family crisis situations and emergency legal assistance in Virginia.",
            'buttons': [
                ("Domestic Violence Information", urls[0] if len(urls) > 0 else ""),
                ("Statewide Senior Legal Helpline", urls[1] if len(urls) > 1 else "")
            ]
        }
    }
    
    # Get content for this intent or use default
    content = content_mapping.get(intent_name, {
        'description': f"Here are helpful resources for {intent_name.lower().replace('_', ' ')} matters in Virginia. Check the links below for more information!",
        'buttons': [(f"{intent_name} Information", urls[0] if urls else "https://selfhelp.vacourts.gov/")]
    })
    
    return content

def update_intent_payload(file_path):
    """Update the payload in a single intent file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        intent_data = json.load(f)
    
    # Extract intent base name
    filename = os.path.basename(file_path)
    intent_name = extract_intent_base_name(filename)
    
    if not intent_name:
        print(f"Skipping {filename} - not a ' - yes.json' file")
        return False, intent_data

    # Skip smalltalk intents
    if 'smalltalk' in intent_name.lower():
        print(f"Skipping {filename} - smalltalk intent")
        return False, intent_data
    
    # Get URL mapping and select appropriate URLs
    url_mapping = create_url_mapping()
    urls = url_mapping.get(intent_name, url_mapping['default'])
    
    # Get content for this intent
    content = update_payload_content(intent_name, urls)
    
    # Update the payload in the intent
    if 'responses' in intent_data and len(intent_data['responses']) > 0:
        response = intent_data['responses'][0]
        
        if 'messages' in response and len(response['messages']) > 0:
            # Find the payload message (type 4 or '4')
            payload_message = None
            for message in response['messages']:
                if (message.get('type') == 4 or message.get('type') == '4') and 'payload' in message:
                    payload_message = message
                    break
            
            if payload_message:
                # Check if it's a richContent payload or web_url payload
                if 'richContent' in payload_message['payload']:
                    # Create new rich content structure
                    rich_content = [[
                        {
                            "type": "description",
                            "title": "",
                            "text": [content['description']]
                        }
                    ]]
                    
                    # Add dividers and buttons
                    for button_text, button_url in content['buttons']:
                        if button_url:  # Only add buttons with valid URLs
                            rich_content[0].extend([
                                create_divider(),
                                create_button_item(button_text, button_url)
                            ])
                    
                    # Update the payload
                    payload_message['payload']['richContent'] = rich_content
                    
                    print(f"Updated richContent payload for {intent_name} with {len(content['buttons'])} buttons")
                    return True, intent_data
                    
                elif 'web_url' in payload_message['payload']:
                    # For web_url payloads, we'll convert to richContent with buttons
                    rich_content = [[
                        {
                            "type": "description",
                            "title": "",
                            "text": [content['description']]
                        }
                    ]]
                    
                    # Add dividers and buttons
                    for button_text, button_url in content['buttons']:
                        if button_url:  # Only add buttons with valid URLs
                            rich_content[0].extend([
                                create_divider(),
                                create_button_item(button_text, button_url)
                            ])
                    
                    # Replace web_url with richContent
                    payload_message['payload'] = {"richContent": rich_content}
                    
                    print(f"Converted web_url to richContent payload for {intent_name} with {len(content['buttons'])} buttons")
                    return True, intent_data
                    
                else:
                    print(f"Unknown payload structure in {filename}")
                    return False, intent_data
            else:
                print(f"No payload message found in {filename}")
                return False, intent_data
        else:
            print(f"No messages found in {filename}")
            return False, intent_data
    else:
        print(f"No responses found in {filename}")
        return False, intent_data

def main():
    """Main function to process all intent files."""
    # Get all " - yes.json" files
    intent_files = []
    for file in os.listdir(INTENTS_DIR):
        if file.endswith(' - yes.json'):
            intent_files.append(os.path.join(INTENTS_DIR, file))
    
    print(f"Found {len(intent_files)} ' - yes.json' files to process")
    
    updated_count = 0
    for file_path in intent_files:
        try:
            updated, intent_data = update_intent_payload(file_path)
            if updated:
                # Write back the updated content
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(intent_data, f, indent=2, ensure_ascii=False)
                
                updated_count += 1
        except Exception as e:
            print(f"Error processing {file_path}: {str(e)}")
    
    print(f"\nCompleted! Updated {updated_count} intent files with Virginia Courts URLs")

if __name__ == "__main__":
    main()
