"use client";
import { supabase } from "@/lib/supabaseClient";
import { EditResumeModal } from "./EditResume";
import { useCallback } from "react";
import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Upload,
  Trash2,
  Eye,
  Edit3,
  Send,
  Star,
  Download,
} from "lucide-react";
import { Resume, ResumeTabProps, AuthUser } from "@/types/user/index";
import mammoth from "mammoth";
import { CompareResumePanel } from "./CompareResumePanel";
import { pdfToText } from "pdf-ts";
export const ResumeTab: React.FC<ResumeTabProps> = ({ user, darkMode }) => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [editingResume, setEditingResume] = useState<Resume | null>(null);
  const [sendingResume, setSendingResume] = useState<string | null>(null);
  const AuthUser = user;
  useEffect(() => {
    const stored = localStorage.getItem(`resumes-${user.id}`);
    if (stored) setResumes(JSON.parse(stored));
  }, [user.id]);
  const saveToLocal = (data: Resume[]) => {
    localStorage.setItem(`resumes-${user.id}`, JSON.stringify(data));
  };
  const formatDate = (value?: string): string =>
    value ? new Date(value).toLocaleDateString() : "Unknown";

  // Fetch resumes from Supabase
  const fetchResumes = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("❌ Failed to fetch resumes:", error);
        return;
      }

      // Generate signed URLs for each resume
      const enrichedResumes = await Promise.all(
        data.map(async (resume) => {
          const { data: signedData } = await supabase.storage
            .from("resumes")
            .createSignedUrl(resume.file_path, 3600);

          return {
            ...resume,
            file_url: signedData?.signedUrl || "",
          };
        })
      );

      setResumes(enrichedResumes);

      // Save to localStorage as backup
      localStorage.setItem(
        `resumes-${user.id}`,
        JSON.stringify(enrichedResumes)
      );
    } catch (error) {
      console.error("Error fetching resumes:", error);
      // Try to load from localStorage as fallback
      const stored = localStorage.getItem(`resumes-${user.id}`);
      if (stored) {
        setResumes(JSON.parse(stored));
      }
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

 const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Unsupported file format. Please upload PDF, DOC, DOCX, or TXT.");
      return;
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const storagePath = `user_${user.id}/${Date.now()}_${safeName}`;

    setUploading(true);

    try {
      let cleanText = "";
      let rawText = "";

      // Extract text based on file type
      if (file.type === "application/pdf") {
        try {
          const buffer = await file.arrayBuffer();
          const text = await pdfToText(new Uint8Array(buffer));
          cleanText = text.replace(/\s+/g, " ").trim();
          rawText = text;
        } catch (pdfError) {
          console.warn("PDF parsing failed, storing as binary file:", pdfError);
          cleanText = "PDF content available for download";
          rawText = "PDF content available for download";
        }
      } else if (file.name.endsWith(".docx")) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        cleanText = result.value?.replace(/\s+/g, " ").trim() || "";
        rawText = result.value || "";
      } else if (file.type === "text/plain") {
        const text = await file.text();
        cleanText = text.replace(/\s+/g, " ").trim();
        rawText = text;
      }

      // Get current user session for auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("No authentication session found");
      }

      // Upload to Supabase Storage with proper authentication
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(storagePath, file, {
          upsert: true,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Create signed URL
      const { data: signedData, error: signedError } = await supabase.storage
        .from("resumes")
        .createSignedUrl(storagePath, 3600);

      if (signedError) {
        throw new Error(`Signed URL failed: ${signedError.message}`);
      }

      // Insert metadata into database
      const { data: insertData, error: insertError } = await supabase
        .from("resumes")
        .insert([
          {
            user_id: user.id,
            file_name: safeName,
            file_path: storagePath,
            file_size: Number(file.size),
            file_type: file.type,
            clean_text: cleanText,
            raw_text: rawText,
            resume_text: cleanText, // For backward compatibility
            is_default: resumes.length === 0, // First resume becomes default
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (insertError) {
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      // Log to admin
      await supabase.from("admin_logs").insert({
        action: "resume_uploaded",
        user_id: user.id,
        details: {
          resume_id: insertData.id,
          file_name: safeName,
          file_size: file.size,
          file_type: file.type,
        },
        timestamp: new Date().toISOString(),
      });

      // Refresh the resumes list
      await fetchResumes();

      alert("Resume uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      alert(
        `Upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  // Set default resume
  const setDefaultResume = async (id: string) => {
    try {
      // Remove default from all resumes
      await supabase
        .from("resumes")
        .update({ is_default: false })
        .eq("user_id", user.id);

      // Set new default
      await supabase.from("resumes").update({ is_default: true }).eq("id", id);

      // Log to admin
      await supabase.from("admin_logs").insert({
        action: "resume_set_default",
        user_id: user.id,
        details: { resume_id: id },
        timestamp: new Date().toISOString(),
      });

      await fetchResumes();
    } catch (error) {
      console.error("Error setting default resume:", error);
      alert("Failed to set default resume");
    }
  };

  // Delete resume
  const deleteResume = async (resume: Resume) => {
    if (!confirm(`Are you sure you want to delete "${resume.file_name}"?`)) {
      return;
    }

    try {
      // Delete from storage
      await supabase.storage.from("resumes").remove([resume.file_path]);

      // Delete from database
      await supabase.from("resumes").delete().eq("id", resume.id);

      // Log to admin
      await supabase.from("admin_logs").insert({
        action: "resume_deleted",
        user_id: user.id,
        details: {
          resume_id: resume.id,
          file_name: resume.file_name,
        },
        timestamp: new Date().toISOString(),
      });

      await fetchResumes();
    } catch (error) {
      console.error("Error deleting resume:", error);
      alert("Failed to delete resume");
    }
  };

  // Send resume to job
  const sendResumeToJob = async (resume: Resume) => {
    setSendingResume(resume.id);
    try {
      // Log the send action
      await supabase.from("admin_logs").insert({
        action: "resume_sent_to_job",
        user_id: user.id,
        details: {
          resume_id: resume.id,
          file_name: resume.file_name,
        },
        timestamp: new Date().toISOString(),
      });

      alert("✅ Resume sending logged successfully!");
    } catch (error) {
      console.error("Error logging resume send:", error);
      alert("Failed to log resume send");
    } finally {
      setSendingResume(null);
    }
  };
  function isValidResume(resume: any): resume is Resume {
    return (
      typeof resume.file_url === "string" &&
      (typeof resume.is_default === "boolean" ||
        typeof resume.is_default === "undefined")
    );
  }

  // Download resume
  const downloadResume = async (resume: Resume) => {
    try {
      if (!resume.file_url) {
        alert("Resume file URL is missing.");
        return;
      }

      const response = await fetch(resume.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = resume.file_name || "resume";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Log download
      await supabase.from("admin_logs").insert({
        action: "resume_downloaded",
        user_id: user.id,
        details: {
          resume_id: resume.id,
          file_name: resume.file_name,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download resume");
    }
  };

  const renderPreview = (resume: Resume) => {
    if (previewId !== resume.id) return null;

    if (resume.file_type === "application/pdf" && resume.file_url) {
      return (
        <div className="mt-4">
          <iframe
            src={resume.file_url}
            width="100%"
            height="600px"
            className="rounded border"
            title="Resume Preview"
          />
        </div>
      );
    } else {
      return (
        <div
          className={`mt-4 p-4 border rounded ${
            darkMode
              ? "bg-gray-900 border-gray-700"
              : "bg-white border-gray-300"
          }`}
        >
          <pre
            className={`whitespace-pre-wrap text-sm ${
              darkMode ? "text-gray-200" : "text-gray-700"
            }`}
          >
            {resume.clean_text ||
              resume.resume_text ||
              "❌ No preview available."}
          </pre>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div
        className={`${
          darkMode ? "bg-gray-800" : "bg-white"
        } rounded-lg shadow p-6`}
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span
            className={`ml-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}
          >
            Loading resumes...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${
        darkMode ? "bg-gray-800" : "bg-white"
      } rounded-lg shadow p-6`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2
          className={`text-2xl font-bold flex items-center ${
            darkMode ? "text-gray-100" : "text-gray-900"
          }`}
        >
          <FileText className="w-6 h-6 mr-2" />
          Resume Management
        </h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? "Uploading..." : "Upload Resume"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Resumes Grid */}
      <div className="grid gap-6">
        {resumes.length === 0 ? (
          <div
            className={`text-center py-12 ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No resumes uploaded yet</p>
            <p>Click "Upload Resume" to get started</p>
          </div>
        ) : (
          resumes.map((resume) => (
            <div
              key={resume.id}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                darkMode
                  ? "border-gray-600 hover:bg-gray-700"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              {/* Resume Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div>
                    <h3
                      className={`font-medium flex items-center ${
                        darkMode ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      {resume.file_name}
                      {resume.is_default && (
                        <Star className="w-4 h-4 text-yellow-500 ml-2 fill-current" />
                      )}
                    </h3>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Updated {formatDate(resume.updated_at)} •{" "}
                      {resume.file_type?.split("/")[1]?.toUpperCase()}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      setPreviewId(previewId === resume.id ? null : resume.id)
                    }
                    title="Toggle Preview"
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => downloadResume(resume)}
                    title="Download Resume"
                    className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setEditingResume(resume)}
                    title="Edit Resume"
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => sendResumeToJob(resume)}
                    disabled={sendingResume === resume.id}
                    title="Send to Job"
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors disabled:opacity-50"
                  >
                    {sendingResume === resume.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => setDefaultResume(resume.id)}
                    title="Set as Default"
                    className={`p-2 rounded transition-colors ${
                      resume.is_default
                        ? "text-yellow-500"
                        : darkMode
                        ? "text-gray-400 hover:text-yellow-500"
                        : "text-gray-600 hover:text-yellow-500"
                    }`}
                  >
                    <Star className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => deleteResume(resume)}
                    title="Delete Resume"
                    className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Preview */}
              {renderPreview(resume)}

              {/* Compare Panel */}
              <div className="mt-4">
                <CompareResumePanel
                  resume={resumes[0]} // ✅ required
                  resumeText={resumes[0]?.clean_text || ""}
                  resumeId={resumes[0]?.id || ""}
                  authUser={user}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingResume && (
        <EditResumeModal
          resume={editingResume}
          isOpen={!!editingResume}
          onClose={() => setEditingResume(null)}
          onSave={(updatedResume) => {
            setResumes(
              resumes.map((r) =>
                r.id === updatedResume.id ? updatedResume : r
              )
            );
            setEditingResume(null);
          }}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};
