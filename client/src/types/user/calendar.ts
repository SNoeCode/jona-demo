// types/calendar.ts
import { Job,DashboardStatsProps } from "@/types/user/index";
export type CalendarEventType = 
  | 'application' 
  | 'interview' 
  | 'follow_up' 
  | 'deadline' 
  | 'offer' 
  | 'rejection' 
  | 'networking' 
  | 'research' 
  | 'other';

export type CalendarEventStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';

export type CalendarPriority = 'low' | 'medium' | 'high';

export type CalendarView = 'day' | 'week' | 'month';

export interface CalendarEvent {
  id: string;
  user_id: string;
  job_id?: string;
  title: string;
  description?: string;
  event_type: CalendarEventType;
  event_date: string; // YYYY-MM-DD format
  event_time?: string; // HH:MM format
  duration_minutes?: number;
  location?: string;
  is_all_day?: boolean;
  status: CalendarEventStatus;
  priority: CalendarPriority;
  reminder_minutes?: number[];
  notes?: string;
  created_at: string;
  updated_at: string;
  // Computed fields for display
  job?: {
    id: string;
    title: string;
    company: string;
  };
}

export interface CalendarSettings {
  id: string;
  user_id: string;
  default_view: CalendarView;
  week_starts_on: number; // 0-6, 0 = Sunday
  work_hours_start: string; // HH:MM
  work_hours_end: string; // HH:MM
  show_weekends: boolean;
  timezone: string;
  default_event_duration: number;
  default_reminder_minutes: number[];
  color_scheme: Record<CalendarEventType, string>;
  created_at: string;
  updated_at: string;
}

export interface CreateCalendarEventPayload {
  job_id?: string;
  title: string;
  description?: string;
  event_type: CalendarEventType;
  event_date: string;
  event_time?: string;
  duration_minutes?: number;
  location?: string;
  is_all_day?: boolean;
  priority?: CalendarPriority;
  reminder_minutes?: number[];
  notes?: string;
}

export interface UpdateCalendarEventPayload extends Partial<CreateCalendarEventPayload> {
  status?: CalendarEventStatus;
}

export interface CalendarTabProps {
  jobs: Job[];
  darkMode: boolean;
  userId: string;
}

export interface CalendarDayProps {
  date: Date;
  events: CalendarEvent[];
  darkMode: boolean;
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
}

export interface CalendarEventModalProps {
  event?: CalendarEvent;
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: CreateCalendarEventPayload | UpdateCalendarEventPayload) => void;
  onDelete?: (eventId: string) => void;
  jobs: Job[];
  darkMode: boolean;
}

// Extend the existing Job interface to include calendar-related data
export interface JobWithCalendarData extends Job {
  calendar_events?: CalendarEvent[];
  upcoming_events_count?: number;
  next_event_date?: string;
}

// Add to your existing types/index.ts
export interface DashboardStatsPropsWithCalendar extends DashboardStatsProps {
  totalCalendarEvents?: number;
  upcomingInterviews?: number;
  overdueFollowUps?: number;
}
export function isCreatePayload(
  payload: CreateCalendarEventPayload | UpdateCalendarEventPayload
): payload is CreateCalendarEventPayload {
  return 'title' in payload && typeof payload.title === 'string';
}

