'use client'
'use client'
import { useState, useEffect } from 'react'
import { Search, Bookmark, ExternalLink, MapPin, Building2, DollarSign, Clock, Heart, Send } from 'lucide-react'

type Job = {
  id: string
  title: string
  company?: string
  location?: string
  url?: string
  description?: string
  salary?: string
  posted?: string
}

type SavedJob = {
  id: string
  job_id: string
  user_id: string
  saved_at: string
  notes?: string
}

type Application = {
  id: string
  job_id: string
  user_id: string
  applied_at: string
  status: 'pending' | 'reviewing' | 'rejected' | 'accepted'
}

export default function OrgUserDashboard() {
  const [activeTab, setActiveTab] = useState<'search' | 'saved' | 'applied'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [location, setLocation] = useState('Austin, TX')
  const [results, setResults] = useState<Job[]>([])
  const [savedJobs, setSavedJobs] = useState<string[]>([])
  const [appliedJobs, setAppliedJobs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userName, setUserName] = useState('User')

  // Load saved/applied jobs from memory on mount
  useEffect(() => {
    const saved = JSON.parse(sessionStorage.getItem('savedJobs') || '[]')
    const applied = JSON.parse(sessionStorage.getItem('appliedJobs') || '[]')
    setSavedJobs(saved)
    setAppliedJobs(applied)
  }, [])

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
      const data = await response.json()
      setResults(data.jobs || data || [])
    } catch (err: any) {
      setError(err?.message ?? 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleSaveJob = (jobId: string) => {
    const newSaved = savedJobs.includes(jobId)
      ? savedJobs.filter(id => id !== jobId)
      : [...savedJobs, jobId]
    
    setSavedJobs(newSaved)
    sessionStorage.setItem('savedJobs', JSON.stringify(newSaved))
  }

  const handleApplyJob = async (jobId: string) => {
    if (appliedJobs.includes(jobId)) {
      alert('You have already applied to this job!')
      return
    }

    const confirmed = window.confirm('Are you sure you want to apply to this job?')
    if (!confirmed) return

    const newApplied = [...appliedJobs, jobId]
    setAppliedJobs(newApplied)
    sessionStorage.setItem('appliedJobs', JSON.stringify(newApplied))
    
    // TODO: In real implementation, send to backend
    // await fetch('/api/applications', { method: 'POST', body: JSON.stringify({ jobId }) })
  }

  const getSavedJobsList = () => {
    return results.filter(job => savedJobs.includes(job.id))
  }

  const getAppliedJobsList = () => {
    return results.filter(job => appliedJobs.includes(job.id))
  }

  const JobCard = ({ job }: { job: Job }) => {
    const isSaved = savedJobs.includes(job.id)
    const isApplied = appliedJobs.includes(job.id)

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-1">{job.title}</h3>
            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              {job.company && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {job.company}
                </span>
              )}
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {job.location}
                </span>
              )}
              {job.salary && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {job.salary}
                </span>
              )}
              {job.posted && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {job.posted}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSaveJob(job.id)}
              className={`p-2 rounded-lg transition ${
                isSaved
                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
              title={isSaved ? 'Remove from saved' : 'Save job'}
            >
              <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {job.description && (
          <p className="text-sm text-gray-700 mb-4">
            {job.description.length > 200
              ? job.description.substring(0, 200) + '…'
              : job.description}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => handleApplyJob(job.id)}
            disabled={isApplied}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              isApplied
                ? 'bg-green-50 text-green-700 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Send className="w-4 h-4" />
            {isApplied ? 'Applied' : 'Apply Now'}
          </button>
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
            >
              <ExternalLink className="w-4 h-4" />
              View Details
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Job Search Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {userName}</p>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="bg-blue-50 px-4 py-2 rounded-lg">
                <span className="text-gray-600">Saved:</span>
                <span className="ml-2 font-semibold text-blue-600">{savedJobs.length}</span>
              </div>
              <div className="bg-green-50 px-4 py-2 rounded-lg">
                <span className="text-gray-600">Applied:</span>
                <span className="ml-2 font-semibold text-green-600">{appliedJobs.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('search')}
              className={`py-4 px-2 border-b-2 font-medium transition ${
                activeTab === 'search'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Search className="w-5 h-5 inline mr-2" />
              Search Jobs
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`py-4 px-2 border-b-2 font-medium transition ${
                activeTab === 'saved'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Bookmark className="w-5 h-5 inline mr-2" />
              Saved Jobs ({savedJobs.length})
            </button>
            <button
              onClick={() => setActiveTab('applied')}
              className={`py-4 px-2 border-b-2 font-medium transition ${
                activeTab === 'applied'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Send className="w-5 h-5 inline mr-2" />
              Applications ({appliedJobs.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Tab */}
        {activeTab === 'search' && (
          <div>
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  className="col-span-2 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search jobs (e.g., Software Engineer)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <input
                  className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="bg-blue-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Searching…' : 'Search'}
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-6 text-red-700 bg-red-50 border border-red-200 rounded-lg p-4">
                <strong>Error:</strong> {error}
              </div>
            )}

            {!loading && results.length === 0 && !error && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No results yet — start your search above</p>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Searching for jobs...</p>
              </div>
            )}

            <div className="space-y-4">
              {results.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </div>
        )}

        {/* Saved Jobs Tab */}
        {activeTab === 'saved' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Saved Jobs</h2>
            {getSavedJobsList().length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-2">No saved jobs yet</p>
                <p className="text-gray-500 text-sm">Click the heart icon on any job to save it</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getSavedJobsList().map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applied' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Applications</h2>
            {getAppliedJobsList().length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <Send className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-2">No applications yet</p>
                <p className="text-gray-500 text-sm">Apply to jobs to track your applications here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getAppliedJobsList().map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
// import { useState } from 'react'

// type Job = {
//   id: string
//   title: string
//   company?: string
//   location?: string
//   url?: string
//   description?: string
// }

// export default function JobSearchPage() {
//   const [searchQuery, setSearchQuery] = useState('')
//   const [location, setLocation] = useState('Austin, TX')
//   const [results, setResults] = useState<Job[]>([])
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)

//   const handleSearch = async () => {
//     setLoading(true)
//     setError(null)
//     try {
//       const response = await fetch('/api/search', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           query: searchQuery,
//           location,
//           days: 7,
//         }),
//       })
//       if (!response.ok) {
//         throw new Error(`HTTP ${response.status}`)
//       }
//       const jobs: Job[] = await response.json()
//       setResults(jobs || [])
//     } catch (err: any) {
//       setError(err?.message ?? 'Search failed')
//       setResults([])
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 p-8">
//       <div className="max-w-6xl mx-auto">
//         <h1 className="text-3xl font-bold mb-6">Job Search</h1>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
//           <input
//             className="border rounded px-3 py-2"
//             placeholder="Search (e.g., Python developer)"
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//           />
//           <input
//             className="border rounded px-3 py-2"
//             placeholder="Location"
//             value={location}
//             onChange={(e) => setLocation(e.target.value)}
//           />
//           <button
//             onClick={handleSearch}
//             disabled={loading}
//             className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-60"
//           >
//             {loading ? 'Searching…' : 'Search'}
//           </button>
//         </div>

//         {error && (
//           <div className="mb-4 text-red-700 bg-red-100 border border-red-200 rounded p-3">
//             {error}
//           </div>
//         )}

//         {!loading && results.length === 0 && !error && (
//           <p className="text-gray-600">No results yet — try a search.</p>
//         )}

//         <ul className="space-y-3">
//           {results.map((job) => (
//             <li key={job.id} className="bg-white rounded border p-4">
//               <div className="flex items-center justify-between gap-4">
//                 <div>
//                   <h2 className="font-semibold text-lg">{job.title}</h2>
//                   <p className="text-sm text-gray-600">
//                     {job.company ?? 'Unknown company'} • {job.location ?? 'Remote/Unknown'}
//                   </p>
//                 </div>
//                 {job.url && (
//                   <a
//                     href={job.url}
//                     target="_blank"
//                     rel="noreferrer"
//                     className="text-blue-600 underline"
//                   >
//                     View
//                   </a>
//                 )}
//               </div>
//               {job.description && (
//                 <p className="mt-2 text-sm text-gray-700">
//                   {job.description.length > 200
//                     ? job.description.substring(0, 200) + '…'
//                     : job.description}
//                 </p>
//               )}
//             </li>
//           ))}
//         </ul>
//       </div>
//     </div>
//   )
// }
