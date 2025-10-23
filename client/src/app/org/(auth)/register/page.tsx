// client/src/app/org/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthUserContext';
import Link from 'next/link';
import { Building2, Mail, Lock, Users, Globe, Briefcase } from 'lucide-react';

interface OrgRegistrationData {
  // Organization details
  orgName: string;
  orgSlug: string;
  industry: string;
  size: string;
  website: string;
  
  // Admin user details
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  position: string;
}

export default function OrgRegisterPage() {
  const router = useRouter();
  const { signUp, signIn } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<OrgRegistrationData>({
    orgName: '',
    orgSlug: '',
    industry: '',
    size: '1-10',
    website: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    position: '',
  });

  const validateStep1 = () => {
    if (!formData.orgName || !formData.orgSlug) {
      setError('Organization name and ID are required');
      return false;
    }
    
    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(formData.orgSlug)) {
      setError('Organization ID can only contain lowercase letters, numbers, and hyphens');
      return false;
    }
    
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    if (!formData.email || !formData.password || !formData.fullName) {
      setError('All fields are required');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    
    setLoading(true);
    setError(null);

    try {
      let userId: string | undefined;
      
      // Try to create a new user account
      const { user: newUser, error: signUpError } = await signUp(
        formData.email,
        formData.password,
        {
          full_name: formData.fullName,
          role: 'org_admin',
          is_org_owner: true,
        }
      );

      if (signUpError) {
        // Check if user already exists
        if (signUpError.message?.includes('already registered') || 
            signUpError.message?.includes('already exists') ||
            signUpError.message?.includes('User already registered')) {
          
          // User exists - try to sign them in instead
          const { user: existingUser, error: signInError } = await signIn(
            formData.email,
            formData.password
          );
          
          if (signInError) {
            throw new Error('This email is already registered with a different password. Please use the login page or reset your password.');
          }
          
          userId = existingUser?.id;
          console.log('✅ Signed in existing user:', userId);
        } else {
          // Different error
          throw signUpError;
        }
      } else {
        userId = newUser?.id;
        console.log('✅ Created new user:', userId);
      }

      if (!userId) {
        throw new Error('Failed to get user ID');
      }

      // Create organization with the authenticated user
      const response = await fetch('/api/org/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookies
        body: JSON.stringify({
          name: formData.orgName,
          slug: formData.orgSlug,
          industry: formData.industry,
          size: formData.size,
          website: formData.website,
          adminUserId: userId,
          adminPosition: formData.position,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to create organization');
      }

      console.log('✅ Organization created:', result.organization.slug);

      // Redirect to organization dashboard
      router.push(`/org/${result.organization.slug}/dashboard`);
      
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create Organization
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Set up your team's workspace
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              1
            </div>
            <div className={`w-20 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
            }`}>
              2
            </div>
          </div>
        </div>

        {step === 1 ? (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Organization Details
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Organization Name *
              </label>
              <input
                type="text"
                required
                placeholder="Acme Corporation"
                value={formData.orgName}
                onChange={(e) =>
                  setFormData({ ...formData, orgName: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Organization ID *
              </label>
              <input
                type="text"
                required
                placeholder="acme-corp"
                value={formData.orgSlug}
                onChange={(e) =>
                  setFormData({ 
                    ...formData, 
                    orgSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                This will be your unique organization identifier
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Industry
              </label>
              <select
                value={formData.industry}
                onChange={(e) =>
                  setFormData({ ...formData, industry: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select an industry</option>
                <option value="technology">Technology</option>
                <option value="healthcare">Healthcare</option>
                <option value="finance">Finance</option>
                <option value="education">Education</option>
                <option value="retail">Retail</option>
                <option value="manufacturing">Manufacturing</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Size
              </label>
              <select
                value={formData.size}
                onChange={(e) =>
                  setFormData({ ...formData, size: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="500+">500+ employees</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Website
              </label>
              <input
                type="url"
                placeholder="https://example.com"
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              onClick={() => {
                if (validateStep1()) setStep(2);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
            >
              Continue
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Admin Account Details
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Work Email *
              </label>
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Position/Title
              </label>
              <input
                type="text"
                placeholder="HR Manager"
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => setStep(1)}
                className="w-1/2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-4 rounded-lg transition duration-200"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto" />
                ) : (
                  'Create Organization'
                )}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an organization?{' '}
            <Link
              href="/org/login"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}