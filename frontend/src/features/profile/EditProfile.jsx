import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../../shared/context/AuthContext';
import profileService from '../../shared/services/profileService';
import Navbar from '../../shared/components/Navbar';
import LocationMap from '../../shared/components/LocationMap';
import './EditProfile.css';

function EditProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (error) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error]);

  const fetchProfile = async () => {
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
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle location changes from the map component
  const handleLocationChange = useCallback((position, address) => {
    setFormData(prev => ({
      ...prev,
      position,
      address,
    }));
  }, []);

  // Validation functions
  const validatePhone = (phone) => {
    if (!phone) return 'Phone number is required';
    if (!/^[0-9]{10}$/.test(phone)) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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
      setError('Please fix the validation errors');
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
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
                    className={`blood-type-btn ${
                      formData.bloodType === type ? 'selected' : ''
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
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;
