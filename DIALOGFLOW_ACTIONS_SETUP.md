# GitHub Actions for Dialogflow ES Integration

This repository now includes two GitHub Actions workflows for seamless integration with Dialogflow ES:

## 🔄 Workflows Overview

### 1. Export from Dialogflow ES (`export_from_dialogflow.yml`)
- **Trigger**: Daily at 2 AM UTC (scheduled) or manual
- **Purpose**: Exports the current Dialogflow ES agent and creates a PR with any changes
- **Behavior**: Creates a new branch, compares changes, and submits a PR for review

### 2. Deploy to Dialogflow ES (`deploy_to_dialogflow.yml`)
- **Trigger**: Manual only (`workflow_dispatch`)
- **Purpose**: Packages the current repository state and deploys to Dialogflow ES
- **Behavior**: Creates zip package, deploys to Dialogflow, optionally runs tests

## ⚙️ Setup Requirements

### 1. Google Cloud Service Account

You need to create a Google Cloud Service Account with Dialogflow API permissions:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Navigate to **IAM & Admin** > **Service Accounts**
4. Click **Create Service Account**
5. Name it something like `dialogflow-github-actions`
6. Grant these roles:
   - **Dialogflow API Admin** (for import/export)
   - **Dialogflow API Client** (for API access)
7. Create and download the JSON key file

### 2. GitHub Repository Secrets

Add these secrets to your GitHub repository:

**Settings** > **Secrets and variables** > **Actions** > **New repository secret**

#### Required Secrets:

1. **`GOOGLE_CLOUD_PROJECT`**
   - Value: Your Google Cloud Project ID
   - Example: `my-dialogflow-project-12345`

2. **`GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY`**
   - Value: The entire JSON content of your service account key file
   - Example: `{"type": "service_account", "project_id": "...", ...}`

### 3. Enable APIs

In Google Cloud Console, enable these APIs:
1. **Dialogflow API**
2. **Cloud Resource Manager API**

## 🚀 Usage

### Export from Dialogflow ES

#### Automatic (Scheduled)
- Runs daily at 2 AM UTC
- Checks for changes between Dialogflow ES and your repository
- Creates a PR if changes are detected

#### Manual Trigger
1. Go to **Actions** tab in your GitHub repository
2. Select **Export from Dialogflow ES**
3. Click **Run workflow**
4. Optionally check "Force update" to create a PR even if no changes detected

### Deploy to Dialogflow ES

1. Go to **Actions** tab in your GitHub repository
2. Select **Deploy to Dialogflow ES**
3. Click **Run workflow**
4. Fill in optional parameters:
   - **Deployment message**: Description of what you're deploying
   - **Run tests after**: Whether to run intent tests after deployment
5. Click **Run workflow**

## 📋 Workflow Details

### Export Workflow Process

1. **Authentication**: Uses service account to authenticate with Google Cloud
2. **Export**: Downloads current Dialogflow ES agent as ZIP
3. **Extract**: Unzips and extracts agent files
4. **Compare**: Checks for differences with current repository
5. **Branch**: Creates new branch if changes detected
6. **Update**: Copies new files to repository
7. **PR**: Creates pull request for review
8. **Cleanup**: Removes temporary files

### Deploy Workflow Process

1. **Authentication**: Uses service account to authenticate with Google Cloud
2. **Package**: Creates ZIP file from current repository state
3. **Deploy**: Uploads and imports agent to Dialogflow ES
4. **Test**: Optionally runs intent tests after deployment
5. **Report**: Creates deployment summary and uploads test results
6. **Cleanup**: Removes temporary files

## 📁 Files Included in Import/Export

Both workflows handle these files:
- `intents/` - All intent configuration files
- `entities/` - All entity definition files
- `agent.json` - Agent settings and configuration
- `package.json` - Package metadata

## 🔍 Monitoring and Troubleshooting

### Checking Workflow Status
- Go to **Actions** tab to see workflow runs
- Click on any run to see detailed logs
- Check **Summary** for deployment reports

### Common Issues

1. **Authentication Errors**
   - Verify `GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY` secret is correctly formatted JSON
   - Ensure service account has proper permissions
   - Check that APIs are enabled in Google Cloud

2. **Project Not Found**
   - Verify `GOOGLE_CLOUD_PROJECT` secret matches your actual project ID
   - Ensure project exists and is accessible

3. **Permission Denied**
   - Service account needs Dialogflow API Admin role
   - Check IAM permissions in Google Cloud Console

4. **ZIP File Issues**
   - Ensure repository has the required files (intents/, entities/, agent.json, package.json)
   - Check file permissions and structure

### Logs and Debugging
- All workflows include detailed logging
- Check the Actions tab for step-by-step execution details
- Failed deployments will show specific error messages

## 🔐 Security Notes

- Service account keys are stored securely as GitHub secrets
- Workflows only run on the main branch or manual triggers
- All temporary files are cleaned up after execution
- No sensitive data is logged or stored in artifacts

## 🎯 Best Practices

1. **Review PRs**: Always review export PRs before merging
2. **Test First**: Use manual export to test changes before deployment
3. **Backup**: Keep backups of working configurations
4. **Monitor**: Check workflow runs regularly
5. **Document**: Use deployment messages to track changes

## 📞 Support

If you encounter issues:
1. Check the workflow logs in the Actions tab
2. Verify all secrets are properly configured
3. Ensure Google Cloud APIs are enabled
4. Review service account permissions
5. Check that your Dialogflow ES agent is accessible

This integration provides a robust CI/CD pipeline for your Dialogflow ES agent, enabling version control, automated testing, and seamless deployments! 🚀