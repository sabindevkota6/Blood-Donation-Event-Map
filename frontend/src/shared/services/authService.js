import axios from "axios";
import API_URL from "../config/api";
import { jwtDecode } from "jwt-decode";

const authService = {
  // Register user
  register: async (userData) => {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    if (response.data.token) {
      localStorage.setItem("user", JSON.stringify(response.data));
      // Store token expiration time
      const decoded = jwtDecode(response.data.token);
      localStorage.setItem("tokenExpiry", decoded.exp);
    }
    return response.data;
  },

  // Login user
  login: async (userData) => {
    const response = await axios.post(`${API_URL}/auth/login`, userData);
    if (response.data.token) {
      localStorage.setItem("user", JSON.stringify(response.data));
      // Store token expiration time
      const decoded = jwtDecode(response.data.token);
      localStorage.setItem("tokenExpiry", decoded.exp);
    }
    return response.data;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("tokenExpiry");
  },

  // Get current user
  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  // Check if token is expired
  isTokenExpired: () => {
    const tokenExpiry = localStorage.getItem("tokenExpiry");
    if (!tokenExpiry) {
      return true;
    }
    // Token expiry is in seconds, Date.now() is in milliseconds
    const currentTime = Date.now() / 1000;
    return currentTime > tokenExpiry;
  },

  // Get current user only if token is valid
  getValidUser: () => {
    const user = authService.getCurrentUser();
    if (!user || authService.isTokenExpired()) {
      authService.logout();
      return null;
    }
    return user;
  },
};

export default authService;
