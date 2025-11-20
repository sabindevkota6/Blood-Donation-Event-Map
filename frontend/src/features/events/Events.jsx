/*
 * Events page: lists events for a user (organizer-specific actions are supported)
 * Displays categorized lists and supports edit/cancel/delete for organizer events.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaPlus,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUsers,
  FaEdit,
  FaTrashAlt,
} from 'react-icons/fa';
import { useAuth } from '../../shared/context/AuthContext';
import eventService from '../../shared/services/eventService';
import Navbar from '../../shared/components/Navbar';
import './Events.css';

const sortEventsByDate = (list, direction = 'asc') => {
  const sorted = [...list];
  sorted.sort((a, b) => {
    const aDate = new Date(a.eventDate);
    const bDate = new Date(b.eventDate);
    const diff = aDate - bDate;
    return direction === 'asc' ? diff : -diff;
  });
  return sorted;
};

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Auto-scroll when user feedback messages appear
  useEffect(() => {
    if (success || error) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [success, error]);

  // Fetch organizer events on mount and when token changes
  useEffect(() => {
    if (!user?.token) {
      setEvents([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError('');
        setSuccess('');
        const response = await eventService.getMyEvents(user.token);
        if (!isMounted) return;
        setEvents(response?.events || []);
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || 'Failed to load events');
        setEvents([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchEvents();

    return () => {
      isMounted = false;
    };
  }, [user?.token]);

  const categorizedEvents = useMemo(() => {
    const upcoming = [];
    const current = [];
    const completed = [];
    const cancelled = [];

    events.forEach((event) => {
      switch (event.status) {
        case 'upcoming':
          upcoming.push(event);
          break;
        case 'ongoing':
          current.push(event);
          break;
        case 'completed':
          completed.push(event);
          break;
        case 'cancelled':
          cancelled.push(event);
          break;
        default:
          break;
      }
    });

    return {
      upcoming: sortEventsByDate(upcoming, 'asc'),
      current: sortEventsByDate(current, 'asc'),
      completed: sortEventsByDate(completed, 'desc'),
      cancelled: sortEventsByDate(cancelled, 'desc'),
    };
  }, [events]);

  const hasEvents = useMemo(() => {
    return (
      categorizedEvents.upcoming.length > 0 ||
      categorizedEvents.current.length > 0 ||
      categorizedEvents.completed.length > 0 ||
      categorizedEvents.cancelled.length > 0
    );
  }, [categorizedEvents]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not set';
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(dateString));
    } catch (err) {
      return dateString;
    }
  };

  const getStatusLabel = (status) => {
    if (status === 'ongoing') return 'Current';
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Upcoming';
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'upcoming':
        return 'badge-status badge-upcoming';
      case 'ongoing':
        return 'badge-status badge-current';
      case 'completed':
        return 'badge-status badge-completed';
      case 'cancelled':
        return 'badge-status badge-cancelled';
      default:
        return 'badge-status badge-upcoming';
    }
  };

  const handleViewDetails = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  const handleEditEvent = (eventId) => {
    navigate(`/events/edit/${eventId}`);
  };

  const handleCancelEvent = async (eventId) => {
    if (!user?.token) return;
    const confirmCancel = window.confirm(
      'Cancelling this event will move it to the Cancelled section. Are you sure you want to continue?'
    );

    if (!confirmCancel) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      const response = await eventService.cancelEvent(eventId, user.token);
      const updatedEvent = response?.event;

      if (updatedEvent) {
        setEvents((prev) =>
          prev.map((eventItem) =>
            eventItem._id === eventId ? updatedEvent : eventItem
          )
        );
      } else {
        setEvents((prev) =>
          prev.map((eventItem) =>
            eventItem._id === eventId
              ? { ...eventItem, status: 'cancelled' }
              : eventItem
          )
        );
      }

      setSuccess(response?.message || 'Event cancelled successfully.');
    } catch (err) {
      setError(err.message || 'Failed to cancel event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!user?.token) return;
    const confirmDelete = window.confirm(
      'Deleting this event is permanent and cannot be undone. Are you sure you want to proceed?'
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      const response = await eventService.deleteEvent(eventId, user.token);
      setEvents((prev) => prev.filter((eventItem) => eventItem._id !== eventId));
      setSuccess(response?.message || 'Event deleted successfully.');
    } catch (err) {
      setError(err.message || 'Failed to delete event');
    }
  };

  if (loading) {
    return (
      <div className="events-page">
        <Navbar />
        <div className="events-container">
          <div className="loading">Loading events...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="events-page">
      <Navbar />

      <div className="events-container">
        {/* Header */}
        <div className="events-header">
          <button className="back-link" onClick={() => navigate('/dashboard')}>
            <FaArrowLeft /> Back to Home
          </button>
        </div>

        {/* Title Bar */}
        <div className="events-title-bar">
          <h1 className="events-title">My Events</h1>
          <button className="create-event-btn" onClick={() => navigate('/events/create')}>
            <FaPlus /> Create New Event
          </button>
        </div>

        {error && <div className="events-alert error">{error}</div>}
        {success && <div className="events-alert success">{success}</div>}

        {/* Events List */}
        <div className="events-content">
          {!hasEvents ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>No Events Yet</h3>
              <p>Create your first blood donation event to get started</p>
              <button className="create-first-event-btn" onClick={() => navigate('/events/create')}>
                <FaPlus /> Create Your First Event
              </button>
            </div>
          ) : (
            <div className="events-sections">
              {categorizedEvents.upcoming.length > 0 && (
                <EventsSection
                  title="Upcoming Events"
                  events={categorizedEvents.upcoming}
                  formatDate={formatDate}
                  getStatusLabel={getStatusLabel}
                  getStatusBadgeClass={getStatusBadgeClass}
                  onViewDetails={handleViewDetails}
                  onEdit={handleEditEvent}
                  onCancel={handleCancelEvent}
                />
              )}

              {categorizedEvents.current.length > 0 && (
                <EventsSection
                  title="Current Events"
                  events={categorizedEvents.current}
                  formatDate={formatDate}
                  getStatusLabel={getStatusLabel}
                  getStatusBadgeClass={getStatusBadgeClass}
                  onViewDetails={handleViewDetails}
                  onEdit={handleEditEvent}
                  onCancel={handleCancelEvent}
                />
              )}

              {categorizedEvents.completed.length > 0 && (
                <EventsSection
                  title="Completed Events"
                  events={categorizedEvents.completed}
                  formatDate={formatDate}
                  getStatusLabel={getStatusLabel}
                  getStatusBadgeClass={getStatusBadgeClass}
                  onViewDetails={handleViewDetails}
                  onDelete={handleDeleteEvent}
                  isCompletedSection
                />
              )}

              {categorizedEvents.cancelled.length > 0 && (
                <EventsSection
                  title="Cancelled Events"
                  events={categorizedEvents.cancelled}
                  formatDate={formatDate}
                  getStatusLabel={getStatusLabel}
                  getStatusBadgeClass={getStatusBadgeClass}
                  onViewDetails={handleViewDetails}
                  onDelete={handleDeleteEvent}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const EventsSection = ({
  title,
  events,
  formatDate,
  getStatusLabel,
  getStatusBadgeClass,
  onViewDetails,
  onEdit,
  onCancel,
  onDelete,
  isCompletedSection = false,
}) => {
  const bloodTypesTitle = isCompletedSection ? 'Blood Types Collected:' : 'Blood Types Needed:';
  const getAttendanceText = (event) => {
    const current = event?.currentAttendees ?? 0;
    const expected = event?.expectedCapacity ?? 0;

    if (expected > 0) {
      return `${current} / ${expected} registered`;
    }

    return `${current} registered`;
  };

  const getDateRangeLabel = (event) => {
    const startRaw = event?.eventDate || event?.startDate;
    const endRaw = event?.endDate;

    if (!startRaw) {
      return 'Date not set';
    }

    const startDate = new Date(startRaw);
    const endDate = endRaw ? new Date(endRaw) : null;

    const startTime = startDate.getTime();
    const endTime = endDate ? endDate.getTime() : Number.NaN;

    if (!endDate || Number.isNaN(endTime) || startTime === endTime) {
      return formatDate(startRaw);
    }

    return `${formatDate(startRaw)} - ${formatDate(endRaw)}`;
  };

  return (
    <section className="events-section">
      <h2 className="section-title">{title}</h2>
      <div className="events-list">
        {events.map((event) => (
          <article key={event._id} className="event-card">
            <div className="event-card-top">
              <div className="badge-group">
                <span className={getStatusBadgeClass(event.status)}>
                  {getStatusLabel(event.status)}
                </span>
                {event.organizationName && (
                  <span className="badge badge-organization">{event.organizationName}</span>
                )}
              </div>

              {(event.status === 'upcoming' || event.status === 'ongoing') && (
                <div className="event-actions">
                  {onEdit && (
                    <button
                      type="button"
                      className="action-btn outline"
                      onClick={() => onEdit(event._id)}
                    >
                      <FaEdit className="action-btn-icon" />
                      Edit Event
                    </button>
                  )}
                  {onCancel && (
                    <button
                      type="button"
                      className="action-btn outline"
                      onClick={() => onCancel(event._id)}
                    >
                      <FaTrashAlt className="action-btn-icon" />
                      Cancel Event
                    </button>
                  )}
                </div>
              )}

              {(event.status === 'cancelled' || event.status === 'completed') && onDelete && (
                <div className="event-actions">
                  <button
                    type="button"
                    className="action-btn outline"
                    onClick={() => onDelete(event._id)}
                  >
                    <FaTrashAlt className="action-btn-icon" />
                    Delete Event
                  </button>
                </div>
              )}
            </div>

            <div className="event-card-header">
              <h3 className="event-name">{event.eventTitle}</h3>
            </div>

            <div className="event-meta">
              <div className="event-meta-item">
                <FaCalendarAlt className="event-meta-icon" />
                <span>
                  {getDateRangeLabel(event)}
                  {event.eventTime ? ` • ${event.eventTime}` : ''}
                </span>
              </div>
              <div className="event-meta-item">
                <FaMapMarkerAlt className="event-meta-icon" />
                <span>{event.location || 'Location to be announced'}</span>
              </div>
              <div className="event-meta-item">
                <FaUsers className="event-meta-icon" />
                <span>{getAttendanceText(event)}</span>
              </div>
            </div>

            <div className="event-blood-types">
              <span className="blood-types-label">{bloodTypesTitle}</span>
              <div className="blood-types-row">
                <div className="blood-types-list">
                  {Array.isArray(event.bloodTypesNeeded) && event.bloodTypesNeeded.length > 0 ? (
                    event.bloodTypesNeeded.map((type) => (
                      <span key={type} className="blood-type-pill">
                        {type}
                      </span>
                    ))
                  ) : (
                    <span className="blood-type-pill muted">Not specified</span>
                  )}
                </div>
                <button
                  type="button"
                  className="view-details-btn"
                  onClick={() => onViewDetails && onViewDetails(event._id)}
                >
                  View Details
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Events;
