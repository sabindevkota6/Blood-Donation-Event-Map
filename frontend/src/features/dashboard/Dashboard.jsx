import React from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Blood Donation Map Dashboard</h1>
        <button onClick={handleLogout} className="btn-logout">
          Logout
        </button>
      </div>
      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome, {user?.fullName}!</h2>
          <p>Role: <strong>{user?.role}</strong></p>
          <p>Email: {user?.email}</p>
        </div>
        <div className="info-card">
          <p>Your dashboard is ready. More features coming soon!</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
