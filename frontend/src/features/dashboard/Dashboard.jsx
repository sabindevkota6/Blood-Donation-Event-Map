import React, { useState, useEffect } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ProfileCompleteModal from '../../shared/components/ProfileCompleteModal';
import profileService from '../../shared/services/profileService';
import Avatar from '../../shared/components/Avatar';
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
      
      // Only show modal for donors with incomplete profiles
      if (user.role === 'donor' && !data.isProfileComplete) {
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
      {showModal && <ProfileCompleteModal onContinue={handleContinue} />}
      
      <div className="dashboard-header">
        <h1>Blood Donation Map Dashboard</h1>
        <div className="header-right">
          <Avatar 
            src={profileData?.profilePicture?.url} 
            name={profileData?.fullName}
            size="small" 
          />
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>
      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome, {user?.fullName}!</h2>
          <p>Role: <strong>{user?.role}</strong></p>
          <p>Email: {user?.email}</p>
          {profileData?.isProfileComplete ? (
            <button className="btn-view-profile" onClick={() => navigate('/profile')}>
              View Profile
            </button>
          ) : (
            <button className="btn-complete-profile" onClick={handleContinue}>
              Complete Profile
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
