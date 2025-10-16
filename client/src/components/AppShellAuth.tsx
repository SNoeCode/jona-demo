
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { AuthUser } from '@/types/user/index'

const AUTH_TIMEOUT = 2 * 60 * 60 * 1000 // 2 hours

interface SessionTimeoutProps {
  user: AuthUser
  onLogout: () => Promise<void>
}

export default function SessionTimeout({ user, onLogout }: SessionTimeoutProps) {
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  const resetAuthTimeout = () => {
    lastActivityRef.current = Date.now()
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)

    if (user) {
      // Show warning 10 minutes before timeout
      warningTimeoutRef.current = setTimeout(() => {
        setShowTimeoutWarning(true)
      }, AUTH_TIMEOUT - 10 * 60 * 1000)

      // Auto logout after full timeout
      timeoutRef.current = setTimeout(() => {
        handleLogout()
        alert("Session expired due to inactivity.")
      }, AUTH_TIMEOUT)
    }
  }

  const handleLogout = async () => {
    clearTimeout(timeoutRef.current!)
    clearTimeout(warningTimeoutRef.current!)
    await onLogout()
  }

  const handleExtendSession = () => {
    resetAuthTimeout()
    setShowTimeoutWarning(false)
  }

  useEffect(() => {
    const activityEvents = [
      "mousedown", "mousemove", "keypress", 
      "scroll", "touchstart", "click"
    ]

    const resetTimer = () => {
      if (user) {
        resetAuthTimeout()
        setShowTimeoutWarning(false)
      }
    }

    activityEvents.forEach((event) =>
      document.addEventListener(event, resetTimer, true)
    )

    // Initialize timeout
    resetAuthTimeout()

    return () => {
      activityEvents.forEach((event) =>
        document.removeEventListener(event, resetTimer, true)
      )
      clearTimeout(timeoutRef.current!)
      clearTimeout(warningTimeoutRef.current!)
    }
  }, [user])

  if (!showTimeoutWarning) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Session Expiring Soon
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Your session will expire in 10 minutes due to inactivity. Would you like to extend your session?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            Logout Now
          </button>
          <button
            onClick={handleExtendSession}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  )
}