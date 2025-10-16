"use server";

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { ScraperRequest, ScraperResponse, ScrapingLog } from "@/types/admin/admin";
import { getAdminBaseURL } from "../base"; 

export async function runScraper(config: ScraperRequest): Promise<ScraperResponse> {
  const response = await fetch("/api/scrape/indeed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    throw new Error(`Failed to run scraper: ${response.statusText}`);
  }

  return response.json();
}

export async function getScraperStatus(logId: string): Promise<any> {
  const response = await fetch(`/api/scrape/status?logId=${logId}`);
  if (!response.ok) {
    throw new Error(`Failed to get scraper status: ${response.statusText}`);
  }

  return response.json();
}

// ===================
// SCRAPING LOGS MANAGEMENT
// ===================

export async function getScrapingLogs(limit = 50): Promise<ScrapingLog[]> {
  try {
    const response = await fetch(`${getAdminBaseURL()}/logs?limit=${limit}`);
    if (response.ok) return response.json();
  } catch {
    console.warn("API endpoint unavailable, falling back to direct DB queries");
  }

  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("scraping_logs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching scraping logs:", error);
    throw error;
  }

  return data || [];
}

export async function createScrapingLog(
  log: Partial<ScrapingLog>
): Promise<ScrapingLog | null> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("scraping_logs")
    .insert(log)
    .select()
    .single();

  if (error) {
    console.error("Error creating scraping log:", error);
    throw error;
  }

  return data;
}

export async function updateScrapingLog(
  id: string,
  updates: Partial<ScrapingLog>
): Promise<ScrapingLog | null> {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("scraping_logs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating scraping log:", error);
    throw error;
  }

  return data;
}