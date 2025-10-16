// utils/CalendarService.ts

import { supabase } from '@/lib/supabaseClient';
import { 
  CalendarEvent, 
  CalendarSettings, 
  CreateCalendarEventPayload, 
  UpdateCalendarEventPayload,
  CalendarEventType 
} from '@/types/calendar';

export class CalendarService {
  static async getCalendarEvents(userId: string, startDate?: string, endDate?: string): Promise<CalendarEvent[]> {
    try {
      let query = supabase
        .from('calendar_events')
        .select(`
          *,
          job:jobs(id, title, company)
        `)
        .eq('user_id', userId)
        .order('event_date', { ascending: true });

      if (startDate) {
        query = query.gte('event_date', startDate);
      }
      if (endDate) {
        query = query.lte('event_date', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching calendar events:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('CalendarService.getCalendarEvents failed:', error);
      throw error;
    }
  }

  static async createCalendarEvent(userId: string, payload: CreateCalendarEventPayload): Promise<CalendarEvent> {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert([{ ...payload, user_id: userId }])
        .select(`
          *,
          job:jobs(id, title, company)
        `)
        .single();

      if (error) {
        console.error('Error creating calendar event:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('CalendarService.createCalendarEvent failed:', error);
      throw error;
    }
  }

  static async updateCalendarEvent(eventId: string, payload: UpdateCalendarEventPayload): Promise<CalendarEvent> {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .update(payload)
        .eq('id', eventId)
        .select(`
          *,
          job:jobs(id, title, company)
        `)
        .single();

      if (error) {
        console.error('Error updating calendar event:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('CalendarService.updateCalendarEvent failed:', error);
      throw error;
    }
  }

  static async deleteCalendarEvent(eventId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) {
        console.error('Error deleting calendar event:', error);
        throw error;
      }
    } catch (error) {
      console.error('CalendarService.deleteCalendarEvent failed:', error);
      throw error;
    }
  }

  static async getCalendarSettings(userId: string): Promise<CalendarSettings | null> {
    try {
      const { data, error } = await supabase
        .from('calendar_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching calendar settings:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('CalendarService.getCalendarSettings failed:', error);
      throw error;
    }
  }

  static async upsertCalendarSettings(userId: string, settings: Partial<CalendarSettings>): Promise<CalendarSettings> {
    try {
      const { data, error } = await supabase
        .from('calendar_settings')
        .upsert([{ ...settings, user_id: userId }], { 
          onConflict: 'user_id' 
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error upserting calendar settings:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('CalendarService.upsertCalendarSettings failed:', error);
      throw error;
    }
  }

  static async getEventsForDateRange(userId: string, startDate: string, endDate: string): Promise<CalendarEvent[]> {
    return this.getCalendarEvents(userId, startDate, endDate);
  }

  static async getUpcomingEvents(userId: string, limit: number = 5): Promise<CalendarEvent[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          job:jobs(id, title, company)
        `)
        .eq('user_id', userId)
        .gte('event_date', today)
        .eq('status', 'scheduled')
        .order('event_date', { ascending: true })
        .order('event_time', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching upcoming events:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('CalendarService.getUpcomingEvents failed:', error);
      throw error;
    }
  }

  static async createEventFromJobAction(
    userId: string, 
    jobId: string, 
    eventType: CalendarEventType, 
    customDate?: string
  ): Promise<CalendarEvent> {
    try {
      // Get job details first
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('title, company')
        .eq('id', jobId)
        .single();

      if (jobError) {
        throw jobError;
      }

      const eventDate = customDate || new Date().toISOString().split('T')[0];
      let title = '';
      let description = '';

      switch (eventType) {
        case 'application':
          title = `Apply to ${job.title}`;
          description = `Submit application for ${job.title} at ${job.company}`;
          break;
        case 'follow_up':
          title = `Follow up: ${job.title}`;
          description = `Follow up on application for ${job.title} at ${job.company}`;
          break;
        case 'interview':
          title = `Interview: ${job.title}`;
          description = `Interview for ${job.title} at ${job.company}`;
          break;
        case 'research':
          title = `Research: ${job.company}`;
          description = `Research ${job.company} and ${job.title} position`;
          break;
        default:
          title = `${eventType}: ${job.title}`;
          description = `${eventType} for ${job.title} at ${job.company}`;
      }

      return await this.createCalendarEvent(userId, {
        job_id: jobId,
        title,
        description,
        event_type: eventType,
        event_date: eventDate,
        priority: 'medium'
      });
    } catch (error) {
      console.error('CalendarService.createEventFromJobAction failed:', error);
      throw error;
    }
  }

  static getDefaultColorScheme() {
    return {
      'application': '#3B82F6',
      'interview': '#10B981',
      'follow_up': '#F59E0B',
      'deadline': '#EF4444',
      'offer': '#8B5CF6',
      'rejection': '#6B7280',
      'networking': '#06B6D4',
      'research': '#84CC16',
      'other': '#64748B'
    };
  }

  static async getEventStats(userId: string): Promise<{
    totalEvents: number;
    upcomingInterviews: number;
    overdueFollowUps: number;
    completedApplications: number;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [totalEventsQuery, interviewsQuery, followUpsQuery, applicationsQuery] = await Promise.all([
        supabase
          .from('calendar_events')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        
        supabase
          .from('calendar_events')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('event_type', 'interview')
          .gte('event_date', today)
          .eq('status', 'scheduled'),
        
        supabase
          .from('calendar_events')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('event_type', 'follow_up')
          .lt('event_date', today)
          .eq('status', 'scheduled'),
        
        supabase
          .from('calendar_events')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('event_type', 'application')
          .eq('status', 'completed')
      ]);

      return {
        totalEvents: totalEventsQuery.count || 0,
        upcomingInterviews: interviewsQuery.count || 0,
        overdueFollowUps: followUpsQuery.count || 0,
        completedApplications: applicationsQuery.count || 0
      };
    } catch (error) {
      console.error('CalendarService.getEventStats failed:', error);
      return {
        totalEvents: 0,
        upcomingInterviews: 0,
        overdueFollowUps: 0,
        completedApplications: 0
      };
    }
  }
}