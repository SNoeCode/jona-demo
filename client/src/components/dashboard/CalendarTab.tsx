"use client"
import React, { useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  User,
  X,
} from "lucide-react";

// Mock types
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  event_date: string;
  event_time?: string;
  duration_minutes?: number;
  location?: string;
  is_all_day?: boolean;
  priority: string;
  notes?: string;
  job_id?: string;
  job?: { title: string; company: string };
}

interface Job {
  id: string;
  title: string;
  company: string;
}

type CalendarView = 'month' | 'week' | 'day';

// Event Modal Component
const CalendarEventModal = ({ event, isOpen, onClose, onSave, onDelete, jobs, darkMode }: any) => {
  const [formData, setFormData] = useState({
    title: event?.title || "",
    description: event?.description || "",
    event_type: event?.event_type || "other",
    event_date: event?.event_date || new Date().toISOString().split("T")[0],
    event_time: event?.event_time || "09:00",
    duration_minutes: event?.duration_minutes || 60,
    location: event?.location || "",
    is_all_day: event?.is_all_day || false,
    priority: event?.priority || "medium",
    notes: event?.notes || "",
    job_id: event?.job_id || "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
        darkMode ? 'bg-[#1B3A57] text-white' : 'bg-white text-[#1B3A57]'
      }`}>
        <div className={`sticky top-0 p-4 sm:p-6 border-b z-10 ${darkMode ? 'bg-[#1B3A57] border-[#2a4f6e]' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {event ? "Edit Event" : "Create Event"}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-[#2a4f6e] border-[#3a5f7e] text-white' : 'bg-white border-gray-300'
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Event Type</label>
              <select
                value={formData.event_type}
                onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-[#2a4f6e] border-[#3a5f7e] text-white' : 'bg-white border-gray-300'
                }`}
              >
                <option value="application">Application</option>
                <option value="interview">Interview</option>
                <option value="follow_up">Follow Up</option>
                <option value="deadline">Deadline</option>
                <option value="offer">Offer</option>
                <option value="rejection">Rejection</option>
                <option value="networking">Networking</option>
                <option value="research">Research</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Related Job</label>
              <select
                value={formData.job_id}
                onChange={(e) => setFormData({ ...formData, job_id: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-[#2a4f6e] border-[#3a5f7e] text-white' : 'bg-white border-gray-300'
                }`}
              >
                <option value="">No related job</option>
                {jobs.map((job: Job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} - {job.company}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-[#2a4f6e] border-[#3a5f7e] text-white' : 'bg-white border-gray-300'
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Time</label>
              <input
                type="time"
                value={formData.event_time}
                onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-[#2a4f6e] border-[#3a5f7e] text-white' : 'bg-white border-gray-300'
                }`}
                disabled={formData.is_all_day}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Duration (min)</label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-[#2a4f6e] border-[#3a5f7e] text-white' : 'bg-white border-gray-300'
                }`}
                min="15"
                step="15"
                disabled={formData.is_all_day}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-[#2a4f6e] border-[#3a5f7e] text-white' : 'bg-white border-gray-300'
                }`}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_all_day}
                  onChange={(e) => setFormData({ ...formData, is_all_day: e.target.checked })}
                  className="rounded"
                />
                All Day Event
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-[#2a4f6e] border-[#3a5f7e] text-white' : 'bg-white border-gray-300'
                }`}
                placeholder="Meeting location, office, online, etc."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-[#2a4f6e] border-[#3a5f7e] text-white' : 'bg-white border-gray-300'
                }`}
                rows={3}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode ? 'bg-[#2a4f6e] border-[#3a5f7e] text-white' : 'bg-white border-gray-300'
                }`}
                rows={2}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
            <div>
              {event && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(event.id)}
                  className="w-full sm:w-auto px-4 py-2 text-red-600 hover:text-red-700 border border-red-300 rounded-md hover:bg-red-50"
                >
                  Delete Event
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 border rounded-md ${
                  darkMode ? 'border-[#3a5f7e] hover:bg-[#2a4f6e]' : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#FF6B35] text-white rounded-md hover:bg-[#e55a2b]"
              >
                {event ? "Update" : "Create"} Event
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Calendar Tab Component
export const CalendarTab = ({ jobs = [], darkMode = false, userId = "demo" }: any) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("month");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>();

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    switch (view) {
      case "month":
        newDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1));
        break;
      case "week":
        newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7));
        break;
      case "day":
        newDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1));
        break;
    }
    setCurrentDate(newDate);
  };

  const getEventColor = (eventType: string) => {
    const colors = {
      application: "bg-[#FF6B35]",
      interview: "bg-[#00A6A6]",
      follow_up: "bg-[#FFB627]",
      deadline: "bg-red-500",
      offer: "bg-purple-500",
      rejection: "bg-gray-500",
      networking: "bg-[#00A6A6]",
      research: "bg-lime-500",
      other: "bg-slate-500",
    };
    return colors[eventType as keyof typeof colors] || colors.other;
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDay = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dayEvents = events.filter(
        (event) => event.event_date === currentDay.toISOString().split("T")[0]
      );

      days.push(
        <div
          key={currentDay.toISOString()}
          className={`min-h-20 sm:min-h-24 p-1 sm:p-2 border cursor-pointer hover:bg-opacity-80 transition-colors ${
            currentDay.getMonth() !== month
              ? darkMode
                ? "text-gray-500 bg-[#0f2537] border-[#2a4f6e]"
                : "text-gray-400 bg-gray-50 border-gray-200"
              : darkMode
              ? "bg-[#1B3A57] border-[#2a4f6e]"
              : "bg-white border-gray-200"
          } ${
            currentDay.toDateString() === new Date().toDateString()
              ? "ring-2 ring-[#FF6B35]"
              : ""
          }`}
          onClick={() => setIsModalOpen(true)}
        >
          <div className="text-xs sm:text-sm font-medium mb-1">{currentDay.getDate()}</div>
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map((event) => (
              <div
                key={event.id}
                className={`text-xs p-1 rounded truncate text-white ${getEventColor(event.event_type)}`}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                +{dayEvents.length - 2}
              </div>
            )}
          </div>
        </div>
      );

      currentDay.setDate(currentDay.getDate() + 1);
    }

    return (
      <div className="grid grid-cols-7 gap-0 border rounded-lg overflow-hidden">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className={`p-2 text-xs sm:text-sm font-medium text-center border-b ${
              darkMode ? 'bg-[#2a4f6e] border-[#3a5f7e]' : 'bg-gray-100 border-gray-200'
            }`}
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}
        {days}
      </div>
    );
  };

  const getViewTitle = () => {
    switch (view) {
      case "month":
        return currentDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        });
      case "week":
        return "Week View";
      case "day":
        return currentDate.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
    }
  };

  return (
    <div className={`${darkMode ? 'bg-[#1B3A57] text-white' : 'bg-white text-[#1B3A57]'} rounded-lg shadow p-4 sm:p-6`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Calendar className="w-6 h-6 text-[#FF6B35]" />
          <h2 className="text-2xl font-bold">Calendar</h2>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b] transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Event</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateDate("prev")}
            className={`p-2 rounded transition-colors ${darkMode ? 'hover:bg-[#2a4f6e]' : 'hover:bg-gray-200'}`}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              darkMode ? 'hover:bg-[#2a4f6e]' : 'hover:bg-gray-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => navigateDate("next")}
            className={`p-2 rounded transition-colors ${darkMode ? 'hover:bg-[#2a4f6e]' : 'hover:bg-gray-200'}`}
          >
            <ChevronRight size={20} />
          </button>
          <h3 className="ml-2 sm:ml-4 text-base sm:text-xl font-semibold">{getViewTitle()}</h3>
        </div>

        <div className="flex items-center gap-1">
          {(["month", "week", "day"] as CalendarView[]).map((viewType) => (
            <button
              key={viewType}
              onClick={() => setView(viewType)}
              className={`px-3 py-1 rounded capitalize text-sm transition-colors ${
                view === viewType
                  ? "bg-[#FF6B35] text-white"
                  : darkMode
                  ? "hover:bg-[#2a4f6e]"
                  : "hover:bg-gray-200"
              }`}
            >
              {viewType}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Content */}
      <div className="calendar-content">
        {renderMonthView()}
      </div>

      {/* Event Modal */}
      <CalendarEventModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(undefined);
        }}
        onSave={(data: any) => {
          console.log('Save event:', data);
          setIsModalOpen(false);
        }}
        onDelete={(id: string) => {
          console.log('Delete event:', id);
          setIsModalOpen(false);
        }}
        jobs={jobs}
        darkMode={darkMode}
      />
    </div>
  );
};

// Demo
export default function Demo() {
  const [darkMode, setDarkMode] = useState(false);
  
  return (
    <div className={`min-h-screen p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#e55a2b]"
          >
            Toggle Dark Mode
          </button>
        </div>
        <CalendarTab 
          jobs={[]}
          darkMode={darkMode}
          userId="demo"
        />
      </div>
    </div>
  );
}