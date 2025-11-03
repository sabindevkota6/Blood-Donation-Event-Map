import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaPhone, FaMapMarkerAlt, FaEnvelope, FaTint, FaUser, FaCalendarAlt, FaAward } from 'react-icons/fa';
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
        {/* Back Button and Title */}
        <div className="profile-header">
          <button className="back-link" onClick={() => navigate('/dashboard')}>
            <FaArrowLeft /> Back to Home
          </button>
        </div>

        <div className="profile-title-bar">
          <h1 className="profile-title">My Profile</h1>
          <button className="edit-btn" onClick={() => navigate('/profile/edit')}>
            <FaEdit /> Edit Profile
          </button>
        </div>

        {/* Personal Information Card */}
        <div className="info-card">
          <h2 className="section-title">Personal Information</h2>
          <div className="info-layout">
            {/* Left Column - Avatar and Button */}
            <div className="info-left-column">
              <Avatar 
                src={profileData?.profilePicture?.url} 
                name={profileData?.fullName}
                size="large" 
              />
              <button className="donor-btn">Donor</button>
            </div>

            {/* Right Column - Info Grid */}
            <div className="info-right-column">
              <div className="info-row">
                <div className="info-field">
                  <div className="field-label">
                    <FaUser className="field-icon" /> Name
                  </div>
                  <div className="field-value">{profileData?.fullName || 'Not provided'}</div>
                </div>
                <div className="info-field">
                  <div className="field-label">
                    <FaTint className="field-icon" /> Blood Type
                  </div>
                  <div className="field-value">{profileData?.bloodType || 'Not provided'}</div>
                </div>
              </div>

              <div className="info-row">
                <div className="info-field">
                  <div className="field-label">
                    <FaEnvelope className="field-icon" /> Email
                  </div>
                  <div className="field-value">{profileData?.email || 'Not provided'}</div>
                </div>
                <div className="info-field">
                  <div className="field-label">
                    <FaCalendarAlt className="field-icon" /> Last Donation
                  </div>
                  <div className="field-value">{formatDate(profileData?.lastDonationDate)}</div>
                </div>
              </div>

              <div className="info-row">
                <div className="info-field">
                  <div className="field-label">
                    <FaPhone className="field-icon" /> Phone
                  </div>
                  <div className="field-value">{profileData?.phone || 'Not provided'}</div>
                </div>
                <div className="info-field">
                  <div className="field-label">
                    <FaAward className="field-icon" /> Total Donations
                  </div>
                  <div className="field-value">{profileData?.totalDonations || 0}</div>
                </div>
              </div>

              <div className="info-row">
                <div className="info-field">
                  <div className="field-label">
                    <FaMapMarkerAlt className="field-icon" /> Location
                  </div>
                  <div className="field-value">{profileData?.location?.address || 'Not provided'}</div>
                </div>
                <div className="info-field">
                  <div className="field-label">
                    <FaTint className="field-icon" /> Donor Eligibility
                  </div>
                  <div className="field-value">
                    {profileData?.donorEligibility === 'eligible' ? 'Eligible to Donate' : 
                     profileData?.donorEligibility === 'not-eligible' ? 'Not Eligible' : 
                     'Not Recorded'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Donation History & Achievements */}
        <div className="info-card">
          <h2 className="section-title">Donation History & Achievements</h2>
          
          {/* Achievements */}
          <div className="subsection">
            <h3 className="subsection-title">Achievements</h3>
            {/* TODO: Replace with dynamic achievement data when backend is ready */}
            {/* Example structure for future implementation:
            <div className="achievements-grid">
              <div className="achievement-card">
                <div className="achievement-header">
                  <div className="achievement-title">First Donation</div>
                  <div className="achievement-date">Jan 2023</div>
                </div>
                <div className="achievement-desc">Completed first blood donation</div>
              </div>
            </div>
            */}
            <div className="empty-state-card">
              <p>No achievements as of now</p>
            </div>
          </div>

          {/* Recent Donations */}
          <div className="subsection">
            <h3 className="subsection-title">Recent Donations</h3>
            {/* TODO: Replace with dynamic donation history data when backend is ready */}
            {/* Example structure for future implementation:
            <div className="donations-list">
              <div className="donation-item">
                <div className="donation-bar"></div>
                <div className="donation-details">
                  <div className="donation-place">Red Cross Center</div>
                  <div className="donation-info">
                    <span>Blood Type: O+</span>
                    <span>Amount: 450ml</span>
                  </div>
                </div>
                <div className="donation-date">Sep 15, 2025</div>
              </div>
            </div>
            */}
            <div className="empty-state-card">
              <p>No donation history</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
