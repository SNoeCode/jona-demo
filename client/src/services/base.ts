let _baseURL: string | null = null;


export async function setAdminBaseURL(url: string): Promise<void> {
  _baseURL = url;
}

export async function getAdminBaseURL(): Promise<string> {
  if (!_baseURL) {
    _baseURL = process.env.NEXT_PUBLIC_ADMIN_BASE_URL || "/api/admin";
  }
  return _baseURL;
}

