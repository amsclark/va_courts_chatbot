#!/usr/bin/env node

const https = require('https');
const http = require('http');
const { URL } = require('url');
const fs = require('fs');

// Extract URLs from the markdown audit file
function extractUrlsFromAudit() {
    const auditContent = fs.readFileSync('payload_links_audit.md', 'utf8');
    const urls = new Set();
    
    // Match URLs in the markdown table format
    const urlMatches = auditContent.match(/https?:\/\/[^\s\|]+/g);
    if (urlMatches) {
        urlMatches.forEach(url => {
            // Clean up any trailing characters
            const cleanUrl = url.replace(/\s+$/, '');
            urls.add(cleanUrl);
        });
    }
    
    return Array.from(urls);
}

// Check HTTP status of a URL
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
                method: 'HEAD', // Use HEAD to avoid downloading full content
                timeout: 10000, // 10 second timeout
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; URL-Checker/1.0)'
                }
            };
            
            const req = client.request(options, (res) => {
                resolve({
                    url: url,
                    status: res.statusCode,
                    statusText: res.statusMessage,
                    success: res.statusCode >= 200 && res.statusCode < 400,
                    redirected: res.statusCode >= 300 && res.statusCode < 400,
                    finalUrl: res.headers.location || url
                });
            });
            
            req.on('error', (err) => {
                resolve({
                    url: url,
                    status: null,
                    statusText: err.message,
                    success: false,
                    error: true
                });
            });
            
            req.on('timeout', () => {
                req.destroy();
                resolve({
                    url: url,
                    status: null,
                    statusText: 'Request timeout',
                    success: false,
                    timeout: true
                });
            });
            
            req.end();
            
        } catch (err) {
            resolve({
                url: url,
                status: null,
                statusText: err.message,
                success: false,
                error: true
            });
        }
    });
}

// Main execution
async function main() {
    console.log('Virginia Courts Chatbot - URL Status Checker');
    console.log('=' .repeat(50));
    console.log();
    
    const urls = extractUrlsFromAudit();
    console.log(`Found ${urls.length} unique URLs to check\n`);
    
    const results = [];
    const failedUrls = [];
    let successCount = 0;
    let redirectCount = 0;
    
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        process.stdout.write(`Checking ${i + 1}/${urls.length}: ${url.substring(0, 60)}${url.length > 60 ? '...' : ''} `);
        
        const result = await checkUrl(url);
        results.push(result);
        
        if (result.success) {
            if (result.redirected) {
                console.log(`✓ REDIRECT (${result.status})`);
                redirectCount++;
            } else {
                console.log(`✓ OK (${result.status})`);
            }
            successCount++;
        } else {
            console.log(`✗ FAILED (${result.status || 'ERROR'})`);
            failedUrls.push(result);
        }
    }
    
    console.log();
    console.log('Summary:');
    console.log('-'.repeat(50));
    console.log(`Total URLs checked: ${urls.length}`);
    console.log(`Successful: ${successCount} (${Math.round(successCount/urls.length*100)}%)`);
    console.log(`Redirects: ${redirectCount}`);
    console.log(`Failed: ${failedUrls.length} (${Math.round(failedUrls.length/urls.length*100)}%)`);
    
    if (failedUrls.length > 0) {
        console.log();
        console.log('Failed URLs:');
        console.log('-'.repeat(50));
        failedUrls.forEach(result => {
            console.log(`❌ ${result.url}`);
            console.log(`   Status: ${result.status || 'N/A'}`);
            console.log(`   Error: ${result.statusText}`);
            if (result.timeout) console.log('   Issue: Request timeout');
            if (result.error) console.log('   Issue: Connection error');
            console.log();
        });
    }
    
    // Create detailed report file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportContent = {
        timestamp: new Date().toISOString(),
        summary: {
            totalUrls: urls.length,
            successful: successCount,
            failed: failedUrls.length,
            redirects: redirectCount,
            successRate: Math.round(successCount/urls.length*100)
        },
        results: results,
        failedUrls: failedUrls
    };
    
    const reportFilename = `url_status_report_${timestamp}.json`;
    fs.writeFileSync(reportFilename, JSON.stringify(reportContent, null, 2));
    console.log(`Detailed report saved to: ${reportFilename}`);
    
    process.exit(failedUrls.length > 0 ? 1 : 0);
}

main().catch(console.error);
