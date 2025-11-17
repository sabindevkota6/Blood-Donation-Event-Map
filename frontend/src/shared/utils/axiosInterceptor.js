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