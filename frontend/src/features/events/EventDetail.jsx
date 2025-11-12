import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../../shared/context/AuthContext';
import eventService from '../../shared/services/eventService';
import profileService from '../../shared/services/profileService';
import LocationMap from '../../shared/components/LocationMap';
import Navbar from '../../shared/components/Navbar';
import EventRegistrationModal from './EventRegistrationModal';
import './EventDetail.css';

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [eligibilityError, setEligibilityError] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const response = await eventService.getEvent(id);
        const eventData = response.event || response;
        setEvent(eventData);
        
        // Check if user is already registered for this event
        if (user && user._id && eventData.attendees) {
          const registered = eventData.attendees.some(
            (attendee) => {
              const donorId = typeof attendee.donor === 'string' 
                ? attendee.donor 
                : attendee.donor?._id;
              return donorId === user._id;
            }
          );
          setIsRegistered(registered);
        }
      } catch (err) {
        console.error('Failed to fetch event:', err);
        setError('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, user]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateRange = (startDate, endDate) => {
    if (!endDate || startDate === endDate) {
      return formatDate(startDate);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if same date
    if (start.toDateString() === end.toDateString()) {
      return formatDate(startDate);
    }

    // Format start date
    const startFormatted = start.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    // Format end date
    const endFormatted = end.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    return `${startFormatted} - ${endFormatted}`;
  };

  const handleRegisterClick = async () => {
    try {
      setEligibilityError('');
      
      // Check eligibility
      const response = await eventService.checkEligibility(id, token);
      
      if (response.eligible) {
        // Fetch user profile
        const profileData = await profileService.getProfile(token);
        setUserProfile(profileData);
        setShowRegistrationModal(true);
      } else {
        setEligibilityError(response.message);
        // Show error message for 5 seconds
        setTimeout(() => setEligibilityError(''), 5000);
      }
    } catch (err) {
      console.error('Error checking eligibility:', err);
      setEligibilityError(err.response?.data?.message || 'Failed to check eligibility');
      setTimeout(() => setEligibilityError(''), 5000);
    }
  };

  const handleRegistration = async () => {
    try {
      await eventService.registerForEvent(id, token);
      setShowRegistrationModal(false);
      
      // Refresh event data and update registration status
      const response = await eventService.getEvent(id);
      const eventData = response.event || response;
      setEvent(eventData);
      
      // Check registration status from updated event data
      if (user && user._id && eventData.attendees) {
        const registered = eventData.attendees.some(
          (attendee) => {
            const donorId = typeof attendee.donor === 'string' 
              ? attendee.donor 
              : attendee.donor?._id;
            return donorId === user._id;
          }
        );
        setIsRegistered(registered);
      }
      
      alert('Successfully registered for the event!');
    } catch (err) {
      console.error('Error registering for event:', err);
      alert(err.response?.data?.message || 'Failed to register for event');
    }
  };

  if (loading) {
    return (
      <div className="event-detail-page">
        <Navbar />
        <div className="event-detail-container">
          <div className="loading">Loading event details...</div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="event-detail-page">
        <Navbar />
        <div className="event-detail-container">
          <div className="error-message">{error || 'Event not found'}</div>
        </div>
      </div>
    );
  }

  const mapCenter = event.locationCoordinates 
    ? [event.locationCoordinates.lat, event.locationCoordinates.lng]
    : [27.7172, 85.324];

  const spotsRemaining = event.expectedCapacity - event.currentAttendees;
  const percentageFilled = Math.round((event.currentAttendees / event.expectedCapacity) * 100);

  return (
    <div className="event-detail-page">
      <Navbar />
      
      <div className="event-detail-container">
        {/* Back Button */}
        <button className="back-button" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>

        {/* Event Header */}
        <div className="event-header">
          <div className="organization-badge">{event.organizationName}</div>
          <h1 className="event-title">{event.eventTitle}</h1>
          <p className="event-organizer">Organized by {event.organizer?.fullName || 'Unknown'}</p>
        </div>

        {/* Info Cards Row */}
        <div className="info-cards-row">
          {/* Date & Time Card */}
          <div className="info-card">
            <div className="info-card-header">
              <FaCalendarAlt className="info-icon" />
              <span>Date & Time</span>
            </div>
            <div className="info-card-content">
              <p className="info-date">{formatDateRange(event.eventDate, event.endDate)}</p>
              <div className="info-time">
                <FaClock className="time-icon" />
                <span>{event.eventTime}</span>
              </div>
            </div>
          </div>

          {/* Location Card */}
          <div className="info-card">
            <div className="info-card-header">
              <FaMapMarkerAlt className="info-icon" />
              <span>Location</span>
            </div>
            <div className="info-card-content">
              <p className="info-location">{event.location}</p>
              <button className="view-map-btn" onClick={() => {
                document.getElementById('event-location-map')?.scrollIntoView({ behavior: 'smooth' });
              }}>
                View on Map
              </button>
            </div>
          </div>

          {/* Blood Types Needed Card */}
          <div className="info-card">
            <div className="info-card-header">
              <div className="blood-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C12 2 6 8 6 13C6 16.31 8.69 19 12 19C15.31 19 18 16.31 18 13C18 8 12 2 12 2Z"/>
                </svg>
              </div>
              <span>Blood Types Needed</span>
            </div>
            <div className="info-card-content">
              <div className="blood-types-list">
                {event.bloodTypesNeeded?.map((type) => (
                  <span key={type} className="blood-type-chip">{type}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Participants Card */}
          <div className="info-card">
            <div className="info-card-header">
              <FaUsers className="info-icon" />
              <span>Participants</span>
            </div>
            <div className="info-card-content">
              <div className="participants-count">
                {event.currentAttendees} / {event.expectedCapacity}
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${percentageFilled}%` }}
                ></div>
              </div>
              <p className="spots-remaining">{spotsRemaining} spots remaining</p>
            </div>
          </div>
        </div>

        {/* Event Location Map */}
        <div className="event-location-section" id="event-location-map">
          <h2 className="section-title">Event Location</h2>
          <div className="location-map-container">
            <LocationMap
              position={event.locationCoordinates || null}
              center={event.locationCoordinates ? [event.locationCoordinates.lat, event.locationCoordinates.lng] : mapCenter}
              zoom={13}
              showSearch={false}
              showCurrentLocation={false}
              onLocationChange={() => {}} // Read-only map
            />
          </div>
          <div className="location-address">
            <FaMapMarkerAlt className="location-icon" />
            <span>{event.location}</span>
          </div>
        </div>

        {/* Two Column Layout for Description and Contact */}
        <div className="content-columns">
          {/* Event Description Column */}
          <div className="description-column">
            {/* Combined Event Details Card */}
            <div className="event-details-card">
              {/* Event Description */}
              <div className="card-section">
                <h2 className="section-title">Event Description</h2>
                <p className="description-text">{event.eventDescription}</p>
              </div>

              {/* Eligibility Requirements */}
              <div className="card-section">
                <h3 className="subsection-title">Eligibility Requirements</h3>
                <ul className="requirements-list">
                  {event.eligibilityRequirements?.map((req, index) => (
                    <li key={index} className="requirement-item">
                      <FaCheckCircle className="check-icon" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What to Bring */}
              <div className="card-section">
                <h3 className="subsection-title">What to Bring</h3>
                <ul className="what-to-bring-list">
                  <li className="what-to-bring-item">
                    <FaCheckCircle className="what-to-bring-icon" />
                    <span>Valid government-issued photo ID</span>
                  </li>
                  <li className="what-to-bring-item">
                    <FaCheckCircle className="what-to-bring-icon" />
                    <span>List of current medications (if any)</span>
                  </li>
                  <li className="what-to-bring-item">
                    <FaCheckCircle className="what-to-bring-icon" />
                    <span>Donor card (if you have one)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contact & Actions Column */}
          <div className="sidebar-column">
            {/* Contact Information */}
            <div className="contact-section">
              <h2 className="section-title">Contact Information</h2>
              <div className="contact-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z"/>
                </svg>
                <span>{event.contactEmail}</span>
              </div>
              <div className="contact-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.62 10.79C8.06 13.62 10.38 15.94 13.21 17.38L15.41 15.18C15.69 14.9 16.08 14.82 16.43 14.93C17.55 15.3 18.75 15.5 20 15.5C20.55 15.5 21 15.95 21 16.5V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z"/>
                </svg>
                <span>{event.contactPhone}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="actions-section">
              <h2 className="section-title">Actions</h2>
              {user && user.role === 'donor' ? (
                <>
                  <p className="actions-description">
                    Be a donor by registering for the event and help us save lives
                  </p>
                  {eligibilityError && (
                    <div className="eligibility-error">
                      {eligibilityError}
                    </div>
                  )}
                  <button 
                    className={`register-event-btn ${isRegistered ? 'registered' : ''}`}
                    onClick={handleRegisterClick}
                    disabled={isRegistered}
                  >
                    {isRegistered ? 'Registered' : 'Register for Event'}
                  </button>
                </>
              ) : (
                <p className="actions-description">
                  If you want to register as a donor for this event, sign-up or sign-in with a donor account.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegistrationModal && userProfile && (
        <EventRegistrationModal
          event={event}
          userProfile={userProfile}
          onClose={() => setShowRegistrationModal(false)}
          onRegister={handleRegistration}
        />
      )}
    </div>
  );
}

export default EventDetail;
