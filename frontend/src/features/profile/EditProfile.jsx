/*
 * EditProfile component
 * Provides a form to edit user profile information and manage profile picture.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../../shared/context/AuthContext';
import profileService from '../../shared/services/profileService';
import Navbar from '../../shared/components/Navbar';
import LocationMap from '../../shared/components/LocationMap';
import Avatar from '../../shared/components/Avatar';
import useFeedbackMessage from '../../shared/hooks/useFeedbackMessage';
import './EditProfile.css';

function EditProfile() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const {
    error,
    success,
    showError: showErrorMessage,
    showSuccess: showSuccessMessage,
    clearMessages,
  } = useFeedbackMessage();
  const [validationErrors, setValidationErrors] = useState({});
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    bloodType: '',
    phone: '',
    address: '',
    position: null,
    // Organizer-specific fields
    organization: '',
    memberSince: '',
  });
  const [profilePicture, setProfilePicture] = useState(null);
  const [pictureUploading, setPictureUploading] = useState(false);
  const fileInputRef = useRef(null);

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  // Load profile data and initialize form values
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await profileService.getProfile(user.token);
      setFormData({
        fullName: data.fullName || '',
        email: data.email || '',
        bloodType: data.bloodType || '',
        phone: data.phone || '',
        address: data.location?.address || '',
        position: data.location?.coordinates?.lat ? {
          lat: data.location.coordinates.lat,
          lng: data.location.coordinates.lng,
        } : null,
        organization: data.organization || '',
        memberSince: data.memberSince ? data.memberSince.slice(0, 7) : '',
      });
      setProfilePicture(data.profilePicture || null);
    } catch (err) {
      showErrorMessage('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.token, showErrorMessage]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Image file validation for profile pictures
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

  // Upload a new profile picture and refresh local profile
  const handleProfilePictureChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationMessage = validateImageFile(file);
    if (validationMessage) {
      showErrorMessage(validationMessage);
      event.target.value = '';
      return;
    }

    const payload = new FormData();
    payload.append('profilePicture', file);

    try {
      setPictureUploading(true);
      const response = await profileService.uploadProfilePicture(
        payload,
        user.token
      );
      setProfilePicture(response.profilePicture);
      await refreshProfile();
      showSuccessMessage('Profile picture updated successfully');
    } catch (uploadError) {
      showErrorMessage(
        uploadError.response?.data?.message ||
        'Failed to upload profile picture'
      );
    } finally {
      setPictureUploading(false);
      event.target.value = '';
    }
  };

  // Remove user's profile picture via API and refresh profile
  const handleDeleteProfilePicture = async () => {
    if (!profilePicture) return;
    try {
      setPictureUploading(true);
      await profileService.deleteProfilePicture(user.token);
      setProfilePicture(null);
      await refreshProfile();
      showSuccessMessage('Profile picture removed successfully');
    } catch (deleteError) {
      showErrorMessage(
        deleteError.response?.data?.message ||
        'Failed to delete profile picture'
      );
    } finally {
      setPictureUploading(false);
    }
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  // Handle location changes from the map component
  // Map component callback to update user's geographic position and address
  const handleLocationChange = useCallback((position, address) => {
    setFormData(prev => ({
      ...prev,
      position,
      address,
    }));
  }, []);

  // Field validation helpers for the form
  const validatePhone = (phone) => {
    if (!phone || !phone.trim()) {
      return '';
    }

    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      return 'Phone number must be exactly 10 digits';
    }

    return '';
  };

  const validateName = (name) => {
    if (!name || name.trim().length === 0) {
      return 'Name is required';
    }
    if (name.trim().length > 50) {
      return 'Name must not exceed 50 characters';
    }
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return 'Name can only contain letters and spaces';
    }
    const words = name.trim().split(/\s+/);
    if (words.length < 2) {
      return 'Please enter at least two words (first and last name)';
    }
    return '';
  };

  const validateOrganization = (org) => {
    if (!org || org.trim().length === 0) {
      return 'Organization name is required';
    }
    if (org.trim().length > 100) {
      return 'Organization name must not exceed 100 characters';
    }
    const words = org.trim().split(/\s+/);
    if (words.length < 2) {
      return 'Please enter at least two words for organization name';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Validate on change
    let error = '';
    if (name === 'phone') {
      error = validatePhone(value);
    } else if (name === 'fullName') {
      error = validateName(value);
    } else if (name === 'organization') {
      error = validateOrganization(value);
    }

    setValidationErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleBloodTypeSelect = (type) => {
    setFormData({
      ...formData,
      bloodType: type,
    });
  };

  // Submit updated profile data to the API
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    if (pictureUploading) {
      showErrorMessage('Please wait for your profile picture upload to finish');
      return;
    }

    // Validate all fields
    const errors = {};

    const nameError = validateName(formData.fullName);
    if (nameError) errors.fullName = nameError;

    const phoneError = validatePhone(formData.phone);
    if (phoneError) errors.phone = phoneError;

    if (user.role === 'organizer') {
      const orgError = validateOrganization(formData.organization);
      if (orgError) errors.organization = orgError;

      if (!formData.memberSince) {
        errors.memberSince = 'Member since date is required for organizers';
      }
    }

    if (user.role === 'donor' && !formData.bloodType) {
      errors.bloodType = 'Blood type is required for donors';
    }

    // If there are validation errors, set them and return
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showErrorMessage('Please fix the validation errors');
      return;
    }

    try {
      setSaving(true);

      const profileData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        location: formData.position ? {
          address: formData.address,
          coordinates: {
            lat: formData.position.lat,
            lng: formData.position.lng,
          },
        } : undefined,
      };

      // Add role-specific fields
      if (user.role === 'donor') {
        profileData.bloodType = formData.bloodType;
      } else if (user.role === 'organizer') {
        profileData.organization = formData.organization;
        profileData.memberSince = formData.memberSince;
      }

      await profileService.updateProfile(profileData, user.token);
      showSuccessMessage('Profile updated successfully!');
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err) {
      showErrorMessage(
        err.response?.data?.message || 'Failed to update profile'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-profile-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="edit-profile-container">
      <Navbar />
      <div className="edit-profile-card">
        <div className="edit-header-top">
          <button
            type="button"
            className="edit-back-link"
            onClick={() => navigate('/profile')}
          >
            <FaArrowLeft /> Back to Profile
          </button>
        </div>
        <div className="edit-header">
          <h1>Edit Profile</h1>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Basic Information</h3>
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
                    name={formData.fullName || user?.fullName}
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
              <p className="help-text" style={{ textAlign: 'center' }}>
                Recommended: clear headshot, JPEG or PNG up to 5MB.
              </p>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name*</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
                {validationErrors.fullName && (
                  <span className="error-text">{validationErrors.fullName}</span>
                )}
              </div>
              <div className="form-group">
                <label>Email*</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled
                  className="disabled-input"
                  required
                />
                <small className="help-text" style={{ color: '#999', marginTop: '4px', display: 'block' }}>
                  Email cannot be changed
                </small>
              </div>
            </div>
          </div>

          {user.role === 'donor' && (
            <div className="form-section">
              <h3>Blood Type*</h3>
              <div className="blood-type-selector">
                {bloodTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`blood-type-btn ${formData.bloodType === type ? 'selected' : ''
                      }`}
                    onClick={() => handleBloodTypeSelect(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
              {validationErrors.bloodType && (
                <span className="error-text">{validationErrors.bloodType}</span>
              )}
            </div>
          )}

          {user.role === 'organizer' && (
            <div className="form-section">
              <h3>Organization Details*</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Organization Name*</label>
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    placeholder="Enter organization name"
                    required
                  />
                  {validationErrors.organization && (
                    <span className="error-text">{validationErrors.organization}</span>
                  )}
                </div>
                <div className="form-group">
                  <label>Member Since*</label>
                  <input
                    type="month"
                    name="memberSince"
                    value={formData.memberSince}
                    onChange={handleChange}
                    max={new Date().toISOString().slice(0, 7)}
                    required
                  />
                  {validationErrors.memberSince && (
                    <span className="error-text">{validationErrors.memberSince}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="form-section">
            <h3>Contact Information</h3>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your 10 digit phone number"
              />
              {validationErrors.phone && (
                <span className="error-text">{validationErrors.phone}</span>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3>Location</h3>

            {/* Selected address display */}
            {formData.address && (
              <div className="selected-address">
                <strong>Selected Address:</strong> {formData.address}
              </div>
            )}

            <p className="help-text">
              Search for a location or click on the map to update your location
            </p>

            {/* Using the reusable LocationMap component */}
            <LocationMap
              position={formData.position}
              onLocationChange={handleLocationChange}
              center={[27.7172, 85.324]} // Kathmandu default
              zoom={13}
              showSearch={true}
              searchPlaceholder="Search for a location..."
              showCurrentLocation={true}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate('/profile')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-save"
              disabled={saving || pictureUploading}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;
