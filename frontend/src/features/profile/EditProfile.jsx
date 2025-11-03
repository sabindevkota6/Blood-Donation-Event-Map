import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import { FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../../shared/context/AuthContext';
import profileService from '../../shared/services/profileService';
import Navbar from '../../shared/components/Navbar';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';
import './EditProfile.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Reverse geocoding function
const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
    );
    const data = await response.json();
    return data.display_name || 'Location selected';
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return 'Location selected';
  }
};

// Component to handle map location button
function LocationButton({ onLocationSelect }) {
  const map = useMap();

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const address = await reverseGeocode(latitude, longitude);
          onLocationSelect({ lat: latitude, lng: longitude }, address);
          map.flyTo([latitude, longitude], 15);
        },
        (error) => {
          alert('Unable to get your location. Please select manually on the map.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  return (
    <button
      type="button"
      className="current-location-btn"
      onClick={handleLocationClick}
      title="Go to my location"
    >
      📍 My Location
    </button>
  );
}

function LocationMarker({ position, onLocationSelect }) {
  const map = useMap();

  useMapEvents({
    async click(e) {
      const { lat, lng } = e.latlng;
      const address = await reverseGeocode(lat, lng);
      onLocationSelect({ lat, lng }, address);
    },
  });

  // Update map view when position changes externally
  React.useEffect(() => {
    if (position && map) {
      map.flyTo([position.lat, position.lng], 15);
    }
  }, [position, map]);

  return position === null ? null : <Marker position={[position.lat, position.lng]}></Marker>;
}

function EditProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const providerRef = useRef(new OpenStreetMapProvider());

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

  // Optimized location selection handler
  const handleLocationSelect = useCallback((position, address) => {
    setFormData(prev => ({
      ...prev,
      position,
      address,
    }));
  }, []);

  // Handle search with optimization
  const handleSearch = useCallback(async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length > 2) {
      try {
        const results = await providerRef.current.search({ query });
        setSearchResults(results.slice(0, 5)); // Limit to 5 results
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, []);

  // Handle search result selection
  const handleSelectResult = useCallback((result) => {
    const position = { lat: result.y, lng: result.x };
    handleLocationSelect(position, result.label);
    setSearchQuery('');
    setShowResults(false);
  }, [handleLocationSelect]);

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
      <Navbar />
      <div className="edit-profile-card">
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
            
            {/* Search box */}
            <div className="search-container">
              <input
                type="text"
                placeholder="Search for a location..."
                value={searchQuery}
                onChange={handleSearch}
                className="search-input"
              />
              {showResults && searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      className="search-result-item"
                      onClick={() => handleSelectResult(result)}
                    >
                      📍 {result.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected address display */}
            {formData.address && (
              <div className="selected-address">
                <strong>Selected Address:</strong> {formData.address}
              </div>
            )}

            <p className="help-text">
              Search for a location or click on the map to update your location
            </p>
            
            <div className="map-wrapper">
              <MapContainer
                center={formData.position ? [formData.position.lat, formData.position.lng] : [27.7172, 85.324]}
                zoom={13}
                className="edit-map"
                scrollWheelZoom={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationMarker
                  position={formData.position}
                  onLocationSelect={handleLocationSelect}
                />
                <LocationButton
                  onLocationSelect={handleLocationSelect}
                />
              </MapContainer>
            </div>
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
