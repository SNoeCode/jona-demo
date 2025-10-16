"use client"
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Plus, ChevronRight } from 'lucide-react';

// Mock types for demo
interface CalendarEvent {
  id: string;
  title: string;
  event_type: string;
  event_date: string;
  event_time?: string;
  location?: string;
  job?: { title: string; company: string };
}

interface Job {
  id: string;
  title: string;
  company: string;
}

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
    upcomingInterviews: 3,
    overdueFollowUps: 1,
    completedApplications: 0
  });

  const getEventColor = (eventType: string) => {
    const colors = {
      'application': 'bg-[#FF6B35]',
      'interview': 'bg-[#00A6A6]',
      'follow_up': 'bg-[#FFB627]',
      'deadline': 'bg-red-500',
      'offer': 'bg-purple-500',
      'rejection': 'bg-gray-500',
      'networking': 'bg-[#00A6A6]',
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

  const quickCreateEvent = async (eventType: 'interview' | 'follow_up' | 'application') => {
    console.log('Creating event:', eventType);
  };

  return (
    <div className={`${darkMode ? 'bg-[#1B3A57] text-white' : 'bg-white text-[#1B3A57]'} rounded-lg shadow-lg p-4 sm:p-6`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#FF6B35]" />
          <h3 className="text-lg font-semibold">Calendar</h3>
        </div>
        {onOpenFullCalendar && (
          <button
            onClick={onOpenFullCalendar}
            className="text-[#FF6B35] hover:text-[#e55a2b] flex items-center gap-1 text-sm self-start sm:self-auto"
          >
            View All
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-[#2a4f6e]' : 'bg-blue-50'}`}>
          <div className="text-2xl font-bold text-[#00A6A6]">{stats.upcomingInterviews}</div>
          <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Upcoming Interviews</div>
        </div>
        <div className={`p-3 rounded-lg ${darkMode ? 'bg-[#2a4f6e]' : 'bg-yellow-50'}`}>
          <div className="text-2xl font-bold text-[#FFB627]">{stats.overdueFollowUps}</div>
          <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Overdue Follow-ups</div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="mb-4 sm:mb-6">
        <h4 className="text-sm font-medium mb-3">Upcoming Events</h4>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF6B35] mx-auto"></div>
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <div className="text-sm">No upcoming events</div>
            <button
              onClick={() => quickCreateEvent('follow_up')}
              className="text-[#FF6B35] hover:text-[#e55a2b] text-sm mt-1"
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
                  darkMode ? 'border-[#2a4f6e] hover:bg-[#2a4f6e]' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${getEventColor(event.event_type)}`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{event.title}</div>
                    <div className={`text-sm mt-1 flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <Clock size={12} />
                      {formatEventDate(event.event_date, event.event_time)}
                    </div>
                    {event.location && (
                      <div className={`text-sm mt-1 flex items-center gap-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        <MapPin size={12} />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                    {event.job && (
                      <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
            className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
              darkMode 
                ? 'border-[#00A6A6] hover:bg-[#2a4f6e]' 
                : 'border-[#00A6A6] hover:bg-teal-50'
            }`}
          >
            <div className="w-6 h-6 bg-[#00A6A6] rounded-full flex items-center justify-center">
              <Plus size={14} className="text-white" />
            </div>
            <span className="text-xs text-[#00A6A6]">Interview</span>
          </button>
          <button
            onClick={() => quickCreateEvent('follow_up')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
              darkMode 
                ? 'border-[#FFB627] hover:bg-[#2a4f6e]' 
                : 'border-[#FFB627] hover:bg-yellow-50'
            }`}
          >
            <div className="w-6 h-6 bg-[#FFB627] rounded-full flex items-center justify-center">
              <Plus size={14} className="text-white" />
            </div>
            <span className="text-xs text-[#FFB627]">Follow-up</span>
          </button>
          <button
            onClick={() => quickCreateEvent('application')}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
              darkMode 
                ? 'border-[#FF6B35] hover:bg-[#2a4f6e]' 
                : 'border-[#FF6B35] hover:bg-orange-50'
            }`}
          >
            <div className="w-6 h-6 bg-[#FF6B35] rounded-full flex items-center justify-center">
              <Plus size={14} className="text-white" />
            </div>
            <span className="text-xs text-[#FF6B35]">Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Demo
export default function Demo() {
  const [darkMode, setDarkMode] = useState(false);
  
  return (
    <div className={`min-h-screen p-4 sm:p-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b]"
          >
            Toggle Dark Mode
          </button>
        </div>
        <CalendarWidget 
          jobs={[]}
          darkMode={darkMode}
          userId="demo"
          onOpenFullCalendar={() => console.log('Open calendar')}
        />
      </div>
    </div>
  );
}