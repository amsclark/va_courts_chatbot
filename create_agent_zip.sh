#!/bin/bash

# Create a Dialogflow agent zip file for manual upload
echo "🔄 Creating Dialogflow agent zip file for manual upload..."

# Create a temporary directory for the agent files
mkdir -p ./temp_agent_export

# Copy agent files
echo "📁 Copying agent files..."

if [ -d "./intents" ]; then
    cp -r ./intents ./temp_agent_export/
    echo "  ✅ Copied intents/ folder"
else
    echo "  ❌ No intents/ folder found"
fi

if [ -d "./entities" ]; then
    cp -r ./entities ./temp_agent_export/
    echo "  ✅ Copied entities/ folder"
else
    echo "  ❌ No entities/ folder found"
fi

if [ -f "./agent.json" ]; then
    cp ./agent.json ./temp_agent_export/
    echo "  ✅ Copied agent.json"
else
    echo "  ❌ No agent.json found"
fi

if [ -f "./package.json" ]; then
    cp ./package.json ./temp_agent_export/
    echo "  ✅ Copied package.json"
else
    echo "  ❌ No package.json found"
fi

# Transform for DEV environment (since this is going to DEV)
echo "🔄 Transforming agent.json for DEV environment..."
if [ -f "./temp_agent_export/agent.json" ]; then
    # Change displayName from _PROD_JAMES to _DEV_JAMES
    sed -i 's/"displayName": "_PROD_JAMES"/"displayName": "_DEV_JAMES"/g' ./temp_agent_export/agent.json
    
    # Change secondaryKey from PROD to DEV value
    sed -i 's/"secondaryKey": "60ed9faa94e644159a1289988ecb5dfc"/"secondaryKey": "d11d0d22834f4c4f9cb05a2c52026093"/g' ./temp_agent_export/agent.json
    
    echo "  ✅ Transformed displayName: _PROD_JAMES → _DEV_JAMES"
    echo "  ✅ Transformed secondaryKey: PROD → DEV"
fi

# Create the zip file
ZIP_NAME="dialogflow_agent_$(date +%Y%m%d_%H%M%S).zip"
echo "📦 Creating zip file: $ZIP_NAME"

cd temp_agent_export
zip -r "../$ZIP_NAME" . -x ".*" "*/.*"
cd ..

# Verify the zip contents
echo "📋 Zip file contents:"
unzip -l "$ZIP_NAME" | head -20

# Show file info
echo ""
echo "📊 Zip file information:"
ls -lh "$ZIP_NAME"

# Count files
INTENT_COUNT=$(find temp_agent_export/intents -name "*.json" 2>/dev/null | wc -l)
ENTITY_COUNT=$(find temp_agent_export/entities -name "*.json" 2>/dev/null | wc -l)

echo ""
echo "📈 Agent contents:"
echo "  - Intents: $INTENT_COUNT files"
echo "  - Entities: $ENTITY_COUNT files"
echo "  - Agent config: $([ -f temp_agent_export/agent.json ] && echo "✅" || echo "❌")"
echo "  - Package info: $([ -f temp_agent_export/package.json ] && echo "✅" || echo "❌")"

# Cleanup
rm -rf ./temp_agent_export

echo ""
echo "🎉 Agent zip file created successfully!"
echo "📁 File: $ZIP_NAME"
echo ""
echo "💡 Next steps:"
echo "1. Go to Dialogflow Console for DEV environment (l-dev-james-hegk)"
echo "2. Click Settings (gear icon) → Export and Import"
echo "3. Click 'Import From Zip'"
echo "4. Upload the file: $ZIP_NAME"
echo "5. Choose 'Import All' and confirm"
echo ""
echo "⚠️  Note: This zip contains DEV configuration (_DEV_JAMES name and DEV keys)"