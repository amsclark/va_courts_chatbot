#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const INTENTS_DIR = './intents';
const TIMEOUT_MS = 10000;
const MAX_CONCURRENT = 2; // Reduced to be more respectful to servers
const BATCH_DELAY_MS = 2000; // Increased delay between batches
const USER_AGENT = 'Mozilla/5.0 (compatible; URL-Validator/1.0; +https://github.com/amsclark/va_courts_chatbot)';

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

// URL extraction patterns
const URL_PATTERNS = [
    // Standard HTTP/HTTPS URLs
    /https?:\/\/[^\s"'<>()[\]{}]+/gi,
    // URLs in JSON string values (with escaped quotes)
    /"https?:\/\/[^"]+"/gi,
    // URLs in text fields
    /(?:url|link|href)["']?\s*[:=]\s*["']?(https?:\/\/[^"'\s<>()[\]{}]+)/gi
];

/**
 * Extract all URLs from a JSON object
 */
function extractUrlsFromObject(obj, urls = new Set()) {
    if (typeof obj === 'string') {
        // Apply all URL patterns to string values
        URL_PATTERNS.forEach(pattern => {
            const matches = obj.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    // Clean up the URL (remove quotes, etc.)
                    let cleanUrl = match.replace(/^["']|["']$/g, '');
                    if (cleanUrl.match(/^https?:\/\//)) {
                        urls.add(cleanUrl);
                    }
                });
            }
        });
    } else if (Array.isArray(obj)) {
        obj.forEach(item => extractUrlsFromObject(item, urls));
    } else if (obj && typeof obj === 'object') {
        Object.values(obj).forEach(value => extractUrlsFromObject(value, urls));
    }
    
    return urls;
}

/**
 * Check HTTP status of a URL
 */
function checkUrl(url) {
    return new Promise((resolve) => {
        try {
            const urlObj = new URL(url);
            const isHttps = urlObj.protocol === 'https:';
            const client = isHttps ? https : http;
            
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (isHttps ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: 'HEAD',
                timeout: TIMEOUT_MS,
                headers: {
                    'User-Agent': USER_AGENT,
                    'Accept': '*/*'
                }
            };
            
            const req = client.request(options, (res) => {
                resolve({
                    url: url,
                    status: res.statusCode,
                    statusText: res.statusMessage,
                    success: res.statusCode >= 200 && res.statusCode < 400,
                    redirect: res.statusCode >= 300 && res.statusCode < 400,
                    location: res.headers.location || null
                });
            });
            
            req.on('timeout', () => {
                req.destroy();
                resolve({
                    url: url,
                    status: null,
                    statusText: 'Request timeout',
                    success: false,
                    redirect: false,
                    timeout: true
                });
            });
            
            req.on('error', (error) => {
                resolve({
                    url: url,
                    status: null,
                    statusText: error.message,
                    success: false,
                    redirect: false,
                    error: true
                });
            });
            
            req.end();
        } catch (error) {
            resolve({
                url: url,
                status: null,
                statusText: error.message,
                success: false,
                redirect: false,
                error: true
            });
        }
    });
}

/**
 * Process URLs in batches to avoid overwhelming servers
 */
async function checkUrlsBatch(urls) {
    const results = [];
    const urlArray = Array.from(urls);
    
    for (let i = 0; i < urlArray.length; i += MAX_CONCURRENT) {
        const batch = urlArray.slice(i, i + MAX_CONCURRENT);
        const batchPromises = batch.map(url => checkUrl(url));
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Add delay between batches to be respectful
        if (i + MAX_CONCURRENT < urlArray.length) {
            await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
        }
    }
    
    return results;
}

/**
 * Get all intent JSON files (excluding usersays files)
 */
function getIntentFiles() {
    try {
        const files = fs.readdirSync(INTENTS_DIR);
        return files
            .filter(file => file.endsWith('.json'))
            .filter(file => !file.includes('usersays'))
            .map(file => path.join(INTENTS_DIR, file));
    } catch (error) {
        console.error(`${colors.red}Error reading intents directory: ${error.message}${colors.reset}`);
        process.exit(1);
    }
}

/**
 * Main execution function
 */
async function main() {
    console.log(`${colors.bold}${colors.blue}Dialogflow Intent URL Validator${colors.reset}`);
    console.log('='.repeat(50));
    console.log();
    
    // Get intent files
    const intentFiles = getIntentFiles();
    console.log(`📂 Found ${intentFiles.length} intent files to scan`);
    
    // Extract URLs from all intent files
    const allUrls = new Set();
    const fileResults = {};
    
    console.log(`${colors.cyan}🔍 Extracting URLs from intent files...${colors.reset}`);
    
    for (const filePath of intentFiles) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const intentData = JSON.parse(content);
            const fileUrls = extractUrlsFromObject(intentData);
            
            if (fileUrls.size > 0) {
                fileResults[path.basename(filePath)] = Array.from(fileUrls);
                fileUrls.forEach(url => allUrls.add(url));
                console.log(`  📄 ${path.basename(filePath)}: ${fileUrls.size} URLs`);
            }
        } catch (error) {
            console.error(`  ${colors.red}❌ Error processing ${path.basename(filePath)}: ${error.message}${colors.reset}`);
        }
    }
    
    if (allUrls.size === 0) {
        console.log(`${colors.yellow}⚠️  No URLs found in intent files${colors.reset}`);
        return;
    }
    
    console.log();
    console.log(`${colors.cyan}🌐 Found ${allUrls.size} unique URLs to validate${colors.reset}`);
    console.log();
    
    // Check all URLs
    console.log(`${colors.cyan}🔗 Validating URLs...${colors.reset}`);
    const results = await checkUrlsBatch(allUrls);
    
    // Analyze results
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const redirects = results.filter(r => r.redirect);
    
    console.log();
    console.log(`${colors.bold}📊 Results Summary${colors.reset}`);
    console.log('='.repeat(30));
    console.log(`Total URLs: ${results.length}`);
    console.log(`${colors.green}✅ Successful: ${successful.length} (${Math.round(successful.length/results.length*100)}%)${colors.reset}`);
    console.log(`${colors.yellow}🔄 Redirects: ${redirects.length}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${failed.length} (${Math.round(failed.length/results.length*100)}%)${colors.reset}`);
    
    if (failed.length > 0) {
        console.log();
        console.log(`${colors.bold}${colors.red}Failed URLs:${colors.reset}`);
        console.log('-'.repeat(50));
        failed.forEach(result => {
            console.log(`${colors.red}❌ ${result.url}${colors.reset}`);
            if (result.status) {
                console.log(`   Status: ${result.status} ${result.statusText}`);
            } else {
                console.log(`   Error: ${result.statusText}`);
            }
            if (result.timeout) console.log(`   ${colors.yellow}⏱️  Request timeout${colors.reset}`);
            console.log();
        });
    }
    
    if (redirects.length > 0) {
        console.log();
        console.log(`${colors.bold}${colors.yellow}Redirect URLs:${colors.reset}`);
        console.log('-'.repeat(50));
        redirects.forEach(result => {
            console.log(`${colors.yellow}🔄 ${result.url}${colors.reset}`);
            console.log(`   Status: ${result.status} ${result.statusText}`);
            if (result.location) {
                console.log(`   Redirects to: ${result.location}`);
            }
            console.log();
        });
    }
    
    // Show which files contain URLs
    if (Object.keys(fileResults).length > 0) {
        console.log();
        console.log(`${colors.bold}📁 URLs by Intent File:${colors.reset}`);
        console.log('-'.repeat(50));
        Object.entries(fileResults).forEach(([filename, urls]) => {
            console.log(`${colors.cyan}📄 ${filename}:${colors.reset}`);
            urls.forEach(url => {
                const result = results.find(r => r.url === url);
                const status = result.success ? `${colors.green}✅` : `${colors.red}❌`;
                const code = result.status ? ` (${result.status})` : '';
                console.log(`  ${status} ${url}${code}${colors.reset}`);
            });
            console.log();
        });
    }
    
    // Exit with appropriate code
    if (failed.length > 0) {
        console.log(`${colors.red}❌ URL validation failed - ${failed.length} URLs are not accessible${colors.reset}`);
        process.exit(1);
    } else {
        console.log(`${colors.green}✅ All URLs are accessible!${colors.reset}`);
        process.exit(0);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log(`\n${colors.yellow}⚠️  URL validation interrupted${colors.reset}`);
    process.exit(130);
});

process.on('unhandledRejection', (error) => {
    console.error(`${colors.red}❌ Unhandled error: ${error.message}${colors.reset}`);
    process.exit(1);
});

// Run the script
if (require.main === module) {
    main().catch(error => {
        console.error(`${colors.red}❌ Script failed: ${error.message}${colors.reset}`);
        process.exit(1);
    });
}

module.exports = { extractUrlsFromObject, checkUrl, checkUrlsBatch };