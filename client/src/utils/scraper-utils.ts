// scraper-utils.ts
import { CheckCircle, AlertTriangle, StopCircle, Clock } from "lucide-react";

export const ScraperUtils = {
  getStatusIcon: (status: string) => {
    switch (status) {
      case "completed":
        return "✅"; 
      case "error":
        return "⚠️"; 
      case "running":
        return "⏳"; 
      case "stopped":
        return "🛑"; 
      default:
        return "❔";
    }
  },

  getScraperDisplayName: (name: string) => {
    const map: Record<string, string> = {
      indeed: "Indeed",
      dice: "Dice",
      careerbuilder: "CareerBuilder",
      ziprecruiter: "ZipRecruiter",
      teksystems: "TEKsystems",
    };
    return map[name] || name;
  },

  formatDuration: (seconds?: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  },
};