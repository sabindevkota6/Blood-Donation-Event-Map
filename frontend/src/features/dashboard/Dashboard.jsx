import React, { useState, useEffect } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaMapMarkerAlt, FaClock, FaUsers, FaCalendarAlt, FaHeart } from 'react-icons/fa';
import ProfileCompleteModal from '../../shared/components/ProfileCompleteModal';
import profileService from '../../shared/services/profileService';
import eventService from '../../shared/services/eventService';
import Navbar from '../../shared/components/Navbar';
import './Dashboard.css';

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const PAGE_SIZE = 6;

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ activeEvents: 0, registeredDonors: 0 });
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBloodType, setSelectedBloodType] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [pageCounts, setPageCounts] = useState([]);

  useEffect(() => {
    checkProfileCompletion();
    fetchDashboardStats();
    fetchEvents();
  }, []);

  const checkProfileCompletion = async () => {
    try {
      const data = await profileService.getProfile(user.token);
      setProfileData(data);
      
      // Show modal for both donors and organizers with incomplete profiles
      if (!data.isProfileComplete) {
        setShowModal(true);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const data = await eventService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  };

  const fetchEvents = async (page = 1, append = false) => {
    try {
      setEventsLoading(true);
      const filters = {
        page,
        limit: PAGE_SIZE,
        status: 'active', // Only fetch upcoming and ongoing events
      };

      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }

      if (selectedBloodType) {
        filters.bloodType = selectedBloodType;
      }

      if (selectedDate) {
        filters.date = selectedDate;
      }

      const data = await eventService.getAllEvents(filters);
      const eventsArray = Array.isArray(data?.events)
        ? data.events
        : Array.isArray(data)
        ? data
        : [];
      
      if (append) {
        setEvents(prev => [...prev, ...eventsArray]);
        setPageCounts((prev) => [...prev, eventsArray.length]);
      } else {
        setEvents(eventsArray);
        setPageCounts([eventsArray.length]);
      }
      
      setHasMore(Boolean(data?.hasMore));
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchEvents(1, false);
  };

  const handleBloodTypeFilter = (bloodType) => {
    setSelectedBloodType(bloodType === selectedBloodType ? '' : bloodType);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchEvents(1, false);
  }, [selectedBloodType]);

  useEffect(() => {
    fetchEvents(1, false);
  }, [selectedDate]);

  const handleLoadMore = () => {
    fetchEvents(currentPage + 1, true);
  };

  const handleLoadLess = () => {
    if (currentPage <= 1 || pageCounts.length <= 1) {
      return;
    }

    const removeCount = pageCounts[pageCounts.length - 1] || 0;

    setEvents((prev) => prev.slice(0, Math.max(0, prev.length - removeCount)));
    setPageCounts((prev) => prev.slice(0, -1));
    setCurrentPage((prev) => Math.max(1, prev - 1));
    setHasMore(true);
  };

  const handleViewEvent = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  const handleContinue = () => {
    setShowModal(false);
    navigate('/profile-setup');
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return 'TBA';
    }

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      return 'TBA';
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'upcoming':
        return 'status-upcoming';
      case 'ongoing':
        return 'status-ongoing';
      case 'completed':
        return 'status-completed';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <Navbar />
        <div className="dashboard-container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Navbar />
      {showModal && <ProfileCompleteModal onContinue={handleContinue} />}
      
      <div className="dashboard-container">
        {/* Welcome Section (card contains stats and CTA) */}
        <div className="welcome-section">
          <div className="welcome-card">
            <div className="welcome-inner">
              <div className="welcome-copy">
                <h1 className="welcome-title">Welcome, {user?.fullName}!</h1>
                <p className="welcome-subtitle">Help save lives by participating in blood donation events</p>
              </div>

              <div className="welcome-stats">
                <div className="welcome-stat">
                  <div className="welcome-stat-number">{stats.activeEvents}</div>
                  <div className="welcome-stat-label">Active Events</div>
                </div>

                <div className="welcome-stat">
                  <div className="welcome-stat-number">{stats.registeredDonors}</div>
                  <div className="welcome-stat-label">Registered Donors</div>
                </div>
              </div>

              {user?.role === 'organizer' && (
                <div className="welcome-actions">
                  <button className="btn-view-my-events" onClick={() => navigate('/events')}>View My Events</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Find Events Section */}
        <div className="find-events-section">
          <h2 className="section-title">Find Events</h2>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by location, event name, or organization"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="date-input-wrapper">
              <FaCalendarAlt className="date-icon" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-input"
                placeholder="Filter by date"
              />
            </div>
            <button type="submit" className="btn-search">
              Search
            </button>
          </form>

          {/* Blood Type Filter */}
          <div className="filter-section">
            <p className="filter-label">Filter by Blood Type:</p>
            <div className="blood-type-filters">
              {BLOOD_TYPES.map(bloodType => (
                <button
                  key={bloodType}
                  className={`blood-type-filter-btn ${selectedBloodType === bloodType ? 'active' : ''}`}
                  onClick={() => handleBloodTypeFilter(bloodType)}
                >
                  {bloodType}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* All Events Section */}
        <div className="events-section">
          <h2 className="section-title">
            {searchQuery || selectedBloodType ? 'Search Results' : 'All Events'}
          </h2>

          {eventsLoading && currentPage === 1 ? (
            <div className="loading">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="no-events">
              <p>No events found</p>
            </div>
          ) : (
            <>
              <div className="events-grid">
                {events.map((event) => (
                  <div key={event._id} className="event-card">
                    <div className="event-header">
                      <h3 className="event-title">{event.eventTitle}</h3>
                      <span className={`event-status ${getStatusClass(event.status)}`}>
                        {event.status}
                      </span>
                    </div>

                    <p className="event-organization">{event.organizationName}</p>

                    <div className="event-details">
                      <div className="event-detail-item">
                        <FaCalendarAlt className="detail-icon" />
                        <span>
                          {formatDate(event.startDate || event.eventDate)}
                          {event.endDate && new Date(event.endDate).toDateString() !== new Date(event.startDate || event.eventDate).toDateString() && ` - ${formatDate(event.endDate)}`}
                        </span>
                      </div>

                      <div className="event-detail-item">
                        <FaClock className="detail-icon" />
                        <span>{event.eventTime}</span>
                      </div>

                      <div className="event-detail-item">
                        <FaMapMarkerAlt className="detail-icon" />
                        <span className="location-text">
                          {event.location?.split(',').slice(0, 2).join(',').trim() || event.location}
                        </span>
                      </div>
                    </div>

                    <div className="event-blood-types">
                      <p className="blood-types-label">Blood Types Needed:</p>
                      <div className="blood-types-list">
                        {event.bloodTypesNeeded.map((type) => (
                          <span key={type} className="blood-type-chip">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="event-participants">
                      <FaUsers className="participants-icon" />
                      <span className="participants-count">{event.currentAttendees || 0} participants</span>
                    </div>

                    <button 
                      className="btn-view-details"
                      onClick={() => handleViewEvent(event._id)}
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {(hasMore || currentPage > 1) && (
                <div className="load-more-section">
                  {currentPage > 1 && (
                    <button
                      className="load-action-btn btn-load-less"
                      onClick={handleLoadLess}
                      disabled={eventsLoading}
                    >
                      {eventsLoading ? 'Please wait...' : 'Load Fewer Events'}
                    </button>
                  )}
                  {hasMore && (
                    <button 
                      className="load-action-btn btn-load-more"
                      onClick={handleLoadMore}
                      disabled={eventsLoading}
                    >
                      {eventsLoading ? 'Loading...' : 'Load More Events'}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
