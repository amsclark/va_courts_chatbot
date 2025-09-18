#!/bin/bash

echo "🧹 Cleaning up test artifacts and legacy files..."
echo "================================================"

# Create backup list of files being removed
echo "📋 Creating backup list of removed files..."
cat > removed_files_backup.txt << 'EOF'
# Files removed by cleanup_test_files.sh on $(date)
# These were test artifacts, empty files, or legacy exports

EOF

# Function to safely remove file with logging
remove_file() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "  🗑️  Removing: $file"
        echo "$file" >> removed_files_backup.txt
        rm "$file"
    else
        echo "  ⚠️  Not found: $file"
    fi
}

echo ""
echo "🗂️  Removing empty/dead test files..."
remove_file "analyze_failures.js"
remove_file "analyze_remaining_failures.js"
remove_file "check_failing.js" 
remove_file "test_specific_failures.js"
remove_file "debug_chatbot_structure.spec.js"
remove_file "debug_single_interaction.spec.js"
remove_file "playwright_customer_feedback.spec.js"
remove_file "playwright_customer_feedback_simple.spec.js"
remove_file "xhr_customer_feedback.spec.js"
remove_file "standardize_intents.py"

echo ""
echo "📊 Removing test results and tracking files..."
remove_file "curl_results.txt"
remove_file "passed_tests.json"
remove_file "customerfeedback.csv"

echo ""
echo "📦 Removing old zip exports..."
remove_file "dialogflow_agent_updated.zip"
remove_file "dialogflow_agent_updated_v2.zip"
remove_file "dialogflow_agent_updated_v3.zip"
remove_file "dialogflow_agent_20250918_102424.zip"

echo ""
echo "🔧 Removing utility scripts and reports..."
remove_file "extract_links.js"
remove_file "check_payload_urls.js"
remove_file "payload_links_audit.md"
remove_file "feedback_analysis_report.md"

echo ""
echo "📁 Current workspace structure after cleanup:"
echo "=============================================="
echo ""
echo "✅ Essential Agent Files:"
echo "  📂 intents/ ($(find intents/ -name "*.json" | wc -l) files)"
echo "  📂 entities/ ($(find entities/ -name "*.json" | wc -l) files)"
echo "  📄 agent.json"
echo "  📄 package.json"
echo ""
echo "✅ Active Testing:"
echo "  📄 curl_intent_test.js"
echo "  📄 pruned_feedback.csv"
echo ""
echo "✅ Infrastructure:"
echo "  📂 .github/ (workflows)"
echo "  📄 DEVOPS_PIPELINE.md"
echo "  📄 DIALOGFLOW_ACTIONS_SETUP.md"
echo "  📄 Virginia_Courts_Chatbot_Final_Report.md"
echo "  📄 create_agent_zip.sh"
echo ""
echo "📋 Other files:"
ls -la | grep -E '^-' | grep -v -E '\.(json|js|md|sh|csv)$' | awk '{print "  📄 " $9}'

echo ""
echo "🎉 Cleanup complete!"
echo "📄 List of removed files saved to: removed_files_backup.txt"
echo ""
echo "💡 Your workspace is now clean and organized with only essential files."
echo "   You can regenerate test results anytime by running curl_intent_test.js"