import { Resume, ResumeComparison } from "@/types/user/resume";
export interface Job {
  id: string;
  title: string;
  company?: string;
  job_location?: string;
  job_state?: string;
  salary?: string;
  site: string;
  date?: string;
  applied?: boolean;
  saved?: boolean;
  url?: string;
  job_description?: string;
  search_term?: string;
  category?: string;
  priority?: "low" | "medium" | "high";
  status?: "applied" | "pending" | "interview" | "rejected" | "offer";
  last_verified?: string;
  inserted_at?: string;
  skills?: string[] | any; 
  user_id?: string;
  skills_by_category?: Record<string, string[]> | any; 
  archived_at?: string;
  updated_at?: string;
}

export type EnrichedJob = Job & Partial<UserJobStatus>;
export type JobStatusPayload = Omit<UserJobStatus, "id">;
export type RawJobRecord = Job & {
  user_job_status?: Partial<UserJobStatus>;
  updated_at?: string;
  archived_at?: string | null;
};

export interface JobStats {
  total?: number;
  applied?: number;
  pending?: number;
  saved?: number;
  interviews?: number;
  offers?: number;
  rejected?: number;
}

export interface JobFilterState {
  filter: string;
  category: string;
  priority: string;
  status: string;
  searchTerm: string;
  fromDate?: string;
  toDate?: string;
}

interface JobMatch {
  id: string;
  title: string;
  company: string;
  match_score?: number;
  matched_skills?: string[];
}
export interface JobSubmission {
  id: string;
  title: string;
  company: string;
  sentAt: string;
  submittedTo?: string[];
  resumeLength?: number;
}


export type ExperienceLevel = "entry" | "mid" | "senior" | "executive";
export type JobType =
| "full_time"
| "part_time"
| "contract"
| "internship"
| "freelance";
export interface UserJobStatus {
  created_at: string;
  id: string;
  user_id: string;
  job_id: string;
  saved?: boolean;
  applied?: boolean;
  status?: "applied" | "pending" | "interview" | "rejected" | "offer";
  notes?: string;
  last_verified?: string;
  updated_at?: string;
}
