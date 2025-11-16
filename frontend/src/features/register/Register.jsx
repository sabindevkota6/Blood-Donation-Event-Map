import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../shared/context/AuthContext';
import './Register.css';

function Register() {
  const [localError, setLocalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('donor');

  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
  });

  const handleRoleChange = (role) => {
    setSelectedRole(role);
  };

  const onSubmit = async (data) => {
    setLocalError('');

    try {
      setIsLoading(true);
      await registerUser({ ...data, role: selectedRole });
      navigate('/dashboard');
    } catch (error) {
      setLocalError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="title">Blood Donation Map</h1>
        <h2 className="subtitle">Register Page</h2>

        {localError && <div className="error-message">{localError}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              placeholder="Enter your full name"
              {...register('fullName', {
                required: 'Full name is required',
                maxLength: {
                  value: 50,
                  message: 'Name must not exceed 50 characters',
                },
                pattern: {
                  value: /^[a-zA-Z\s]+$/,
                  message: 'Name can only contain letters and spaces',
                },
                validate: {
                  twoWords: (value) => {
                    const words = value.trim().split(/\s+/);
                    return words.length >= 2 || 'Please enter at least two words (first and last name)';
                  },
                },
              })}
            />
            {errors.fullName && <span className="error-text">{errors.fullName.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: 'Please enter a valid email address',
                },
              })}
            />
            {errors.email && <span className="error-text">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Create a password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/,
                  message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                },
              })}
            />
            {errors.password && <span className="error-text">{errors.password.message}</span>}
          </div>

          <div className="form-group">
            <label>User Role</label>
            <div className="role-selector">
              <button
                type="button"
                className={`role-btn ${selectedRole === 'donor' ? 'active' : ''}`}
                onClick={() => handleRoleChange('donor')}
              >
                Donor
              </button>
              <button
                type="button"
                className={`role-btn ${selectedRole === 'organizer' ? 'active' : ''}`}
                onClick={() => handleRoleChange('organizer')}
              >
                Organizer
              </button>
            </div>
          </div>

          <button type="submit" className="btn-register" disabled={isLoading}>
            {isLoading ? 'REGISTERING...' : 'REGISTER'}
          </button>
        </form>

        <p className="auth-link">
          Already have an account?{' '}
          <Link to="/login" className="link">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
