'use client'

import React, { useState } from 'react';
import { 
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
  Save,
  Camera,
  Crown,
  Loader2
} from 'lucide-react';
import { updateUserProfile } from '@/services/user-services/profile-service'

import type { 
  EnhancedUserProfile, 
  CurrentSubscription, 
  AuthUser,
  ExperienceLevel 
} from '@/types/user/index';

export interface ProfileTabProps {
  profile: EnhancedUserProfile | null;
  setProfile: React.Dispatch<React.SetStateAction<EnhancedUserProfile | null>>;
  authUser: AuthUser;
  subscription: CurrentSubscription | null;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  onSave?: (updated: EnhancedUserProfile) => void;
  onError?: (msg: string) => void;
}

const ProfileTab = ({
  profile,
  setProfile,
  authUser,
  subscription,
  loading,
  setLoading,
  setError,
  onSave,
  onError
}: ProfileTabProps): JSX.Element => {
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profile || !authUser?.id) return;

    setLoading(true);
    setError(null);

    try {
      const updates = {
        full_name: profile.full_name,
        phone: profile.phone,
        location: profile.location,
        job_title: profile.job_title,
        company: profile.company,
        bio: profile.bio,
        website: profile.website,
        linkedin_url: profile.linkedin_url,
        github_url: profile.github_url,
        experience_level: profile.experience_level,
        salary_range_min: profile.salary_range_min,
        salary_range_max: profile.salary_range_max,
      };

      const updatedProfile = await updateUserProfile(authUser.id, updates);

      if (updatedProfile) {
        setProfile(updatedProfile);
        setSuccess('Profile updated successfully');
        setIsEditing(false);
        onSave?.(updatedProfile);
      } else {
        throw new Error('Profile update returned null');
      }
    } catch (err: any) {
      setError('Failed to update profile');
      onError?.(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser?.id) return;

    setUploadingAvatar(true);
    setError(null);

    try {
      // TODO: Implement avatar upload logic here
      // This would typically involve:
      // 1. Uploading the file to your storage service
      // 2. Getting the URL back
      // 3. Updating the profile with the new avatar_url
      
      console.log('Avatar upload not implemented yet', file);
      
      // Placeholder implementation:
      // const avatarUrl = await uploadAvatarToStorage(file, authUser.id);
      // if (profile) {
      //   const updatedProfile = await ProfileService.updateUserProfile(authUser.id, {
      //     avatar_url: avatarUrl
      //   });
      //   if (updatedProfile) {
      //     setProfile(updatedProfile);
      //     setSuccess('Avatar updated successfully');
      //   }
      // }
      
    } catch (err: any) {
      setError('Failed to upload avatar');
      onError?.(err.message || 'Unknown error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleInputChange = <K extends keyof EnhancedUserProfile>(
    field: K, 
    value: EnhancedUserProfile[K]
  ) => {
    if (!profile) return;
    setProfile(prev => prev ? { ...prev, [field]: value } : null);
  };
// ?/? ******************profiletabbbbb
  if (!profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Basic Info */}
      <div className="flex items-start gap-6">
        <div className="relative">
          <img
            src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || authUser.email || 'User')}&size=96&background=3b82f6&color=fff`}
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
              disabled={uploadingAvatar || loading}
              className="hidden"
            />
          </label>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {profile?.full_name || authUser.email}
              </h2>
              <p className="text-gray-600">
                {profile?.job_title}
                {profile?.company && profile?.job_title && ` at ${profile.company}`}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {subscription?.plan_name || 'Free'}
                  </span>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  subscription?.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : subscription?.status === 'canceled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {subscription?.status || 'free'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleProfileUpdate} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={profile?.full_name || ''}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                disabled={!isEditing || loading}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="Enter your full name"
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
                value={authUser.email || ''}
                disabled={true}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                value={profile?.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!isEditing || loading}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="Enter your phone number"
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
                value={profile?.location || ''}
                onChange={(e) => handleInputChange('location', e.target.value)}
                disabled={!isEditing || loading}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="Enter your location"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Title
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={profile?.job_title || ''}
                onChange={(e) => handleInputChange('job_title', e.target.value)}
                disabled={!isEditing || loading}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="Enter your job title"
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
                value={profile?.company || ''}
                onChange={(e) => handleInputChange('company', e.target.value)}
                disabled={!isEditing || loading}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="Enter your company"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            value={profile?.bio || ''}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            disabled={!isEditing || loading}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
            placeholder="Tell us about yourself"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="url"
                value={profile?.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
                disabled={!isEditing || loading}
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
                value={profile?.linkedin_url || ''}
                onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                disabled={!isEditing || loading}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GitHub
            </label>
            <div className="relative">
              <Github className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="url"
                value={profile?.github_url || ''}
                onChange={(e) => handleInputChange('github_url', e.target.value)}
                disabled={!isEditing || loading}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="https://github.com/yourusername"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experience Level
            </label>
            <select
              value={profile?.experience_level || ''}
              onChange={(e) => handleInputChange('experience_level', e.target.value as ExperienceLevel)}
              disabled={!isEditing || loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
            >
              <option value="">Select experience level</option>
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior Level</option>
              <option value="executive">Executive</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Salary
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="number"
                value={profile?.salary_range_min || ''}
                onChange={(e) => handleInputChange('salary_range_min', parseInt(e.target.value) || undefined)}
                disabled={!isEditing || loading}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="50000"
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
                value={profile?.salary_range_max || ''}
                onChange={(e) => handleInputChange('salary_range_max', parseInt(e.target.value) || undefined)}
                disabled={!isEditing || loading}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="100000"
              />
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProfileTab;
