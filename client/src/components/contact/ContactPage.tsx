"use client";
import React, { useState } from "react";
import { Mail, Info } from "lucide-react";
import { useTheme } from '@/context/ThemeContext';

export default function ContactPage() {
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 1000);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-color)'
      }}
      className={`min-h-screen py-16 transition-colors duration-200 ${
        darkMode ? 'bg-blue-950 text-gray-100' : 'bg-gray-50 text-gray-900'
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-orange-500">
            Contact Us – JobTracker by Bayan Labs
          </h1>
          <p className="mt-4 text-xl text-gray-400">
            Whether you're rebuilding, restarting, or just beginning—we're here to help.
          </p>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact Info */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-orange-400">
            Get in Touch
          </h2>
          <div className="space-y-6">
            <div className="flex items-start">
              <Mail className="w-6 h-6 text-orange-500 mt-1" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-orange-300">Email</h3>
                <p className="text-gray-400">support@jobtracker.com</p>
              </div>
            </div>
            <div className="flex items-start">
              <Info className="w-6 h-6 text-orange-500 mt-1" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-orange-300">Support Hours</h3>
                <p className="text-gray-400">
                  Monday - Friday: 9:00 AM - 6:00 PM EST<br />
                  Saturday - Sunday: 10:00 AM - 4:00 PM EST
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4 text-orange-400">
              Why We’re Here
            </h3>
            <div className="space-y-4">
              <p className="text-gray-300">
                JobTracker was built to support second chances and focused futures. Whether you're a job seeker
                navigating reentry or a recruiter looking to connect with resilient talent, we’re here to make
                the process smoother, smarter, and more human.
              </p>
              <p className="text-gray-400 text-sm">
                Every message helps us improve. We read every note and respond with care.
              </p>
            </div>
          </div>
        </div>
        <div
          className={`rounded-lg shadow-lg p-8 transition-colors duration-200 ${
            darkMode ? 'bg-blue-950 border border-orange-300 text-gray-100' : 'bg-white text-gray-900'
          }`}
        >
          <h2 className="text-2xl font-bold mb-6 text-orange-500">
            Send Us a Message
          </h2>

          <p className={`mb-6 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Whether you're navigating reentry, restarting your career, or just need guidance—JobTracker is here to support you. Drop us a note and we’ll respond with care.
          </p>

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
              Thank you for your message! We'll get back to you soon.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {(['name', 'email', 'subject'] as Array<keyof typeof formData>).map((field) => (
              <div key={field}>
                <label
                  htmlFor={field}
                  className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  type={field === 'email' ? 'email' : 'text'}
                  id={field}
                  name={field}
                  required
                  value={formData[field]}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 ${
                    darkMode
                      ? 'border-gray-600 bg-blue-900 text-gray-100 placeholder-gray-400'
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                />
              </div>
            ))}

            <div>
              <label
                htmlFor="message"
                className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                required
                value={formData.message}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 ${
                  darkMode
                    ? 'border-gray-600 bg-blue-900 text-gray-100 placeholder-gray-400'
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Message with Purpose"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}