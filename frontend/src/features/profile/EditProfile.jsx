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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.fullName || !formData.email) {
      setError('Name and email are required');
      return;
    }

    if (user.role === 'donor' && !formData.bloodType) {
      setError('Blood type is required for donors');
      return;
    }

    if (user.role === 'organizer') {
      if (!formData.organization.trim()) {
        setError('Organization name is required for organizers');
        return;
      }
      if (!formData.memberSince) {
        setError('Member since date is required for organizers');
        return;
      }
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
              </div>
              <div className="form-group">
                <label>Email*</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
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
                placeholder="+1 (555) 123-4567"
              />
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
