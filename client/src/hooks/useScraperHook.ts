// hooks/useScrapers.ts
"use client";

import { useState, useCallback } from "react";
import type { ScraperRequest, ScraperResponse, ScrapingLog, ScraperStats, ScraperType } from "@/types/scraper";

export function useScrapers() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentScraper, setCurrentScraper] = useState<string | null>(null);
  const [logs, setLogs] = useState<ScrapingLog[]>([]);
  const [stats, setStats] = useState<ScraperStats>({
    totalSessions: 0,
    totalJobsFound: 0,
    averageDuration: 0,
    successRate: 0,
  });

  /**
   * Run individual scraper
   */
  const runScraper = useCallback(async (
    scraperType: ScraperType,
    config: Partial<ScraperRequest>
  ): Promise<ScraperResponse> => {
    setIsRunning(true);
    setCurrentScraper(scraperType);

    try {
      const response = await fetch(`/api/scrapers/${scraperType}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location: config.location || "remote",
          days: config.days || 15,
          keywords: config.keywords || [],
          priority: config.priority || "medium",
          debug: config.debug || false,
          max_results: config.max_results || 100,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Scraper request failed");
      }

      const result: ScraperResponse = await response.json();
      
      // Refresh logs and stats after completion
      await Promise.all([fetchLogs(), fetchStats()]);
      
      return result;
    } catch (error) {
      console.error(`Error running ${scraperType}:`, error);
      throw error;
    } finally {
      setIsRunning(false);
      setCurrentScraper(null);
    }
  }, []);

  /**
   * Run all scrapers
   */
  const runAllScrapers = useCallback(async (
    config: Partial<ScraperRequest>
  ): Promise<ScraperResponse[]> => {
    setIsRunning(true);
    setCurrentScraper("all");

    const scrapers: ScraperType[] = [
      "indeed",
      "careerbuilder",
      "dice",
      "zip",
      "teksystems",
    ];

    const results: ScraperResponse[] = [];

    try {
      for (const scraperType of scrapers) {
        setCurrentScraper(scraperType);
        const result = await runScraper(scraperType, config);
        results.push(result);

        // Small delay between scrapers
        if (scrapers.indexOf(scraperType) < scrapers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      return results;
    } finally {
      setIsRunning(false);
      setCurrentScraper(null);
    }
  }, [runScraper]);

  /**
   * Fetch scraping logs
   */
  const fetchLogs = useCallback(async (limit = 50) => {
    try {
      const response = await fetch(`/api/scrapers/logs?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch logs");
      }

      const data = await response.json();
      setLogs(data);
      return data;
    } catch (error) {
      console.error("Error fetching logs:", error);
      return [];
    }
  }, []);

  /**
   * Fetch scraper statistics
   */
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/scrapers/stats");
      
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }

      const data = await response.json();
      setStats(data);
      return data;
    } catch (error) {
      console.error("Error fetching stats:", error);
      return stats;
    }
  }, [stats]);

  /**
   * Check health of scraper service
   */
  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch("/api/scrapers/health");
      
      if (!response.ok) {
        return {
          status: "offline",
          available_scrapers: [],
          running_scrapers: 0,
        };
      }

      return await response.json();
    } catch (error) {
      console.error("Health check failed:", error);
      return {
        status: "offline",
        available_scrapers: [],
        running_scrapers: 0,
      };
    }
  }, []);

  return {
    // State
    isRunning,
    currentScraper,
    logs,
    stats,

    // Methods
    runScraper,
    runAllScrapers,
    fetchLogs,
    fetchStats,
    checkHealth,
  };
}

export const scraperUtils = {
  formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(0)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  },

  getScraperDisplayName(scraperType: string): string {
    const nameMap: Record<string, string> = {
      indeed: "Indeed",
      careerbuilder: "CareerBuilder",
      dice: "Dice",
      zip: "ZipRecruiter",
      teksystems: "TekSystems",
      monster: "Monster",
      "monster-playwright": "Monster (Playwright)",
      "zip-playwright": "ZipRecruiter (Playwright)",
      "snag-playwright": "Snagajob (Playwright)",
    };
    return nameMap[scraperType] || scraperType;
  },

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case "completed":
      case "success":
        return "text-green-600 bg-green-100";
      case "running":
      case "in-progress":
        return "text-blue-600 bg-blue-100";
      case "failed":
      case "error":
        return "text-red-600 bg-red-100";
      case "pending":
      case "waiting":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
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
};