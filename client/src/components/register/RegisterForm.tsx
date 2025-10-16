"use client";

import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";

import {
  Upload,
  Briefcase,
  MapPin,
  DollarSign,
  Globe,
  Linkedin,
  Github,
  Image as ImageIcon,
  Check,
  Crown,
  Zap,
  Star,
} from "lucide-react";
import { User as UserIcon } from "lucide-react";
import { AuthUser } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

interface RegistrationFormProps {
  onSuccess: (user: User) => void;
  setCurrentPage?: (page: "login" | "register") => void;
}

const experienceLevels = [
  { value: "entry", label: "Entry Level (0-2 years)" },
  { value: "mid", label: "Mid Level (2-5 years)" },
  { value: "senior", label: "Senior Level (5-10 years)" },
  { value: "executive", label: "Executive (10+ years)" },
];

const jobTypes = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
];

// Subscription plans based on your schema
const subscriptionPlans = [
  {
    id: "free",
    name: "Free",
    description:
      "Basic plan with limited features - perfect for getting started",
    price_monthly: 0,
    price_yearly: 0,
    max_jobs_per_month: 10,
    max_resumes: 1,
    max_applications_per_day: 5,
    auto_scrape_enabled: false,
    priority_support: false,
    api_access: false,
    export_enabled: false,
    features: [
      "10 jobs per month",
      "1 resume",
      "Basic scraping",
      "Email alerts",
    ],
    popular: false,
    trial_days: 0,
    icon: Star,
    color: "gray",
  },
  {
    id: "pro",
    name: "Pro",
    description:
      "Professional plan with advanced features for serious job seekers",
    price_monthly: 29.99,
    price_yearly: 299.99,
    max_jobs_per_month: 100,
    max_resumes: 5,
    max_applications_per_day: 25,
    auto_scrape_enabled: true,
    priority_support: true,
    api_access: true,
    export_enabled: true,
    features: [
      "100 jobs per month",
      "5 resumes",
      "Auto-scrape enabled",
      "Advanced scraping",
      "Email alerts",
      "Advanced filters",
      "Resume templates",
      "Cover letter generator",
      "Priority support",
      "API access",
    ],
    popular: true,
    trial_days: 14,
    icon: Zap,
    color: "blue",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description:
      "Enterprise plan with unlimited features for teams and power users",
    price_monthly: 99.99,
    price_yearly: 999.99,
    max_jobs_per_month: 1000,
    max_resumes: 50,
    max_applications_per_day: 100,
    auto_scrape_enabled: true,
    priority_support: true,
    api_access: true,
    export_enabled: true,
    features: [
      "1000 jobs per month",
      "50 resumes",
      "Bulk operations",
      "Team features",
      "Custom integrations",
      "Dedicated support",
      "Analytics dashboard",
      "All Pro features",
    ],
    popular: false,
    trial_days: 30,
    icon: Crown,
    color: "purple",
  },
];

export default function RegistrationForm({
  onSuccess,
  setCurrentPage,
}: RegistrationFormProps) {
  const router = useRouter();
  const { darkMode } = useTheme();

  // Profile Form Data
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    location: "",
    bio: "",
    website: "",
    linkedinUrl: "",
    githubUrl: "",
    jobTitle: "",
    company: "",
    experienceLevel: "entry" as const,
    preferredJobTypes: [] as string[],
    preferredLocations: [] as string[],
    salaryRangeMin: "",
    salaryRangeMax: "",
    role: "job_seeker" as const,
  });

  // Subscription & Upload Data
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [resume, setResume] = useState<File | null>(null);
  const [avatar, setAvatar] = useState<File | null>(null);

  // State Management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [profileCreated, setProfileCreated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "resume" | "avatar"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "resume") {
      if (file.size > 5 * 1024 * 1024) {
        setError("Resume file size must be less than 5MB");
        return;
      }
      if (
        ![
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ].includes(file.type)
      ) {
        setError("Resume must be a PDF or Word document");
        return;
      }
      setResume(file);
    } else if (type === "avatar") {
      if (file.size > 2 * 1024 * 1024) {
        setError("Avatar file size must be less than 2MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Avatar must be an image file");
        return;
      }
      setAvatar(file);
    }

    setError("");
  };

  const handleJobTypeChange = (jobType: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      preferredJobTypes: checked
        ? [...prev.preferredJobTypes, jobType]
        : prev.preferredJobTypes.filter((t) => t !== jobType),
    }));
  };

  const handleLocationChange = (location: string) => {
    const locations = location
      .split(",")
      .map((l) => l.trim())
      .filter((l) => l);
    setFormData((prev) => ({ ...prev, preferredLocations: locations }));
  };

  const validateAllFields = () => {
    if (!formData.email || !formData.password || !formData.fullName) {
      setError(
        "Please fill in all required fields (Email, Password, Full Name)"
      );
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    if (formData.salaryRangeMin && formData.salaryRangeMax) {
      const minSalary = parseInt(formData.salaryRangeMin);
      const maxSalary = parseInt(formData.salaryRangeMax);

      if (minSalary >= maxSalary) {
        setError("Maximum salary must be greater than minimum salary");
        return false;
      }
    }

    const urlFields = [
      { field: formData.website, name: "Website" },
      { field: formData.linkedinUrl, name: "LinkedIn" },
      { field: formData.githubUrl, name: "GitHub" },
    ];

    for (const { field, name } of urlFields) {
      if (field && field.trim()) {
        try {
          new URL(field);
        } catch {
          setError(`${name} must be a valid URL (include https://)`);
          return false;
        }
      }
    }

    return true;
  };

  const validateStep1 = () => {
    if (!formData.email || !formData.password || !formData.fullName) {
      setError("Please fill in all required fields");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleNext = () => {
    setError("");
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  // Step 1: Create User Profile
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!validateAllFields()) {
      setLoading(false);
      return;
    }

    try {
      console.log("Starting registration process...");

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: formData.role,
            phone: formData.phone,
            location: formData.location,
          },
        },
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user)
        throw new Error("Registration failed - no user returned");

      console.log("User created:", authData.user.id);

      // Wait for session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session || !sessionData.session.user) {
        throw new Error("User not authenticated — cannot create profile");
      }

      const userId = sessionData.session.user.id;

      // Create user profile via API
      const response = await fetch("/api/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: userId,
          email: formData.email,
          full_name: formData.fullName,
          phone: formData.phone,
          location: formData.location,
          bio: formData.bio,
          website: formData.website,
          linkedin_url: formData.linkedinUrl,
          github_url: formData.githubUrl,
          job_title: formData.jobTitle,
          company: formData.company,
          experience_level: formData.experienceLevel,
          preferred_job_types: formData.preferredJobTypes,
          preferred_locations: formData.preferredLocations,
          salary_range_min: formData.salaryRangeMin
            ? parseInt(formData.salaryRangeMin)
            : null,
          salary_range_max: formData.salaryRangeMax
            ? parseInt(formData.salaryRangeMax)
            : null,
          role: formData.role,
        }),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Profile creation failed");

      console.log("Profile created:", result.profile);

      setUser(authData.user);
      setProfileCreated(true);
      setStep(4); // Move to subscription/upload step
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(error.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Improved bucket management function
  const ensureBucketExists = async (bucketName: string, isPublic = false) => {
    try {
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error(`Error listing buckets:`, listError);
        return false;
      }

      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        console.log(`Creating bucket: ${bucketName}`);
        const { error } = await supabase.storage.createBucket(bucketName, {
          public: isPublic,
          fileSizeLimit: bucketName === 'resumes' ? 5242880 : 2097152, // 5MB for resumes, 2MB for avatars
        });
        
        if (error) {
          console.error(`Failed to create ${bucketName} bucket:`, error);
          return false;
        }
        
        console.log(`Created bucket: ${bucketName}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error ensuring bucket exists:`, error);
      return false;
    }
  };
// Fixed uploadFile function for your RegisterForm.tsx

const uploadFile = async (
  file: File,
  userId: string,
  type: "resume" | "avatar"
): Promise<string | null> => {
  try {
    const fileExt = file.name.split(".").pop();
    const timestamp = Date.now();
    const fileName = `${userId}/${type}-${timestamp}.${fileExt}`;
    const bucketName = type === "resume" ? "resumes" : "avatars";

    console.log(`Uploading ${type}:`, fileName);

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    // Upload file
    const { data, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error(`${type} upload error:`, uploadError);
      throw uploadError;
    }

    console.log(`${type} uploaded successfully:`, fileName);

    // For resumes, return the file path for database storage
    if (type === "resume") {
      return fileName;
    }

    // For avatars, return the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error(`${type} upload failed:`, error);
    throw error;
  }
};
const handleCompleteSetup = async () => {
  setLoading(true);
  setError("");

  try {
    // Verify authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated - please log in again');
    }

    const userId = user.id;
    let resumeFilePath: string | null = null;
    let avatarUrl: string | null = null;

    // Upload files if present
    if (resume) {
      try {
        console.log("Uploading resume:", `${userId}/resume-${Date.now()}.${resume.name.split('.').pop()}`);
        resumeFilePath = await uploadFile(resume, userId, "resume");
        
        // If resume upload returns a path, store it in resumes table
        if (resumeFilePath) {
          try {
            const { error: resumeInsertError } = await supabase
              .from('resumes')
              .insert({
                user_id: userId,
                file_name: resume.name,
                file_path: resumeFilePath,
                file_size: resume.size,
                content_type: resume.type,
                created_at: new Date().toISOString(),
              });

            if (resumeInsertError) {
              console.warn('Failed to insert resume record:', resumeInsertError);
            }
          } catch (insertError) {
            console.warn('Resume record insertion failed:', insertError);
          }
        }
      } catch (error) {
        console.error("Resume upload failed:", error);
        // Don't stop execution for resume upload failure - continue with registration
        console.warn("Continuing without resume...");
      }
    }

    if (avatar) {
      try {
        avatarUrl = await uploadFile(avatar, userId, "avatar");
      } catch (error) {
        console.error("Avatar upload failed:", error);
        console.warn("Continuing without avatar...");
      }
    }

    // Update profile with file URLs if any were uploaded
    if (avatarUrl) {
      try {
        const response = await fetch("/api/update-profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            avatar_url: avatarUrl,
          }),
        });

        if (response.ok) {
          const updateResult = await response.json();
          console.log("Profile updated with avatar URL");
        } else {
          const errorResult = await response.json();
          console.warn("Failed to update profile with avatar URL:", errorResult.error);
        }
      } catch (error) {
        console.warn("Profile update failed:", error);
      }
    }

    // Create subscription
    try {
      const subscriptionResponse = await fetch("/api/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          planId: selectedPlan,
          billingCycle,
        }),
      });

      if (subscriptionResponse.ok) {
        const subscriptionResult = await subscriptionResponse.json();
        console.log("Subscription created successfully:", subscriptionResult);
      } else {
        const subscriptionError = await subscriptionResponse.json();
        console.warn("Failed to create subscription:", subscriptionError.error);
        
        // Only show error for paid plans
        if (selectedPlan !== "free") {
          setError(`Subscription setup failed: ${subscriptionError.error}`);
          return;
        }
      }
    } catch (error) {
      console.error("Subscription creation failed:", error);
      if (selectedPlan !== "free") {
        setError(`Failed to create subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
      }
    }

    // Complete registration successfully
    console.log("Registration completed successfully!");
    if (user) {
      onSuccess(user);
    }

  } catch (error) {
    console.error("Setup completion error:", error);
    setError(error instanceof Error ? error.message : "Failed to complete setup. Please try again.");
  } finally {
    setLoading(false);
  }
};

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Basic Information
      </h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Full Name *
        </label>
        <div className="relative">
          <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
          <input
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => handleInputChange("fullName", e.target.value)}
            className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
            placeholder="Enter your full name"
            autoComplete="name"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email Address *
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
          placeholder="Enter your email"
          autoComplete="email"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password *
          </label>
          <input
            type="password"
            required
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
            placeholder="Create a password"
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confirm Password *
          </label>
          <input
            type="password"
            required
            value={formData.confirmPassword}
            onChange={(e) =>
              handleInputChange("confirmPassword", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
            placeholder="Confirm your password"
            autoComplete="new-password"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
            placeholder="Your phone number"
            autoComplete="tel"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              placeholder="City, State"
              autoComplete="address-level1"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Professional Information
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Current/Desired Job Title
          </label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) => handleInputChange("jobTitle", e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              placeholder="e.g. Software Engineer"
              autoComplete="organization-title"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Current Company
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => handleInputChange("company", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
            placeholder="Current or last company"
            autoComplete="organization"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Experience Level
        </label>
        <select
          value={formData.experienceLevel}
          onChange={(e) => handleInputChange("experienceLevel", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
        >
          {experienceLevels.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Preferred Job Types
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {jobTypes.map((type) => (
            <label key={type.value} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.preferredJobTypes.includes(type.value)}
                onChange={(e) =>
                  handleJobTypeChange(type.value, e.target.checked)
                }
                className="rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {type.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Preferred Locations
        </label>
        <input
          type="text"
          value={formData.preferredLocations.join(", ")}
          onChange={(e) => handleLocationChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
          placeholder="e.g. San Francisco, Remote, New York"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Separate multiple locations with commas
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Salary Range (Annual)
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="number"
              value={formData.salaryRangeMin}
              onChange={(e) =>
                handleInputChange("salaryRangeMin", e.target.value)
              }
              className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              placeholder="Min salary"
            />
          </div>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="number"
              value={formData.salaryRangeMax}
              onChange={(e) =>
                handleInputChange("salaryRangeMax", e.target.value)
              }
              className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              placeholder="Max salary"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Website
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange("website", e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              placeholder="https://yoursite.com"
              autoComplete="url"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            LinkedIn
          </label>
          <div className="relative">
            <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="url"
              value={formData.linkedinUrl}
              onChange={(e) => handleInputChange("linkedinUrl", e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              placeholder="LinkedIn profile URL"
              autoComplete="url"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            GitHub
          </label>
          <div className="relative">
            <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
            <input
              type="url"
              value={formData.githubUrl}
              onChange={(e) => handleInputChange("githubUrl", e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              placeholder="GitHub profile URL"
              autoComplete="url"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Bio
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => handleInputChange("bio", e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
          placeholder="Tell us a bit about yourself and your career goals..."
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Review & Create Profile
      </h3>

      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          Profile Summary
        </h4>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <p>
            <strong>Name:</strong> {formData.fullName}
          </p>
          <p>
            <strong>Email:</strong> {formData.email}
          </p>
          {formData.jobTitle && (
            <p>
              <strong>Job Title:</strong> {formData.jobTitle}
            </p>
          )}
          {formData.location && (
            <p>
              <strong>Location:</strong> {formData.location}
            </p>
          )}
          {formData.preferredJobTypes.length > 0 && (
            <p>
              <strong>Job Types:</strong>{" "}
              {formData.preferredJobTypes.join(", ")}
            </p>
          )}
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Next Steps
        </h4>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          After creating your profile, you'll be able to upload your resume,
          choose an avatar, and select your subscription plan to unlock all
          features.
        </p>
      </div>
    </div>
  );

  const renderSubscriptionStep = () => {
    const selectedPlanData = subscriptionPlans.find(
      (p) => p.id === selectedPlan
    );
    const price =
      billingCycle === "yearly"
        ? selectedPlanData?.price_yearly
        : selectedPlanData?.price_monthly;
    const savings =
      selectedPlanData && billingCycle === "yearly"
        ? (
            selectedPlanData.price_monthly * 12 -
            selectedPlanData.price_yearly
          ).toFixed(2)
        : 0;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Profile Created Successfully!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Complete your setup by uploading files and choosing your plan
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg inline-flex">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                billingCycle === "monthly"
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                billingCycle === "yearly"
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              Yearly
              <span className="ml-1 text-xs bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subscriptionPlans.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan === plan.id;
            const planPrice =
              billingCycle === "yearly"
                ? plan.price_yearly
                : plan.price_monthly;
            const monthlyEquivalent =
              billingCycle === "yearly"
                ? (plan.price_yearly / 12).toFixed(2)
                : plan.price_monthly;

            return (
              <div
                key={plan.id}
                className={`relative p-6 rounded-xl cursor-pointer transition-all transform hover:scale-105 ${
                  isSelected
                    ? `ring-2 ${
                        plan.color === "blue"
                          ? "ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : plan.color === "purple"
                          ? "ring-purple-500 bg-purple-50 dark:bg-purple-900/20"
                          : "ring-gray-500 bg-gray-50 dark:bg-gray-700"
                      }`
                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <div
                    className={`w-12 h-12 ${
                      plan.color === "blue"
                        ? "bg-blue-100 dark:bg-blue-900/30"
                        : plan.color === "purple"
                        ? "bg-purple-100 dark:bg-purple-900/30"
                        : "bg-gray-100 dark:bg-gray-700"
                    } rounded-lg flex items-center justify-center mx-auto mb-4`}
                  >
                    <Icon
                      className={`w-6 h-6 ${
                        plan.color === "blue"
                          ? "text-blue-600 dark:text-blue-400"
                          : plan.color === "purple"
                          ? "text-purple-600 dark:text-purple-400"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    />
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>

                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      ${planPrice}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      /{billingCycle}
                    </span>
                    {billingCycle === "yearly" && plan.price_yearly > 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        ${monthlyEquivalent}/month billed yearly
                      </p>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {plan.description}
                  </p>

                  <ul className="space-y-2 text-sm text-left">
                    {plan.features.slice(0, 5).map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-center text-gray-600 dark:text-gray-300"
                      >
                        <Check className="w-4 h-4 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                    {plan.features.length > 5 && (
                      <li className="text-gray-500 dark:text-gray-400 text-xs">
                        +{plan.features.length - 5} more features
                      </li>
                    )}
                  </ul>

                  {plan.trial_days > 0 && (
                    <div className="mt-4 p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {plan.trial_days} day free trial
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* File Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Avatar Upload */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">
              Profile Picture
            </h4>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                {avatar ? (
                  <img
                    src={URL.createObjectURL(avatar)}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                )}
              </div>
              <div>
                <label
                  htmlFor="avatar-upload-final"
                  className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                >
                  Choose File
                </label>
                <input
                  id="avatar-upload-final"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "avatar")}
                  className="sr-only"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  JPG, PNG up to 2MB
                </p>
              </div>
            </div>

            {avatar && (
              <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                <p className="text-sm text-green-800 dark:text-green-400">
                  ✓ {avatar.name} selected
                </p>
              </div>
            )}
          </div>

          {/* Resume Upload */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">
              Resume
            </h4>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
              <Upload className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
              <div>
                <label htmlFor="resume-upload-final" className="cursor-pointer">
                  <span className="text-blue-600 dark:text-blue-400 hover:text-blue-500 text-sm">
                    Upload a file
                  </span>
                </label>
                <input
                  id="resume-upload-final"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileUpload(e, "resume")}
                  className="sr-only"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                PDF, DOC, DOCX up to 5MB
              </p>

              {resume && (
                <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                  <p className="text-sm text-green-800 dark:text-green-400">
                    ✓ {resume.name} selected
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected Plan Summary */}
        {selectedPlanData && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Selected Plan Summary
            </h4>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedPlanData.name} - {billingCycle}
                </p>
                {billingCycle === "yearly" && Number(savings) > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Save ${savings} per year
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${price}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {billingCycle}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (profileCreated && step === 4) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            {renderSubscriptionStep()}

            {error && (
              <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={() => {
                  // Skip setup and go straight to success
                  if (user) onSuccess(user);
                }}
                className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                Skip for now
              </button>

              <button
                onClick={handleCompleteSetup}
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 border border-transparent rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Completing Setup..." : "Complete Setup"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <button
                onClick={() =>
                  setCurrentPage
                    ? setCurrentPage("login")
                    : router.push("/login")
                }
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
              >
                Sign in
              </button>
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Step {step} of 3
              </span>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {step === 1
                  ? "Basic Info"
                  : step === 2
                  ? "Professional"
                  : "Review"}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleProfileSubmit}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            {error && (
              <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-between mt-8">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                >
                  Back
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="ml-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 border border-transparent rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                 
                  className="ml-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 border border-transparent rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                
                >
                  {loading ? "Creating Profile..." : "Create Profile"}
                   setCurrentPage
                    ? setCurrentPage("login")
                    : router.push("/login")
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
