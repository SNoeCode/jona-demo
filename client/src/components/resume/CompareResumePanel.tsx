"use client";
import { AuthUser } from "@/types/user/index";
import type { Resume } from "@/types/user/index"; // ✅ adjust path if needed
import React, { useState, useEffect } from "react";
import { useApplicationTracker } from "../../hooks/useApplicationTracker";


export interface CompareResumePanelProps {
   resume: Resume;
  resumeText: string;
  resumeId: string;
  authUser: AuthUser;
  engine?: "native" | "openai";
}


interface JobMatch {
  id: string;
  title: string;
  company: string;
  match_score?: number;
  matched_skills?: string[];
}

export const CompareResumePanel: React.FC<CompareResumePanelProps> = ({
  resumeText,
  
  resumeId,
  authUser,
  engine = "native",
}) => {
  const [mounted, setMounted] = useState(false);
  const [topJobs, setTopJobs] = useState<JobMatch[]>([]);
  const [currentEngine, setCurrentEngine] = useState<"native" | "openai">(engine);
  const [loading, setLoading] = useState(false);
  const [jobStatusMap, setJobStatusMap] = useState<{
    [jobId: string]: "pending" | "success" | "error";
  }>({});

  const { addSubmission } = useApplicationTracker(authUser.id);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCompare = async () => {
    setLoading(true);
    try {
      const endpoint =
        currentEngine === "openai"
          ? "http://localhost:8000/openai-match-top-jobs"
          : "http://localhost:8000/match-top-jobs";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: resumeText }),
      });

      const data = await response.json();
      setTopJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Comparison failed:", err);
      alert("Could not fetch top matches.");
    } finally {
      setLoading(false);
    }
  };

  const sendResume = async (
    jobId: string,
    jobTitle: string,
    company: string
  ) => {
    if (!authUser?.id || !authUser?.email || !resumeId) {
      alert("Missing user or resume information. Cannot send.");
      return;
    }

    setJobStatusMap((prev) => ({ ...prev, [jobId]: "pending" }));

    try {
      const response = await fetch("http://localhost:8000/send-resume-to-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text: resumeText,
          job_ids: [jobId],
          user_id: authUser.id,
          user_email: authUser.email,
          resume_id: resumeId,
        }),
      });

      const result = await response.json();
      setJobStatusMap((prev) => ({ ...prev, [jobId]: "success" }));

 addSubmission({
  id: jobId,
  job_id: jobId,
  user_id: authUser.id,
  job_title: jobTitle,
  company,
  submittedTo: result.submitted_to,
  resumeLength: result.resume_length,
});
      alert(`📨 Resume sent to ${jobTitle} at ${company}`);
    } catch {
      setJobStatusMap((prev) => ({ ...prev, [jobId]: "error" }));
      alert("Failed to send resume.");
    }
  };

  if (!mounted) return null;

  return (
    <div className="p-6 border rounded bg-white shadow">
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex gap-3 items-center">
          <label className="text-sm font-medium">Matching Engine:</label>
          <select
            value={currentEngine}
            onChange={(e) => {
              const selected = e.target.value as "native" | "openai";
              setCurrentEngine(selected);
            }}
            className="px-2 py-1 border rounded text-sm"
          >
            <option value="native">🧮 Keyword Matcher</option>
            <option value="openai">🤖 OpenAI Smart Matcher</option>
          </select>
        </div>

        <button
          onClick={handleCompare}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          {loading ? "Comparing..." : "Compare Resume to Jobs"}
        </button>
      </div>

      {topJobs.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-bold mb-2">Top Matching Jobs</h3>
          <ul className="space-y-4">
            {topJobs.map((job) => (
              <li key={job.id} className="border p-4 rounded">
                <h4 className="font-semibold">
                {job.title ?? "Untitled"} @ {job.company ?? "Unknown"}
                </h4>
                <p className="text-sm text-gray-600">
                  Match Score: <strong>{job.match_score ?? "N/A"}</strong>
                </p>

                {Array.isArray(job.matched_skills) && job.matched_skills.length > 0 ? (
                  <div className="mt-2 text-sm">
                    <span>Matched Skills:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {job.matched_skills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm italic text-gray-500 mt-1">
                    No significant overlap.
                  </p>
                )}

                <button
                  onClick={() => sendResume(job.id, job.title, job.company)}
                  className="mt-3 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Send Resume
                </button>

                {jobStatusMap[job.id] === "success" && (
                  <p className="text-green-600 text-sm mt-1">✅ Resume sent</p>
                )}
                {jobStatusMap[job.id] === "error" && (
                  <p className="text-red-600 text-sm mt-1">❌ Send failed</p>
                )}
                {jobStatusMap[job.id] === "pending" && (
                  <p className="text-yellow-500 text-sm mt-1 animate-pulse">
                    ⏳ Sending...
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
