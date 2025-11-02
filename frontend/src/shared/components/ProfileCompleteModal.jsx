import React from 'react';
import './ProfileCompleteModal.css';

function ProfileCompleteModal({ onContinue }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-icon">
          <span>👤</span>
        </div>
        <h2>Complete Your Profile</h2>
        <p>
          To get the most out of Blood Donation Map, please complete your
          profile with additional information.
        </p>
        <button className="btn-continue" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}

export default ProfileCompleteModal;
