import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../../shared/context/AuthContext';
import profileService from '../../shared/services/profileService';
import 'leaflet/dist/leaflet.css';
import './EditProfile.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : <Marker position={position}></Marker>;
}

function EditProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    bloodType: '',
    phone: '',
    address: '',
    position: null,
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
      });
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

    try {
      setSaving(true);

      const profileData = {
        fullName: formData.fullName,
        email: formData.email,
        bloodType: formData.bloodType,
        phone: formData.phone,
        location: formData.position ? {
          address: formData.address,
          coordinates: {
            lat: formData.position.lat,
            lng: formData.position.lng,
          },
        } : undefined,
      };

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
      <div className="edit-profile-card">
        <div className="edit-header">
          <button className="back-btn" onClick={() => navigate('/profile')}>
            <FaArrowLeft /> Back to Profile
          </button>
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
            <div className="form-group">
              <label>Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter your address"
              />
            </div>
            <p className="help-text">Click on the map to update your location</p>
            <div className="map-wrapper">
              <MapContainer
                center={formData.position || [27.7172, 85.324]}
                zoom={13}
                className="edit-map"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationMarker
                  position={formData.position}
                  setPosition={(pos) =>
                    setFormData({ ...formData, position: pos })
                  }
                />
              </MapContainer>
            </div>
            {formData.position && (
              <p className="location-coords">
                Selected: {formData.position.lat.toFixed(4)},{' '}
                {formData.position.lng.toFixed(4)}
              </p>
            )}
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
