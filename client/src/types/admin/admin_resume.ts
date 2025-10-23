// types/admin/admin.ts - Updated AdminResume type definition
export interface AdminResume {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  

  original_filename?: string;
  filename?: string; 
  file_url?: string;
  file_path?: string; 
  file_type?: string;
  content_type?: string; 
  file_size?: number;
  
  // Resume content and analysis
  parsed_content?: string;
  match_score?: number;
  total_matches?: number; // Maps to match_score in DB
  experience_years?: number;
  education?: string;
  skills?: string[];
  
  // Application tracking
  applications_sent?: number;
  
  // Timestamps
  uploaded_date?: string;
  created_at?: string;
  updated_at?: string;
  
  // User profile information
  user_profile?: {
    full_name: string;
    email: string;
  };
}

// Alternative simplified type that matches your database exactly
export interface ResumeRecord {
  id: string;
  user_id: string;
  original_filename?: string;
  file_url?: string;
  file_type?: string;
  file_size?: number;
  parsed_content?: string;
  match_score?: number;
  experience_years?: number;
  education?: string;
  skills?: string[];
  applications_sent?: number;
  uploaded_date?: string;
  created_at?: string;
  updated_at?: string;
}

// Enhanced type with user information
export interface AdminResumeWithUser extends ResumeRecord {
  user_name: string;
  user_email: string;
  user_profile?: {
    full_name: string;
    email: string;
  };
}

// For your existing Zod schema compatibility
export interface ResumeAdmin {
  id: string;
  user_id: string;
  file_name?: string | null;
  file_path?: string | null;
  created_at: string;
  raw_text?: string | null;
  users?: Array<{
    name?: string;
    email?: string;
  }>;
  user_profile?: {
    full_name: string;
    email: string;
  };
  total_matches?: number;
  content?: string;
}

// Type guards for runtime checking
export function isAdminResume(obj: any): obj is AdminResume {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.user_id === 'string' &&
    typeof obj.user_name === 'string' &&
    typeof obj.user_email === 'string'
  );
}

export function isResumeRecord(obj: any): obj is ResumeRecord {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.user_id === 'string'
  );
}