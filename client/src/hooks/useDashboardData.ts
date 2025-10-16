
import { useState, useEffect } from 'react'
import { 
  JobApplication, 
  Resume, 
  Job, 
  UserSettings, 
  EnhancedUserProfile,
  UserDashboardStats 
} from '@/types/user/index'
import { JobService } from '@/services/user-services/job-service'
import { UserService } from '@/services/user-services/user-service'
import { ResumeService } from '@/services/user-services/resume-service'

import { getUsagePayload } from '@/services/user-services/usage-service'
import { getInitialUserDashboardStats } from '@/utils/dashboardStats'
import { getCurrentSubscription } from '@/app/actions/getCurrentSubscription'

export function useDashboardData(userId?: string) {
  const [stats, setStats] = useState<UserDashboardStats>(getInitialUserDashboardStats())
  const [enhancedUserProfile, setEnhancedUserProfile] = useState<EnhancedUserProfile | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [allJobs, setAllJobs] = useState<Job[]>([])
  const [userResumes, setUserResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchUserData = async () => {
      try {
        // Get job statistics
        const rawStats = await JobService.getJobStatistics(userId)
        
        const baseStats = {
          totalJobs: rawStats.total ?? 0,
          appliedJobs: rawStats.applied ?? 0,
          savedJobs: rawStats.saved ?? 0,
          pendingJobs: rawStats.pending ?? 0,
          interviewJobs: rawStats.interviews ?? 0,
          offerJobs: rawStats.offers ?? 0,
          rejectedJobs: rawStats.rejected ?? 0,
          matchRate: 0,
          matchScore: 0,
        }

        setStats({
          ...getInitialUserDashboardStats(),
          ...baseStats,
          totalResumes: 0,
          totalApplications: 0,
          avgMatchScore: 0,
        })

        // Fetch all data in parallel
        const [apps, jobs, resumes] = await Promise.all([
          UserService.getJobApplications(userId),
          JobService.getAllJobs(userId),
          ResumeService.getUserResumes(userId),
        ])

        setApplications(apps)
        setAllJobs(jobs)
        setUserResumes(resumes)

        const [profile, subscription, usage, userSettings] = await Promise.all([
          UserService.getUserProfile(userId),
         getCurrentSubscription(userId),
          getUsagePayload(),
          UserService.getUserSettings(userId),
        ])

        if (profile?.id) {
          setEnhancedUserProfile({
            ...profile,
            current_subscription: subscription ?? null,
            usage: usage ?? null,
          })
        }

        setSettings(
          userSettings ?? {
            id: userId,
            notification_push: true,
          }
        )
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [userId])

  return {
    stats,
    enhancedUserProfile,
    settings,
    applications,
    allJobs,
    userResumes,
    loading,
    refetch: () => {
      if (userId) {
        setLoading(true)
        // Re-run the effect
      }
    }
  }
}