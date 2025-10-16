"use client";

import type { AdminResume } from "@/types/admin/admin_resume";

export class ResumeService {
  static async getAllResumes(): Promise<AdminResume[]> {
    try {
      const response = await fetch("/api/admin/resumes");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching resumes via API:", error);
      throw error;
    }
  }

  static async getResumeById(id: string): Promise<AdminResume> {
    const response = await fetch(`/api/admin/resumes/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch resume: ${response.status}`);
    }
    return await response.json();
  }

  static async deleteResume(id: string): Promise<void> {
    const response = await fetch(`/api/admin/resumes/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete resume: ${response.status}`);
    }
  }

  static async updateResume(id: string, updates: Partial<AdminResume>): Promise<AdminResume> {
    const response = await fetch(`/api/admin/resumes/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update resume: ${response.status}`);
    }

    return await response.json();
  }

  static async deleteMultipleResumes(ids: string[]): Promise<void> {
    const deletePromises = ids.map(id => this.deleteResume(id));
    await Promise.all(deletePromises);
  }
}

// Alternative hook-based approach for React components
export function useResumeService() {
  return {
    getAllResumes: ResumeService.getAllResumes,
    getResumeById: ResumeService.getResumeById,
    deleteResume: ResumeService.deleteResume,
    updateResume: ResumeService.updateResume,
    deleteMultipleResumes: ResumeService.deleteMultipleResumes,
  };
}