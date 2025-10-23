// jobScraper/client/src/lib/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '', // Use relative path for Next.js API routes
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
  },
  timeout: 10000,
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Axios error:', error);
    return Promise.reject(error);
  }
);

export default api;