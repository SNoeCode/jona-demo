import {
  JobApplication,
  UserJobStatus,
  AuthUser,
  Job,
  ResumeComparison,
  Resume,
} from "@/types/user/index";

export interface DashboardStatsProps {
  user: AuthUser;
  totalJobs?: number;
  darkMode: boolean;
  applications: JobApplication[];
  stats: BaseDashboardStats;
  setCurrentPageAction?: (page: string | ((prev: string) => string)) => void;
  allJobs: (Job & Partial<UserJobStatus>)[];
  userResumes: Resume[];
  appliedJobs?:(Job & Partial<UserJobStatus>)[];
 
  savedJobs?: (Job & Partial<UserJobStatus>)[];

  pendingJobs?: (Job & Partial<UserJobStatus>)[];

  interviewJobs?:(Job & Partial<UserJobStatus>)[];

  offerJobs?:(Job & Partial<UserJobStatus>)[];

  rejectedJobs?:(Job & Partial<UserJobStatus>)[];

  matchRate?: (Resume & Partial<ResumeComparison>)[]
  matchScore?: (Resume & Partial<ResumeComparison>)[]
  totalResumes?: (Resume & Partial<ResumeComparison>)[]
  totalApplications?: (Resume & Partial<ResumeComparison>)[]
}
export interface UserDashboardStats extends BaseDashboardStats {
  avgMatchScore: number;
  darkMode: boolean;
}

export interface BaseDashboardStats {
  totalJobs: number;
  appliedJobs: number;
  savedJobs: number;
  pendingJobs: number;
  interviewJobs: number;
  offerJobs: number;
  rejectedJobs: number;
  matchRate: number;
  matchScore: number;
  totalResumes: number;
  totalApplications: number;
}

export interface UserDashboardStats extends BaseDashboardStats {
  avgMatchScore: number;
}

export const getInitialUserDashboardStats = (): UserDashboardStats => ({
  totalJobs: 0,
  appliedJobs: 0,
  savedJobs: 0,
  pendingJobs: 0,
  interviewJobs: 0,
  offerJobs: 0,
  rejectedJobs: 0,
  matchRate: 0,
  darkMode: false, 
  matchScore: 0,
  totalResumes: 0,
  totalApplications: 0,
  avgMatchScore: 0,
});











// curl -X POST http://127.0.0.1:8080/api/v1/auth/login \
// >   -H "Content-Type: application/json" \
// >   -H "X-Tenant-ID: 00000000-0000-0000-0000-000000000000" \
// >   -d '{
// >     "email": "admin@mcpstudio.com",
// >     "password": "admin123",
// >     "device_type": "web"
// >   }'
// {"user":{"id":"00000000-0000-0000-0000-000000000001","tenant_id":"00000000-0000-0000-0000-000000000000","email":"admin@mcpstudio.com","email_verified":true,"first_name":"System","last_name":"Administrator","display_name":"System Admin","role":"super_admin","status":"active","mfa_enabled":false,"last_login_at":"2025-09-15T18:06:20.023904Z","created_at":"2025-09-15T16:29:19.520361Z","updated_at":"2025-09-15T18:06:20.023904Z"},"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAxIiwidGVuYW50X2lkIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIiwiZW1haWwiOiJhZG1pbkBtY3BzdHVkaW8uY29tIiwicm9sZSI6InN1cGVyX2FkbWluIiwianRpIjoiYmNkYzlkZDEtMzgyZi00MjhjLWEzMWUtZGY0MjA3ZmM5NTc0Iiwic3ViIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAxIiwiZXhwIjoxNzU4MDQ2MDc2LCJpYXQiOjE3NTc5NTk2NzZ9.T0MjJNe4pjurhJwKq-yMngF6Ipf1cVHALORcKqVVTio","refresh_token":"ypfbQJNSBiLK5Xh88R_v-NkeR_mOeUQ59dv8OoDieQU=","expires_at":"2025-09-16T14:07:56.90252-04:00","token_type":"Bearer"}


// curl -X GET http://127.0.0.1:8080/api/v1/users/me \
//   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAxIiwidGVuYW50X2lkIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwIiwiZW1haWwiOiJhZG1pbkBtY3BzdHVkaW8uY29tIiwicm9sZSI6InN1cGVyX2FkbWluIiwianRpIjoiYmNkYzlkZDEtMzgyZi00MjhjLWEzMWUtZGY0MjA3ZmM5NTc0Iiwic3ViIjoiMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAxIiwiZXhwIjoxNzU4MDQ2MDc2LCJpYXQiOjE3NTc5NTk2NzZ9.T0MjJNe4pjurhJwKq-yMngF6Ipf1cVHALORcKqVVTio"