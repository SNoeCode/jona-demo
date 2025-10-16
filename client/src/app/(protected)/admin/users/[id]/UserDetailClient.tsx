"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Crown,
  RefreshCw,
  Edit,
  Trash2,
  User,
  Mail,
  MapPin,
  Calendar,
  Activity,
  Settings,
  Send,
  FileText,
} from "lucide-react";
import { AdminUser } from "@/types/admin/admin_authuser";
import { UserProfile } from "@/types/user/profile";
import {getUserProfile } from "@/app/services/server-user/server_user";

interface UserDetailClientProps {
  userId: string;
}

type ErrorState = { message: string; status?: number } | null;

const UserDetailClient: React.FC<UserDetailClientProps> = ({ userId }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    location: "",
    email: "",
  });

  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    let statusCode = 500;

    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      statusCode = response.status;

      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${statusCode}`);
      }

      const userData = await response.json();
      setUser(userData);
      setEditForm({
        full_name: userData.full_name || "",
        location: userData.location || "",
        email: userData.email || "",
      });

      const profileData = await getUserProfile(userData.id);
      setProfile(profileData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError({ message, status: statusCode });
      console.error("Error fetching user:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_metadata: {
            full_name: editForm.full_name,
            location: editForm.location,
          },
          email: editForm.email,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update user: ${response.status}`);
      }

      await fetchUser();
      setIsEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update user";
      setError({ message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !user ||
      !confirm("Are you sure you want to delete this user? This action cannot be undone.")
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete user: ${response.status}`);
      }

      router.push("/admin/users");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete user";
      setError({ message });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadge = (status?: string) => {
    const isActive = status === "active";
    return (
      <span
        className={`px-3 py-1 text-sm rounded-full font-medium ${
          isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
        }`}
      >
        {isActive ? "Active" : "Inactive"}
      </span>
    );
  };

  const getSubscriptionBadge = (type?: string) => {
    const isEnterprise = type === "enterprise";
    return (
      <span
        className={`inline-flex items-center px-3 py-1 text-sm rounded-full font-medium ${
          isEnterprise ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"
        }`}
      >
        {isEnterprise && <Crown className="w-4 h-4 mr-1" />}
        {isEnterprise ? "Pro" : "Free"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error.message}
        </div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-500">User not found</div>
        <button
          onClick={() => router.back()}
          className="mt-4 inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user.full_name || "Unknown User"}
            </h1>
            <p className="text-gray-600">ID: {user.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchUser}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-800"
          >
            <RefreshCw
              className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Edit className="w-4 h-4 mr-2" />
            {isEditing ? "Cancel" : "Edit"}
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-lg font-semibold mb-4">User Information</h2>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, full_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) =>
                      setEditForm({ ...editForm, location: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleUpdate}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Full Name</div>
                      <div className="font-medium">
                        {user.full_name || "N/A"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Email</div>
                      <div className="font-medium">{user.email || "N/A"}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Location</div>
                      <div className="font-medium">
                        {user.location || "N/A"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Joined Date</div>
                      <div className="font-medium">
                        {formatDate(user.joined_date)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Activity className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Last Login</div>
                      <div className="font-medium">
                        {formatDate(user.last_login ?? undefined)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Settings className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Status</div>
                      <div className="font-medium">
                        {getStatusBadge(user.status)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats & Subscription */}
        <div className="space-y-6">
          {/* Subscription */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold mb-4">Subscription</h3>
            <div className="text-center">
              {getSubscriptionBadge(user.subscription_type)}
            </div>
          </div>

          {/* Activity Stats */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold mb-4">Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Send className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Applications Sent
                  </span>
                </div>
                <span className="font-semibold">
                  {user.applications_sent || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Resumes Uploaded
                  </span>
                </div>
                <span className="font-semibold">
                  {user.resumes_uploaded || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Profile Complete
                  </span>
                </div>
                <span
                  className={`text-sm font-medium ${
                    user.profile_completed ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {user.profile_completed ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>

          {/* Raw Data (for debugging) */}
          {profile && (
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold mb-4">Additional Data</h3>
              <div className="text-xs text-gray-600 space-y-2">
                <div>
                  <strong>Profile ID:</strong> {profile.id || "N/A"}
                </div>
                {profile.created_at && (
                  <div>
                    <strong>Profile Created:</strong>{" "}
                    {formatDate(profile.created_at)}
                  </div>
                )}
                {profile.updated_at && (
                  <div>
                    <strong>Profile Updated:</strong>{" "}
                    {formatDate(profile.updated_at)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailClient;