"use client"
import { useState, useEffect } from 'react';
import type { DashboardStatsProps, Job } from '@/types/user/index';
import type { AdminUser } from '@/types/admin/admin_authuser';

export function useAdminData() {
  const [stats, setStats] = useState<DashboardStatsProps | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchJobs = async (page = 1, search = '', status = 'all') => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        ...(search && { search }),
        ...(status !== 'all' && { status })
      });
      
      const response = await fetch(`/api/admin/jobs?${params}`);
      const data = await response.json();
      setJobs(data.jobs);
      return data;
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const deleteJob = async (jobId: string) => {
    try {
      await fetch(`/api/admin/jobs/${jobId}`, { method: 'DELETE' });
      setJobs(prev => prev.filter(job => job.id !== jobId));
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  useEffect(() => {
    Promise.all([fetchStats(), fetchJobs()]).finally(() => setLoading(false));
  }, []);

  return {
    stats,
    jobs,
    users,
    loading,
    fetchStats,
    fetchJobs,
    deleteJob,
    refetch: () => Promise.all([fetchStats(), fetchJobs()])
  };
}