import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaPhone, FaMapMarkerAlt, FaEnvelope, FaTint } from 'react-icons/fa';
import { useAuth } from '../../shared/context/AuthContext';
import profileService from '../../shared/services/profileService';
import Avatar from '../../shared/components/Avatar';
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
      {/* Header */}
      <div className="profile-header">
        <div className="header-content">
          <div className="header-left">
            <button className="back-btn" onClick={() => navigate('/dashboard')}>
              <FaArrowLeft /> Back to Home
            </button>
            <h1>Blood Donation Map</h1>
          </div>
          <div className="header-right">
            <Avatar 
              src={profileData?.profilePicture?.url} 
              name={profileData?.fullName}
              size="small" 
            />
            <span className="header-name">{profileData?.fullName}</span>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="profile-content">
        {/* Profile Title */}
        <div className="profile-title-section">
          <h2>My Profile</h2>
          <button className="edit-profile-btn" onClick={() => navigate('/profile/edit')}>
            <FaEdit /> Edit Profile
          </button>
        </div>

        {/* Personal Information Card */}
        <div className="profile-card">
          <h3 className="card-title">Personal Information</h3>
          <div className="personal-info-grid">
            <div className="info-left">
              <Avatar 
                src={profileData?.profilePicture?.url} 
                name={profileData?.fullName}
                size="large" 
              />
              <div className="role-badge">{profileData?.role}</div>
            </div>
            <div className="info-right">
              <div className="info-grid">
                <div className="info-item">
                  <label><FaEnvelope className="info-icon" /> Name</label>
                  <p>{profileData?.fullName || 'Not provided'}</p>
                </div>
                <div className="info-item">
                  <label><FaTint className="info-icon" /> Blood Type</label>
                  <p className="blood-type-badge">{profileData?.bloodType || 'Not provided'}</p>
                </div>
                <div className="info-item">
                  <label><FaEnvelope className="info-icon" /> Email</label>
                  <p>{profileData?.email || 'Not provided'}</p>
                </div>
                <div className="info-item">
                  <label><FaTint className="info-icon" /> Last Donation</label>
                  <p>{formatDate(profileData?.lastDonationDate)}</p>
                </div>
                <div className="info-item">
                  <label><FaPhone className="info-icon" /> Phone</label>
                  <p>{profileData?.phone || 'Not provided'}</p>
                </div>
                <div className="info-item">
                  <label><FaTint className="info-icon" /> Total Donations</label>
                  <p>{profileData?.totalDonations || 0}</p>
                </div>
                <div className="info-item">
                  <label><FaMapMarkerAlt className="info-icon" /> Location</label>
                  <p>{profileData?.location?.address || 'Not provided'}</p>
                </div>
                <div className="info-item">
                  <label><FaTint className="info-icon" /> Donor Eligibility</label>
                  <p className={`eligibility-badge ${profileData?.donorEligibility}`}>
                    {profileData?.donorEligibility === 'eligible' ? 'Eligible to Donate' : 
                     profileData?.donorEligibility === 'not-eligible' ? 'Not Eligible' : 
                     'Not Recorded'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Donation History & Achievements */}
        <div className="profile-card">
          <h3 className="card-title">Donation History & Achievements</h3>
          
          {/* Achievements */}
          <div className="achievements-section">
            <h4>Achievements</h4>
            <div className="achievements-empty">
              <p>No achievements yet. Start donating to earn achievements!</p>
            </div>
          </div>

          {/* Recent Donations */}
          <div className="donations-section">
            <h4>Recent Donations</h4>
            <div className="donations-empty">
              <p>No donation history yet. Your donations will appear here.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
