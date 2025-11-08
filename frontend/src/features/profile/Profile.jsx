import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaPhone, FaMapMarkerAlt, FaEnvelope, FaTint, FaUser, FaCalendarAlt, FaAward, FaUsers } from 'react-icons/fa';
import { useAuth } from '../../shared/context/AuthContext';
import profileService from '../../shared/services/profileService';
import Avatar from '../../shared/components/Avatar';
import Navbar from '../../shared/components/Navbar';
import './Profile.css';

function Profile() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
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
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (date) => {
    if (!date) return 'Not recorded';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
                  <div className="info-value">{profileData?.location?.address || 'Not provided'}</div>
                </div>
              </div>

              {/* Column 2 */}
              <div className="info-column">
                {user.role === 'organizer' && (
                  <>
                    <div className="info-item">
                      <div className="info-label">
                        <FaAward className="info-icon" /> Organization
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
                        <FaCalendarAlt className="info-icon" /> Events Organized
                      </div>
                      <div className="info-value">{profileData?.eventsOrganized || '24'}</div>
                    </div>

                    <div className="info-item">
                      <div className="info-label">
                        <FaUsers className="info-icon" /> Total Attendees
                      </div>
                      <div className="info-value">{profileData?.totalAttendees || '1942'}</div>
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
                      <div className="info-value">
                        {profileData?.donorEligibility === 'eligible' ? 'Eligible to Donate' : 
                         profileData?.donorEligibility === 'not-eligible' ? 'Not Eligible' : 
                         'Not Recorded'}
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
            <div className="achievement-card">
              <div className="achievement-content">
                <div className="achievement-title">First Event</div>
                <div className="achievement-description">Successfully organized first blood donation event</div>
              </div>
              <div className="achievement-date">Mar 2022</div>
            </div>

            <div className="achievement-card">
              <div className="achievement-content">
                <div className="achievement-title">100 Donors Milestone</div>
                <div className="achievement-description">Reached 100 total donors across all events</div>
              </div>
              <div className="achievement-date">Aug 2022</div>
            </div>

            <div className="achievement-card">
              <div className="achievement-content">
                <div className="achievement-title">10 Events Organized</div>
                <div className="achievement-description">Organized 10+ successful blood donation events</div>
              </div>
              <div className="achievement-date">May 2023</div>
            </div>

            <div className="achievement-card">
              <div className="achievement-content">
                <div className="achievement-title">50 Events Organized</div>
                <div className="achievement-description">Reached the milestone of organizing 50 blood donation events</div>
              </div>
              <div className="achievement-date">Sep 2025</div>
            </div>
          </div>
        </div>

        {/* Event History */}
        <div className="info-card">
          <h2 className="section-title">
            {user.role === 'donor' ? 'Donation History' : 'Event History'}
          </h2>
          
          {/* Event List */}
          <div className="event-list">
            <div className="event-item">
              <div className="event-bar"></div>
              <div className="event-content">
                <div className="event-name">Winter Blood Drive 2025</div>
                <div className="event-details">
                  <FaUsers className="detail-icon" /> 142 attendees
                </div>
              </div>
              <div className="event-date">Oct 15, 2025</div>
            </div>

            <div className="event-item">
              <div className="event-bar"></div>
              <div className="event-content">
                <div className="event-name">Community Blood Drive 2025</div>
                <div className="event-details">
                  <FaUsers className="detail-icon" /> 87 attendees
                </div>
              </div>
              <div className="event-date">Aug 15, 2025</div>
            </div>

            <div className="event-item">
              <div className="event-bar"></div>
              <div className="event-content">
                <div className="event-name">Summer Donation Event</div>
                <div className="event-details">
                  <FaUsers className="detail-icon" /> 124 attendees
                </div>
              </div>
              <div className="event-date">Jun 10, 2025</div>
            </div>

            <div className="event-item">
              <div className="event-bar"></div>
              <div className="event-content">
                <div className="event-name">Spring Health Fair</div>
                <div className="event-details">
                  <FaUsers className="detail-icon" /> 65 attendees
                </div>
              </div>
              <div className="event-date">Apr 20, 2025</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
