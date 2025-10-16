import { Job, AuthUser } from "@/types/user/index";

export interface ApplicationRecord {
  resume_text: string;
  job_id: string;
  job_title: string;
  company: string;
  user_id: string;
  user_email: string;
  submitted_at: string;
}
export interface JobApplication {
  id: string;
  user_id: string;
  job_id: string;
  resume_id?: string;
  status?: "applied";
  applied_at?: string;
  notes?: string;
}
export interface ApplicationsSentPanelProps {
  jobs: Job[];
  appliedVia?: string;
  user: AuthUser | null;
  darkMode: boolean;
}
export type PromptResult = {
  id: string;
  title: string;
  company: string;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
};
export interface SubmitApplicationParams {
  resumeId: string;
  resumeText: string;
  jobId: string;
  jobTitle: string;
  company: string;
  userId: string;
  userEmail: string;
  submittedTo?: string[];
  resumeLength?: number;
}

export interface ApplicationRecord {
  id: string;
  resume_id: string;
  resume_text: string;
  job_id: string;
  job_title: string;
  company: string;
  user_id: string;
  user_email: string;
  submitted_at: string;
  submitted_to?: string[];
  resume_length?: number;
  status?: "pending" | "success" | "error";
}
export interface SubmittedJob {
  id: string; // job_id
  job_id: string;
  user_id: string;
  job_title: string;
  company: string;
  submittedTo?: string[];
  resumeLength?: number;
  status?: "pending" | "success" | "error";
  sentAt: string;
}
export interface JobTrackerTabProps {
  jobs: Job[];
  onJobUpdateAction: (jobId: string, update: Partial<Job>) => void;
  onApplyStatusChangeAction: (jobId: string, applied: boolean) => void;
  onToggleSavedAction: (jobId: string, currentSaved: boolean) => Promise<void>;
  darkMode: boolean;
  userId: string;
  userEmail: string; // Add this line
}