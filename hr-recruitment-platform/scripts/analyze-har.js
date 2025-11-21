#!/usr/bin/env node

/**
 * HAR File Error Analyzer
 * Parses a HAR file and extracts all HTTP errors
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Get HAR file path from command line argument
const harFilePath = process.argv[2] || '/Users/valentinechideme/Downloads/ringsteadcare-mruz.vercel.app.har';

if (!fs.existsSync(harFilePath)) {
    console.error(`❌ Error: HAR file not found at ${harFilePath}`);
    process.exit(1);
}

console.log(`📊 Analyzing HAR file: ${path.basename(harFilePath)}\n`);

try {
    // Read and parse HAR file
    const harContent = fs.readFileSync(harFilePath, 'utf8');
    const harData = JSON.parse(harContent);

    const entries = harData.log.entries;

    // Categorize errors
    const errors = {
        clientErrors: [], // 4xx
        serverErrors: [], // 5xx
        corsErrors: [],
        failedRequests: [],
        slowRequests: []
    };

    // Analyze each request
    entries.forEach((entry, index) => {
        const { request, response, time } = entry;
        const status = response.status;
        const url = request.url;
        const method = request.method;

        // Check for errors
        if (status >= 400 && status < 500) {
            errors.clientErrors.push({
                index: index + 1,
                method,
                url,
                status,
                statusText: response.statusText,
                time: Math.round(time)
            });
        }

        if (status >= 500) {
            errors.serverErrors.push({
                index: index + 1,
                method,
                url,
                status,
                statusText: response.statusText,
                time: Math.round(time)
            });
        }

        // Check for CORS errors
        const corsHeader = response.headers.find(h =>
            h.name.toLowerCase() === 'access-control-allow-origin'
        );
        if (!corsHeader && url.includes('supabase.co/functions')) {
            errors.corsErrors.push({
                index: index + 1,
                method,
                url,
                status
            });
        }

        // Check for failed requests (status 0 or no response)
        if (status === 0 || !response) {
            errors.failedRequests.push({
                index: index + 1,
                method,
                url,
                error: 'Request failed or blocked'
            });
        }

        // Check for slow requests (> 3 seconds)
        if (time > 3000) {
            errors.slowRequests.push({
                index: index + 1,
                method,
                url,
                time: Math.round(time),
                status
            });
        }
    });

    // Print summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                    ERROR SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`Total Requests: ${entries.length}`);
    console.log(`Client Errors (4xx): ${errors.clientErrors.length}`);
    console.log(`Server Errors (5xx): ${errors.serverErrors.length}`);
    console.log(`CORS Errors: ${errors.corsErrors.length}`);
    console.log(`Failed Requests: ${errors.failedRequests.length}`);
    console.log(`Slow Requests (>3s): ${errors.slowRequests.length}\n`);

    // Print detailed errors
    if (errors.clientErrors.length > 0) {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🔴 CLIENT ERRORS (4xx)');
        console.log('═══════════════════════════════════════════════════════════\n');

        errors.clientErrors.forEach(err => {
            console.log(`[${err.index}] ${err.status} ${err.statusText}`);
            console.log(`    ${err.method} ${err.url}`);
            console.log(`    Time: ${err.time}ms\n`);
        });
    }

    if (errors.serverErrors.length > 0) {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🔴 SERVER ERRORS (5xx)');
        console.log('═══════════════════════════════════════════════════════════\n');

        errors.serverErrors.forEach(err => {
            console.log(`[${err.index}] ${err.status} ${err.statusText}`);
            console.log(`    ${err.method} ${err.url}`);
            console.log(`    Time: ${err.time}ms\n`);
        });
    }

    if (errors.corsErrors.length > 0) {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🔴 CORS ERRORS');
        console.log('═══════════════════════════════════════════════════════════\n');

        errors.corsErrors.forEach(err => {
            console.log(`[${err.index}] ${err.method} ${err.url}`);
            console.log(`    Status: ${err.status}\n`);
        });
    }

    if (errors.failedRequests.length > 0) {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('🔴 FAILED REQUESTS');
        console.log('═══════════════════════════════════════════════════════════\n');

        errors.failedRequests.forEach(err => {
            console.log(`[${err.index}] ${err.method} ${err.url}`);
            console.log(`    Error: ${err.error}\n`);
        });
    }

    if (errors.slowRequests.length > 0) {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('⚠️  SLOW REQUESTS (>3s)');
        console.log('═══════════════════════════════════════════════════════════\n');

        errors.slowRequests.forEach(err => {
            console.log(`[${err.index}] ${err.method} ${err.url}`);
            console.log(`    Time: ${err.time}ms | Status: ${err.status}\n`);
        });
    }

    // Extract unique error patterns
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 UNIQUE ERROR PATTERNS');
    console.log('═══════════════════════════════════════════════════════════\n');

    const errorPatterns = new Map();

    [...errors.clientErrors, ...errors.serverErrors].forEach(err => {
        const pattern = `${err.status} - ${err.url.split('?')[0]}`;
        errorPatterns.set(pattern, (errorPatterns.get(pattern) || 0) + 1);
    });

    Array.from(errorPatterns.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([pattern, count]) => {
            console.log(`${count}x - ${pattern}`);
        });

    console.log('\n═══════════════════════════════════════════════════════════\n');

    // Recommendations
    console.log('💡 RECOMMENDATIONS:\n');

    if (errors.clientErrors.some(e => e.status === 404)) {
        console.log('• Fix 404 errors by creating missing database tables');
        console.log('  Run: migrations/add_automation_and_settings_tables.sql\n');
    }

    if (errors.corsErrors.length > 0) {
        console.log('• Fix CORS errors by ensuring Supabase functions return proper headers');
        console.log('  Check that automation-engine function has required tables\n');
    }

    if (errors.slowRequests.length > 0) {
        console.log('• Optimize slow requests by adding indexes or caching\n');
    }

} catch (error) {
    console.error('❌ Error parsing HAR file:', error.message);
    process.exit(1);
}
