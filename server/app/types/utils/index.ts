// services/index.ts
import type { AuthUser } from "@/types/index";
import { ResumeService } from "./resume-service";
import { JobService } from "./job-service";
import {MatchingService} from "./matching-service";
import { UserService } from "./user-service";
import { SubscriptionService } from "./subscription-service";
import { UsageService } from "./usage-service";
import { ProfileService } from "./profile-service";
import { ApplicationService } from "./application-service";

// Unified service registry for authenticated users
export const Service = {
  // Resumes
  uploadResume: ResumeService.uploadResume,
  getResumePublicUrl: ResumeService.getResumePublicUrl,
  insertResumeMetadata: ResumeService.insertResumeMetadata,
  getUserResumes: ResumeService.getUserResumes,
  buildResumeObject: ResumeService.buildResumeObject,
  getDefaultResume: ResumeService.getDefaultResume,
  updateResume: ResumeService.updateResume,

  // Jobs
  getAllJobs: JobService.getAllJobs,
  getFilteredJobs: JobService.getFilteredJobs,
  searchJobs: JobService.searchJobs,
  getJobStatistics: JobService.getJobStatistics,
  updateUserJobStatus: JobService.updateUserJobStatus,
  toggleSaved: JobService.toggleSaved,
  markAsApplied: JobService.markAsApplied,
  updateStatus: JobService.updateStatus,
  batchUpdateUserJobs: JobService.batchUpdateUserJobs,
  verifyConnection: JobService.verifyConnection,
  getJobCount: JobService.getJobCount,

   compareResume: MatchingService.compareResume,
  matchTopJobs:  MatchingService.matchTopJobs, 
    matchTopJobsWithOpenAI:  MatchingService.matchTopJobsWithOpenAI,
  getUserResumeSkills:  MatchingService.getUserResumeSkills,
  triggerAutoJobSearch:  MatchingService.triggerAutoJobSearch,
  getMatchingStats:  MatchingService.getMatchingStats,
  batchCompareJobs:  MatchingService.batchCompareJobs,
 
  updateUserProfile: UserService.updateUserProfile,
  getUserProfile: UserService.getUserProfile,
  createUserProfile: ProfileService.createUserProfile,
  getUserSettings: UserService.getUserSettings,
  getEnhancedUserProfile: UserService.getEnhancedUserProfile,


  getSubmittedJobs: UserService.getSubmittedJobs,
  getJobApplications: UserService.getJobApplications,
  getApplicationRecords: UserService.getApplicationRecords,
  getJobStats: UserService.getJobStats,
  getJobStatuses: UserService.getJobStatuses,
  // submitApplication: ApplicationService.submitApplication, // Add this

  getUserSubscription: SubscriptionService.getUserSubscription,
  cancelUserSubscription: SubscriptionService.cancelSubscription,
  getSubscriptionPlans: ProfileService.getSubscriptionPlans,
  getCurrentSubscription: SubscriptionService.getCurrentSubscription,
  createCheckoutSession: SubscriptionService.createCheckoutSession,
  cancelSubscription: SubscriptionService.cancelSubscription,

  // Usage
  getUserUsage: UsageService.getUserUsage,
  initializeUserUsage: UsageService.initializeUserUsage,
  updateUserUsage: UsageService.updateUserUsage,
  getUsagePayload: UsageService.getUsagePayload,
  checkUsageLimits: UsageService.checkUsageLimits,
  incrementUsage: UsageService.incrementUsage,

  // Payments
  getPaymentHistory: ProfileService.getPaymentHistory,
  updateSubscriptionProfile: ProfileService.updateUserProfile,
};

export {
  ResumeService,
  JobService,
  UserService,
MatchingService,
  SubscriptionService,
  UsageService,
  ProfileService,
  ApplicationService,
};
