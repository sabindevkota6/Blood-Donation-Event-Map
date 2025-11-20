/*
 * CreateEvent component: Organizer form for creating a new event
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { FaArrowLeft, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../shared/context/AuthContext';
import eventService from '../../shared/services/eventService';
import profileService from '../../shared/services/profileService';
import LocationMap from '../../shared/components/LocationMap';
import Navbar from '../../shared/components/Navbar';
import './CreateEvent.css';

const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

function CreateEvent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileData, setProfileData] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [eligibilityRequirements, setEligibilityRequirements] = useState([
    'Be at least 17 years old',
    'Weigh at least 110 pounds',
    'Be in good general health'
  ]);
  const pageTopRef = useRef(null);

  const { register, handleSubmit, control, setValue, getValues, formState: { errors } } = useForm({
    mode: 'onChange', // Validate on every change
    reValidateMode: 'onChange', // Re-validate on every change
    criteriaMode: 'firstError', // Show first error only
    defaultValues: {
      eventTitle: '',
      organizationName: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      location: '',
      expectedCapacity: '',
      bloodTypesNeeded: [],
      eventDescription: '',
      contactEmail: '',
      contactPhone: ''
    }
  });

  // Load organizer profile to auto-fill contact and organization fields
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setProfileLoading(true);
        const data = await profileService.getProfile(user.token);
        setProfileData(data);

        // Pre-fill form with profile data (excluding location)
        if (data.organization) {
          setValue('organizationName', data.organization);
        }
        if (data.email) {
          setValue('contactEmail', data.email);
        }
        if (data.phone) {
          setValue('contactPhone', data.phone);
        }
        // Don't auto-fill location - let user select manually
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('Failed to load profile data');
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfileData();
  }, [user.token, setValue]);

  // Scroll the page to the top when an error shows so the user sees it
  useEffect(() => {
    if (!error) {
      return;
    }

    if (pageTopRef.current) {
      pageTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error]);

  // Map selection handler: update selected location and set the form location value
  const handleLocationSelect = (position, address) => {
    setSelectedLocation({
      coordinates: position,
      address: address
    });
    setValue('location', address, { shouldValidate: true });
  };

  const handleBloodTypeToggle = (bloodType, currentValue) => {
    if (currentValue.includes(bloodType)) {
      return currentValue.filter(type => type !== bloodType);
    } else {
      return [...currentValue, bloodType];
    }
  };

  const handleRequirementChange = (index, value) => {
    const updatedRequirements = [...eligibilityRequirements];
    updatedRequirements[index] = value;
    setEligibilityRequirements(updatedRequirements);
  };

  const handleAddRequirement = () => {
    setEligibilityRequirements([...eligibilityRequirements, '']);
  };

  const handleRemoveRequirement = (index) => {
    if (eligibilityRequirements.length > 1) {
      setEligibilityRequirements(eligibilityRequirements.filter((_, i) => i !== index));
    }
  };

  const onSubmit = async (data) => {
    setError('');
    setSuccess('');

    // Validate blood types
    if (!data.bloodTypesNeeded || data.bloodTypesNeeded.length === 0) {
      setError('Please select at least one blood type');
      return;
    }

    // Validate location is selected from map
    if (!selectedLocation || !selectedLocation.coordinates) {
      setError('Please select a location from the map');
      return;
    }

    // Validate organization name matches profile
    if (profileData && profileData.organization &&
      data.organizationName.trim() !== profileData.organization.trim()) {
      setError('Organization name must match your profile organization');
      return;
    }

    // Validate contact email matches profile
    if (profileData && profileData.email &&
      data.contactEmail.trim().toLowerCase() !== profileData.email.trim().toLowerCase()) {
      setError('Contact email must match your profile email');
      return;
    }

    // Validate contact phone matches profile
    if (profileData && profileData.phone &&
      data.contactPhone.trim() !== profileData.phone.trim()) {
      setError('Contact phone must match your profile phone number');
      return;
    }

    try {
      setLoading(true);

      // Convert 24-hour time format to 12-hour AM/PM format
      const formatTime = (time) => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
      };

      const eventTime = `${formatTime(data.startTime)} - ${formatTime(data.endTime)}`;

      const { startDate, endDate, startTime, endTime, ...rest } = data;

      const effectiveStartDate = startDate;
      const effectiveEndDate = endDate || startDate;

      const formData = {
        ...rest,
        startDate: effectiveStartDate,
        endDate: effectiveEndDate,
        eventTime,
        location: selectedLocation.address,
        locationCoordinates: selectedLocation.coordinates,
        eligibilityRequirements: eligibilityRequirements.filter((req) => req.trim() !== ''),
      };

      await eventService.createEvent(formData, user.token);

      setSuccess('Event created successfully!');
      // Navigate immediately instead of waiting
      navigate('/events');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/events');
  };

  if (profileLoading) {
    return (
      <div className="create-event-page">
        <Navbar />
        <div className="create-event-container">
          <div className="loading">Loading profile information...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-event-page">
      <Navbar />

      <div ref={pageTopRef} className="create-event-container">
        {/* Header */}
        <div className="create-event-header">
          <button className="back-link" onClick={() => navigate('/events')}>
            <FaArrowLeft /> Back to Events
          </button>
        </div>

        {/* Title */}
        <div className="page-title-section">
          <h1 className="page-title">Create New Event</h1>
          <p className="page-subtitle">Fill in the details to create a new blood donation event</p>
        </div>

        {/* Messages */}
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="create-event-form">
          {/* Basic Information */}
          <div className="form-card">
            <h2 className="section-title">Basic Information</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="eventTitle">
                  Event Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="eventTitle"
                  placeholder="e.g., Community Blood Drive 2025"
                  {...register('eventTitle', {
                    required: 'Event title is required',
                    minLength: {
                      value: 3,
                      message: 'Title must be at least 3 characters'
                    }
                  })}
                />
                {errors.eventTitle && <span className="error-text">{errors.eventTitle.message}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="organizationName">
                  Organization Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="organizationName"
                  placeholder="e.g., Red Cross Center"
                  readOnly
                  {...register('organizationName', {
                    required: 'Organization name is required',
                    validate: (value) => {
                      if (!profileData?.organization) return true;
                      return value.trim() === profileData.organization.trim() ||
                        'Organization name must match your profile';
                    }
                  })}
                />
                {errors.organizationName && <span className="error-text">{errors.organizationName.message}</span>}
                <span className="field-hint">From your profile</span>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDate">
                  Start Date <span className="required">*</span>
                </label>
                <input
                  type="date"
                  id="startDate"
                  {...register('startDate', {
                    required: 'Start date is required',
                    validate: (value) => {
                      const selectedDate = new Date(value);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return selectedDate >= today || 'Start date cannot be in the past';
                    },
                  })}
                />
                {errors.startDate && <span className="error-text">{errors.startDate.message}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="endDate">
                  End Date <span className="required">*</span>
                </label>
                <input
                  type="date"
                  id="endDate"
                  {...register('endDate', {
                    required: 'End date is required',
                    validate: (value) => {
                      const startDate = getValues('startDate');
                      if (!startDate || !value) return true;

                      // Compare dates properly using Date objects
                      const startDateObj = new Date(startDate);
                      const endDateObj = new Date(value);

                      return endDateObj >= startDateObj || 'End date must be on or after the start date';
                    },
                  })}
                />
                {errors.endDate && <span className="error-text">{errors.endDate.message}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startTime">
                  Start Time <span className="required">*</span>
                </label>
                <input
                  type="time"
                  id="startTime"
                  {...register('startTime', {
                    required: 'Start time is required',
                    validate: (value) => {
                      const startDateValue = getValues('startDate');
                      if (!startDateValue || !value) return true;

                      const selectedDate = new Date(startDateValue);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      selectedDate.setHours(0, 0, 0, 0);

                      // If start date is today, validate time is not in the past
                      if (selectedDate.getTime() === today.getTime()) {
                        const now = new Date();
                        const [hours, minutes] = value.split(':').map(Number);
                        const selectedTime = hours * 60 + minutes;
                        const currentTime = now.getHours() * 60 + now.getMinutes();

                        return selectedTime >= currentTime || 'Start time cannot be in the past';
                      }

                      return true;
                    },
                  })}
                />
                {errors.startTime && <span className="error-text">{errors.startTime.message}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="endTime">
                  End Time <span className="required">*</span>
                </label>
                <input
                  type="time"
                  id="endTime"
                  {...register('endTime', {
                    required: 'End time is required',
                    validate: (value) => {
                      const startTime = getValues('startTime');
                      if (!startTime || !value) return true;

                      const startDateValue = getValues('startDate');
                      const endDateValue = getValues('endDate');

                      // Convert time strings to minutes for comparison
                      const [startHour, startMin] = startTime.split(':').map(Number);
                      const [endHour, endMin] = value.split(':').map(Number);
                      const startMinutes = startHour * 60 + startMin;
                      const endMinutes = endHour * 60 + endMin;

                      if (startDateValue && endDateValue) {
                        const startDateObj = new Date(startDateValue);
                        const endDateObj = new Date(endDateValue);

                        if (endDateObj.getTime() === startDateObj.getTime()) {
                          return (
                            endMinutes > startMinutes ||
                            'End time must be after start time for same-day events'
                          );
                        }

                        if (endDateObj > startDateObj) {
                          return true;
                        }
                      }

                      return endMinutes > startMinutes || 'End time must be after start time';
                    },
                  })}
                />
                {errors.endTime && <span className="error-text">{errors.endTime.message}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group full-width">
                <label>
                  Location <span className="required">*</span>
                </label>
                <div className="help-text">
                  Search and select the event location on the map
                </div>
                {selectedLocation && (
                  <div className="selected-address">
                    <strong>Selected:</strong> {selectedLocation.address}
                  </div>
                )}
                <div className="map-container">
                  <LocationMap
                    position={selectedLocation?.coordinates || null}
                    onLocationChange={handleLocationSelect}
                    center={[27.7172, 85.324]} // Kathmandu default
                    zoom={13}
                    showSearch={true}
                    searchPlaceholder="Search for event location..."
                    showCurrentLocation={true}
                  />
                </div>
                <input
                  type="hidden"
                  {...register('location', {
                    required: 'Location is required',
                    validate: () => selectedLocation !== null || 'Please select a location from the map'
                  })}
                />
                {errors.location && <span className="error-text">{errors.location.message}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="expectedCapacity">
                  Expected Capacity <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="expectedCapacity"
                  placeholder="e.g., 100"
                  {...register('expectedCapacity', {
                    required: 'Expected capacity is required',
                    min: { value: 1, message: 'Capacity must be at least 1' },
                    valueAsNumber: true
                  })}
                />
                {errors.expectedCapacity && <span className="error-text">{errors.expectedCapacity.message}</span>}
              </div>
            </div>
          </div>

          {/* Blood Types Needed */}
          <div className="form-card">
            <h2 className="section-title">Blood Types Needed</h2>
            <p className="section-subtitle">Select all blood types you need for this event</p>

            <Controller
              name="bloodTypesNeeded"
              control={control}
              rules={{ validate: (value) => value.length > 0 || 'Please select at least one blood type' }}
              render={({ field }) => (
                <div className="blood-types-grid">
                  {BLOOD_TYPES.map(bloodType => (
                    <button
                      key={bloodType}
                      type="button"
                      className={`blood-type-btn ${field.value.includes(bloodType) ? 'selected' : ''}`}
                      onClick={() => field.onChange(handleBloodTypeToggle(bloodType, field.value))}
                    >
                      {bloodType}
                    </button>
                  ))}
                </div>
              )}
            />
            {errors.bloodTypesNeeded && <span className="error-text">{errors.bloodTypesNeeded.message}</span>}
          </div>

          {/* Event Details */}
          <div className="form-card">
            <h2 className="section-title">Event Details</h2>

            <div className="form-group">
              <label htmlFor="eventDescription">
                Event Description <span className="required">*</span>
              </label>
              <textarea
                id="eventDescription"
                placeholder="Provide a detailed description of the event..."
                rows="5"
                {...register('eventDescription', {
                  required: 'Event description is required',
                  minLength: { value: 20, message: 'Description must be at least 20 characters' }
                })}
              />
              {errors.eventDescription && <span className="error-text">{errors.eventDescription.message}</span>}
            </div>

            <div className="form-group">
              <label>Eligibility Requirements</label>
              <div className="requirements-list">
                {eligibilityRequirements.map((requirement, index) => (
                  <div key={index} className="requirement-item">
                    <input
                      type="text"
                      value={requirement}
                      onChange={(e) => handleRequirementChange(index, e.target.value)}
                      placeholder="Enter requirement"
                    />
                    {eligibilityRequirements.length > 1 && (
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => handleRemoveRequirement(index)}
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="add-requirement-btn"
                  onClick={handleAddRequirement}
                >
                  Add new requirement
                </button>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="form-card">
            <h2 className="section-title">Contact Information</h2>
            <p className="section-subtitle">Contact information from your profile</p>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contactEmail">
                  Contact Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="contactEmail"
                  placeholder="contact@example.com"
                  readOnly
                  {...register('contactEmail', {
                    required: 'Contact email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    },
                    validate: (value) => {
                      if (!profileData?.email) return true;
                      return value.trim().toLowerCase() === profileData.email.trim().toLowerCase() ||
                        'Email must match your profile email';
                    }
                  })}
                />
                {errors.contactEmail && <span className="error-text">{errors.contactEmail.message}</span>}
                <span className="field-hint">From your profile</span>
              </div>

              <div className="form-group">
                <label htmlFor="contactPhone">
                  Contact Phone <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  placeholder="+1 (555) 123-4567"
                  readOnly
                  {...register('contactPhone', {
                    required: 'Contact phone is required',
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: 'Phone number must be exactly 10 digits'
                    },
                    validate: (value) => {
                      if (!profileData?.phone) return true;
                      return value.trim() === profileData.phone.trim() ||
                        'Phone must match your profile phone number';
                    }
                  })}
                />
                {errors.contactPhone && <span className="error-text">{errors.contactPhone.message}</span>}
                <span className="field-hint">From your profile</span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={handleCancel}
              disabled={loading}
            >
              <FaTimes /> Cancel
            </button>
            <button
              type="submit"
              className="btn-create"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateEvent;
