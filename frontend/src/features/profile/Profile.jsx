/*
 * Profile page component
 * Displays user profile information, achievements, and recent events/donation history.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaPhone, FaMapMarkerAlt, FaEnvelope, FaTint, FaUser, FaCalendarAlt, FaAward, FaUsers, FaBuilding, FaCalendarCheck } from 'react-icons/fa';
import { useAuth } from '../../shared/context/AuthContext';
import profileService from '../../shared/services/profileService';
import Avatar from '../../shared/components/Avatar';
import Navbar from '../../shared/components/Navbar';
import './Profile.css';

function Profile() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch the current user's profile (including role-specific calculated fields)
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await profileService.getProfile(user.token);
      setProfileData(data);
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user.token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const formatDate = (date) => {
    if (!date) return 'Not recorded';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getEligibilityStatus = () => {
    if (!profileData?.lastDonationDate) {
      return {
        status: 'Eligible to Donate',
        className: 'eligible'
      };
    }

    const lastDonation = new Date(profileData.lastDonationDate);
    const today = new Date();
    const daysSinceLastDonation = Math.floor((today - lastDonation) / (1000 * 60 * 60 * 24));

    if (daysSinceLastDonation >= 10) {
      return {
        status: 'Eligible to Donate',
        className: 'eligible'
      };
    } else {
      const eligibleDate = new Date(lastDonation);
      eligibleDate.setDate(eligibleDate.getDate() + 10);
      return {
        status: `Not eligible before ${eligibleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        className: 'not-eligible'
      };
    }
  };

  const formatLocation = (address) => {
    if (!address) return 'Not provided';
    const parts = address.split(',');
    if (parts.length >= 2) {
      return `${parts[0].trim()}, ${parts[1].trim()}`;
    }
    return address;
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Navigation Bar */}
      <Navbar />

      {/* Main Content */}
      <div className="profile-container">
        {/* Back Button */}
        <div className="profile-header">
          <button className="back-link" onClick={() => navigate('/dashboard')}>
            <FaArrowLeft /> Back to Home
          </button>
        </div>

        {/* Title and Edit Button */}
        <div className="profile-title-bar">
          <h1 className="profile-title">
            {user.role === 'donor' ? 'Donor Profile' : 'Organizer Profile'}
          </h1>
          <button className="edit-btn" onClick={() => navigate('/profile/edit')}>
            <FaEdit /> Edit Profile
          </button>
        </div>

        {/* Personal Information Card */}
        <div className="info-card">
          <h2 className="section-title">Personal Information</h2>
          <div className="personal-info-layout">
            {/* Left Side - Avatar and Role Badge */}
            <div className="avatar-section">
              <Avatar
                src={profileData?.profilePicture?.url}
                name={profileData?.fullName}
                size="large"
              />
              <button className="role-badge">
                {user.role === 'donor' ? 'Donor' : 'Organizer'}
              </button>
            </div>

            {/* Right Side - Two Column Grid */}
            <div className="info-grid">
              {/* Column 1 */}
              <div className="info-column">
                <div className="info-item">
                  <div className="info-label">
                    <FaUser className="info-icon" /> Name
                  </div>
                  <div className="info-value">{profileData?.fullName || 'John Doe'}</div>
                </div>

                <div className="info-item">
                  <div className="info-label">
                    <FaEnvelope className="info-icon" /> Email
                  </div>
                  <div className="info-value">{profileData?.email || 'Not provided'}</div>
                </div>

                <div className="info-item">
                  <div className="info-label">
                    <FaPhone className="info-icon" /> Phone
                  </div>
                  <div className="info-value">{profileData?.phone || 'Not provided'}</div>
                </div>

                <div className="info-item">
                  <div className="info-label">
                    <FaMapMarkerAlt className="info-icon" /> Location
                  </div>
                  <div className="info-value">{formatLocation(profileData?.location?.address)}</div>
                </div>
              </div>

              {/* Column 2 */}
              <div className="info-column">
                {user.role === 'organizer' && (
                  <>
                    <div className="info-item">
                      <div className="info-label">
                        <FaBuilding className="info-icon" /> Organization
                      </div>
                      <div className="info-value">{profileData?.organization || 'Not provided'}</div>
                    </div>

                    <div className="info-item">
                      <div className="info-label">
                        <FaCalendarAlt className="info-icon" /> Member Since
                      </div>
                      <div className="info-value">
                        {profileData?.memberSince
                          ? new Date(profileData.memberSince + '-01').toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long'
                          })
                          : 'Not provided'}
                      </div>
                    </div>

                    <div className="info-item">
                      <div className="info-label">
                        <FaCalendarCheck className="info-icon" /> Events Organized
                      </div>
                      <div className="info-value">{profileData?.eventsOrganized || 0}</div>
                    </div>

                    <div className="info-item">
                      <div className="info-label">
                        <FaUsers className="info-icon" /> Total Attendees
                      </div>
                      <div className="info-value">{profileData?.totalAttendees || 0}</div>
                    </div>
                  </>
                )}

                {user.role === 'donor' && (
                  <>
                    <div className="info-item">
                      <div className="info-label">
                        <FaTint className="info-icon" /> Blood Type
                      </div>
                      <div className="info-value">{profileData?.bloodType || 'Not provided'}</div>
                    </div>

                    <div className="info-item">
                      <div className="info-label">
                        <FaCalendarAlt className="info-icon" /> Last Donation
                      </div>
                      <div className="info-value">{formatDate(profileData?.lastDonationDate)}</div>
                    </div>

                    <div className="info-item">
                      <div className="info-label">
                        <FaAward className="info-icon" /> Total Donations
                      </div>
                      <div className="info-value">{profileData?.totalDonations || 0}</div>
                    </div>

                    <div className="info-item">
                      <div className="info-label">
                        <FaTint className="info-icon" /> Donor Eligibility
                      </div>
                      <div className={`info-value eligibility-status ${getEligibilityStatus().className}`}>
                        {getEligibilityStatus().status}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Organizing Achievements */}
        <div className="info-card">
          <h2 className="section-title">
            {user.role === 'donor' ? 'Achievements' : 'Organizing Achievements'}
          </h2>

          {/* Achievement Cards Grid */}
          <div className="achievements-grid">
            {profileData?.achievements && profileData.achievements.length > 0 ? (
              profileData.achievements.map((achievement, index) => (
                <div key={index} className="achievement-card">
                  <div className="achievement-content">
                    <div className="achievement-title">{achievement.title}</div>
                    <div className="achievement-description">{achievement.description}</div>
                  </div>
                  <div className="achievement-date">
                    {achievement.date ? new Date(achievement.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Achieved'}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data-message">
                {user.role === 'donor'
                  ? 'No achievements yet. Register for an event to start your journey!'
                  : 'No achievements yet. Create your first event to get started!'}
              </div>
            )}
          </div>
        </div>

        {/* Event History */}
        <div className="info-card">
          <h2 className="section-title">
            {user.role === 'donor' ? 'Recent Donation History' : 'Recent Event History'}
          </h2>

          {/* Event List */}
          <div className="event-list">
            {(user.role === 'donor' ? profileData?.donationHistory : profileData?.eventHistory) &&
              (user.role === 'donor' ? profileData?.donationHistory : profileData?.eventHistory).length > 0 ? (
              (user.role === 'donor' ? profileData?.donationHistory : profileData?.eventHistory).map((event) => (
                <div key={event._id} className="profile-event-item">
                  <div className="profile-event-bar"></div>
                  <div className="profile-event-content">
                    <div className="profile-event-name">{event.name}</div>
                    {user.role === 'organizer' && (
                      <div className="profile-event-details">
                        <FaUsers className="profile-detail-icon" /> {event.attendees} attendees
                      </div>
                    )}
                  </div>
                  <div className="profile-event-date">
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data-message">
                {user.role === 'donor'
                  ? 'No donation history yet. Register for an event to begin!'
                  : 'No event history yet. Create your first event!'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
