import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useAuth } from '../../shared/context/AuthContext';
import profileService from '../../shared/services/profileService';
import 'leaflet/dist/leaflet.css';
import './ProfileSetup.css';
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

function ProfileSetup() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    bloodType: '',
    phone: '',
    address: '',
    position: null,
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }
      setProfilePicture(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const nextStep = () => {
    setError('');
    
    if (step === 1 && !formData.bloodType) {
      setError('Please select your blood type');
      return;
    }
    
    if (step === 2 && !formData.phone) {
      setError('Please enter your phone number');
      return;
    }
    
    if (step === 3 && (!formData.address || !formData.position)) {
      setError('Please select your location on the map');
      return;
    }

    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
    setError('');
  };

  const skipProfilePicture = async () => {
    await handleSubmit(true);
  };

  const handleSubmit = async (skipPicture = false) => {
    try {
      setLoading(true);
      setError('');

      // Update profile
      const profileData = {
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

      await profileService.updateProfile(profileData, user.token);

      // Upload profile picture if provided
      if (!skipPicture && profilePicture) {
        const formDataPic = new FormData();
        formDataPic.append('profilePicture', profilePicture);
        await profileService.uploadProfilePicture(formDataPic, user.token);
      }

      // Navigate to profile or dashboard
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-setup-container">
      <div className="profile-setup-card">
        <div className="setup-header">
          <h1>Complete Your Profile</h1>
          <div className="step-indicator">
            <span className={step >= 1 ? 'active' : ''}>1</span>
            <div className={`line ${step >= 2 ? 'active' : ''}`}></div>
            <span className={step >= 2 ? 'active' : ''}>2</span>
            <div className={`line ${step >= 3 ? 'active' : ''}`}></div>
            <span className={step >= 3 ? 'active' : ''}>3</span>
            <div className={`line ${step >= 4 ? 'active' : ''}`}></div>
            <span className={step >= 4 ? 'active' : ''}>4</span>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {step === 1 && (
          <div className="setup-step">
            <h2>Select Your Blood Type</h2>
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
            <button className="btn-next" onClick={nextStep}>
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="setup-step">
            <h2>Enter Your Phone Number</h2>
            <input
              type="tel"
              name="phone"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={handleChange}
              className="input-field"
            />
            <div className="button-group">
              <button className="btn-back" onClick={prevStep}>
                Back
              </button>
              <button className="btn-next" onClick={nextStep}>
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="setup-step">
            <h2>Select Your Location</h2>
            <input
              type="text"
              name="address"
              placeholder="Enter your address"
              value={formData.address}
              onChange={handleChange}
              className="input-field"
            />
            <p className="help-text">Click on the map to set your location</p>
            <div className="map-container-wrapper">
              <MapContainer
                center={[27.7172, 85.324]} // Default to Kathmandu, Nepal
                zoom={13}
                className="map-container"
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
              <p className="location-info">
                Selected: {formData.position.lat.toFixed(4)},{' '}
                {formData.position.lng.toFixed(4)}
              </p>
            )}
            <div className="button-group">
              <button className="btn-back" onClick={prevStep}>
                Back
              </button>
              <button className="btn-next" onClick={nextStep}>
                Next
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="setup-step">
            <h2>Upload Profile Picture (Optional)</h2>
            <div className="upload-section">
              {previewUrl ? (
                <div className="preview-container">
                  <img src={previewUrl} alt="Preview" className="preview-image" />
                  <button
                    className="btn-remove"
                    onClick={() => {
                      setProfilePicture(null);
                      setPreviewUrl('');
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="upload-box">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <div className="upload-icon">📷</div>
                  <p>Click to upload</p>
                  <span className="upload-hint">Max size: 5MB</span>
                </label>
              )}
            </div>
            <div className="button-group">
              <button className="btn-back" onClick={prevStep}>
                Back
              </button>
              <button
                className="btn-skip"
                onClick={skipProfilePicture}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Skip'}
              </button>
              <button
                className="btn-submit"
                onClick={() => handleSubmit(false)}
                disabled={loading || !profilePicture}
              >
                {loading ? 'Saving...' : 'Complete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileSetup;
