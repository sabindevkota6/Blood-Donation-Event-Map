/*
 * Navbar component - top-level navigation bar with user info and logout
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import './Navbar.css';

function Navbar() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const displayName = profile?.fullName || user?.fullName || user?.name;
  const avatarSrc = profile?.profilePicture?.url;

  // Navigate user to dashboard
  const handleHomeClick = () => {
    navigate('/dashboard');
  };

  // Open profile page
  const handleProfileClick = () => {
    navigate('/profile');
  };

  // Perform logout and navigate to login screen
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand" onClick={handleHomeClick}>Blood Donation Map</div>
        <div className="navbar-user">
          <div className="navbar-profile" onClick={handleProfileClick}>
            <Avatar 
              src={avatarSrc} 
              name={displayName}
              size="small" 
            />
            <span className="navbar-username">{displayName}</span>
          </div>
          <button className="navbar-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
