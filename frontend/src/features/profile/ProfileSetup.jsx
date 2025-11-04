import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import profileService from '../../shared/services/profileService';
import LocationMap from '../../shared/components/LocationMap';
import './ProfileSetup.css';

function ProfileSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    bloodType: '',
    phone: '',
    address: '',
    position: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Handle location changes from the map component
  const handleLocationChange = useCallback((position, address) => {
    setFormData(prev => ({
      ...prev,
      position,
      address,
    }));
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleBloodTypeSelect = (type) => {
    setFormData({
      ...formData,
      bloodType: type,
    });
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.fullName.trim()) {
        setError('Please enter your full name');
        return;
      }
      if (user.role === 'donor' && !formData.bloodType) {
        setError('Please select your blood type');
        return;
      }
    }
    
    if (currentStep === 2) {
      if (!formData.position) {
        setError('Please select your location on the map');
        return;
      }
    }

    setError('');
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!formData.position) {
      setError('Please select your location');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const profileData = {
        fullName: formData.fullName,
        bloodType: formData.bloodType,
        phone: formData.phone,
        location: {
          address: formData.address,
          coordinates: {
            lat: formData.position.lat,
            lng: formData.position.lng,
          },
        },
      };

      await profileService.completeProfile(profileData, user.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h2>Basic Information</h2>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            {user.role === 'donor' && (
              <>
                <label className="blood-type-label">Blood Type *</label>
                <div className="blood-type-grid">
                  {bloodTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`blood-type-btn ${
                        formData.bloodType === type ? 'selected' : ''
                      }`}
                      onClick={() => handleBloodTypeSelect(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+977 98xxxxxxxx"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <h2>Your Location</h2>
            <p className="step-description">
              Select your location to help others find you when in need
            </p>

            {formData.address && (
              <div className="selected-address">
                <strong>Selected Address:</strong> {formData.address}
              </div>
            )}

            <p className="help-text">
              Search for a location, use "My Location" button, or click on the map
            </p>

            {/* Using the reusable LocationMap component */}
            <LocationMap
              position={formData.position}
              onLocationChange={handleLocationChange}
              center={[27.7172, 85.324]} // Kathmandu default
              zoom={13}
              showSearch={true}
              searchPlaceholder="Search for your location..."
              showCurrentLocation={true}
            />
          </div>
        );

      case 3:
        return (
          <div className="step-content summary">
            <h2>Confirm Your Information</h2>
            <div className="summary-card">
              <div className="summary-item">
                <span className="label">Full Name:</span>
                <span className="value">{formData.fullName}</span>
              </div>
              {user.role === 'donor' && (
                <div className="summary-item">
                  <span className="label">Blood Type:</span>
                  <span className="value blood-badge">{formData.bloodType}</span>
                </div>
              )}
              {formData.phone && (
                <div className="summary-item">
                  <span className="label">Phone:</span>
                  <span className="value">{formData.phone}</span>
                </div>
              )}
              <div className="summary-item">
                <span className="label">Location:</span>
                <span className="value">{formData.address || 'Not set'}</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="profile-setup-container">
      <div className="setup-card">
        <div className="setup-header">
          <h1>Complete Your Profile</h1>
          <div className="step-indicator">
            <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">Basic Info</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Location</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-label">Confirm</span>
            </div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="setup-body">
          {renderStepContent()}
        </div>

        <div className="setup-actions">
          {currentStep > 1 && (
            <button
              type="button"
              className="btn-back"
              onClick={handleBack}
              disabled={loading}
            >
              Back
            </button>
          )}
          {currentStep < 3 ? (
            <button
              type="button"
              className="btn-next"
              onClick={handleNext}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              className="btn-submit"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Complete Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileSetup;
