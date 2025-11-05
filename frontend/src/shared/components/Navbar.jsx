import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleHomeClick = () => {
    navigate('/dashboard');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

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
              src={user?.profilePicture?.url} 
              name={user?.fullName || user?.name}
              size="small" 
            />
            <span className="navbar-username">{user?.fullName || user?.name}</span>
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
