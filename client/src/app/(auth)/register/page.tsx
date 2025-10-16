'use client';
import { useRouter } from 'next/navigation';
import RegistrationForm from '@/components/register/RegisterForm'

export default function RegisterPage() {
  const router = useRouter();

  const handleSuccess = (user: any) => {
    const role = user.user_metadata?.role || user.app_metadata?.role || 'user';
    const target = role === 'admin' ? '/admin/dashboard' : '/dashboard';
    router.push(target);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <RegistrationForm onSuccess={handleSuccess} />
    </div>
  );
}

