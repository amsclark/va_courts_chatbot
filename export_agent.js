const dialogflow = require('@google-cloud/dialogflow');
const fs = require('fs');
const AdmZip = require('adm-zip');
const path = require('path');

async function exportAgent() {
  const agentsClient = new dialogflow.AgentsClient();
  const projectPath = agentsClient.projectPath(process.env.GOOGLE_CLOUD_PROJECT);
  
  console.log('Exporting agent from project:', process.env.GOOGLE_CLOUD_PROJECT);
  
  // Export agent without Cloud Storage URI (inline export)
  const [operation] = await agentsClient.exportAgent({
    parent: projectPath
  });
  
  const [response] = await operation.promise();
  
  // Save the exported zip content
  fs.writeFileSync('exported_agent.zip', response.agentContent);
  console.log('Agent exported successfully');
  
  // Extract the zip file
  const zip = new AdmZip('exported_agent.zip');
  zip.extractAllTo('./exported_agent/', true);
  
  console.log('Agent extracted successfully');
  return true;
}

exportAgent().catch(console.error);
