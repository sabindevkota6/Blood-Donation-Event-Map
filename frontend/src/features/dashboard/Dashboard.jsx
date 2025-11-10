import React, { useState, useEffect } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ProfileCompleteModal from '../../shared/components/ProfileCompleteModal';
import profileService from '../../shared/services/profileService';
import Navbar from '../../shared/components/Navbar';
import './Dashboard.css';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkProfileCompletion();
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

  const handleContinue = () => {
    setShowModal(false);
    navigate('/profile-setup');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Navbar />
      {showModal && <ProfileCompleteModal onContinue={handleContinue} />}
      
      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome, {user?.fullName}!</h2>
          <p>Role: <strong>{user?.role}</strong></p>
          <p>Email: {user?.email}</p>
          {profileData?.isProfileComplete && (
            <button 
              className="btn-view-profile" 
              onClick={() => navigate(user?.role === 'organizer' ? '/events' : '/profile')}
            >
              {user?.role === 'organizer' ? 'View My Events' : 'View Profile'}
            </button>
          )}
        </div>
        <div className="info-card">
          <p>Your dashboard is ready. More features coming soon!</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
