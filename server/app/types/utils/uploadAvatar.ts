export const uploadAvatar = async (userId: string, formData: FormData) => {
  try {
    const response = await fetch(`/api/users/${userId}/avatar`, {
      method: 'POST',
      body: formData,
      headers: {
       },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      avatar_url: result.avatar_url,
      error: null
    };
  } catch (error) {
    return {
      success: false,
      avatar_url: null,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};