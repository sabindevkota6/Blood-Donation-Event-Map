import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../shared/context/AuthContext';
import './Login.css';

function Login() {
  const [localError, setLocalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if redirected due to session expiration
    if (searchParams.get('session') === 'expired') {
      setLocalError('Your session has expired. Please log in again.');
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    setLocalError('');

    try {
      setIsLoading(true);
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (error) {
      setLocalError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="title">Blood Donation Map</h1>
        <h2 className="subtitle">Login Page</h2>

        {localError && <div className="error-message">{localError}</div>}

        <form onSubmit={handleSubmit(onSubmit)}>
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
              placeholder="Enter your password"
              {...register('password', {
                required: 'Password is required',
              })}
            />
            {errors.password && <span className="error-text">{errors.password.message}</span>}
          </div>

          <button type="submit" className="btn-login" disabled={isLoading}>
            {isLoading ? 'LOGGING IN...' : 'LOGIN'}
          </button>
        </form>

        <p className="auth-link">
          Don't have an account?{' '}
          <Link to="/register" className="link">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
