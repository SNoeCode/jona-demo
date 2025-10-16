
// export const subscriptionPlans: SubscriptionPlan[] = [
//    {
//     id: "a23b2460-6e1e-44ef-8f65-78d89749dd72",
//     name: "Enterprise",
//     description: "Enterprise plan with unlimited features for teams and power users",
//     price_monthly: 99.99,
//     price_yearly: 999.99,
//     currency: "USD",
//     trial_days: 30,
//     max_jobs_per_month: 1000,
//     max_resumes: 50,
//     max_applications_per_day: 100,
//     auto_scrape_enabled: true,
//     priority_support: true,
//     api_access: true,
//     export_enabled: true,
//     features: {
//       team_features: true,
//       basic_scraping: true,
//       bulk_operations: true,
//       advanced_scraping: true,
//       dedicated_support: true,
//       analytics_dashboard: true,
//       custom_integrations: true
//     },
//     active: true,
//     popular: false,
//     created_at: "2025-09-17T00:55:17.724Z",
//     updated_at: "2025-09-17T00:55:17.724Z"
//   },
//   {
//     id: "cb641d9f-ebd8-4818-8cc2-d245a0fb2c4c",
//     name: "Pro",
//     description: "Professional plan with advanced features for serious job seekers",
//     price_monthly: 29.99,
//     price_yearly: 299.99,
//     currency: "USD",
//     trial_days: 14,
//     max_jobs_per_month: 100,
//     max_resumes: 5,
//     max_applications_per_day: 25,
//     auto_scrape_enabled: true,
//     priority_support: true,
//     api_access: true,
//     export_enabled: true,
//     features: {
//       email_alerts: true,
//       basic_scraping: true,
//       advanced_filters: true,
//       resume_templates: true,
//       advanced_scraping: true,
//       cover_letter_generator: true
//     },
//     active: true,
//     popular: false,
//     created_at: "2025-09-17T00:55:17.724Z",
//     updated_at: "2025-09-17T00:55:17.724Z"
//   },
//   {
//     id: "d98224db-cd2a-4d6d-b818-a2eede442b88",
//     name: "Free",
//     description: "Basic plan with limited features - perfect for getting started",
//     price_monthly: 0.0,
//     price_yearly: 0.0,
//     currency: "USD",
//     trial_days: 0,
//     max_jobs_per_month: 10,
//     max_resumes: 1,
//     max_applications_per_day: 5,
//     auto_scrape_enabled: false,
//     priority_support: false,
//     api_access: false,
//     export_enabled: false,
//     features: {
//       email_alerts: false,
//       basic_scraping: true,
//       advanced_filters: false
//     },
//     active: true,
//     popular: false,
//     created_at: "2025-09-17T00:55:17.724Z",
//     updated_at: "2025-09-17T00:55:17.724Z"
//   }
// ];
// export type RawSubscriptionData = z.infer<typeof CurrentSubscriptionSchema>;

// export type SubscriptionSummary = Pick<
//   RawSubscriptionData,
//   "plan_name" | "status" | "price_paid" | "billing_cycle"
// >;


