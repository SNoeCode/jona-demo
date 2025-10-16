// client/src/components/ScraperTab.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RefreshCw,
  Settings,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Calendar,
  MapPin,
  Search,
  Loader2,
  StopCircle,
  Activity,
  Zap,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";


import { scraperApiClient } from "@/services/scraperApiClient";
// import type { ScraperRequest, ScraperResponse } from "@/types/admin";
import { createScraperRequest } from "@/helpers/scraperhelper";
interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    role?: string;
  };
}// src/types/index.ts
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

// export type AuthUser = {
//   id: string;
//   email: string;
//   role: string;
//   aud: string;
//   created_at: string;
//   app_metadata: Record<string, unknown>;
//   user_metadata?: Record<string, unknown>;
// };

interface ScrapingLog {
  id: string;
  status: string;
  jobs_found: number;
  jobs_saved: number;
  duration_seconds?: number;
  started_at: string;
  scraper_type?: string;
  error_message?: string;
}

const ScraperTab: React.FC<{ user: AuthUser }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<"control" | "logs" | "analytics">(
    "control"
  );
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [currentOperation, setCurrentOperation] = useState<string>("");
  const [scrapingLogs, setScrapingLogs] = useState<ScrapingLog[]>([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalJobsFound: 0,
    averageDuration: 0,
    successRate: 0,
  });

  const outputRef = useRef<HTMLDivElement>(null);
const [config, setConfig] = useState<Partial<ScraperRequest>>({
  location: "remote",
  days: 15,
  keywords: ["software engineer"],
  sites: ["indeed", "linkedin"],
  debug: false,
  priority: "medium",
  id: "admin_email"
});

const normalizedConfig = {
  ...config,
  created_at: config.created_at ?? new Date().toISOString(),
  updated_at: config.updated_at ?? new Date().toISOString(),
  completed_at: config.completed_at ?? null,
  job_title: config.job_title ?? 'Untitled Job',
  id: config.id ?? 'unknown-id',
  max_results: config.max_results ?? 50,
  results_count: config.results_count ?? 0,
  error_message: config.error_message ?? '',
  status: config.status ?? 'pending',
  location: config.location ?? 'unspecified',
  days: config.days ?? 7,
  keywords: config.keywords ?? [],
  sites: config.sites ?? [],
    debug: config.debug ?? false,
priority: config.priority ?? "medium",

};

  const [selectedScrapers, setSelectedScrapers] = useState<string[]>([
    "indeed",
    "careerbuilder",
    "dice",
  ]);
const id = uuidv4();
const generateId = () => crypto.randomUUID(); // if supported
  // Auto scroll to bottom of output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Load scraping logs and stats on mount
  useEffect(() => {
    loadScrapingLogs();
    loadStats();
  }, []);

  const addToOutput = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setOutput((prev) => prev + `[${timestamp}] ${message}\n`);
  };

  const loadScrapingLogs = async () => {
    try {
      const response = await fetch("/api/scrapers/logs");
      if (response.ok) {
        const data = await response.json();
        setScrapingLogs(data.slice(0, 20));
      }
    } catch (error) {
      console.error("Failed to load scraping logs:", error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch("/api/scrapers/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const runIndividualScraper = async (scraperName: string) => {
    if (isRunning) return;

    setIsRunning(true);
    setCurrentOperation(`Running ${scraperName}`);
    addToOutput(`🚀 Starting ${scraperName} scraper...`);

    try {

      const scraperConfig = createScraperRequest(config, {
  ...user,
  role: 'user', 
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  app_metadata: {},
  email: user.email ?? 'unknown@domain.com',
});
// let result = createScraperRequest 
 let result

      // Call the appropriate scraper method
      switch (scraperName) {
        case "careerbuilder":
          result = await scraperApiClient.runCareerBuilder(scraperConfig);
          break;
        case "indeed":
          result = await scraperApiClient.runIndeed(scraperConfig);
          break;
        case "ziprecruiter":
          result = await scraperApiClient.runZipRecruiter(scraperConfig);
          break;
        case "dice":
          result = await scraperApiClient.runDice(scraperConfig);
          break;
        case "teksystems":
          result = await scraperApiClient.runTekSystems(scraperConfig);
          break;
        default:
          throw new Error(`Unknown scraper: ${scraperName}`);
      }

      if (result.success) {
        addToOutput(
          `✅ ${scraperName} completed: Found ${result.jobs_found} jobs ${
            result.duration_seconds ? `(${formatDuration(result.duration_seconds)})` : ""
          }`
        );
        if (result.message) {
          addToOutput(`📝 ${result.message}`);
        }
      } else {
        addToOutput(`❌ ${scraperName} failed: ${result.error || "Unknown error"}`);
      }

      // Refresh logs and stats
      loadScrapingLogs();
      loadStats();
    } catch (error) {
      addToOutput(
        `❌ ${scraperName} failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsRunning(false);
      setCurrentOperation("");
    }
  };

  const runAllScrapers = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setOutput("");
    addToOutput("🚀 Starting ALL scrapers with full pipeline...");

    try {
if (!config.job_title) throw new Error("Missing job title");
if (config.max_results === undefined) throw new Error("Missing max_results");


const scraperConfig: ScraperRequest = {
  ...normalizedConfig,
  admin_user_id: user.id,
  admin_email: user.email ?? 'unknown@domain.com',
};
    

const result = await scraperApiClient.runAllScrapers(scraperConfig);

      if (result.success) {
        addToOutput(`✅ All scrapers completed!`);
        addToOutput(`📊 Total jobs: ${result.jobs_found || 0}`);
        
        if (result.duration_seconds) {
          addToOutput(`🕐 Duration: ${formatDuration(result.duration_seconds)}`);
        }

        if (result.output) {
          // Parse the output to show individual results
          try {
            const outputData = JSON.parse(result.output);
            if (outputData.individual_results) {
              Object.entries(outputData.individual_results).forEach(
                ([scraper, count]) => {
                  const displayName = getScraperDisplayName(scraper);
                  addToOutput(`  • ${displayName}: ${count} jobs`);
                }
              );
            }
            if (outputData.success_rate) {
              addToOutput(`📈 Success rate: ${outputData.success_rate}%`);
            }
          } catch (e) {
            // If parsing fails, just show the raw output
            addToOutput(result.output);
          }
        }
      } else {
        addToOutput(`❌ All scrapers failed: ${result.error || "Unknown error"}`);
      }

      loadScrapingLogs();
      loadStats();
    } catch (error) {
      addToOutput(
        `❌ All scrapers failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsRunning(false);
    }
  };

  const stopScraping = () => {
    setIsRunning(false);
    addToOutput("⏹️ Scraping stopped by user");
  };

  const clearOutput = () => {
    setOutput("");
  };

  const testConnection = async () => {
    addToOutput("🔌 Testing connection to FastAPI scraper service...");

    try {
      const status = await scraperApiClient.getScraperStatus();

      addToOutput("✅ Connection successful");
      addToOutput(`📊 Service status: ${status.status || "unknown"}`);
      addToOutput(
        `🔧 Available scrapers: ${
          status.available_scrapers?.join(", ") || "Unknown"
        }`
      );
      addToOutput(`🏃 Running scrapers: ${status.running_scrapers || 0}`);
    } catch (error: unknown) {
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : "Unknown error";
      addToOutput(`❌ Connection failed: ${message}`);
    }
  };

  const handleScraperToggle = (scraperName: string) => {
    setSelectedScrapers((prev) =>
      prev.includes(scraperName)
        ? prev.filter((s) => s !== scraperName)
        : [...prev, scraperName]
    );
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    if (seconds < 3600)
      return `${Math.floor(seconds / 60)}m ${(seconds % 60).toFixed(0)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor(
      (seconds % 3600) / 60
    )}m`;
  };

  const getScraperDisplayName = (scraperName: string): string => {
    const nameMap: Record<string, string> = {
      indeed: "Indeed",
      careerbuilder: "CareerBuilder",
      dice: "Dice",
      ziprecruiter: "ZipRecruiter",
      teksystems: "TekSystems",
    };
    return nameMap[scraperName] || scraperName;
  };

  const getStatusColor = (status: string): string => {
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
  };

  const availableScrapers = [
    {
      id: "indeed",
      name: "Indeed",
      description: "Large job board with comprehensive listings",
    },
    {
      id: "careerbuilder",
      name: "CareerBuilder",
      description: "Professional networking and job search",
    },
    { id: "dice", name: "Dice", description: "Tech-focused job board" },
    {
      id: "ziprecruiter",
      name: "ZipRecruiter",
      description: "AI-powered job matching",
    },
    {
      id: "teksystems",
      name: "TekSystems",
      description: "IT staffing and consulting",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Job Scraper Control Panel (FastAPI)
        </h2>
        <p className="text-gray-600">
          Manage and monitor job scraping operations via FastAPI backend
        </p>
        <div className="flex items-center mt-2 text-sm text-gray-500">
          <Activity className="w-4 h-4 mr-1" />
          Admin: {user.email}
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">
                Total Sessions
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {stats.totalSessions}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Jobs Found</p>
              <p className="text-2xl font-bold text-green-900">
                {stats.totalJobsFound}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">
                Avg Duration
              </p>
              <p className="text-2xl font-bold text-yellow-900">
                {formatDuration(stats.averageDuration)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">
                Success Rate
              </p>
              <p className="text-2xl font-bold text-purple-900">
                {stats.successRate}%
              </p>
            </div>
            <Zap className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {[
          { id: "control", label: "Control Panel", icon: Settings },
          { id: "logs", label: "Logs & Output", icon: Eye },
          { id: "analytics", label: "Analytics", icon: BarChart3 },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === id
                ? "border-blue-500 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Icon className="w-4 h-4 mr-2" />
            {label}
          </button>
        ))}
      </div>

      {/* Control Panel Tab */}
      {activeTab === "control" && (
        <div className="space-y-6">
          {/* Configuration Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">
                Configuration
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={config.location || ""}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          location: e.target.value,
                        }))
                      }
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., remote, New York, San Francisco"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Days Back
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="number"
                      value={config.days || 15}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          days: parseInt(e.target.value) || 15,
                        }))
                      }
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      max="30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <textarea
                      value={(config.keywords || []).join(", ")}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          keywords: e.target.value
                            .split(",")
                            .map((k) => k.trim())
                            .filter((k) => k),
                        }))
                      }
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="software engineer, react, javascript, python"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={config.priority || "medium"}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        priority: e.target.value as "low" | "medium" | "high",
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="debug"
                    checked={config.debug || false}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        debug: e.target.checked,
                      }))
                    }
                    className="mr-2"
                  />
                  <label htmlFor="debug" className="text-sm font-medium text-gray-700">
                    Debug Mode
                  </label>
                </div>
              </div>
            </div>

            {/* Scraper Selection */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">
                Available Scrapers
              </h3>
              <div className="space-y-3">
                {availableScrapers.map((scraper) => (
                  <div
                    key={scraper.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      selectedScrapers.includes(scraper.id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={scraper.id}
                          checked={selectedScrapers.includes(scraper.id)}
                          onChange={() => handleScraperToggle(scraper.id)}
                          className="mr-3"
                        />
                        <div>
                          <label
                            htmlFor={scraper.id}
                            className="font-medium text-gray-800 cursor-pointer"
                          >
                            {scraper.name}
                          </label>
                          <p className="text-sm text-gray-600">
                            {scraper.description}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => runIndividualScraper(scraper.id)}
                        disabled={isRunning}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isRunning && currentOperation.includes(scraper.name) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={runAllScrapers}
              disabled={isRunning}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRunning ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Play className="w-5 h-5 mr-2" />
              )}
              Run All Scrapers
            </button>

            <button
              onClick={stopScraping}
              disabled={!isRunning}
              className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <StopCircle className="w-5 h-5 mr-2" />
              Stop Scraping
            </button>

            <button
              onClick={testConnection}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Test Connection
            </button>

            <button
              onClick={clearOutput}
              className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Clear Output
            </button>
          </div>

          {/* Output Console */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Console Output
            </h3>
            <div
              ref={outputRef}
              className="bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-lg h-80 overflow-y-auto whitespace-pre-wrap"
            >
              {output || "Ready to start scraping..."}
              {isRunning && (
                <div className="flex items-center mt-2">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {currentOperation}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === "logs" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Recent Scraping Logs</h3>
            <button
              onClick={loadScrapingLogs}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scraper
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jobs Found
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {scrapingLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          log.status
                        )}`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getScraperDisplayName(log.scraper_type || "unknown")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.jobs_found}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.duration_seconds ? formatDuration(log.duration_seconds) : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(log.started_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {scrapingLogs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No scraping logs found. Run some scrapers to see logs here.
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Analytics Dashboard</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="text-md font-semibold text-gray-700 mb-4">Performance Overview</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Scraping Sessions:</span>
                  <span className="font-semibold">{stats.totalSessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Jobs Discovered:</span>
                  <span className="font-semibold">{stats.totalJobsFound}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Session Duration:</span>
                  <span className="font-semibold">{formatDuration(stats.averageDuration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="font-semibold">{stats.successRate}%</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="text-md font-semibold text-gray-700 mb-4">Quick Actions</h4>
              <div className="space-y-3">
                <button
                  onClick={loadStats}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Refresh Analytics
                </button>
                <button
                  onClick={loadScrapingLogs}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Load Recent Logs
                </button>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800 font-medium">Analytics Note</span>
            </div>
            <p className="text-yellow-700 mt-2">
              Detailed analytics charts and visualizations will be implemented in a future update. 
              Current analytics show basic performance metrics from the scraping operations.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScraperTab;
