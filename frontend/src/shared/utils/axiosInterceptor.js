/*
 * Axios interceptor utility
 * Provides a single place to install global axios interceptors for handling
 * common API response scenarios such as unauthorized (401) responses.
 */
import axios from 'axios';

export const setupAxiosInterceptors = (logout) => {
  // Install a response interceptor that handles HTTP 401 by logging the user out
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        // Backend indicates the token is invalid/expired; log out locally
        console.warn('Unauthorized - logging out');
        logout?.();
        // Redirect user to login and add a query param to indicate an expired session
        window.location.href = '/login?expired=true';
      }
      return Promise.reject(error);
    }
  );
};

export default setupAxiosInterceptors;
import axios from 'axios';

export const setupAxiosInterceptors = (logout) => {
  // Response interceptor to handle 401 errors
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        // Token is invalid or expired
        console.log('Unauthorized - logging out...');
        logout();
        window.location.href = '/login?expired=true';