// fastapi-diagnostic.js - Comprehensive FastAPI connection test
// Run with: node fastapi-diagnostic.js

const http = require('http');

const HOSTS_TO_TEST = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0'
];

const PORT = 8000;

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(color, icon, message) {
  console.log(`${colors[color]}${icon} ${message}${colors.reset}`);
}

async function testConnection(host, endpoint = '/api/health') {
  return new Promise((resolve) => {
    const url = `http://${host}:${PORT}${endpoint}`;
    
    const req = http.get(url, { timeout: 3000 }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            success: true,
            status: res.statusCode,
            host,
            endpoint,
            data: json
          });
        } catch (e) {
          resolve({
            success: false,
            host,
            endpoint,
            error: 'Invalid JSON response',
            rawData: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        success: false,
        host,
        endpoint,
        error: error.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        host,
        endpoint,
        error: 'Connection timeout (3s)'
      });
    });
  });
}

async function testPostEndpoint(host, endpoint) {
  return new Promise((resolve) => {
    const url = `http://${host}:${PORT}${endpoint}`;
    const payload = JSON.stringify({
      location: 'remote',
      keywords: ['test'],
      debug: true,
      headless: true,
      skip_captcha: true,
      max_results: 1
    });
    
    const options = {
      hostname: host,
      port: PORT,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 3000
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          success: res.statusCode < 500,
          status: res.statusCode,
          host,
          endpoint,
          response: data.substring(0, 200)
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        success: false,
        host,
        endpoint,
        error: error.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        host,
        endpoint,
        error: 'Timeout'
      });
    });
    
    req.write(payload);
    req.end();
  });
}

async function runDiagnostics() {
  console.log('\n' + '='.repeat(60));
  log('magenta', '🔍', 'FastAPI Connection Diagnostic Tool');
  console.log('='.repeat(60) + '\n');
  
  // Test 1: Health endpoint on all hosts
  log('cyan', '📋', 'Test 1: Health Endpoint Check');
  console.log('-'.repeat(60));
  
  for (const host of HOSTS_TO_TEST) {
    const result = await testConnection(host, '/api/health');
    
    if (result.success) {
      log('green', '✅', `${host}:${PORT}/api/health - OK (${result.status})`);
      console.log(`   Available scrapers: ${result.data.available_scrapers?.length || 0}`);
      console.log(`   Status: ${result.data.status}`);
    } else {
      log('red', '❌', `${host}:${PORT}/api/health - FAILED`);
      console.log(`   Error: ${result.error}`);
    }
  }
  
  console.log('\n' + '-'.repeat(60) + '\n');
  
  // Test 2: Find working host
  log('cyan', '📋', 'Test 2: Finding Working Host');
  console.log('-'.repeat(60));
  
  let workingHost = null;
  for (const host of HOSTS_TO_TEST) {
    const result = await testConnection(host);
    if (result.success) {
      workingHost = host;
      log('green', '✅', `Working host found: ${host}`);
      break;
    }
  }
  
  if (!workingHost) {
    log('red', '❌', 'No working host found!');
    console.log('\n💡 Troubleshooting steps:');
    console.log('   1. Check if FastAPI is running: ps aux | grep python');
    console.log('   2. Verify port: netstat -an | grep 8000');
    console.log('   3. Check firewall settings');
    console.log('   4. Try restarting FastAPI server\n');
    return;
  }
  
  console.log('\n' + '-'.repeat(60) + '\n');
  
  // Test 3: Scraper endpoints
  log('cyan', '📋', 'Test 3: Testing Scraper Endpoints');
  console.log('-'.repeat(60));
  
  const endpoints = [
    '/api/scrapers/snag-playwright/run',
    '/scrapers/snag-playwright/run',
    '/api/scrapers/snagajob/run',
  ];
  
  let foundEndpoint = null;
  for (const endpoint of endpoints) {
    const result = await testPostEndpoint(workingHost, endpoint);
    
    if (result.success) {
      log('green', '✅', `${endpoint} - Found! (${result.status})`);
      foundEndpoint = endpoint;
      break;
    } else if (result.status === 404) {
      log('yellow', '⚠️', `${endpoint} - Not Found (404)`);
    } else {
      log('red', '❌', `${endpoint} - Error: ${result.error || result.status}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  log('magenta', '📊', 'DIAGNOSTIC RESULTS');
  console.log('='.repeat(60));
  
  if (workingHost && foundEndpoint) {
    log('green', '✅', 'FastAPI connection successful!');
    console.log(`\n✨ Use this configuration in your Next.js app:\n`);
    log('cyan', '📝', `NEXT_PUBLIC_FASTAPI_URL=http://${workingHost}:${PORT}`);
    log('cyan', '📝', `Endpoint: ${foundEndpoint}`);
    
    console.log('\n💡 Update your Next.js route.ts file:');
    console.log(`   const fastApiUrl = \`http://${workingHost}:${PORT}${foundEndpoint}\`;`);
  } else if (workingHost && !foundEndpoint) {
    log('yellow', '⚠️', 'FastAPI is running but scraper endpoint not found');
    console.log(`\n📚 Check FastAPI docs at: http://${workingHost}:${PORT}/docs`);
    console.log('   Look for the correct endpoint path\n');
  } else {
    log('red', '❌', 'Cannot connect to FastAPI server');
    console.log('\n🔧 Check if FastAPI is running on port 8000\n');
  }
  
  console.log('='.repeat(60) + '\n');
}

// Run the diagnostics
runDiagnostics().catch(console.error);

// Export for use in other modules
module.exports = { testConnection, HOSTS_TO_TEST, PORT };