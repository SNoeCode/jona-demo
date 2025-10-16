import { supabase } from "@/lib/supabaseClient"; // adjust path as needed
import { AuthUser } from "@/types/user/authUser";
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

const DEFAULT_BASE_URL = "http://localhost:8000";

export class MatchingService {
  static async getAuthHeaders(): Promise<HeadersInit> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token || ""}`,
    };
  }

  static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    baseUrl: string = DEFAULT_BASE_URL
  ): Promise<T> {
    console.log(`🚀 Making matching request to: ${baseUrl}${endpoint}`);
    console.log(`📋 Request options:`, options);

    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      console.log(`📡 Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`❌ Matching request failed:`, errorData);
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      console.log(`✅ Matching request successful:`, data);
      return data;
    } catch (error) {
      console.error(`💥 Matching request error:`, error);
      throw error;
    }
  }

  static async compareResume(request: CompareResumeRequest, baseUrl?: string) {
    console.log("🔍 Comparing resume to job description...");
    return this.makeRequest<ComparisonResult>("/api/matching/compare-resume", {
      method: "POST",
      body: JSON.stringify(request),
    }, baseUrl);
  }

  static async matchTopJobs(request: ResumeMatchRequest, baseUrl?: string) {
    console.log("🎯 Matching resume against all jobs...");
    return this.makeRequest<MatchResult[]>("/api/matching/match-top-jobs", {
      method: "POST",
      body: JSON.stringify(request),
    }, baseUrl);
  }

  static async matchTopJobsWithOpenAI(request: ResumeMatchRequest, baseUrl?: string) {
    console.log("🤖 Matching resume against jobs using OpenAI...");
    return this.makeRequest<MatchResult[]>("/api/matching/openai-match-top-jobs", {
      method: "POST",
      body: JSON.stringify(request),
    }, baseUrl);
  }

  static async getUserResumeSkills(baseUrl?: string) {
    console.log("🧠 Getting user resume skills...");
    return this.makeRequest<string[]>("/api/matching/user-resume-skills", {
      method: "GET",
    }, baseUrl);
  }

  static async triggerAutoJobSearch(baseUrl?: string) {
    console.log("🚀 Triggering automated job search...");
    return this.makeRequest<{
      matches: MatchResult[];
      applications_sent: number;
      message: string;
    }>("/api/matching/trigger-auto-job-search", {
      method: "POST",
    }, baseUrl);
  }

  static async getMatchingStats(baseUrl?: string) {
    console.log("📊 Getting matching statistics...");
    return this.makeRequest<MatchingStats>("/api/matching/matching-stats", {
      method: "GET",
    }, baseUrl);
  }

  static async batchCompareJobs(resumeText: string, jobIds: string[], baseUrl?: string) {
    console.log("📦 Batch comparing jobs...");
    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("id, job_description")
      .in("id", jobIds);

    if (error || !jobs) {
      console.error("❌ Failed to fetch jobs:", error);
      throw new Error("Failed to fetch job descriptions");
    }

    const results: ComparisonResult[] = [];
    for (const job of jobs) {
      try {
        const result = await this.compareResume({
          resume_text: resumeText,
          job_description: job.job_description || "",
        }, baseUrl);
        results.push(result);
      } catch (error) {
        console.error(`❌ Failed to compare job ${job.id}:`, error);
        results.push({
          match_score: 0,
          matched_skills: [],
          missing_skills: [],
        });
      }
    }

    return results;
  }

}

