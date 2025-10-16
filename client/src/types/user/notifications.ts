import { CalendarEvent } from "@/types/user/calendar";
export interface Notification {
  id: string;
  user_id?: string;
  type: string;
  title: string;
  message?: string;
  data?: any; // jsonb in database
  read?: boolean;
  created_at?: string;
}
export interface NotificationProps {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  created_at: string;
}
export interface NotificationSlice {
  notifications: NotificationProps[];
  loading: boolean;
  error?: string;
}
export function createCalendarNotification(event: CalendarEvent): Notification {
  return {
    id: crypto.randomUUID(),
    user_id: event.user_id,
    type: "calendar_event",
    title: `Upcoming ${event.event_type}`,
    message: `Don't forget: ${event.title} on ${event.event_date} at ${event.event_time}`,
    data: {
      event_id: event.id,
      job_id: event.job_id,
      priority: event.priority,
    },
    read: false,
    created_at: new Date().toISOString(),
  };
}