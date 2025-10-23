import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { location, days, keywords } = body

    // Call your Python backend
    const response = await fetch(`${process.env.SCRAPER_API_URL}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SCRAPER_SECRET_TOKEN}`
      },
      body: JSON.stringify({ 
        location: location || 'Austin, TX',
        days: days || 7,
        keywords: keywords || []
      })
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Scraper error:', error)
    return NextResponse.json({ error: 'Scraping failed' }, { status: 500 })
  }
}
