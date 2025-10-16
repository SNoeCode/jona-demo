
import type { User } from '@supabase/supabase-js';

import { Job } from "@/types/user/index";


export interface AdminJob extends Job {
  user_name?: string;
  user_email?: string;
  application_count?: number;
  created_by?: string;
}
