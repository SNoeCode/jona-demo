import {CreateCalendarEventPayload} from '@/types/user/calendar'

export const buildDefaultEventPayload = (
  overrides: Partial<CreateCalendarEventPayload> = {}
): CreateCalendarEventPayload => ({
  title: '',
  description: '',
  event_type: 'other',
  event_date: new Date().toISOString().split('T')[0],
  event_time: '09:00',
  duration_minutes: 60,
  location: '',
  is_all_day: false,
  priority: 'medium',
  notes: '',
  ...overrides
});