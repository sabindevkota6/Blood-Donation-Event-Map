import axios from "axios";
import API_URL from "../config/api";
import { jwtDecode } from "jwt-decode";

/*
 * authService: helper functions that call backend auth endpoints and manage local storage tokens
 */
const authService = {
  /* Register a user and store their token locally for session management */
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

  /* Login user and persist token/data to local storage */
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

  /* Logout and clear stored session information */
  logout: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("tokenExpiry");
  },

  /* Return the user object from local storage if present */
  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  /* Token expiration helper: checks stored expiry timestamp */
  isTokenExpired: () => {
    const tokenExpiry = localStorage.getItem("tokenExpiry");
    if (!tokenExpiry) {
      return true;
    }
    // Token expiry is in seconds, Date.now() is in milliseconds
    const currentTime = Date.now() / 1000;
    return currentTime > tokenExpiry;
  },

  /* Returns user only if token is valid; performs automatic logout on expired token */
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
