import { EnrichedJob,AuthUser } from '@/types/user/index';
export interface Resume {
  id: string;
  user_id?: string;
  file_path: string;
  file_size?: number;
  resume_type?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
  resume_text?: string;
  raw_text?: string;
  clean_text?: string;
  file_name?: string;
  file_url?: string;
  file_type?: string;
  is_default?: boolean;
}

export interface ResumeComparison {
  id: string;
  user_id: string;
  resume_id?: string;
  job_id?: string;
  matched_skills?: string[] | any; 
  missing_skills?: string[] | any; 
  match_score?: number;
  compared_at?: string;
}
export interface ResumeTabProps {
  user: AuthUser;
  darkMode: boolean;
}

export interface CompareResumeRequest {
  resume_text: string;
  job_description: string;
}
export interface ResumeMatchRequest {
  resume_text: string;
  job_ids?: string[];
  limit?: number;
  min_score?: number;
}
export interface ComparisonResult {
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  error?: string;
  recommendations?: string[];
  skill_gaps?: string[];
  overall_feedback?: string;
}
export interface MatchResult {
  id: string;
  title: string;
  company: string;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  error?: string;
  location?: string;
  salary_range?: string;
  job_type?: string;
  posted_date?: string;
  apply_url?: string;
}



export interface MatchingStats {
  total_matches: number;
  avg_match_score: number;
  top_skills: string[];
  skill_gaps: string[];
  applications_sent: number;
  response_rate: number;
  last_updated: string;
}
export interface EditResumeModalProps {
  resume: Resume;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedResume: Resume) => void;
  darkMode: boolean;
}
export type ComparedJob = EnrichedJob & Partial<ResumeComparison>;
