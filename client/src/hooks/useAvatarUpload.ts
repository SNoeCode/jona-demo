import { useState } from 'react';
import { uploadAvatar } from '@/utils/uploadAvatar';
import type { EnhancedUserProfile } from '@/types/user';

export function useAvatarUpload(
  userId: string | null,
  setProfile: React.Dispatch<React.SetStateAction<EnhancedUserProfile | null>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
) {
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const result = await uploadAvatar(userId, formData);

      if (result.success && result.avatar_url) {
        setProfile(prev => prev ? { ...prev, avatar_url: result.avatar_url } : null);
        setSuccess('Avatar uploaded successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(result.error || 'Failed to upload avatar');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    success,
    handleAvatarUpload,
  };
}