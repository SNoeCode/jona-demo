import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import {
  Play,
  RefreshCw,
  Settings,
  Eye,
  Clock,
  CheckCircle,
  BarChart3,
  Calendar,
  MapPin,
  Search,
  Loader2,
  Activity,
  Zap,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface AuthUser {
  id: string;
  email?: string;
}

type ScraperConfig = {
  location: string;
  days: number;
  keywords: string[];
  priority: "low" | "medium" | "high";
  debug: boolean;
  max_results: number;
  headless: boolean;
  skip_captcha: boolean;
};

interface LogEntry {
  id: string;
  scraper_type: string;
  status: string;
  jobs_found: number;
  duration_seconds: number;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  admin_user_id: string;
  admin_email: string;
  location: string;
  keywords: string[];
  debug: boolean;
  priority: string;
  max_results: number;
  headless: boolean;
  skip_captcha: boolean;
  created_at: string;
  updated_at: string;
}

interface Stats {
  totalSessions: number;
  totalJobsFound: number;
  averageDuration: number;
  successRate: number;
  completedSessions?: number;
  failedSessions?: number;
  runningSessions?: number;
  statsByScraper?: Record<
    string,
    {
      total: number;
      completed: number;
      failed: number;
      jobs_found: number;
    }
  >;
}

const AVAILABLE_SCRAPERS = [
  {
    id: "indeed",
    name: "Indeed",
    description: "Large job board with comprehensive listings",
    status: "active",
  },
  {
    id: "careerbuilder",
    name: "CareerBuilder",
    description: "Professional job search platform",
    status: "active",
  },
  {
    id: "dice",
    name: "Dice",
    description: "Tech-focused job board",
    status: "active",
  },
  {
    id: "zip",
    name: "ZipRecruiter",
    description: "AI-powered job matching",
    status: "active",
  },
  {
    id: "teksystems",
    name: "TekSystems",
    description: "IT staffing and consulting",
    status: "active",
  },
  {
    id: "monster",
    name: "Monster",
    description: "Global employment website",
    status: "active",
  },
  {
    id: "monster-playwright",
    name: "Monster (Playwright)",
    description: "Monster via Playwright automation",
    status: "active",
  },
  {
    id: "zip-playwright",
    name: "ZipRecruiter (Playwright)",
    description: "ZipRecruiter via Playwright",
    status: "active",
  },
  {
    id: "snag-playwright",
    name: "Snagajob (Playwright)",
    description: "Snagajob via Playwright",
    status: "active",
  },
];

const ScraperTab: React.FC<{ user: AuthUser }> = ({ user }) => {
  const [config, setConfig] = useState<ScraperConfig>({
    location: "remote",
    days: 15,
    keywords: ["software engineer"],
    priority: "medium",
    debug: true,
    max_results: 100,
    headless: true,
    skip_captcha: true,
  });

  const [activeTab, setActiveTab] = useState<"control" | "logs" | "analytics">(
    "control"
  );
  const [isRunning, setIsRunning] = useState(false);
  const [currentScraper, setCurrentScraper] = useState<string | null>(null);
  const [output, setOutput] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    totalJobsFound: 0,
    averageDuration: 0,
    successRate: 0,
  });

  const outputRef = useRef<HTMLDivElement>(null);

  const [selectedScrapers, setSelectedScrapers] = useState<string[]>([
    "snag-playwright",
  ]);

  const getScraperEndpoint = (scraperId: string) =>
    `/api/scrapers/${scraperId}`;
  const getHealthEndpoint = () => `/api/health`;

  const buildScraperPayload = (config: ScraperConfig) => ({
    location: config.location || "remote",
    days: config.days || 15,
    keywords: config.keywords || [],
    priority: config.priority || "medium",
    debug: config.debug || false,
    max_results: config.max_results || 100,
    headless: config.headless ?? true,
    skip_captcha: config.skip_captcha ?? true,
  });

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, []);

  const addToOutput = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setOutput((prev) => prev + `[${timestamp}] ${message}\n`);
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/scrapers/logs?limit=50");
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        console.error("Failed to fetch logs:", response.status);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/scrapers/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error("Failed to fetch stats:", response.status);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleRunIndividualScraper = async (scraperId: string) => {
    if (isRunning) return;

    setIsRunning(true);
    setCurrentScraper(scraperId);
    const scraperName =
      AVAILABLE_SCRAPERS.find((s) => s.id === scraperId)?.name || scraperId;
    addToOutput(`🚀 Starting ${scraperName} scraper...`);

    const payload = buildScraperPayload(config);
    addToOutput(`⚙️ Configuration:`);
    addToOutput(`   Location: ${payload.location}`);
    addToOutput(`   Keywords: ${payload.keywords.join(", ")}`);
    addToOutput(`   Headless: ${payload.headless}`);
    addToOutput(`   Debug: ${payload.debug}`);

    let logId: string | null = null;
    const startTime = Date.now();

    const pollInterval = setInterval(async () => {
      if (logId) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        addToOutput(`⏱️ Elapsed time: ${formatDuration(elapsed)}`);
      }
      await fetchLogs();
      await fetchStats();
    }, 3000);

    try {
      const endpoint = getScraperEndpoint(scraperId);
      addToOutput(`📤 Sending POST to: ${endpoint}`);
      addToOutput(`⏳ This may take several minutes...`);
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error("No valid session found");
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      addToOutput(
        `📥 Response status: ${response.status} ${response.statusText}`
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: `HTTP ${response.status}`,
        }));
        addToOutput(`❌ Error response: ${JSON.stringify(error, null, 2)}`);
        throw new Error(
          error.message || error.error || "Scraper request failed"
        );
      }

      const result = await response.json();
      logId = result.log_id;

      addToOutput(`📊 Result received:`);
      addToOutput(`   Log ID: ${result.log_id || "N/A"}`);
      addToOutput(`   Jobs Found: ${result.jobs_found || 0}`);
      addToOutput(
        `   Duration: ${
          result.duration_seconds
            ? formatDuration(result.duration_seconds)
            : "N/A"
        }`
      );

      if (result.success) {
        addToOutput(`✅ ${scraperName} completed successfully!`);
        addToOutput(
          `📊 Final stats: ${result.jobs_found || 0} jobs in ${formatDuration(
            result.duration_seconds || 0
          )}`
        );
        if (result.message) {
          addToOutput(`📝 ${result.message}`);
        }
        toast.success(`${scraperName}: Found ${result.jobs_found || 0} jobs`);
      } else {
        addToOutput(
          `❌ ${scraperName} failed: ${result.message || "Unknown error"}`
        );
        if (result.error_details && config.debug) {
          addToOutput(`🔍 Error details:\n${result.error_details}`);
        }
        toast.error(`${scraperName} failed: ${result.message}`);
      }

      await Promise.all([fetchLogs(), fetchStats()]);
    } catch (error) {
      addToOutput(
        `❌ ${scraperName} failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      if (error instanceof Error && error.stack && config.debug) {
        addToOutput(`🔍 Stack trace:\n${error.stack}`);
      }
      toast.error(`${scraperName} failed`);
    } finally {
      clearInterval(pollInterval);
      setIsRunning(false);
      setCurrentScraper(null);
      await Promise.all([fetchLogs(), fetchStats()]);
    }
  };

  const handleRunAllScrapers = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setCurrentScraper("all");
    setOutput("");
    addToOutput("🚀 Starting ALL scrapers...");
    addToOutput(`📝 Selected: ${selectedScrapers.join(", ")}`);

    const results: any[] = [];

    for (const scraper of selectedScrapers) {
      const scraperName =
        AVAILABLE_SCRAPERS.find((s) => s.id === scraper)?.name || scraper;
      setCurrentScraper(scraper);
      addToOutput(`\n▶️ Running ${scraperName}...`);

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session?.access_token) {
          throw new Error("No valid session found");
        }

        const response = await fetch(getScraperEndpoint(scraper), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildScraperPayload(config)),
        });

        if (response.ok) {
          const result = await response.json();
          results.push(result);
          addToOutput(`  ✅ ${scraperName}: ${result.jobs_found || 0} jobs`);
          toast.success(`${scraperName}: ${result.jobs_found || 0} jobs`);
        } else {
          addToOutput(`  ❌ ${scraperName}: Failed (HTTP ${response.status})`);
          toast.error(`${scraperName} failed`);
        }
      } catch (error) {
        addToOutput(
          `  ❌ ${scraperName}: ${
            error instanceof Error ? error.message : "Error"
          }`
        );
        toast.error(`${scraperName} error`);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const successful = results.filter((r) => r.success).length;
    const totalJobs = results.reduce((sum, r) => sum + (r.jobs_found || 0), 0);

    addToOutput(`\n✅ All scrapers completed!`);
    addToOutput(`📊 Total jobs: ${totalJobs}`);
    addToOutput(
      `📈 Success rate: ${Math.round((successful / results.length) * 100)}%`
    );

    toast.success(`All scrapers complete: ${totalJobs} total jobs`);

    await Promise.all([fetchLogs(), fetchStats()]);

    setIsRunning(false);
    setCurrentScraper(null);
  };

  const handleTestConnection = async () => {
    addToOutput("🔌 Testing connection to backend...");

    try {
      const response = await fetch(getHealthEndpoint());

      if (response.ok) {
        const health = await response.json();
        addToOutput("✅ Connection successful");
        addToOutput(`📊 Service status: ${health.status || "unknown"}`);
        addToOutput(`📊 FastAPI status: ${health.fastapi_status || "unknown"}`);
        addToOutput(
          `🔧 Available scrapers: ${
            health.available_scrapers?.join(", ") || "Unknown"
          }`
        );
        addToOutput(`🏃 Running scrapers: ${health.running_scrapers || 0}`);
        toast.success("Backend connection successful");
      } else {
        addToOutput(`❌ Connection failed: HTTP ${response.status}`);
        toast.error("Backend connection failed");
      }
    } catch (error) {
      addToOutput(
        `❌ Connection failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      toast.error("Backend connection failed");
    }
  };

  const handleScraperToggle = (scraperId: string) => {
    setSelectedScrapers((prev) =>
      prev.includes(scraperId)
        ? prev.filter((s) => s !== scraperId)
        : [...prev, scraperId]
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

  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
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

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "success":
        return <CheckCircle className="w-4 h-4" />;
      case "running":
      case "in-progress":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "failed":
      case "error":
        return <XCircle className="w-4 h-4" />;
      case "pending":
      case "waiting":
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const clearOutput = () => setOutput("");

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Job Scraper Control Panel
        </h2>
        <p className="text-gray-600">
          Manage and monitor job scraping operations
        </p>
        <div className="flex items-center mt-2 text-sm text-gray-500">
          <Activity className="w-4 h-4 mr-1" />
          Admin: {user.email}
        </div>
      </div>

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

      {activeTab === "control" && (
        <div className="space-y-6">
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
                      value={config.location}
                      onChange={(e) =>
                        setConfig({ ...config, location: e.target.value })
                      }
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., remote, New York"
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
                      value={config.days}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          days: parseInt(e.target.value) || 15,
                        })
                      }
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      value={config.keywords.join(", ")}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          keywords: e.target.value
                            .split(",")
                            .map((k) => k.trim())
                            .filter((k) => k),
                        })
                      }
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="software engineer, react, python"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Results
                  </label>
                  <input
                    type="number"
                    value={config.max_results}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        max_results: parseInt(e.target.value) || 100,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={config.priority}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        priority: e.target.value as "low" | "medium" | "high",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="headless"
                      checked={config.headless}
                      onChange={(e) =>
                        setConfig({ ...config, headless: e.target.checked })
                      }
                      className="mr-2"
                    />
                    <label
                      htmlFor="headless"
                      className="text-sm font-medium text-gray-700"
                    >
                      Headless Mode (no browser window)
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="skip_captcha"
                      checked={config.skip_captcha}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          skip_captcha: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    <label
                      htmlFor="skip_captcha"
                      className="text-sm font-medium text-gray-700"
                    >
                      Skip CAPTCHA prompt
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="debug"
                      checked={config.debug}
                      onChange={(e) =>
                        setConfig({ ...config, debug: e.target.checked })
                      }
                      className="mr-2"
                    />
                    <label
                      htmlFor="debug"
                      className="text-sm font-medium text-gray-700"
                    >
                      Debug Mode (verbose logging)
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">
                Available Scrapers
              </h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {AVAILABLE_SCRAPERS.map((scraper) => (
                  <div
                    key={scraper.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      selectedScrapers.includes(scraper.id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
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
                        onClick={() => handleRunIndividualScraper(scraper.id)}
                        disabled={isRunning}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ml-2"
                      >
                        {isRunning && currentScraper === scraper.id ? (
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

          <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={handleRunAllScrapers}
              disabled={isRunning || selectedScrapers.length === 0}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRunning && currentScraper === "all" ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Play className="w-5 h-5 mr-2" />
              )}
              Run All Selected ({selectedScrapers.length})
            </button>

            <button
              onClick={handleTestConnection}
              disabled={isRunning}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
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

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Console Output
            </h3>
            <div
              ref={outputRef}
              className="bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-lg h-96 overflow-y-auto whitespace-pre-wrap"
            >
              {output ||
                "Ready to start scraping...\n\nClick 'Test Connection' to verify backend connectivity."}
              {isRunning && currentScraper && (
                <div className="flex items-center mt-2 text-yellow-400">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Running{" "}
                  {AVAILABLE_SCRAPERS.find((s) => s.id === currentScraper)
                    ?.name || currentScraper}
                  ...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">
              Recent Scraping Logs
            </h3>
            <button
              onClick={fetchLogs}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Scraper
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Keywords
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Jobs Found
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Started At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          log.status
                        )}`}
                      >
                        {getStatusIcon(log.status)}
                        <span className="ml-1">{log.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {AVAILABLE_SCRAPERS.find((s) => s.id === log.scraper_type)
                        ?.name ||
                        log.scraper_type ||
                        "unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.location || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {log.keywords?.join(", ") || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.jobs_found || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.duration_seconds
                        ? formatDuration(log.duration_seconds)
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(log.started_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {logs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No scraping logs found. Run some scrapers to see logs here.
            </div>
          )}
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">
            Analytics Dashboard
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="text-md font-semibold text-gray-700 mb-4">
                Performance Overview
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Total Scraping Sessions:
                  </span>
                  <span className="font-semibold">{stats.totalSessions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Jobs Discovered:</span>
                  <span className="font-semibold">{stats.totalJobsFound}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Average Session Duration:
                  </span>
                  <span className="font-semibold">
                    {formatDuration(stats.averageDuration)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="font-semibold">{stats.successRate}%</span>
                </div>
                {stats.completedSessions !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed Sessions:</span>
                    <span className="font-semibold text-green-600">
                      {stats.completedSessions}
                    </span>
                  </div>
                )}
                {stats.failedSessions !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Failed Sessions:</span>
                    <span className="font-semibold text-red-600">
                      {stats.failedSessions}
                    </span>
                  </div>
                )}
                {stats.runningSessions !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Running Sessions:</span>
                    <span className="font-semibold text-blue-600">
                      {stats.runningSessions}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h4 className="text-md font-semibold text-gray-700 mb-4">
                Quick Actions
              </h4>
              <div className="space-y-3">
                <button
                  onClick={fetchStats}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Refresh Analytics
                </button>
                <button
                  onClick={fetchLogs}
                  className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Recent Logs
                </button>
                <button
                  onClick={() => setActiveTab("control")}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Run New Scraper
                </button>
              </div>
            </div>
          </div>

          {stats.statsByScraper &&
            Object.keys(stats.statsByScraper).length > 0 && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h4 className="text-md font-semibold text-gray-700 mb-4">
                  Stats by Scraper
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(stats.statsByScraper).map(
                    ([scraperId, scraperStats]) => {
                      const scraperName =
                        AVAILABLE_SCRAPERS.find((s) => s.id === scraperId)
                          ?.name || scraperId;
                      const successRate =
                        scraperStats.total > 0
                          ? Math.round(
                              (scraperStats.completed / scraperStats.total) *
                                100
                            )
                          : 0;

                      return (
                        <div
                          key={scraperId}
                          className="bg-white p-4 rounded-lg border border-gray-200"
                        >
                          <h5 className="font-semibold text-gray-800 mb-2">
                            {scraperName}
                          </h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Runs:</span>
                              <span className="font-medium">
                                {scraperStats.total}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Completed:</span>
                              <span className="font-medium text-green-600">
                                {scraperStats.completed}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Failed:</span>
                              <span className="font-medium text-red-600">
                                {scraperStats.failed}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Jobs Found:</span>
                              <span className="font-medium text-blue-600">
                                {scraperStats.jobs_found}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Success Rate:
                              </span>
                              <span
                                className={`font-medium ${
                                  successRate >= 80
                                    ? "text-green-600"
                                    : successRate >= 50
                                    ? "text-yellow-600"
                                    : "text-red-600"
                                }`}
                              >
                                {successRate}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}

          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">
                  Analytics Information
                </h4>
                <p className="text-sm text-blue-800">
                  Analytics are updated in real-time as scrapers run. Use the
                  "Refresh Analytics" button to get the latest statistics. All
                  times are in your local timezone.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScraperTab;
