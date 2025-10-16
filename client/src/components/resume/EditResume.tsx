"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  FileText,
  Upload,
  Trash2,
  Eye,
  Star,
  Edit3,
  Download,
  Send,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { pdfToText } from "pdf-ts";
import mammoth from "mammoth";
import { supabase } from "@/lib/supabaseClient";
import { CompareResumePanel } from "./CompareResumePanel";
import type { Resume, AuthUser,EditResumeModalProps } from "@/types/user/index";

interface ResumeTabProps {
  user: AuthUser;
  darkMode: boolean;
}
export const EditResumeModal: React.FC<EditResumeModalProps> = ({
  resume,
  isOpen,
  onClose,
  onSave,
  darkMode,
}) => {
  const [editedResume, setEditedResume] = useState<Resume>(resume);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditedResume(resume);
  }, [resume]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update in Supabase
      const { error } = await supabase
        .from("resumes")
        .update({
          file_name: editedResume.file_name,
          clean_text: editedResume.clean_text,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editedResume.id);

      if (error) throw error;

      // Log to admin
      await supabase.from("admin_logs").insert({
        action: "resume_updated",
        user_id: editedResume.user_id,
        details: {
          resume_id: editedResume.id,
          file_name: editedResume.file_name,
          updated_fields: ["file_name", "clean_text"],
        },
        timestamp: new Date().toISOString(),
      });

      onSave(editedResume);
      onClose();
    } catch (error) {
      console.error("Error updating resume:", error);
      alert("Failed to update resume");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`${
          darkMode ? "bg-gray-800" : "bg-white"
        } rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3
            className={`text-xl font-bold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Edit Resume
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              File Name
            </label>
            <input
              type="text"
              value={editedResume.file_name || ""}
              onChange={(e) =>
                setEditedResume({ ...editedResume, file_name: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-md ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            />
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Resume Content
            </label>
            <textarea
              value={editedResume.clean_text || ""}
              onChange={(e) =>
                setEditedResume({ ...editedResume, clean_text: e.target.value })
              }
              rows={15}
              className={`w-full px-3 py-2 border rounded-md ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};
