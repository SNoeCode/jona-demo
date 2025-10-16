import { v4 as uuidv4 } from "uuid";
import type { AdminAuthUser } from "@/types/admin/admin_authuser";
// src/types/index.ts
export type ScraperRequest = {
  id: string;
  job_title: string;
  max_results: number;
  status: "pending" | "running" | "completed" | "failed";
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  admin_user_id: string;
  admin_email: string;
  location: string;
  days: number;
  keywords: string[];
  sites: string[];
  debug: boolean;
  priority: "low" | "medium" | "high";
  options?: Record<string, unknown>;
  results_count: number;
  error_message: string | null;

  
};

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  aud: string;
  created_at: string;
  app_metadata: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
  
};

export  function createScraperRequest(
  config: Partial<ScraperRequest>,
  user: AuthUser
): ScraperRequest {
  return {
    id: config.id ?? uuidv4(),

    job_title: config.job_title ?? "",
    max_results: config.max_results ?? 50,
    status: config.status ?? "pending",
    created_at: config.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: config.completed_at ?? null,
    admin_user_id: user.id,
    admin_email: user.email ?? "",
    location: config.location ?? "remote",
    days: config.days ?? 15,
    keywords: config.keywords ?? [],
    sites: config.sites ?? [],
    debug: config.debug ?? false,
    priority: config.priority ?? "medium",
    options: config.options ?? {},
    results_count: 0,
error_message: '',
  };
}