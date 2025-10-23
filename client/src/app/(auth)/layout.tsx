// jona-demo\client\src\app\(auth)\layout.tsx
'use client';
import { useAuth } from '@/context/AuthUserContext';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
