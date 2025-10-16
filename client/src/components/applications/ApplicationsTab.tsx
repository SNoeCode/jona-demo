'use client'
import React, { useState, useMemo } from 'react';
import { useApplicationTracker } from '@/hooks/useApplicationTracker';
import { AuthUser } from '@/types/user';
import { 
  Calendar, 
  Building2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';

interface ApplicationsTabProps {
  user: AuthUser | null;
  darkMode?: boolean;
}

type StatusFilter = 'all' | 'pending' | 'success' | 'error';
type SortBy = 'date' | 'company' | 'title' | 'status';

export default function ApplicationsTab({ user, darkMode = false }: ApplicationsTabProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    submittedJobs,
    isLoading,
    error,
    refreshApplications,
    getStats
  } = useApplicationTracker(user?.id || '', user ?? undefined);

  const stats = getStats();

  // Filter and sort applications
  const filteredAndSortedApplications = useMemo(() => {
    let filtered = submittedJobs;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.job_title.toLowerCase().includes(query) ||
        app.company.toLowerCase().includes(query)
      );
    }

    // Sort applications
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime();
        case 'company':
          return a.company.localeCompare(b.company);
        case 'title':
          return a.job_title.localeCompare(b.job_title);
        case 'status':
          return (a.status || 'pending').localeCompare(b.status || 'pending');
        default:
          return 0;
      }
    });

    return filtered;
  }, [submittedJobs, statusFilter, searchQuery, sortBy]);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return darkMode ? 'text-green-400' : 'text-green-600';
      case 'error':
        return darkMode ? 'text-red-400' : 'text-red-600';
      default:
        return darkMode ? 'text-yellow-400' : 'text-yellow-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user?.id) {
    return (
      <div className={`p-8 text-center ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600'} rounded-lg`}>
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg">Please log in to view your applications.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-blue-50'} border ${darkMode ? 'border-gray-700' : 'border-blue-200'}`}>
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total</div>
        </div>
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-yellow-50'} border ${darkMode ? 'border-gray-700' : 'border-yellow-200'}`}>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pending</div>
        </div>
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-green-50'} border ${darkMode ? 'border-gray-700' : 'border-green-200'}`}>
          <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Successful</div>
        </div>
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-red-50'} border ${darkMode ? 'border-gray-700' : 'border-red-200'}`}>
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Failed</div>
        </div>
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-purple-50'} border ${darkMode ? 'border-gray-700' : 'border-purple-200'}`}>
          <div className="text-2xl font-bold text-purple-600">{stats.thisMonth}</div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>This Month</div>
        </div>
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-indigo-50'} border ${darkMode ? 'border-gray-700' : 'border-indigo-200'}`}>
          <div className="text-2xl font-bold text-indigo-600">{stats.thisWeek}</div>
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>This Week</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs or companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                darkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-black placeholder-gray-500'
              }`}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              darkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-black'
            }`}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="success">Successful</option>
            <option value="error">Failed</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              darkMode 
                ? 'bg-gray-800 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-black'
            }`}
          >
            <option value="date">Sort by Date</option>
            <option value="company">Sort by Company</option>
            <option value="title">Sort by Job Title</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>

        {/* Refresh Button */}
        <button
          onClick={refreshApplications}
          disabled={isLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : darkMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Applications List */}
      <div className={`border rounded-lg ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p>Loading applications...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <XCircle className="w-8 h-8 mx-auto mb-4" />
            <p>Error loading applications: {error}</p>
          </div>
        ) : filteredAndSortedApplications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-4" />
            <p>No applications found matching your criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAndSortedApplications.map((application) => (
              <div key={`${application.id}-${application.sentAt}`} className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{application.job_title}</h3>
                      {getStatusIcon(application.status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        <span>{application.company}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(application.sentAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)} ${
                        application.status === 'success' 
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : application.status === 'error'
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : 'bg-yellow-100 dark:bg-yellow-900/30'
                      }`}>
                        {(application.status || 'pending').charAt(0).toUpperCase() + (application.status || 'pending').slice(1)}
                      </span>
                      
                      {application.submittedTo && application.submittedTo.length > 0 && (
                        <span className="text-gray-500">
                          Submitted to: {application.submittedTo.join(', ')}
                        </span>
                      )}
                      
                      {application.resumeLength && (
                        <span className="text-gray-500">
                          Resume: {application.resumeLength} chars
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}