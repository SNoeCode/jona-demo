// export interface AdminConfiguration {
//   scraper_settings: {
//     auto_scrape_enabled: boolean;
//     scrape_frequency_hours: number;
//     max_jobs_per_scrape: number;
//     supported_sites: string[];
//   };
//   email_settings: {
//     smtp_enabled: boolean;
//     daily_digest_enabled: boolean;
//     notification_emails_enabled: boolean;
//   };
//   system_limits: {
//     max_users: number;
//     max_jobs_per_user: number;
//     max_file_size_mb: number;
//     max_resumes_per_user: number;
//   };
// }
// // Admin Report Types
// export interface AdminReportConfig {
//   id: string;
//   name: string;
//   type:
//     | "user_activity"
//     | "job_statistics"
//     | "revenue_report"
//     | "system_performance";
//   parameters: Record<string,unknown>;
//   schedule?: {
//     frequency: "daily" | "weekly" | "monthly";
//     day_of_week?: number;
//     day_of_month?: number;
//     time: string;
//   };
//   email_recipients: string[];
//   active: boolean;
// }