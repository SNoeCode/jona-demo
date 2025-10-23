// quick-test.js - Test the exact endpoint
export {}; // Add this at the top of both test-fastapi.test.ts and scraper-integration.test.ts
const http = require('http');

const HOST = '127.0.0.1';
const PORT = 8000;

console.log('\n🧪 Testing FastAPI Snagajob Endpoint\n');
console.log('='.repeat(60));

// Test 1: Health Check
console.log('\n1️⃣ Testing Health Endpoint...');
testEndpoint('GET', '/api/health', null, (result) => {
  if (result.success) {
    console.log('✅ Health check passed');
    console.log('   Status:', result.data.status);
    console.log('   Available scrapers:', result.data.available_scrapers);
    
    // Test 2: Snagajob endpoint
    console.log('\n2️⃣ Testing Snagajob POST Endpoint...');
    
    const payload = {
      location: 'remote',
      keywords: ['software engineer'],
      debug: true,
      priority: 'medium',
      max_results: 1,
      headless: true,
      skip_captcha: true
    };
    
    testEndpoint('POST', '/api/scrapers/snag-playwright/run', payload, (result) => {
      console.log('\n' + '='.repeat(60));
      console.log('📊 RESULTS');
      console.log('='.repeat(60));
      
      if (result.success) {
        console.log('✅ SUCCESS - Endpoint is working!');
        console.log('\nResponse:', JSON.stringify(result.data, null, 2));
      } else {
        console.log('❌ FAILED');
        console.log('Status:', result.status);
        console.log('Error:', result.error);
        console.log('\nResponse:', result.rawData);
        
        // Additional troubleshooting
        console.log('\n🔍 Troubleshooting:');
        console.log('1. Check if the router is registered in main.py');
        console.log('2. Verify the endpoint path in your FastAPI docs');
        console.log('3. Check FastAPI server logs for errors');
      }
      console.log('='.repeat(60) + '\n');
    });
  } else {
    console.log('❌ Health check failed:', result.error);
    console.log('\n⚠️ FastAPI server may not be running on', `${HOST}:${PORT}`);
  }
});

function testEndpoint(method, path, payload, callback) {
  const options = {
    hostname: HOST,
    port: PORT,
    path: path,
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 5000
  };
  
  if (payload) {
    const jsonPayload = JSON.stringify(payload);
    options.headers['Content-Length'] = Buffer.byteLength(jsonPayload);
  }
  
  const req = http.request(options, (res) => {
    let data = '';
    
    console.log(`   ${method} ${HOST}:${PORT}${path}`);
    console.log(`   Status: ${res.statusCode}`);
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        callback({
          success: res.statusCode >= 200 && res.statusCode < 400,
          status: res.statusCode,
          data: json,
          rawData: data
        });
      } catch (e) {
        callback({
          success: false,
          status: res.statusCode,
          error: 'Invalid JSON response',
          rawData: data
        });
      }
    });
  });
  
  req.on('error', (error) => {
    callback({
      success: false,
      error: error.message,
      rawData: null
    });
  });
  
  req.on('timeout', () => {
    req.destroy();
    callback({
      success: false,
      error: 'Connection timeout (5s)',
      rawData: null
    });
  });
  
  if (payload) {
    req.write(JSON.stringify(payload));
  }
  
  req.end();
}