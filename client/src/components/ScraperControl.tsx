'use client'
import { useState } from 'react'

export function ScraperControl() {
  const [loading, setLoading] = useState(false)
  const [location, setLocation] = useState('Austin, TX')
  const [days, setDays] = useState(7)
  const [status, setStatus] = useState<any>(null)

  const triggerScraper = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/scraper/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, days })
      })
      const data = await res.json()
      setStatus(data)
    } catch (error) {
      setStatus({ error: 'Failed to trigger scraper' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Job Scraper Control</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border rounded"
            placeholder="Austin, TX"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Days Back</label>
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded"
            min="1"
            max="30"
          />
        </div>
        
        <button
          onClick={triggerScraper}
          disabled={loading}
          className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          {loading ? 'Scraping...' : 'Start Scraping'}
        </button>
        
        {status && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <pre className="text-sm">{JSON.stringify(status, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
