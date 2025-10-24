/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Job,
  UserJobStatus,
  Resume,
  ResumeComparison,
  PublicUser,
  JobStatusPayload,
  ContactMessage,
  Notification,
  UserProfile,
  UserSettings,
  SubscriptionPlan,
  UserSubscription,
  UserUsage,
  PaymentHistory,
} from "@/types/user/index";
import {
  Organization,
  OrganizationMember,
  OrganizationInvitation,
  OrganizationSubscription,
  OrganizationUsage,
  OrganizationAuditLog,
  Tenant,
} from "@/types/org/organization";
import { AdminJob } from "@/types/admin/admin_jobs";
import { AdminResume } from "@/types/admin/admin_resume";
import { AdminSubscriptionData } from "@/types/admin/admin_subscription";
import { ScrapingLog } from "@/types/admin/admin_scraper";
import { AdminUser } from "@/types/admin/admin_authuser";

// ============= ROLE DEFINITIONS =============
export type UserRole =
  | "admin"           // System-level admin (full system access)
  | "tenant_owner"    // Tenant-level admin (global org access, no user data)
  | "org_admin"       // Full org management
  | "org_manager"     // Limited org management
  | "org_user"        // Basic org member
  | "recruiter"       // Job/candidate focus
  | "unassigned_user" // No org affiliation
  | "user";           // Default role

export type SystemConfigUpdate = {
  key: string;
  value: string | number | boolean | null;
  updated_by: string;
  updated_at: string;
};

export type AuditLogEntry = {
  id?: string;
  admin_user_id: string;
  admin_email: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: Record<string, any>;
  new_values: Record<string, string | number | boolean | null>;
  created_at?: string;
};

// ============= ENHANCED USER TYPE WITH ROLE =============
export type UserWithRole = PublicUser & {
  role: UserRole;
  organization_id?: string | null;
  tenant_id?: string | null;
  is_admin?: boolean;
  is_tenant_owner?: boolean;
  is_org_owner?: boolean;
};

export type Database = {
  public: {
    Tables: {
      // ============= TENANT & ORGANIZATION TABLES =============
      tenants: {
        Row: Tenant;
        Insert: Partial<Tenant>;
        Update: Partial<Tenant>;
        Relationships: [];
      };
      organizations: {
        Row: Organization;
        Insert: Partial<Organization>;
        Update: Partial<Organization>;
        Relationships: [
          {
            foreignKeyName: "organizations_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organizations_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      organization_members: {
        Row: OrganizationMember;
        Insert: Partial<OrganizationMember>;
        Update: Partial<OrganizationMember>;
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_members_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      organization_invitations: {
        Row: OrganizationInvitation;
        Insert: Partial<OrganizationInvitation>;
        Update: Partial<OrganizationInvitation>;
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_invitations_invited_by_fkey";
            columns: ["invited_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      organization_subscriptions: {
        Row: OrganizationSubscription;
        Insert: Partial<OrganizationSubscription>;
        Update: Partial<OrganizationSubscription>;
        Relationships: [
          {
            foreignKeyName: "organization_subscriptions_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            referencedRelation: "subscription_plans";
            referencedColumns: ["id"];
          }
        ];
      };
      organization_usage: {
        Row: OrganizationUsage;
        Insert: Partial<OrganizationUsage>;
        Update: Partial<OrganizationUsage>;
        Relationships: [
          {
            foreignKeyName: "organization_usage_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      organization_audit_logs: {
        Row: OrganizationAuditLog;
        Insert: Partial<OrganizationAuditLog>;
        Update: Partial<OrganizationAuditLog>;
        Relationships: [
          {
            foreignKeyName: "organization_audit_logs_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_audit_logs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };

      // ============= ENHANCED USERS TABLE WITH ROLE =============
      users: {
        Row: UserWithRole;
        Insert: Partial<UserWithRole>;
        Update: Partial<UserWithRole>;
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };

      // ============= EXISTING TABLES =============
      jobs: {
        Row: Job;
        Insert: Partial<Job>;
        Update: Partial<Job>;
        Relationships: [
          {
            foreignKeyName: "jobs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "jobs_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
      user_job_status: {
        Row: UserJobStatus;
        Insert: JobStatusPayload;
        Update: Partial<JobStatusPayload>;
        Relationships: [
          {
            foreignKeyName: "user_job_status_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_job_status_job_id_fkey";
            columns: ["job_id"];
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          }
        ];
      };
      resumes: {
        Row: Resume;
        Insert: Partial<Resume>;
        Update: Partial<Resume>;
        Relationships: [
          {
            foreignKeyName: "resumes_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      resume_comparisons: {
        Row: ResumeComparison;
        Insert: Partial<ResumeComparison>;
        Update: Partial<ResumeComparison>;
        Relationships: [
          {
            foreignKeyName: "resume_comparisons_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "resume_comparisons_job_id_fkey";
            columns: ["job_id"];
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "resume_comparisons_resume_id_fkey";
            columns: ["resume_id"];
            referencedRelation: "resumes";
            referencedColumns: ["id"];
          }
        ];
      };
      scraping_logs: {
        Row: ScrapingLog;
        Insert: Partial<ScrapingLog>;
        Update: Partial<ScrapingLog>;
        Relationships: [
          {
            foreignKeyName: "scraping_logs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      contact_messages: {
        Row: ContactMessage;
        Insert: Partial<ContactMessage>;
        Update: Partial<ContactMessage>;
      };
      notifications: {
        Row: Notification;
        Insert: Partial<Notification>;
        Update: Partial<Notification>;
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      user_profiles: {
        Row: UserProfile;
        Insert: Partial<UserProfile>;
        Update: Partial<UserProfile>;
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      user_settings: {
        Row: UserSettings;
        Insert: Partial<UserSettings>;
        Update: Partial<UserSettings>;
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      subscription_plans: {
        Row: SubscriptionPlan;
        Insert: Partial<SubscriptionPlan>;
        Update: Partial<SubscriptionPlan>;
      };
      user_subscriptions: {
        Row: UserSubscription;
        Insert: Partial<UserSubscription>;
        Update: Partial<UserSubscription>;
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            referencedRelation: "subscription_plans";
            referencedColumns: ["id"];
          }
        ];
      };
      user_usage: {
        Row: UserUsage;
        Insert: Partial<UserUsage>;
        Update: Partial<UserUsage>;
        Relationships: [
          {
            foreignKeyName: "user_usage_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      payment_history: {
        Row: PaymentHistory;
        Insert: Partial<PaymentHistory>;
        Update: Partial<PaymentHistory>;
        Relationships: [
          {
            foreignKeyName: "payment_history_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payment_history_subscription_id_fkey";
            columns: ["subscription_id"];
            referencedRelation: "user_subscriptions";
            referencedColumns: ["id"];
          }
        ];
      };
      system_configuration: {
        Row: SystemConfigUpdate;
        Insert: SystemConfigUpdate;
        Update: Partial<SystemConfigUpdate>;
      };
      admin_audit_logs: {
        Row: AuditLogEntry;
        Insert: AuditLogEntry;
        Update: Partial<AuditLogEntry>;
      };
      user_org_roles: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          role: UserRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<{
          id: string;
          user_id: string;
          organization_id: string;
          role: UserRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        }>;
        Update: Partial<{
          id: string;
          user_id: string;
          organization_id: string;
          role: UserRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [
          {
            foreignKeyName: "user_org_roles_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_org_roles_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Functions: {
      get_user_organizations: {
        Args: {
          user_uuid: string;
        };
        Returns: Organization[];
      };
      get_user_role: {
        Args: {
          user_id: string;
        };
        Returns: UserRole;
      };
      check_user_org_access: {
        Args: {
          user_id: string;
          org_id: string;
        };
        Returns: boolean;
      };
    };
  };
};

// ============= OPERATION TYPES =============
export type DatabaseOperations = {
  // Tenant operations
  TenantInsert: Database["public"]["Tables"]["tenants"]["Insert"];
  TenantUpdate: Database["public"]["Tables"]["tenants"]["Update"];
  TenantRow: Database["public"]["Tables"]["tenants"]["Row"];

  // Organization operations
  OrganizationInsert: Database["public"]["Tables"]["organizations"]["Insert"];
  OrganizationUpdate: Database["public"]["Tables"]["organizations"]["Update"];
  OrganizationRow: Database["public"]["Tables"]["organizations"]["Row"];

  // Organization member operations
  OrganizationMemberInsert: Database["public"]["Tables"]["organization_members"]["Insert"];
  OrganizationMemberUpdate: Database["public"]["Tables"]["organization_members"]["Update"];
  OrganizationMemberRow: Database["public"]["Tables"]["organization_members"]["Row"];

  // Organization invitation operations
  OrganizationInvitationInsert: Database["public"]["Tables"]["organization_invitations"]["Insert"];
  OrganizationInvitationUpdate: Database["public"]["Tables"]["organization_invitations"]["Update"];
  OrganizationInvitationRow: Database["public"]["Tables"]["organization_invitations"]["Row"];

  // Organization subscription operations
  OrganizationSubscriptionInsert: Database["public"]["Tables"]["organization_subscriptions"]["Insert"];
  OrganizationSubscriptionUpdate: Database["public"]["Tables"]["organization_subscriptions"]["Update"];
  OrganizationSubscriptionRow: Database["public"]["Tables"]["organization_subscriptions"]["Row"];

  // Organization usage operations
  OrganizationUsageInsert: Database["public"]["Tables"]["organization_usage"]["Insert"];
  OrganizationUsageUpdate: Database["public"]["Tables"]["organization_usage"]["Update"];
  OrganizationUsageRow: Database["public"]["Tables"]["organization_usage"]["Row"];

  // Organization audit log operations
  OrganizationAuditLogInsert: Database["public"]["Tables"]["organization_audit_logs"]["Insert"];
  OrganizationAuditLogUpdate: Database["public"]["Tables"]["organization_audit_logs"]["Update"];
  OrganizationAuditLogRow: Database["public"]["Tables"]["organization_audit_logs"]["Row"];

  // Job operations
  JobInsert: Database["public"]["Tables"]["jobs"]["Insert"];
  JobUpdate: Database["public"]["Tables"]["jobs"]["Update"];
  JobRow: Database["public"]["Tables"]["jobs"]["Row"];

  // Resume operations
  ResumeInsert: Database["public"]["Tables"]["resumes"]["Insert"];
  ResumeUpdate: Database["public"]["Tables"]["resumes"]["Update"];
  ResumeRow: Database["public"]["Tables"]["resumes"]["Row"];

  // User operations
  UserInsert: Database["public"]["Tables"]["users"]["Insert"];
  UserUpdate: Database["public"]["Tables"]["users"]["Update"];
  UserRow: Database["public"]["Tables"]["users"]["Row"];

  // User job status operations
  UserJobStatusInsert: Database["public"]["Tables"]["user_job_status"]["Insert"];
  UserJobStatusUpdate: Database["public"]["Tables"]["user_job_status"]["Update"];
  UserJobStatusRow: Database["public"]["Tables"]["user_job_status"]["Row"];

  // Resume comparison operations
  ResumeComparisonInsert: Database["public"]["Tables"]["resume_comparisons"]["Insert"];
  ResumeComparisonUpdate: Database["public"]["Tables"]["resume_comparisons"]["Update"];
  ResumeComparisonRow: Database["public"]["Tables"]["resume_comparisons"]["Row"];

  // Scraping log operations
  ScrapingLogInsert: Database["public"]["Tables"]["scraping_logs"]["Insert"];
  ScrapingLogUpdate: Database["public"]["Tables"]["scraping_logs"]["Update"];
  ScrapingLogRow: Database["public"]["Tables"]["scraping_logs"]["Row"];

  // Contact message operations
  ContactMessageInsert: Database["public"]["Tables"]["contact_messages"]["Insert"];
  ContactMessageUpdate: Database["public"]["Tables"]["contact_messages"]["Update"];
  ContactMessageRow: Database["public"]["Tables"]["contact_messages"]["Row"];

  // Notification operations
  NotificationInsert: Database["public"]["Tables"]["notifications"]["Insert"];
  NotificationUpdate: Database["public"]["Tables"]["notifications"]["Update"];
  NotificationRow: Database["public"]["Tables"]["notifications"]["Row"];

  // User profile operations
  UserProfileInsert: Database["public"]["Tables"]["user_profiles"]["Insert"];
  UserProfileUpdate: Database["public"]["Tables"]["user_profiles"]["Update"];
  UserProfileRow: Database["public"]["Tables"]["user_profiles"]["Row"];

  // User settings operations
  UserSettingsInsert: Database["public"]["Tables"]["user_settings"]["Insert"];
  UserSettingsUpdate: Database["public"]["Tables"]["user_settings"]["Update"];
  UserSettingsRow: Database["public"]["Tables"]["user_settings"]["Row"];

  // Subscription plan operations
  SubscriptionPlanInsert: Database["public"]["Tables"]["subscription_plans"]["Insert"];
  SubscriptionPlanUpdate: Database["public"]["Tables"]["subscription_plans"]["Update"];
  SubscriptionPlanRow: Database["public"]["Tables"]["subscription_plans"]["Row"];

  // User subscription operations
  UserSubscriptionInsert: Database["public"]["Tables"]["user_subscriptions"]["Insert"];
  UserSubscriptionUpdate: Database["public"]["Tables"]["user_subscriptions"]["Update"];
  UserSubscriptionRow: Database["public"]["Tables"]["user_subscriptions"]["Row"];

  // User usage operations
  UserUsageInsert: Database["public"]["Tables"]["user_usage"]["Insert"];
  UserUsageUpdate: Database["public"]["Tables"]["user_usage"]["Update"];
  UserUsageRow: Database["public"]["Tables"]["user_usage"]["Row"];

  // Payment history operations
  PaymentHistoryInsert: Database["public"]["Tables"]["payment_history"]["Insert"];
  PaymentHistoryUpdate: Database["public"]["Tables"]["payment_history"]["Update"];
  PaymentHistoryRow: Database["public"]["Tables"]["payment_history"]["Row"];
};

// Admin-specific database operations
export type AdminDatabaseOperations = {
  AdminJobRow: AdminJob;
  AdminJobInsert: Partial<AdminJob>;
  AdminJobUpdate: Partial<AdminJob>;

  AdminUserRow: AdminUser;
  AdminUserInsert: Partial<AdminUser>;
  AdminUserUpdate: Partial<AdminUser>;

  AdminResumeRow: AdminResume;
  AdminResumeInsert: Partial<AdminResume>;
  AdminResumeUpdate: Partial<AdminResume>;

  AdminSubscriptionDataRow: AdminSubscriptionData;
} & DatabaseOperations;

// ============= EXPORTS =============
export type TableName = keyof Database["public"]["Tables"];

export type TableOperations<T extends TableName> = {
  Row: Database["public"]["Tables"][T]["Row"];
  Insert: Database["public"]["Tables"][T]["Insert"];
  Update: Database["public"]["Tables"][T]["Update"];
};

// Role-based access control types
export type RoleBasedOperations<R extends UserRole> = 
  R extends "admin" ? AdminDatabaseOperations :
  R extends "tenant_owner" ? AdminDatabaseOperations :
  DatabaseOperations;

// Helper type for role permissions
export type RolePermissions = {
  canViewAllOrgs: boolean;
  canManageOrg: boolean;
  canManageUsers: boolean;
  canViewUserData: boolean;
  canManageJobs: boolean;
  canViewJobs: boolean;
  requiresOrgId: boolean;
  canViewOwnUserData: boolean;
  canManageSettings: boolean;
  canManageProfile: boolean;
  canApplyToJobs: boolean;
  canManageSystem: boolean;
  canViewAuditLogs: boolean;
};

// Role permission mapping
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canViewAllOrgs: true,
    canManageOrg: true,
    canManageUsers: true,
    canViewUserData: true,
    canManageJobs: true,
    canViewJobs: true,
    requiresOrgId: false,
    canViewOwnUserData: true,
    canManageSettings: true,
    canManageProfile: true,
    canApplyToJobs: false,
    canManageSystem: true,
    canViewAuditLogs: true,
  },
  tenant_owner: {
    canViewAllOrgs: true,
    canManageOrg: true,
    canManageUsers: true,
    canViewUserData: false, // Cannot see org user data
    canManageJobs: false,
    canViewJobs: false,
    requiresOrgId: false,
    canViewOwnUserData: true,
    canManageSettings: true,
    canManageProfile: true,
    canApplyToJobs: false,
    canManageSystem: false,
    canViewAuditLogs: true,
  },
  org_admin: {
    canViewAllOrgs: false,
    canManageOrg: true,
    canManageUsers: true,
    canViewUserData: true,
    canManageJobs: true,
    canViewJobs: true,
    requiresOrgId: true,
    canViewOwnUserData: true,
    canManageSettings: true,
    canManageProfile: true,
    canApplyToJobs: true,
    canManageSystem: false,
    canViewAuditLogs: false,
  },
  org_manager: {
    canViewAllOrgs: false,
    canManageOrg: false,
    canViewUserData: true,
    requiresOrgId: true,
    canViewOwnUserData: true,
    canManageUsers: true,
    canViewJobs: true,
    canManageJobs: true,
    canManageSettings: false,
    canManageProfile: true,
    canApplyToJobs: true,
    canManageSystem: false,
    canViewAuditLogs: false,
  },
  org_user: {
    canViewAllOrgs: false,
    canManageOrg: false,
    canManageUsers: false,
    canViewUserData: false,
    canManageJobs: false,
    canViewJobs: true,
    requiresOrgId: true,
    canViewOwnUserData: true,
    canManageSettings: false,
    canManageProfile: true,
    canApplyToJobs: true,
    canManageSystem: false,
    canViewAuditLogs: false,
  },
  recruiter: {
    canViewAllOrgs: false,
    canManageOrg: false,
    canManageUsers: false,
    canViewUserData: false,
    canManageJobs: true,
    canViewJobs: true,
    requiresOrgId: false,
    canViewOwnUserData: true,
    canManageProfile: true,
    canApplyToJobs: false,
    canManageSettings: false,
    canManageSystem: false,
    canViewAuditLogs: false,
  },
  unassigned_user: {
    canViewAllOrgs: false,
    canManageOrg: false,
    canManageUsers: false,
    canViewUserData: false,
    canManageJobs: false,
    canViewJobs: true,
    requiresOrgId: false,
    canViewOwnUserData: true,
    canManageProfile: true,
    canApplyToJobs: true,
    canManageSettings: false,
    canManageSystem: false,
    canViewAuditLogs: false,
  },
  user: {
    canViewAllOrgs: false,
    canManageOrg: false,
    canManageUsers: false,
    canViewUserData: false,
    canManageJobs: false,
    canViewJobs: false,
    requiresOrgId: false,
    canViewOwnUserData: true,
    canManageProfile: true,
    canApplyToJobs: true,
    canManageSettings: false,
    canManageSystem: false,
    canViewAuditLogs: false,
  },
};

// Helper function to check permissions
export function hasPermission(
  role: UserRole,
  permission: keyof RolePermissions
): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

// Route determination helper
export function getRouteForRole(
  role: UserRole,
  organizationId?: string
): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "tenant_owner":
      return "/tenant/dashboard";
    case "org_admin":
      return `/org/${organizationId}/admin`;
    case "org_manager":
      return `/org/${organizationId}/manage`;
    case "org_user":
      return `/org/${organizationId}/dashboard`;
    case "recruiter":
      return organizationId ? `/org/${organizationId}/recruit` : "/recruit";
    case "unassigned_user":
      return "/dashboard";
    default:
      return "/";
  }
}

// Type exports for backward compatibility
export type {
  Job,
  UserJobStatus,
  Resume,
  ResumeComparison,
  PublicUser,
  JobStatusPayload,
  ContactMessage,
  Notification,
  UserProfile,
  UserSettings,
  SubscriptionPlan,
  UserSubscription,
  UserUsage,
  PaymentHistory,
  Organization,
  OrganizationMember,
  OrganizationInvitation,
  OrganizationSubscription,
  OrganizationUsage,
  OrganizationAuditLog,
  Tenant,
  AdminJob,
  AdminResume,
  AdminSubscriptionData,
  ScrapingLog,
  AdminUser,
};
