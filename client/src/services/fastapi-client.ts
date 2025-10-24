// services/fastapi-client.ts
"use server";

import type { ScraperRequest, ScraperResponse, ScraperType, ScraperMetadata } from "@/types/org/scraper";

const FASTAPI_BASE_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://127.0.0.1:8000";

function buildHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    // Add authentication if needed
    ...(process.env.FASTAPI_API_KEY && {
      "X-API-Key": process.env.FASTAPI_API_KEY,
    }),
  };
}

async function runScraperInternal(
  scraperType: ScraperType,
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
        debug: config.debug || false,
        priority: config.priority || "medium",
        max_results: config.max_results || 100,
      }),
      signal: AbortSignal.timeout(600000), // 10 minutes
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      scraper_name: scraperType,
      jobs_found: result.jobs_found || result.jobs_saved || 0,
      jobs_saved: result.jobs_saved || result.jobs_found || 0,
      duration_seconds: result.duration_seconds,
      status: result.status || "completed",
      message: result.message,
      ...result,
    };
  } catch (error) {
    console.error(`[FastAPI] Error running ${scraperType} scraper:`, error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      scraper_name: scraperType,
      status: "failed",
      jobs_found: 0,
    };
  }
}


export const scraperClient = {
  runTekSystems: (config: ScraperRequest) => runScraperInternal("teksystems", config),
  runDice: (config: ScraperRequest) => runScraperInternal("dice", config),
  runIndeed: (config: ScraperRequest) => runScraperInternal("indeed", config),
  runZipRecruiter: (config: ScraperRequest) => runScraperInternal("zip", config),
  runCareerBuilder: (config: ScraperRequest) => runScraperInternal("careerbuilder", config),
  runMonster: (config: ScraperRequest) => runScraperInternal("monster", config),
  runMonsterPlaywright: (config: ScraperRequest) => runScraperInternal("monster-playwright", config),
  runZipPlaywright: (config: ScraperRequest) => runScraperInternal("zip-playwright", config),
  runSnagajob: (config: ScraperRequest) => runScraperInternal("snag-playwright", config),


  runAllScrapers: async (config: ScraperRequest): Promise<ScraperResponse> => {
    const scrapers: ScraperType[] = [
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
      console.log(`[FastAPI] Running ${scraperType}...`);
      const result = await runScraperInternal(scraperType, config);
      results.push({ scraper: scraperType, result });

      if (result.success) {
        successfulScrapers++;
        totalJobsFound += result.jobs_found || 0;
      }

      if (scrapers.indexOf(scraperType) < scrapers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const duration = (Date.now() - startTime) / 1000;
    const successRate = Math.round((successfulScrapers / scrapers.length) * 100);

    return {
      success: successfulScrapers > 0,
      scraper_name: "all_scrapers",
      jobs_found: totalJobsFound,
      jobs_saved: totalJobsFound,
      duration_seconds: duration,
      status: successfulScrapers > 0 ? "completed" : "failed",
      message: `Ran ${scrapers.length} scrapers, ${successfulScrapers} successful`,
      output: JSON.stringify({
        individual_results: results.reduce((acc, { scraper, result }) => {
          acc[scraper] = result.jobs_found || 0;
          return acc;
        }, {} as Record<string, number>),
        success_rate: successRate,
        scrapers_run: scrapers.length,
        scrapers_successful: successfulScrapers,
      }, null, 2),
    };
  },

  getHealth: async (): Promise<{
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

      return await response.json();
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
      const response = await fetch(`${FASTAPI_BASE_URL}/health`, {
        headers: buildHeaders(),
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};

export const SCRAPER_REGISTRY: Record<ScraperType, ScraperMetadata> = {
  indeed: {
    id: "indeed",
    name: "Indeed",
    description: "Large job board with comprehensive listings",
    endpoint: "/scrapers/indeed/run",
    status: "active",
  },
  careerbuilder: {
    id: "careerbuilder",
    name: "CareerBuilder",
    description: "Professional job search platform",
    endpoint: "/scrapers/careerbuilder/run",
    status: "active",
  },
  dice: {
    id: "dice",
    name: "Dice",
    description: "Tech-focused job board",
    endpoint: "/scrapers/dice/run",
    status: "active",
  },
  zip: {
    id: "zip",
    name: "ZipRecruiter",
    description: "AI-powered job matching",
    endpoint: "/scrapers/zip/run",
    status: "active",
  },
  teksystems: {
    id: "teksystems",
    name: "TekSystems",
    description: "IT staffing and consulting",
    endpoint: "/scrapers/teksystems/run",
    status: "active",
  },
  monster: {
    id: "monster",
    name: "Monster",
    description: "Global employment website",
    endpoint: "/scrapers/monster/run",
    status: "active",
  },
  "monster-playwright": {
    id: "monster-playwright",
    name: "Monster (Playwright)",
    description: "Monster via Playwright automation",
    endpoint: "/scrapers/monster-playwright/run",
    status: "active",
  },
  "zip-playwright": {
    id: "zip-playwright",
    name: "ZipRecruiter (Playwright)",
    description: "ZipRecruiter via Playwright",
    endpoint: "/scrapers/zip-playwright/run",
    status: "active",
  },
  "snag-playwright": {
    id: "snag-playwright",
    name: "Snagajob (Playwright)",
    description: "Snagajob via Playwright",
    endpoint: "/scrapers/snag-playwright/run",
    status: "active",
  },
};