'use client'
import { useState } from 'react'

type Job = {
  id: string
  title: string
  company?: string
  location?: string
  url?: string
  description?: string
}

export default function JobSearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [location, setLocation] = useState('Austin, TX')
  const [results, setResults] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          location,
          days: 7,
        }),
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const jobs: Job[] = await response.json()
      setResults(jobs || [])
    } catch (err: any) {
      setError(err?.message ?? 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Job Search</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <input
            className="border rounded px-3 py-2"
            placeholder="Search (e.g., Python developer)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <input
            className="border rounded px-3 py-2"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-60"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>

        {error && (
          <div className="mb-4 text-red-700 bg-red-100 border border-red-200 rounded p-3">
            {error}
          </div>
        )}

        {!loading && results.length === 0 && !error && (
          <p className="text-gray-600">No results yet — try a search.</p>
        )}

        <ul className="space-y-3">
          {results.map((job) => (
            <li key={job.id} className="bg-white rounded border p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-lg">{job.title}</h2>
                  <p className="text-sm text-gray-600">
                    {job.company ?? 'Unknown company'} • {job.location ?? 'Remote/Unknown'}
                  </p>
                </div>
                {job.url && (
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                  >
                    View
                  </a>
                )}
              </div>
              {job.description && (
                <p className="mt-2 text-sm text-gray-700">
                  {job.description.length > 200
                    ? job.description.substring(0, 200) + '…'
                    : job.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
