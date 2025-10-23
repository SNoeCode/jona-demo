// types/shared.ts
export type MetadataValue = string | number | boolean | null | undefined;
export type Metadata = Record<string, MetadataValue>;
export type OrgSize = "1-10" | "11-50" | "51-200" | "201-500" | "500+";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing" | "paused";
export type OrgRole = "org_admin" | "org_manager" | "org_user";
export type UserRole = "admin" | "tenant_owner" | "org_admin" | "org_manager" | "org_user" | "recruiter" | "unassigned_user" | "user";

export type UserMetadata = Metadata;