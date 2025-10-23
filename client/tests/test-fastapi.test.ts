
export {}; 
type HealthResponse = {
  available_scrapers: string[];
};

type ScraperRequestPayload = {
  location: string;
  keywords: string[];
  debug: boolean;
  headless: boolean;
  skip_captcha: boolean;
  max_results: number;
};

type ScraperResponse = Record<string, unknown>;

const FASTAPI_URL = 'http://127.0.0.1:8000';

async function testFastAPIEndpoint(): Promise<void> {
  console.log('🔍 Testing FastAPI endpoints...\n');

  // Test 1: Health check
  try {
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${FASTAPI_URL}/api/health`);
    console.log(`   Status: ${healthResponse.status}`);

    if (healthResponse.ok) {
      const data: HealthResponse = await healthResponse.json();
      console.log('   ✅ Health check passed');
      console.log('   Available scrapers:', data.available_scrapers);
    } else {
      console.log('   ❌ Health check failed');
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.log('   ❌ Error:', message);
  }

  console.log('\n');

  // Test 2: Try different endpoint paths
  const endpoints: string[] = [
    '/scrapers/snag-playwright/run',
    '/api/scrapers/snag-playwright/run',
    '/scrapers/snagajob/run',
  ];

  const payload: ScraperRequestPayload = {
    location: 'remote',
    keywords: ['test'],
    debug: true,
    headless: true,
    skip_captcha: true,
    max_results: 1,
  };

  for (const endpoint of endpoints) {
    try {
      console.log(`2️⃣ Testing: ${FASTAPI_URL}${endpoint}`);
      const response = await fetch(`${FASTAPI_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log(`   Status: ${response.status}`);

      if (response.ok) {
        console.log('   ✅ Endpoint found!');
        const data: ScraperResponse = await response.json();
        console.log('   Response:', data);
        break;
      } else if (response.status === 404) {
        console.log('   ❌ Not found (404)');
      } else {
        console.log('   ⚠️ Got response:', response.statusText);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.log('   ❌ Error:', message);
    }

    console.log('');
  }

  console.log('\n3️⃣ Check your FastAPI docs at: http://localhost:8000/docs');
}

// Run the test
testFastAPIEndpoint();





