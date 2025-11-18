import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import profileService from '../../shared/services/profileService';
import LocationMap from '../../shared/components/LocationMap';
import Avatar from '../../shared/components/Avatar';
import './ProfileSetup.css';

function ProfileSetup() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    bloodType: '',
    phone: '',
    address: '',
    position: null,
    // Organizer-specific fields
    organization: '',
    memberSince: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [profilePicture, setProfilePicture] = useState(null);
  const [pictureUploading, setPictureUploading] = useState(false);
  const fileInputRef = useRef(null);

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    let ignore = false;
    const loadProfile = async () => {
      try {
        const data = await profileService.getProfile(user.token);
        if (!ignore && data?.profilePicture) {
          setProfilePicture(data.profilePicture);
        }
      } catch (err) {
        console.error('Failed to load profile info', err);
      }
    };
    loadProfile();
    return () => {
      ignore = true;
    };
  }, [user.token]);

  useEffect(() => {
    if (error || successMessage) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error, successMessage]);

  const showErrorMessage = (message) => {
    setError(message);
    setSuccessMessage('');
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setError('');
  };

  // Validation functions
  const validatePhone = (phone) => {
    if (!phone) return null;
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone.replace(/[\s()-]/g, ''))) {
      return 'Phone number must be 10 digits';
    }
    return null;
  };

  const validateName = (name) => {
    if (!name || !name.trim()) {
      return 'This field is required';
    }
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return 'Can only contain letters and spaces';
    }
    const words = name.trim().split(/\s+/);
    if (words.length < 2) {
      return 'Please enter at least two words (first and last name)';
    }
    return null;
  };

  // Handle location changes from the map component
  const handleLocationChange = useCallback((position, address) => {
    setFormData(prev => ({
      ...prev,
      position,
      address,
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: null,
      });
    }
    
    // Validate on change
    if (name === 'phone') {
      const phoneError = validatePhone(value);
      if (phoneError) {
        setValidationErrors({
          ...validationErrors,
          phone: phoneError,
        });
      }
    } else if (name === 'organization') {
      const orgError = validateName(value);
      if (orgError) {
        setValidationErrors({
          ...validationErrors,
          organization: orgError,
        });
      }
    }
  };

  const handleBloodTypeSelect = (type) => {
    setFormData({
      ...formData,
      bloodType: type,
    });
  };

  const handleNext = async () => {
    setError('');
    if (pictureUploading) {
      showErrorMessage('Please wait for your profile picture upload to finish');
      return;
    }
    
    if (currentStep === 1) {
      // Validate organization name for organizers
      if (user.role === 'organizer') {
        const orgError = validateName(formData.organization);
        if (orgError) {
          setValidationErrors({ ...validationErrors, organization: orgError });
          showErrorMessage('Please fix the validation errors');
          return;
        }
        if (!formData.memberSince) {
          showErrorMessage('Please select when you joined the organization');
          return;
        }
      }
      
      // Validate blood type for donors
      if (user.role === 'donor' && !formData.bloodType) {
        showErrorMessage('Please select your blood type');
        return;
      }
      
      // Validate phone number if provided
      if (formData.phone && formData.phone.trim()) {
        const phoneError = validatePhone(formData.phone);
        if (phoneError) {
          setValidationErrors({ ...validationErrors, phone: phoneError });
          showErrorMessage('Please fix the validation errors');
          return;
        }
        
        try {
          setLoading(true);
          // Try to update with just the phone to check if it's available
          await profileService.updateProfile({ phone: formData.phone }, user.token);
          setLoading(false);
        } catch (err) {
          setLoading(false);
          showErrorMessage(
            err.response?.data?.message || 'Phone number validation failed'
          );
          return;
        }
      }
    }
    
    if (currentStep === 2) {
      if (!formData.position) {
        showErrorMessage('Please select your location on the map');
        return;
      }
    }

    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (pictureUploading) {
      showErrorMessage('Please wait for your profile picture upload to finish');
      return;
    }
    if (!formData.position) {
      showErrorMessage('Please select your location');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const profileData = {
        phone: formData.phone,
        location: {
          address: formData.address,
          coordinates: {
            lat: formData.position.lat,
            lng: formData.position.lng,
          },
        },
      };

      // Add role-specific fields
      if (user.role === 'donor') {
        profileData.bloodType = formData.bloodType;
      } else if (user.role === 'organizer') {
        profileData.organization = formData.organization;
        profileData.memberSince = formData.memberSince;
      }

      // Use completeProfile which won't re-check phone since it was already validated
      await profileService.completeProfile(profileData, user.token);
      navigate('/dashboard');
    } catch (err) {
      // If there's an error here, it's likely not about phone validation
      const errorMessage = err.response?.data?.message || 'Failed to complete profile. Please try again.';
      showErrorMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validateImageFile = (file) => {
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file';
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'Image size must be 5MB or less';
    }
    return null;
  };

  const handleProfilePictureChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationMessage = validateImageFile(file);
    if (validationMessage) {
      showErrorMessage(validationMessage);
      event.target.value = '';
      return;
    }

    const formPayload = new FormData();
    formPayload.append('profilePicture', file);

    try {
      setPictureUploading(true);
      const response = await profileService.uploadProfilePicture(
        formPayload,
        user.token
      );
      setProfilePicture(response.profilePicture);
      await refreshProfile();
      showSuccessMessage('Profile picture updated successfully');
    } catch (err) {
      showErrorMessage(
        err.response?.data?.message || 'Failed to upload profile picture'
      );
    } finally {
      setPictureUploading(false);
      event.target.value = '';
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!profilePicture) return;
    try {
      setPictureUploading(true);
      await profileService.deleteProfilePicture(user.token);
      setProfilePicture(null);
      await refreshProfile();
      showSuccessMessage('Profile picture removed successfully');
    } catch (err) {
      showErrorMessage(
        err.response?.data?.message || 'Failed to delete profile picture'
      );
    } finally {
      setPictureUploading(false);
    }
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h2>Basic Information</h2>
            <div className="profile-picture-upload">
              <div className="profile-picture-preview">
                {profilePicture?.url ? (
                  <img
                    src={profilePicture.url}
                    alt="Profile"
                    className="avatar-image"
                  />
                ) : (
                  <Avatar
                    src={null}
                    name={user?.fullName}
                    size="150px"
                  />
                )}
                {pictureUploading && (
                  <div className="upload-overlay">
                    <div className="spinner"></div>
                  </div>
                )}
              </div>
              <div className="profile-picture-actions">
                <button
                  type="button"
                  className="btn-upload-image"
                  onClick={triggerFilePicker}
                  disabled={pictureUploading}
                >
                  {profilePicture ? 'Change Photo' : 'Upload Photo'}
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleProfilePictureChange}
                />
                {profilePicture && (
                  <button
                    type="button"
                    className="btn-delete-image"
                    onClick={handleDeleteProfilePicture}
                    disabled={pictureUploading}
                  >
                    Remove Photo
                  </button>
                )}
              </div>
              <p className="step-subtitle">
                Add a profile picture so organizers and donors can recognize you
                easily. JPEG or PNG up to 5MB.
              </p>
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

            {user.role === 'organizer' && (
              <>
                <div className="form-group">
                  <label>Organization Name *</label>
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    placeholder="Enter your organization name"
                    required
                  />
                  {validationErrors.organization && (
                    <span className="error-text">{validationErrors.organization}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Member Since *</label>
                  <input
                    type="month"
                    name="memberSince"
                    value={formData.memberSince}
                    onChange={handleChange}
                    max={new Date().toISOString().slice(0, 7)}
                    required
                  />
                  <small className="field-hint">Select the date when you became a member of the organization</small>
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
                placeholder="Enter 10-digit phone number"
              />
              {validationErrors.phone && (
                <span className="error-text">{validationErrors.phone}</span>
              )}
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
              {user.role === 'donor' && (
                <div className="summary-item">
                  <span className="label">Blood Type:</span>
                  <span className="value blood-badge">{formData.bloodType}</span>
                </div>
              )}
              {user.role === 'organizer' && (
                <>
                  <div className="summary-item">
                    <span className="label">Organization:</span>
                    <span className="value">{formData.organization}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Member Since:</span>
                    <span className="value">
                      {new Date(formData.memberSince + '-01').toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </span>
                  </div>
                </>
              )}
              {formData.phone && (
                <div className="summary-item">
                  <span className="label">Phone:</span>
                  <span className="value">{formData.phone}</span>
                </div>
              )}
              <div className="summary-item">
                <span className="label">Profile Picture:</span>
                <span className="value">
                  {profilePicture ? 'Uploaded' : 'Not added'}
                </span>
              </div>
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
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

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
              disabled={pictureUploading}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              className="btn-submit"
              onClick={handleSubmit}
              disabled={loading || pictureUploading}
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
