 "use client"
import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '@/types/user/calendar';
import { Job } from '@/types/user/index';
import { CalendarService } from '@/services/user-services/calendar-service';
import { Calendar, Clock, MapPin, Plus, ChevronRight } from 'lucide-react';

interface CalendarWidgetProps {
  jobs: Job[];
  darkMode: boolean;
  userId: string;
  onOpenFullCalendar?: () => void;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ 
  jobs, 
  darkMode, 
  userId, 
  onOpenFullCalendar 
}) => {
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingInterviews: 0,
    overdueFollowUps: 0,
    completedApplications: 0
  });

  useEffect(() => {
    loadUpcomingEvents();
    loadStats();
  }, [userId]);

  const loadUpcomingEvents = async () => {
    setLoading(true);
    try {
      const events = await CalendarService.getUpcomingEvents(userId, 5);
      setUpcomingEvents(events);
    } catch (error) {
      console.error('Failed to load upcoming events:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const eventStats = await CalendarService.getEventStats(userId);
      setStats(eventStats);
    } catch (error) {
      console.error('Failed to load calendar stats:', error);
    }
  };

  const getEventColor = (eventType: string) => {
    const colors = {
      'application': 'bg-blue-500',
      'interview': 'bg-green-500',
      'follow_up': 'bg-yellow-500',
      'deadline': 'bg-red-500',
      'offer': 'bg-purple-500',
      'rejection': 'bg-gray-500',
      'networking': 'bg-cyan-500',
      'research': 'bg-lime-500',
      'other': 'bg-slate-500'
    };
    return colors[eventType as keyof typeof colors] || colors.other;
  };

  const formatEventDate = (dateStr: string, timeStr?: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    let dateDisplay = '';
    if (date.toDateString() === today.toDateString()) {
      dateDisplay = 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dateDisplay = 'Tomorrow';
    } else {
      dateDisplay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    if (timeStr) {
      dateDisplay += ` at ${timeStr}`;
    }
    
    return dateDisplay;
  };

  const quickCreateEvent = async (eventType: 'interview' | 'follow_up' | 'application', jobId?: string) => {
    try {
      let job = null;
      if (jobId) {
        job = jobs.find(j => j.id === jobId);
      }

      const title = job 
        ? `${eventType.charAt(0).toUpperCase() + eventType.slice(1)}: ${job.title}`
        : `${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`;
        
      const description = job 
        ? `${eventType} for ${job.title} at ${job.company}`
        : undefined;

      await CalendarService.createCalendarEvent(userId, {
        job_id: jobId,
        title,
        description,
        event_type: eventType,
        event_date: new Date().toISOString().split('T')[0],
        priority: eventType === 'interview' ? 'high' : 'medium'
      });

      await loadUpcomingEvents();
      await loadStats();
    } catch (error) {
      console.error('Failed to create quick event:', error);
    }
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg shadow-lg p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Calendar</h3>
        </div>
        {onOpenFullCalendar && (
          <button
            onClick={onOpenFullCalendar}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
          >
            View All
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
          <div className="text-2xl font-bold text-blue-600">{stats.upcomingInterviews}</div>
          <div className="text-sm text-gray-600">Upcoming Interviews</div>
        </div>
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-yellow-50'}`}>
          <div className="text-2xl font-bold text-yellow-600">{stats.overdueFollowUps}</div>
          <div className="text-sm text-gray-600">Overdue Follow-ups</div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-3">Upcoming Events</h4>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <div className="text-sm">No upcoming events</div>
            <button
              onClick={() => quickCreateEvent('follow_up')}
              className="text-blue-600 hover:text-blue-700 text-sm mt-1"
            >
              Create your first event
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map(event => (
              <div
                key={event.id}
                className={`p-3 rounded-lg border transition-colors hover:shadow-md cursor-pointer ${
                  darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${getEventColor(event.event_type)}`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{event.title}</div>
                    <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                      <Clock size={12} />
                      {formatEventDate(event.event_date, event.event_time)}
                    </div>
                    {event.location && (
                      <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                        <MapPin size={12} />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                    {event.job && (
                      <div className="text-xs text-gray-500 mt-1">
                        {event.job.title} - {event.job.company}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => quickCreateEvent('interview')}
            className="flex flex-col items-center gap-1 p-2 rounded-lg border border-green-300 hover:bg-green-50 transition-colors"
          >
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <Plus size={14} className="text-white" />
            </div>
            <span className="text-xs text-green-700">Interview</span>
          </button>
          <button
            onClick={() => quickCreateEvent('follow_up')}
            className="flex flex-col items-center gap-1 p-2 rounded-lg border border-yellow-300 hover:bg-yellow-50 transition-colors"
          >
            <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
              <Plus size={14} className="text-white" />
            </div>
            <span className="text-xs text-yellow-700">Follow-up</span>
          </button>
          <button
            onClick={() => quickCreateEvent('application')}
            className="flex flex-col items-center gap-1 p-2 rounded-lg border border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <Plus size={14} className="text-white" />
            </div>
            <span className="text-xs text-blue-700">Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
};