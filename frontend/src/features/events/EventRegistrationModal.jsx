import React, { useState } from 'react';
import { FaCheckCircle, FaTimes } from 'react-icons/fa';
import './EventRegistrationModal.css';

function EventRegistrationModal({ event, userProfile, onClose, onRegister }) {
  const [acceptedEligibility, setAcceptedEligibility] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!acceptedEligibility) {
      alert('Please confirm that you meet the eligibility criteria');
      return;
    }
    setLoading(true);
    await onRegister();
    setLoading(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never donated';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="registration-modal-overlay" onClick={onClose}>
      <div className="registration-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <FaTimes />
        </button>

        <h2 className="modal-title">Complete Registration</h2>

        <form onSubmit={handleSubmit}>
          {/* User Profile Information */}
          <div className="profile-info-section">
            <h3 className="section-subtitle">From your profile</h3>
            
            <div className="form-group">
              <label>Blood Type</label>
              <input 
                type="text" 
                value={userProfile.bloodType || 'Not specified'} 
                disabled 
                className="form-input-disabled"
              />
            </div>

            <div className="form-group">
              <label>Last Donation Date</label>
              <input 
                type="text" 
                value={formatDate(userProfile.lastDonationDate)} 
                disabled 
                className="form-input-disabled"
              />
            </div>
          </div>

          {/* Eligibility Requirements */}
          <div className="eligibility-section">
            <h3 className="section-subtitle">Eligibility Requirements</h3>
            <ul className="eligibility-list">
              {event.eligibilityRequirements?.map((req, index) => (
                <li key={index} className="eligibility-item">
                  <FaCheckCircle className="check-icon" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>

            <div className="eligibility-confirmation">
              <p className="confirmation-question">Do you meet these eligibility criteria?</p>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={acceptedEligibility}
                  onChange={(e) => setAcceptedEligibility(e.target.checked)}
                  className="confirmation-checkbox"
                />
                <span>Yes, I meet all the eligibility criteria</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="register-submit-btn"
            disabled={!acceptedEligibility || loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EventRegistrationModal;
