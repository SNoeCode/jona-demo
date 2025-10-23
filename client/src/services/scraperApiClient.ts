"use server";

import type { ScraperRequest } from "@/types/admin";

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
}
const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://127.0.0.1:8000";

function buildHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
   
  };
}

async function runScraperInternal(
  scraperType: string,
  config: ScraperRequest
): Promise<ScraperResponse> {
  try {
    const endpoint = `${FASTAPI_BASE_URL}/scrapers/${scraperType}/run`;
    
    console.log(`[FastAPI] Running ${scraperType} scraper at ${endpoint}`);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({
        location: config.location,
        days: config.days,
        keywords: config.keywords,
        debug: config.debug,
        priority: config.priority,
        max_results: config.max_results,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      scraper_name: scraperType,
      ...result,
    };
  } catch (error) {
    console.error(`[FastAPI] Error running ${scraperType} scraper:`, error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      scraper_name: scraperType,
      status: "failed",
    };
  }
}


export const scraperApiClient = {
  // TekSystems
  runTekSystems: (config: ScraperRequest) =>
    runScraperInternal("teksystems", config),

  // Dice
  runDice: (config: ScraperRequest) =>
    runScraperInternal("dice", config),

  // Indeed
  runIndeed: (config: ScraperRequest) =>
    runScraperInternal("indeed", config),

  // ZipRecruiter
  runZipRecruiter: (config: ScraperRequest) =>
    runScraperInternal("zip", config),

  // CareerBuilder
  runCareerBuilder: (config: ScraperRequest) =>
    runScraperInternal("careerbuilder", config),

  // Monster (Selenium)
  runMonster: (config: ScraperRequest) =>
    runScraperInternal("monster", config),

  // Monster (Playwright)
  runMonsterPlaywright: (config: ScraperRequest) =>
    runScraperInternal("monster-playwright", config),

  // ZipRecruiter (Playwright)
  runZipPlaywright: (config: ScraperRequest) =>
    runScraperInternal("zip-playwright", config),

  // Snagajob (Playwright)
  runSnagajob: (config: ScraperRequest) =>
    runScraperInternal("snag-playwright", config),

  runAllScrapers: async (config: ScraperRequest): Promise<ScraperResponse> => {
    const scrapers = [
      "indeed",
      "careerbuilder",
      "dice",
      "zip",
      "teksystems",
    ];

    const results: Array<{ scraper: string; result: ScraperResponse }> = [];
    let totalJobsFound = 0;
    let successfulScrapers = 0;
    const startTime = Date.now();

    for (const scraperType of scrapers) {
      const result = await runScraperInternal(scraperType, config);
      results.push({ scraper: scraperType, result });

      if (result.success) {
        successfulScrapers++;
        totalJobsFound += result.jobs_found || 0;
      }
    }

    const duration = (Date.now() - startTime) / 1000;
    const successRate = Math.round((successfulScrapers / scrapers.length) * 100);

    return {
      success: successfulScrapers > 0,
      jobs_found: totalJobsFound,
      duration_seconds: duration,
      output: JSON.stringify({
        individual_results: results.reduce((acc, { scraper, result }) => {
          acc[scraper] = result.jobs_found || 0;
          return acc;
        }, {} as Record<string, number>),
        success_rate: successRate,
        scrapers_run: scrapers.length,
        scrapers_successful: successfulScrapers,
      }),
      message: `Ran ${scrapers.length} scrapers, ${successfulScrapers} successful`,
    };
  },


  getScraperStatus: async (): Promise<{
    status: string;
    available_scrapers: string[];
    running_scrapers: number;
  }> => {
    try {
      const response = await fetch(`${FASTAPI_BASE_URL}/health`, {
        headers: buildHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      return {
        status: "online",
        available_scrapers: [
          "indeed",
          "careerbuilder",
          "dice",
          "zip",
          "teksystems",
          "monster",
          "monster-playwright",
          "zip-playwright",
          "snag-playwright",
        ],
        running_scrapers: data.running_scrapers || 0,
      };
    } catch (error) {
      console.error("[FastAPI] Health check failed:", error);
      
      return {
        status: "offline",
        available_scrapers: [],
        running_scrapers: 0,
      };
    }
  },


  testConnection: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${FASTAPI_BASE_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  },
};


export const ScraperRegistry = {
  indeed: { label: "Indeed", endpoint: "indeed" },
  careerbuilder: { label: "CareerBuilder", endpoint: "careerbuilder" },
  dice: { label: "Dice", endpoint: "dice" },
  zip: { label: "ZipRecruiter", endpoint: "zip" },
  teksystems: { label: "TEKsystems", endpoint: "teksystems" },
  monster: { label: "Monster", endpoint: "monster" },
  "monster-playwright": { label: "Monster (Playwright)", endpoint: "monster-playwright" },
  "zip-playwright": { label: "ZipRecruiter (Playwright)", endpoint: "zip-playwright" },
  "snag-playwright": { label: "Snagajob (Playwright)", endpoint: "snag-playwright" },
};
