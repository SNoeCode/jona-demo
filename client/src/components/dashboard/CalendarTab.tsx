 "use client"
import React, { useState, useEffect, useMemo } from "react";
import {
  CalendarEvent,
  CalendarView,
  CreateCalendarEventPayload,
  UpdateCalendarEventPayload,
} from "@/types/user/calendar"
import { Job } from "@/types/user/index";
import { CalendarService } from "@/services/user-services/calendar-service";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  User,
} from "lucide-react";
import { isCreatePayload } from "@/types/user/calendar";
interface CalendarTabProps {
  jobs: Job[];
  darkMode: boolean;
  userId: string;
}


interface CalendarEventModalProps {
  event?: CalendarEvent;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    event: CreateCalendarEventPayload | UpdateCalendarEventPayload
  ) => void;
  onDelete?: (eventId: string) => void;
  jobs: Job[];
  darkMode: boolean;
}

const CalendarEventModal: React.FC<CalendarEventModalProps> = ({
  event,
  isOpen,
  onClose,
  onSave,
  onDelete,
  jobs,
  darkMode,
}) => {
  const [formData, setFormData] = useState<CreateCalendarEventPayload>({
    title: "",
    description: "",
    event_type: "other",
    event_date: new Date().toISOString().split("T")[0],
    event_time: "09:00",
    duration_minutes: 60,
    location: "",
    is_all_day: false,
    priority: "medium",
    notes: "",
  });

  useEffect(() => {
    if (event) {
      setFormData({
        job_id: event.job_id,
        title: event.title,
        description: event.description || "",
        event_type: event.event_type,
        event_date: event.event_date,
        event_time: event.event_time || "09:00",
        duration_minutes: event.duration_minutes || 60,
        location: event.location || "",
        is_all_day: event.is_all_day || false,
        priority: event.priority,
        notes: event.notes || "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        event_type: "other",
        event_date: new Date().toISOString().split("T")[0],
        event_time: "09:00",
        duration_minutes: 60,
        location: "",
        is_all_day: false,
        priority: "medium",
        notes: "",
      });
    }
  }, [event]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const eventTypeColors = {
    application: "bg-blue-100 text-blue-800 border-blue-200",
    interview: "bg-green-100 text-green-800 border-green-200",
    follow_up: "bg-yellow-100 text-yellow-800 border-yellow-200",
    deadline: "bg-red-100 text-red-800 border-red-200",
    offer: "bg-purple-100 text-purple-800 border-purple-200",
    rejection: "bg-gray-100 text-gray-800 border-gray-200",
    networking: "bg-cyan-100 text-cyan-800 border-cyan-200",
    research: "bg-lime-100 text-lime-800 border-lime-200",
    other: "bg-slate-100 text-slate-800 border-slate-200",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`w-full max-w-2xl rounded-lg shadow-xl ${
          darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        }`}
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {event ? "Edit Event" : "Create Event"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Event Type
              </label>
              <select
                value={formData.event_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    event_type: e.target.value as any,
                  })
                }
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
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
              <label className="block text-sm font-medium mb-1">
                Related Job
              </label>
              <select
                value={formData.job_id || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    job_id: e.target.value || undefined,
                  })
                }
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
                }`}
              >
                <option value="">No related job</option>
                {jobs.map((job) => (
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
                onChange={(e) =>
                  setFormData({ ...formData, event_date: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
                }`}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Time</label>
              <input
                type="time"
                value={formData.event_time}
                onChange={(e) =>
                  setFormData({ ...formData, event_time: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
                }`}
                disabled={formData.is_all_day}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_minutes: parseInt(e.target.value),
                  })
                }
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
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
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as any })
                }
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
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
                  onChange={(e) =>
                    setFormData({ ...formData, is_all_day: e.target.checked })
                  }
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
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
                }`}
                placeholder="Meeting location, office, online, etc."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
                }`}
                rows={3}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-md ${
                  darkMode
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
                }`}
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <div>
              {event && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(event.id)}
                  className="px-4 py-2 text-red-600 hover:text-red-700 border border-red-300 rounded-md hover:bg-red-50"
                >
                  Delete Event
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 border rounded-md ${
                  darkMode
                    ? "border-gray-600 hover:bg-gray-700"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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

export const CalendarTab: React.FC<CalendarTabProps> = ({
  jobs,
  darkMode,
  userId,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("month");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<
    CalendarEvent | undefined
  >();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Load events for the current view
  useEffect(() => {
    loadEvents();
  }, [userId, currentDate, view]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      const calendarEvents = await CalendarService.getCalendarEvents(
        userId,
        startDate,
        endDate
      );
      setEvents(calendarEvents);
    } catch (error) {
      console.error("Failed to load calendar events:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    switch (view) {
      case "month":
        const startDate = new Date(year, month, 1).toISOString().split("T")[0];
        const endDate = new Date(year, month + 1, 0)
          .toISOString()
          .split("T")[0];
        return { startDate, endDate };
      case "week":
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return {
          startDate: startOfWeek.toISOString().split("T")[0],
          endDate: endOfWeek.toISOString().split("T")[0],
        };
      case "day":
        const dayStr = currentDate.toISOString().split("T")[0];
        return { startDate: dayStr, endDate: dayStr };
      default:
        return { startDate: "", endDate: "" };
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);

    switch (view) {
      case "month":
        newDate.setMonth(
          currentDate.getMonth() + (direction === "next" ? 1 : -1)
        );
        break;
      case "week":
        newDate.setDate(
          currentDate.getDate() + (direction === "next" ? 7 : -7)
        );
        break;
      case "day":
        newDate.setDate(
          currentDate.getDate() + (direction === "next" ? 1 : -1)
        );
        break;
    }

    setCurrentDate(newDate);
  };

  const handleCreateEvent = async (eventData: CreateCalendarEventPayload) => {
    try {
      await CalendarService.createCalendarEvent(userId, eventData);
      await loadEvents();
      setIsModalOpen(false);
      setSelectedEvent(undefined);
    } catch (error) {
      console.error("Failed to create event:", error);
    }
  };

  const handleUpdateEvent = async (eventData: UpdateCalendarEventPayload) => {
    if (!selectedEvent) return;

    try {
      await CalendarService.updateCalendarEvent(selectedEvent.id, eventData);
      await loadEvents();
      setIsModalOpen(false);
      setSelectedEvent(undefined);
    } catch (error) {
      console.error("Failed to update event:", error);
    }
  };

const handleSaveEvent = async (
  eventData: CreateCalendarEventPayload | UpdateCalendarEventPayload
): Promise<void> => {
  try {
    if (isCreatePayload(eventData)) {
      await CalendarService.createCalendarEvent(userId, eventData);
    } else {
      if (!selectedEvent) return;
      await CalendarService.updateCalendarEvent(selectedEvent.id, eventData);
    }

    await loadEvents();
    setIsModalOpen(false);
    setSelectedEvent(undefined);
  } catch (error) {
    console.error("Failed to save event:", error);
  }
};
  const handleDeleteEvent = async (eventId: string) => {
    try {
      await CalendarService.deleteCalendarEvent(eventId);
      await loadEvents();
      setIsModalOpen(false);
      setSelectedEvent(undefined);
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  const openCreateModal = (date?: Date) => {
    setSelectedEvent(undefined);
    setSelectedDate(date || null);
    setIsModalOpen(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const getEventColor = (eventType: string) => {
    const colors = {
      application: "bg-blue-500",
      interview: "bg-green-500",
      follow_up: "bg-yellow-500",
      deadline: "bg-red-500",
      offer: "bg-purple-500",
      rejection: "bg-gray-500",
      networking: "bg-cyan-500",
      research: "bg-lime-500",
      other: "bg-slate-500",
    };
    return colors[eventType as keyof typeof colors] || colors.other;
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDay = new Date(startDate);

    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const dayEvents = events.filter(
        (event) => event.event_date === currentDay.toISOString().split("T")[0]
      );

      days.push(
        <div
          key={currentDay.toISOString()}
          className={`min-h-24 p-1 border border-gray-200 cursor-pointer hover:bg-gray-50 ${
            currentDay.getMonth() !== month
              ? darkMode
                ? "text-gray-500 bg-gray-800"
                : "text-gray-400 bg-gray-50"
              : darkMode
              ? "bg-gray-700"
              : "bg-white"
          } ${
            currentDay.toDateString() === new Date().toDateString()
              ? "ring-2 ring-blue-500"
              : ""
          }`}
          onClick={() => openCreateModal(new Date(currentDay))}
        >
          <div className="text-sm font-medium mb-1">{currentDay.getDate()}</div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className={`text-xs p-1 rounded truncate text-white ${getEventColor(
                  event.event_type
                )}`}
                onClick={(e) => {
                  e.stopPropagation();
                  openEditModal(event);
                }}
              >
                {event.event_time && !event.is_all_day && (
                  <span className="mr-1">{event.event_time}</span>
                )}
                {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </div>
      );

      currentDay.setDate(currentDay.getDate() + 1);
    }

    return (
      <div className="grid grid-cols-7 gap-0 border border-gray-200">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className={`p-2 text-sm font-medium text-center border-b border-gray-200 ${
              darkMode ? "bg-gray-600" : "bg-gray-100"
            }`}
          >
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);

      const dayEvents = events.filter(
        (event) => event.event_date === day.toISOString().split("T")[0]
      );

      days.push(
        <div
          key={day.toISOString()}
          className={`flex-1 border border-gray-200 ${
            darkMode ? "bg-gray-700" : "bg-white"
          }`}
        >
          <div
            className={`p-2 text-sm font-medium border-b border-gray-200 ${
              darkMode ? "bg-gray-600" : "bg-gray-100"
            }`}
          >
            <div>{day.toLocaleDateString("en-US", { weekday: "short" })}</div>
            <div
              className={`text-lg ${
                day.toDateString() === new Date().toDateString()
                  ? "text-blue-600 font-bold"
                  : ""
              }`}
            >
              {day.getDate()}
            </div>
          </div>
          <div className="p-2 space-y-1 min-h-96">
            {dayEvents.map((event) => (
              <div
                key={event.id}
                className={`p-2 rounded text-white text-sm cursor-pointer ${getEventColor(
                  event.event_type
                )}`}
                onClick={() => openEditModal(event)}
              >
                {event.event_time && !event.is_all_day && (
                  <div className="font-semibold">{event.event_time}</div>
                )}
                <div className="truncate">{event.title}</div>
                {event.location && (
                  <div className="text-xs opacity-80 flex items-center gap-1">
                    <MapPin size={10} />
                    {event.location}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return <div className="flex gap-0">{days}</div>;
  };

  const renderDayView = () => {
    const dayEvents = events.filter(
      (event) => event.event_date === currentDate.toISOString().split("T")[0]
    );

    return (
      <div
        className={`border border-gray-200 ${
          darkMode ? "bg-gray-700" : "bg-white"
        }`}
      >
        <div
          className={`p-4 text-lg font-semibold border-b border-gray-200 ${
            darkMode ? "bg-gray-600" : "bg-gray-100"
          }`}
        >
          {currentDate.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
        <div className="p-4 space-y-3">
          {dayEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No events scheduled for this day
              <div className="mt-2">
                <button
                  onClick={() => openCreateModal(currentDate)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Create an event
                </button>
              </div>
            </div>
          ) : (
            dayEvents.map((event) => (
              <div
                key={event.id}
                className={`p-4 rounded-lg border cursor-pointer hover:shadow-md ${
                  darkMode
                    ? "border-gray-600 hover:bg-gray-600"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => openEditModal(event)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`w-3 h-3 rounded-full ${getEventColor(
                          event.event_type
                        )}`}
                      ></div>
                      <h3 className="font-semibold">{event.title}</h3>
                    </div>
                    {event.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {event.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {event.event_time && !event.is_all_day && (
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          {event.event_time} ({event.duration_minutes}m)
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-1">
                          <MapPin size={14} />
                          {event.location}
                        </div>
                      )}
                      {event.job && (
                        <div className="flex items-center gap-1">
                          <User size={14} />
                          {event.job.title} - {event.job.company}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
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
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${startOfWeek.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} - ${endOfWeek.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`;
      case "day":
        return currentDate.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      default:
        return "";
    }
  };

  return (
    <div
      className={`${
        darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
      } rounded-lg shadow p-6`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Calendar className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Calendar</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openCreateModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} />
            New Event
          </button>
        </div>
      </div>

      {/* View Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateDate("prev")}
            className={`p-2 rounded hover:bg-gray-200 ${
              darkMode ? "hover:bg-gray-700" : ""
            }`}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className={`px-4 py-2 rounded font-medium ${
              darkMode ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => navigateDate("next")}
            className={`p-2 rounded hover:bg-gray-200 ${
              darkMode ? "hover:bg-gray-700" : ""
            }`}
          >
            <ChevronRight size={20} />
          </button>
          <h3 className="ml-4 text-xl font-semibold">{getViewTitle()}</h3>
        </div>

        <div className="flex items-center gap-1">
          {(["month", "week", "day"] as CalendarView[]).map((viewType) => (
            <button
              key={viewType}
              onClick={() => setView(viewType)}
              className={`px-3 py-1 rounded capitalize ${
                view === viewType
                  ? "bg-blue-600 text-white"
                  : darkMode
                  ? "hover:bg-gray-700"
                  : "hover:bg-gray-200"
              }`}
            >
              {viewType}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="calendar-content">
          {view === "month" && renderMonthView()}
          {view === "week" && renderWeekView()}
          {view === "day" && renderDayView()}
        </div>
      )}

      {/* Event Modal */}
      <CalendarEventModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(undefined);
          setSelectedDate(null);
        }}
        onSave={handleSaveEvent}
        onDelete={selectedEvent ? handleDeleteEvent : undefined}
        jobs={jobs}
        darkMode={darkMode}
      />
    </div>
  );
};
