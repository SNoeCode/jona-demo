"use server";
import * as DashboardService from "./admin_dashboard";
import * as JobService from "./admin_jobs";
import * as UserService from "./admin_users";
import * as ResumeService from "./admin_resume";

import * as BulkService from "./admin_bulk";
import * as SubscriptionService from "./admin_subscription"; // ✅ Add this line
import * as handleError from './admin_error'
// import { } from "../user-services";
// Unified service registry
export const AdminService = {
  // Dashboard
  getDashboardStats: DashboardService.getDashboardStats,

  // Jobs
  getAllJobs: JobService.getAllJobs,
  getJobById: JobService.getJobById,
  getJob: JobService.getJob,
  createJob: JobService.createJob,
  updateJob: JobService.updateJob,
  deleteJob: JobService.deleteJob,
  getJobStats: JobService.getJobStats,
  searchJobs: JobService.searchJobs,
  filterJobs: JobService.filterJobs,
  exportJobsToCSV: JobService.exportJobsToCSV,

  // Users
  getAllUsers: UserService.getAllUsers,
  getUsers: UserService.getUsers,
  getUserById: UserService.getUserById,
  getUser: UserService.getUser,
  updateUser: UserService.updateUser,
  deleteUser: UserService.deleteUser,
  getAdminEnhancedUserProfile:UserService.getAdminEnhancedUserProfile,
  exportUsersToCSV: UserService.exportUsersToCSV,

  // Resumes
  getAllResumes: ResumeService.getAllResumes,
  getResumes: ResumeService.getResumes,
  getResumeById: ResumeService.getResumeById,
  deleteResume: ResumeService.deleteResume,

  // Bulk actions
  bulkDeleteJobs: BulkService.bulkDeleteJobs,
  bulkUpdateJobStatus: BulkService.bulkUpdateJobStatus,
  bulkDeleteUsers: BulkService.bulkDeleteUsers,
  // bulkUpdateUserRoles: BulkService.bulkUpdateUserRoles,

  // Subscriptions
getAllSubscriptions: SubscriptionService.getAllSubscriptions,
getSubscriptionStats: SubscriptionService.getSubscriptionStats,
getSubscriptionOverview: SubscriptionService.getSubscriptionOverview,
getSubscriptions: SubscriptionService.getSubscriptions,
cancelSubscription: SubscriptionService.cancelSubscription,
refundSubscription: SubscriptionService.refundSubscription,
exportSubscriptions: SubscriptionService.exportSubscriptions,
handleError: handleError.handleError,

// errors

};

export {
  DashboardService,
  JobService,
  UserService,
  ResumeService,
  BulkService,
  SubscriptionService,
  handleError
};
