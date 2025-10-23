// client\src\app\services\admin\scraperEngine.ts
'use server'
import { supabase } from "@/lib/supabaseClient";
import {getSupabaseAdmin} from "@/lib/supabaseAdmin";
import type { ScraperRequest } from "@/types/admin/admin";
import { Job } from "@/types/user";
import {AdminAuthUser} from '@/types/admin/admin_authuser'
export interface ScraperResponse {
  success: boolean;
  output?: string;
  jobs_found?: number;
  jobs_saved?: number;
  jobs_count?: number;
  log_id?: string;
  error?: string;
  scraper_name?: string;
  status?: string;
  duration_seconds?: number;
  message?: string;
  admin_notes?: string;
  jobs?: Job[];
  priority?: "low" | "medium" | "high";
}
export const VALID_SCRAPER_TYPES = [
  "indeed",
  "careerbuilder",
  "dice",
  "ziprecruiter",
  "teksystems",
  "monster",
  "monster-playwright",
  "zip-playwright",
  "snag-playwright",
];

export function isValidScraperType(type: string): boolean {
  return VALID_SCRAPER_TYPES.includes(type);
}

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";

// 🧼 Centralized header builder
function buildHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
  };
}

// 🧠 Generic scraper runner
async function runScraperInternal(
  scraperType: string,
  config: ScraperRequest,
  admin?: { id: string; email: string }
): Promise<ScraperResponse> {
  try {
    const response = await fetch(`${FASTAPI_BASE_URL}/api/scrapers/${scraperType}/run`, {
  method: "POST",
  headers: buildHeaders(),
  body: JSON.stringify({
    ...config,
    admin_user_id: admin?.id,
    admin_email: admin?.email,
  }),
});



    // const response = await fetch(`/api/admin/scraper/${scraperType}`, {
    //   method: "POST",
    //   headers: buildHeaders(),
    //   body: JSON.stringify({
    //     ...config,
    //     admin_user_id: admin?.id,
    //     admin_email: admin?.email,
    //   }),
    // });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error running ${scraperType} scraper:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      scraper_name: scraperType,
      status: "failed",
      priority: config.priority,
      admin_notes: admin ? `Triggered by ${admin.email}` : undefined,
    };
  }
}

// 🔁 Individual scraper wrappers
export const runIndeedScraper = (config: ScraperRequest, admin?: { id: string; email: string }) =>
  runScraperInternal("indeed", config, admin);

export const runZipRecruiterScraper = (config: ScraperRequest, admin?: { id: string; email: string }) =>
  runScraperInternal("ziprecruiter", config, admin);

export const runCareerBuilderScraper = (config: ScraperRequest, admin?: { id: string; email: string }) =>
  runScraperInternal("careerbuilder", config, admin);

export const runTekSystemsScraper = (config: ScraperRequest, admin?: { id: string; email: string }) =>
  runScraperInternal("teksystems", config, admin);

export const startDiceScraperProcess = (config: ScraperRequest, admin?: { id: string; email: string }) =>
  runScraperInternal("dice", config, admin);

// 📦 Registry for UI or orchestration
export const ScraperRegistry = {
  indeed: { label: "Indeed", script: "run_indeed.py" },
  ziprecruiter: { label: "ZipRecruiter", script: "run_ziprecruiter.py" },
  careerbuilder: { label: "CareerBuilder", script: "run_careerbuilder.py" },
  teksystems: { label: "TEKsystems", script: "run_teksystems.py" },
  dice: { label: "Dice", script: "run_dice.py" },
  "monster-playwright": { label: "Monster (Playwright)", script: "run_monster_playwright.py" },
  "zip-playwright": { label: "ZipRecruiter (Playwright)", script: "run_zip_playwright.py" },
  "snag-playwright": { label: "Snagajob (Playwright)", script: "run_snag_playwright.py" },
};

// 🧠 Orchestrator for multiple scrapers
export async function runAllScrapers(
  config: ScraperRequest,
  scrapers: string[],
  admin?: { id: string; email: string }
): Promise<{ success: boolean; results: Array<{ scraper: string; result: ScraperResponse }> }> {
  const results: Array<{ scraper: string; result: ScraperResponse }> = [];

  for (const scraperType of scrapers) {
    let result: ScraperResponse;

    switch (scraperType) {
      case "indeed":
        result = await runIndeedScraper(config, admin);
        break;
      case "ziprecruiter":
        result = await runZipRecruiterScraper(config, admin);
        break;
      case "careerbuilder":
        result = await runCareerBuilderScraper(config, admin);
        break;
      case "teksystems":
        result = await runTekSystemsScraper(config, admin);
        break;
      case "dice":
        result = await startDiceScraperProcess(config, admin);
        break;
      default:
        result = {
          success: false,
          error: `Unknown scraper type: ${scraperType}`,
          scraper_name: scraperType,
          status: "failed",
        };
    }

    results.push({ scraper: scraperType, result });
  }

  return { success: true, results };
}

