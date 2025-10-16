"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Github,
  Briefcase,
  Building2,
  DollarSign,
  Camera,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { UserService } from "@/services/user-services/user-service";
import { useAuth } from "@/hooks/useAuth";
import type { UserProfile, ExperienceLevel } from "@/types/user/index";
import {  } from "@/services/user-services/profile-service";
import { uploadAvatar } from "@/utils/uploadAvatar";
import { updateUserProfile } from "@/services/user-services/user-server";
export interface ProfileUpdateResponse {
  success: boolean;
  error?: string;
  data?: UserProfile | null;
}
interface EditProfilePageProps {
  onBack?: () => void;
  onSave?: (profile: UserProfile) => void;
}

export default function EditProfilePage({
  onBack,
  onSave,
}: EditProfilePageProps) {
  const { authUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  useEffect(() => {
    const loadProfile = async () => {
      if (!authUser?.id) return;

      setLoading(true);
      setError(null);

      try {
        const profile = await UserService.getUserProfile(authUser.id);

        if (profile) {
          setProfile(profile);
        } else {
          // Create empty profile for new users
          const now = new Date().toISOString();
          setProfile({
            id: authUser.id,
            full_name: "",
            phone: "",
            location: "",
            bio: "",
            website: "",
            linkedin_url: "",
            github_url: "",
            job_title: "",
            company: "",
            experience_level: undefined,
            preferred_job_types: [],
            preferred_locations: [],
            salary_range_min: undefined,
            salary_range_max: undefined,
            created_at: now,
            updated_at: now,
          });
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load profile";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [authUser?.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile || !authUser?.id) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedProfile = await updateUserProfile(
        authUser.id,
        profile
      );

      if (updatedProfile) {
        setProfile(updatedProfile);
        setSuccess("Profile updated successfully!");
        onSave?.(updatedProfile);

        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unexpected error during profile update";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser?.id) return;

    setUploadingAvatar(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const result = await uploadAvatar(authUser.id, formData);

      if (result.success && result.avatar_url) {
        setProfile((prev) =>
          prev ? { ...prev, avatar_url: result.avatar_url } : null
        );
        setSuccess("Avatar uploaded successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(result.error || "Failed to upload avatar");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleInputChange = <K extends keyof UserProfile>(
    field: K,
    value: UserProfile[K]
  ) => {
    if (!profile) return;
    setProfile((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  
// ???***************************************EDITPROFILEPAGE
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile || !authUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Unable to load profile data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </button>

          <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
          <p className="text-gray-600">
            Update your personal information and preferences
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
              <p className="text-green-800">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Profile Form */}
        <div className="bg-white rounded-lg shadow">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <img
                  src={
                    profile.avatar_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      profile.full_name || authUser.email || "User"
                    )}&size=96&background=3b82f6&color=fff`
                  }
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
                <label className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 cursor-pointer">
                  {uploadingAvatar ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar || saving}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Profile Photo
                </h3>
                <p className="text-sm text-gray-600">
                  Upload a professional photo. JPG, PNG or GIF. Max size 5MB.
                </p>
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={profile.full_name || ""}
                      onChange={(e) =>
                        handleInputChange("full_name", e.target.value)
                      }
                      disabled={saving}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      value={authUser.email || ""}
                      disabled
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      value={profile.phone || ""}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      disabled={saving}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={profile.location || ""}
                      onChange={(e) =>
                        handleInputChange("location", e.target.value)
                      }
                      disabled={saving}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      placeholder="San Francisco, CA"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={profile.bio || ""}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  disabled={saving}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  placeholder="Tell us about yourself, your background, and career goals..."
                />
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                Professional Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={profile.job_title || ""}
                      onChange={(e) =>
                        handleInputChange("job_title", e.target.value)
                      }
                      disabled={saving}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      placeholder="Software Engineer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={profile.company || ""}
                      onChange={(e) =>
                        handleInputChange("company", e.target.value)
                      }
                      disabled={saving}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      placeholder="Tech Company Inc."
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Level
                  </label>
                  <select
                    value={profile.experience_level || ""}
                    onChange={(e) =>
                      handleInputChange(
                        "experience_level",
                        e.target.value as ExperienceLevel
                      )
                    }
                    disabled={saving}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  >
                    <option value="">Select experience level</option>
                    <option value="entry">Entry Level (0-2 years)</option>
                    <option value="mid">Mid Level (3-5 years)</option>
                    <option value="senior">Senior Level (6-10 years)</option>
                    <option value="executive">Executive (10+ years)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Salary Expectations */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                Salary Expectations
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Salary
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={profile.salary_range_min || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "salary_range_min",
                          parseInt(e.target.value) || undefined
                        )
                      }
                      disabled={saving}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      placeholder="50000"
                      min="0"
                      step="1000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Salary
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      value={profile.salary_range_max || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "salary_range_max",
                          parseInt(e.target.value) || undefined
                        )
                      }
                      disabled={saving}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      placeholder="100000"
                      min="0"
                      step="1000"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                Social Links
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="url"
                      value={profile.website || ""}
                      onChange={(e) =>
                        handleInputChange("website", e.target.value)
                      }
                      disabled={saving}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn
                  </label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="url"
                      value={profile.linkedin_url || ""}
                      onChange={(e) =>
                        handleInputChange("linkedin_url", e.target.value)
                      }
                      disabled={saving}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GitHub
                  </label>
                  <div className="relative">
                    <Github className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="url"
                      value={profile.github_url || ""}
                      onChange={(e) =>
                        handleInputChange("github_url", e.target.value)
                      }
                      disabled={saving}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                      placeholder="https://github.com/yourusername"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Job Preferences */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                Job Preferences
              </h3>

              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Job Types
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      "full-time",
                      "part-time",
                      "contract",
                      "remote",
                      "hybrid",
                      "on-site",
                    ].map((type) => (
                      <label key={type} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={
                            profile.preferred_job_types?.includes(type) || false
                          }
                          onChange={(e) => {
                            const currentTypes =
                              profile.preferred_job_types || [];
                            if (e.target.checked) {
                              handleInputChange("preferred_job_types", [
                                ...currentTypes,
                                type,
                              ]);
                            } else {
                              handleInputChange(
                                "preferred_job_types",
                                currentTypes.filter((t) => t !== type)
                              );
                            }
                          }}
                          disabled={saving}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">
                          {type.replace("-", " ")}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Locations
                  </label>
                  <textarea
                    value={profile.preferred_locations?.join(", ") || ""}
                    onChange={(e) => {
                      const locations = e.target.value
                        .split(",")
                        .map((loc) => loc.trim())
                        .filter((loc) => loc.length > 0);
                      handleInputChange("preferred_locations", locations);
                    }}
                    disabled={saving}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                    placeholder="San Francisco, New York, Remote, etc. (comma-separated)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter multiple locations separated by commas
                  </p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onBack}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
