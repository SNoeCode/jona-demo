import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const response = await fetch(`${process.env.SCRAPER_API_URL}/status`, {
      headers: {
        'Authorization': `Bearer ${process.env.SCRAPER_SECRET_TOKEN}`
      }
    })
    
    const data = await response.json()
    return NextResponse.json(data)
} catch (error) {
  const message =
    error instanceof Error ? error.message : 'Unknown error occurred';
  return NextResponse.json({ status: 'offline', error: message }, { status: 500 });
}
}