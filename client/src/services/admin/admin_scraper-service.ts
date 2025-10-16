// utils/scraper-service.ts
"use server";
import { ScraperConfig, ScraperResponse, AllScrapersResponse } from "@/types/user/scraper";

export interface ExtendedScraperResponse extends ScraperResponse {
  log_id?: string;
  output?: string;
  error?: string;
}

class ScraperService {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_BASE_URL || "") {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    };
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    console.log(`Making request to: ${this.baseUrl}${endpoint}`);

    try {
      const headers = this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      console.log(`Response status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Request failed:`, errorData);
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      console.log(`Request successful:`, data);
      return data;
    } catch (error) {
      console.error(`Request error:`, error);
      throw error;
    }
  }

  async runIndeedScraper(config: ScraperConfig): Promise<ExtendedScraperResponse> {
    return this.makeRequest<ExtendedScraperResponse>(`/api/scrapers/indeed`, {
      method: "POST",
      body: JSON.stringify(config)
    });
  }

  async runCareerBuilderScraper(config: ScraperConfig): Promise<ExtendedScraperResponse> {
    return this.makeRequest<ExtendedScraperResponse>(`/api/scrapers/careerbuilder`, {
      method: "POST",
      body: JSON.stringify(config)
    });
  }

  async runDiceScraper(config: ScraperConfig): Promise<ExtendedScraperResponse> {
    return this.makeRequest<ExtendedScraperResponse>(`/api/scrapers/dice`, {
      method: "POST",
      body: JSON.stringify(config)
    });
  }

  async runZipRecruiterScraper(config: ScraperConfig): Promise<ExtendedScraperResponse> {
    return this.makeRequest<ExtendedScraperResponse>(`/api/scrapers/ziprecruiter`, {
      method: "POST",
      body: JSON.stringify(config)
    });
  }

  async runTekSystemsScraper(config: ScraperConfig): Promise<ExtendedScraperResponse> {
    return this.makeRequest<ExtendedScraperResponse>(`/api/scrapers/teksystems`, {
      method: "POST",
      body: JSON.stringify(config)
    });
  }

  async runAllScrapers(config: ScraperConfig & { secret: string }): Promise<AllScrapersResponse> {
    return this.makeRequest<AllScrapersResponse>(`/api/scrapers/all`, {
      method: "POST", 
      body: JSON.stringify(config)
    });
  }

  async runSpecificScrapers(
    config: ScraperConfig, 
    scraperNames: string[]
  ): Promise<ExtendedScraperResponse[]> {
    const results: ExtendedScraperResponse[] = [];
    const scraperMap: Record<string, () => Promise<ExtendedScraperResponse>> = {
      indeed: () => this.runIndeedScraper(config),
      careerbuilder: () => this.runCareerBuilderScraper(config),
      dice: () => this.runDiceScraper(config),
      ziprecruiter: () => this.runZipRecruiterScraper(config),
      teksystems: () => this.runTekSystemsScraper(config),
    };

    // Run scrapers sequentially to avoid overwhelming the system
    for (const scraperName of scraperNames) {
      try {
        const scraperFunction = scraperMap[scraperName];
        if (!scraperFunction) {
          console.warn(`Unknown scraper: ${scraperName}`);
          continue;
        }

        console.log(`Starting ${scraperName} scraper...`);
        const result = await scraperFunction();
        results.push(result);
        console.log(`${scraperName} scraper completed:`, result);
        
        // Add small delay between scrapers to prevent overwhelming
        if (scraperNames.indexOf(scraperName) < scraperNames.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`${scraperName} failed:`, error);
        results.push(createFailedResponse(scraperName, error));
      }
    }

    return results;
  }

  async getScrapingLogs(): Promise<any[]> {
    return this.makeRequest<any[]>(`/api/scrapers/logs`);
  }

  async getScrapingStatus(): Promise<any> {
    return this.makeRequest<any>(`/api/scrapers/status`);
  }

  async checkHealth(): Promise<any> {
    return this.makeRequest<any>(`/api/health`);
  }

  async stopScraper(logId: string): Promise<any> {
    return this.makeRequest<any>(`/api/scrapers/stop/${logId}`, {
      method: "POST"
    });
  }
}

// Export both the class and singleton
export { ScraperService };
export const scraperService = new ScraperService();

// Utility functions
export const ScraperUtils = {
  formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(0)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  },

  getScraperDisplayName(scraperName: string): string {
    const nameMap: Record<string, string> = {
      indeed: "Indeed",
      careerbuilder: "CareerBuilder", 
      dice: "Dice",
      ziprecruiter: "ZipRecruiter",
      teksystems: "TekSystems",
    };
    return nameMap[scraperName] || scraperName;
  },

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case "completed":
      case "success":
        return "text-green-600";
      case "running":
      case "in-progress":
        return "text-blue-600";
      case "failed":
      case "error":
        return "text-red-600";
      case "pending":
      case "waiting":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  },

  getStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case "completed":
      case "success":
        return "✅";
      case "running":
      case "in-progress":
        return "🔄";
      case "failed":
      case "error":
        return "❌";
      case "pending":
      case "waiting":
        return "⏳";
      default:
        return "❓";
    }
  },

  calculateSuccessRate(results: ExtendedScraperResponse[]): number {
    const successful = results.filter(r => r.status === "completed").length;
    return results.length > 0 ? Math.round((successful / results.length) * 100) : 0;
  },

  getTotalJobsFound(results: ExtendedScraperResponse[]): number {
    return results.reduce((total, result) => total + (result.jobs_count || 0), 0);
  },

  getAverageDuration(results: ExtendedScraperResponse[]): number {
    const validResults = results.filter(r => r.duration_seconds && r.duration_seconds > 0);
    if (validResults.length === 0) return 0;
    
    const totalDuration = validResults.reduce((sum, result) => 
      sum + (result.duration_seconds || 0), 0
    );
    return totalDuration / validResults.length;
  }
};

export function createFailedResponse(scraperName: string, error: unknown): ExtendedScraperResponse {
  return {
    scraper_name: scraperName,
    jobs_count: 0,
    status: "failed",
    duration_seconds: 0,
    message: `Failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    success: false,
    error: error instanceof Error ? error.message : "Unknown error"
  };
}