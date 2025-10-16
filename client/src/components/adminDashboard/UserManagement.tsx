 "use client"
import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  Edit,
  RefreshCw,
  Mail,
  Calendar,
  FileText,
  Send,
  User,
  MapPin,
  Crown,
  Users,
} from "lucide-react";
import { AdminUser } from "@/types/admin/admin_authuser";
import { useRouter } from "next/navigation";
import { AuthUser } from "@/types/user/authUser";
import Link from 'next/link';
interface UserManagementProps {
  user: AuthUser;
  onStatsUpdate: () => void;
}

type FilterStatus = "all" | "active" | "inactive";

export const UserManagement: React.FC<UserManagementProps> = ({
  user,
  onStatsUpdate,
}) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Memoize the filtered users to prevent unnecessary recalculations
  const filteredUsers = React.useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        // user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        filterStatus === "all" || user.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [users, searchTerm, filterStatus]);

  // Use useCallback to prevent unnecessary re-renders
const fetchUsers = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    console.log("🔄 Fetching users...");
 const response = await fetch(`/api/admin/users?search=${searchTerm}&status=${filterStatus}`);

    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch users: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("📊 API Response:", data);
    
    // Handle the updated API response format
    const usersArray = data.users || data || [];
    
    if (!Array.isArray(usersArray)) {
      console.error("❌ Expected users array, got:", typeof usersArray);
      throw new Error("Invalid response format: users data is not an array");
    }
    
    console.log(`✅ Successfully loaded ${usersArray.length} users`);
    setUsers(usersArray);
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to fetch users";
    console.error("❌ Error fetching users:", errorMessage);
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
}, []);
  const handleDeleteUser = useCallback(async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete user: ${response.status}`);
      }

      // Remove user from local state
      setUsers(prev => prev.filter(u => u.id !== userId));
      setSelectedUsers(prev => prev.filter(id => id !== userId));
      // Only update stats after successful deletion
      onStatsUpdate();

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
      console.error("Error deleting user:", err);
    }
  }, [onStatsUpdate]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedUsers.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedUsers.length} users? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const deletePromises = selectedUsers.map(userId =>
        fetch(`/api/admin/users/${userId}`, { method: "DELETE" })
      );

      await Promise.all(deletePromises);

      // Remove deleted users from local state
      setUsers(prev => prev.filter(u => !selectedUsers.includes(u.id)));
      setSelectedUsers([]);
      // Only update stats after successful bulk deletion
      onStatsUpdate();

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete users");
      console.error("Error bulk deleting users:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedUsers, onStatsUpdate]);

  const handleSelectAll = useCallback(() => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((user) => user.id));
    }
  }, [selectedUsers.length, filteredUsers]);

  const handleUserSelect = useCallback((userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  }, []);

  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  }, []);

  const getStatusBadge = useCallback((status?: string) => {
    const isActive = status === "active";
    return (
      <span
        className={`px-2 py-1 text-xs rounded-full ${
          isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
        }`}
      >
        {isActive ? "Active" : "Inactive"}
      </span>
    );
  }, []);

  const getSubscriptionBadge = useCallback((type?: string) => {
    const isEnterprise = type === "enterprise";
    return (
      <span
        className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
          isEnterprise ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"
        }`}
      >
        {isEnterprise && <Crown className="w-3 h-3 mr-1" />}
        {isEnterprise ? "Pro" : "Free"}
      </span>
    );
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Clear selected users when filtered users change
  useEffect(() => {
    const validSelectedUsers = selectedUsers.filter(id =>
      filteredUsers.some(user => user.id === id)
    );
    if (validSelectedUsers.length !== selectedUsers.length) {
      setSelectedUsers(validSelectedUsers);
    }
  }, [filteredUsers, selectedUsers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
        <div className="flex items-center space-x-3">
          {selectedUsers.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected ({selectedUsers.length})
            </button>
          )}
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-gray-900">
            {filteredUsers.length}
          </div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-green-600">
            {filteredUsers.filter((u) => u.status === "active").length}
          </div>
          <div className="text-sm text-gray-600">Active Users</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-yellow-600">
            {
              filteredUsers.filter((u) => u.subscription_type === "enterprise")
                .length
            }
          </div>
          <div className="text-sm text-gray-600">Enterprise Users</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-blue-600">
            {filteredUsers.reduce(
              (sum, u) => sum + (u.applications_sent || 0),
              0
            )}
          </div>
          <div className="text-sm text-gray-600">Total Applications</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((userRecord) => (
                <tr key={userRecord.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(userRecord.id)}
                      onChange={(e) => handleUserSelect(userRecord.id, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">
                          {userRecord.full_name || userRecord.full_name || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {userRecord.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-900">
                        <Mail className="w-4 h-4 mr-1 text-gray-400" />
                        {userRecord.email || "N/A"}
                      </div>
                      {userRecord.location && userRecord.location !== "N/A" && (
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                          {userRecord.location}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-900">
                        <Send className="w-4 h-4 mr-1 text-gray-400" />
                        {userRecord.applications_sent || 0} applications
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <FileText className="w-4 h-4 mr-1 text-gray-400" />
                        {userRecord.resumes_uploaded || 0} resumes
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        Joined {formatDate(userRecord.joined_date)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(userRecord.status)}
                  </td>
                  <td className="px-6 py-4">
                    {getSubscriptionBadge(userRecord.subscription_type)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => router.push(`/admin/users/${userRecord.id}`)}
                        className="text-gray-400 hover:text-gray-600"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <Link href={`/admin/users/${userRecord.id}`}>Edit</Link>
                      {/* <button
                        onClick={() => router.push(`/admin/users/${userRecord.id}`)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Edit user"
                      >
                        <Edit className="w-4 h-4" />
                      </button> */}
                      <button
                        onClick={() => handleDeleteUser(userRecord.id)}
                        className="text-red-400 hover:text-red-600"
                        title="Delete user"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
            <Users className="w-full h-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No users found
          </h3>
          <p className="text-gray-500">
            {searchTerm || filterStatus !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Users will appear here once they register."}
          </p>
        </div>
      )}
    </div>
  );
};