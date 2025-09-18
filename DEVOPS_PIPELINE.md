# DevOps Pipeline Setup

## Overview
This repository now has a complete DevOps pipeline that manages development and production Dialogflow ES environments with automated testing and deployment.

## Environments

### Development Environment
- **Project ID**: `l-dev-james-hegk`
- **Purpose**: Testing and development of new features
- **Agent Name**: `_DEV_JAMES`

### Production Environment  
- **Project ID**: `x-prod-james-eoau`
- **Purpose**: Live production chatbot
- **Agent Name**: `_PROD_JAMES`

## Workflow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   DEV Console   │───▶│   GitHub Repo    │───▶│  PROD Console   │
│  l-dev-james-   │    │                  │    │ x-prod-james-   │
│      hegk       │    │  ┌─────────────┐ │    │      eoau       │
└─────────────────┘    │  │   Branch    │ │    └─────────────────┘
                       │  │    + PR     │ │             ▲
                       │  └─────────────┘ │             │
                       │         │        │             │
                       │         ▼        │             │
                       │  ┌─────────────┐ │             │
                       │  │ Test DEV    │ │             │
                       │  │ Environment │ │             │
                       │  └─────────────┘ │             │
                       │         │        │             │
                       │         ▼        │             │
                       │  ┌─────────────┐ │             │
                       │  │   Merge to  │ │─────────────┘
                       │  │    main     │ │
                       │  └─────────────┘ │
                       └──────────────────┘
```

## GitHub Actions Workflows

### 1. `export_from_dialogflow.yml` - DEV Export
**Triggers**: 
- Daily at 2 AM UTC
- Manual dispatch

**Purpose**: 
- Exports the latest agent configuration from DEV environment
- Creates a new branch with changes
- Opens a PR for review

**What it does**:
1. Downloads agent from `l-dev-james-hegk`
2. Compares with current repo state
3. If changes found, creates branch `dialogflow-export-updates`
4. Opens PR with detailed change summary

### 2. `test_dev.yml` - DEV Testing
**Triggers**:
- Pull requests that modify agent files
- Manual dispatch

**Purpose**:
- Tests the DEV environment to ensure changes work correctly
- Provides feedback on PR

**What it does**:
1. Runs test suite against `l-dev-james-hegk`
2. Posts test results as PR comment
3. Uploads test artifacts

### 3. `deploy_to_prod.yml` - PROD Deployment  
**Triggers**:
- Push to main branch (after PR merge)
- Only when agent files are changed

**Purpose**:
- Deploys the merged changes to production environment

**What it does**:
1. Creates deployment package from repo
2. Uploads agent to `x-prod-james-eoau`
3. Confirms successful deployment

### 4. `test_prod.yml` - PROD Verification
**Triggers**:
- After successful PROD deployment
- Manual dispatch

**Purpose**:
- Verifies production environment is working correctly
- Creates alerts if issues detected

**What it does**:
1. Runs test suite against `x-prod-james-eoau`
2. Creates GitHub issue if tests fail
3. Uploads test results for monitoring

## Required GitHub Secrets

You need to add these secrets to your repository:

### DEV Environment
- `GOOGLE_CLOUD_PROJECT_DEV` = `l-dev-james-hegk`
- `GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY_DEV` = Service account JSON for DEV project

### PROD Environment  
- `GOOGLE_CLOUD_PROJECT_PROD` = `x-prod-james-eoau`
- `GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY_PROD` = Service account JSON for PROD project

## How to Use

### Daily Development Workflow
1. **Make changes** in the DEV Dialogflow console (`l-dev-james-hegk`)
2. **Wait for export** (daily at 2 AM) or trigger manually
3. **Review the PR** that gets created automatically
4. **Check test results** on the PR (tests run against DEV)
5. **Merge the PR** when satisfied
6. **Automatic deployment** to PROD happens
7. **Monitor** for any production test failures

### Manual Operations
- **Force export from DEV**: Run "Export from Dialogflow ES (DEV)" workflow manually
- **Test DEV environment**: Run "Test DEV Environment" workflow manually  
- **Deploy to PROD**: Run "Deploy to PROD" workflow manually
- **Test PROD environment**: Run "Test PROD Environment" workflow manually

## Benefits

✅ **Safe Development**: Test changes in DEV before production
✅ **Automated Deployment**: No manual deployment steps
✅ **Quality Assurance**: Automated testing at each stage
✅ **Change Tracking**: All changes go through git/PR process
✅ **Rollback Capability**: Git history allows easy rollbacks
✅ **Monitoring**: Automatic alerts if production issues occur

## Troubleshooting

### If DEV export fails
- Check DEV service account permissions
- Verify DEV project ID is correct
- Check DEV agent exists and is accessible

### If PROD deployment fails  
- Check PROD service account permissions
- Verify PROD project ID is correct
- Check for any breaking changes in the deployment

### If tests fail
- Review test output in GitHub Actions
- Check if agent configuration is correct
- Verify network connectivity to Dialogflow

## Next Steps

1. **Add the required secrets** to GitHub repository settings
2. **Create service accounts** for both DEV and PROD with appropriate permissions
3. **Test the pipeline** by making a small change in DEV console
4. **Monitor** the first few runs to ensure everything works correctly