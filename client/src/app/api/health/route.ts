// app/api/health/route.ts

import { NextResponse } from 'next/server';

const FASTAPI_BASE_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export async function GET() {
  try {
    console.log('🏥 Health check: Pinging FastAPI...');
    
    const response = await fetch(`${FASTAPI_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`FastAPI health check failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ FastAPI is healthy:', data);

    return NextResponse.json({
      status: 'healthy',
      fastapi_status: data.status,
      available_scrapers: data.available_scrapers || [],
      running_scrapers: data.running_scrapers || 0,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}