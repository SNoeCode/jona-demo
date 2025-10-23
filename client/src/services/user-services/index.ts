import { ResumeService } from "./resume-service";
import { JobService } from "./job-service";
import { MatchingService } from "./matching-service";
import { UserService } from "./user-service";
import { UsageService } from "./usage-service";
import { ApplicationService } from "./application-service";
import {
  getCurrentSubscription,
  getPaymentHistory,
  createCheckoutSession,
  cancelSubscription,
} from "@/services/user-services";
export const Service = {
  uploadResume: ResumeService.uploadResume,
  getResumePublicUrl: ResumeService.getResumePublicUrl,
  insertResumeMetadata: ResumeService.insertResumeMetadata,
  getUserResumes: ResumeService.getUserResumes,
  buildResumeObject: ResumeService.buildResumeObject,
  getDefaultResume: ResumeService.getDefaultResume,
  updateResume: ResumeService.updateResume,

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
  matchTopJobs: MatchingService.matchTopJobs,
  matchTopJobsWithOpenAI: MatchingService.matchTopJobsWithOpenAI,
  getUserResumeSkills: MatchingService.getUserResumeSkills,
  triggerAutoJobSearch: MatchingService.triggerAutoJobSearch,
  getMatchingStats: MatchingService.getMatchingStats,
  batchCompareJobs: MatchingService.batchCompareJobs,

  updateUserProfile: UserService.updateUserProfile,
  getUserProfile: UserService.getUserProfile,
  getUserSettings: UserService.getUserSettings,
  getEnhancedUserProfile: UserService.getEnhancedUserProfile,
  getSubmittedJobs: UserService.getSubmittedJobs,
  getJobApplications: UserService.getJobApplications,
  getApplicationRecords: UserService.getApplicationRecords,
  getJobStats: UserService.getJobStats,
  getJobStatuses: UserService.getJobStatuses,
 
  getUserUsage: UsageService.getUserUsage,
  initializeUserUsage: UsageService.initializeUserUsage,
  updateUserUsage: UsageService.updateUserUsage,
  // getUsagePayload: UsageService.getUsagePayload,
  checkUsageLimits: UsageService.checkUsageLimits,
  incrementUsage: UsageService.incrementUsage,

  // Payments
  // getPaymentHistory: BilllingService.getPaymentHistory,
  // updateSubscriptionProfile: ProfileService.updateUserProfile,
};

export {
  ResumeService,
  JobService,
  UserService,
  MatchingService,
  UsageService,
  ApplicationService,
};
export {
  getCurrentSubscription,
  getPaymentHistory,
  createCheckoutSession,
  cancelSubscription,
} from "./billing-service";
