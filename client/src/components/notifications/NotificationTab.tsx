'use client';

import React, { useEffect, useState } from "react";
import { Job } from "../../types/user/index";
import { CalendarEvent } from "@/types/user/calendar";
import {
  NotificationProps,
  createCalendarNotification,
} from "@/types/user/notifications";
import { CalendarService } from "@/services/user-services/calendar-service";
import { Clock, MapPin } from "lucide-react";

interface NotificationsTabProps {
  jobs: Job[];
  darkMode: boolean;
  userId: string;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({
  jobs,
  darkMode,
  userId,
}) => {
  const [calendarNotifications, setCalendarNotifications] = useState<
    NotificationProps[]
  >([]);

  useEffect(() => {
    const loadCalendarNotifications = async () => {
      try {
        const events: CalendarEvent[] = await CalendarService.getUpcomingEvents(
          userId,
          5
        );
        const mapped = events.map(mapCalendarEventToNotification);
        setCalendarNotifications(mapped);
      } catch (error) {
        console.error("Failed to load calendar notifications:", error);
      }
    };

    loadCalendarNotifications();
  }, [userId]);

  const jobNotifications: NotificationProps[] = jobs
    .filter((job) => job.applied)
    .slice(0, 5)
    .map((job) => ({
      id: job.id,
      title: `Application status: ${job.status || "Applied"}`,
      message: `${job.title} at ${job.company} - ${job.date}`,
      type: "info",
      read: false,
      created_at: job.date || new Date().toISOString(),
    }));

  const allNotifications = [...jobNotifications, ...calendarNotifications].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div
      className={`${
        darkMode ? "bg-gray-800" : "bg-white"
      } rounded-lg shadow p-6`}
    >
      <h2 className="text-lg font-semibold">Notifications</h2>
      <p
        className={`text-sm mt-2 ${
          darkMode ? "text-gray-300" : "text-gray-600"
        }`}
      >
        Stay updated on your job application progress and upcoming calendar
        events.
      </p>

      <div className="mt-6 space-y-4">
        {allNotifications.length === 0 ? (
          <p
            className={`text-sm ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            No notifications yet.
          </p>
        ) : (
          allNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded border-l-4 ${
                notification.type === "error"
                  ? "border-red-500"
                  : notification.type === "warning"
                  ? "border-yellow-500"
                  : notification.type === "success"
                  ? "border-green-500"
                  : "border-blue-500"
              } ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}
            >
              <p className="text-sm font-medium">{notification.title}</p>
              <p
                className={`text-xs mt-1 ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {notification.message}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ✅ Use this helper inside the same file or import it
function mapCalendarEventToNotification(
  event: CalendarEvent
): NotificationProps {
  const base = createCalendarNotification(event);

  const mappedType: NotificationProps["type"] = (() => {
    switch (event.event_type) {
      case "interview":
      case "offer":
        return "success";
      case "follow_up":
      case "deadline":
        return "warning";
      case "rejection":
        return "error";
      default:
        return "info";
    }
  })();

  return {
    id: base.id,
    title: base.title,
    message: base.message || "",
    type: mappedType,
    read: base.read ?? false,
    created_at: base.created_at || new Date().toISOString(),
  };
}