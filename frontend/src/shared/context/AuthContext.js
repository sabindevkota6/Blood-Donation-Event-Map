/*
 * AuthContext: centralizes authentication state and profile data
 * Provides helpers for login/logout and profile refresh to the app.
 */
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import authService from "../services/authService";
import profileService from "../services/profileService";

const AuthContext = createContext();

// Hook to access auth context from components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);

  // Refresh profile data, optionally using an override token
  const refreshProfile = useCallback(
    async (overrideToken) => {
      const tokenToUse = overrideToken || user?.token;

      if (!tokenToUse) {
        setProfile(null);
        return null;
      }

      try {
        const data = await profileService.getProfile(tokenToUse);
        setProfile(data);
        return data;
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        return null;
      }
    },
    [user?.token]
  );

  // On startup: load stored user and refresh profile if present
  useEffect(() => {
    const storedUser = authService.getValidUser();
    if (storedUser) {
      setUser(storedUser);
      refreshProfile(storedUser.token);
    }
    setLoading(false);
  }, [refreshProfile]);

  // Watch for token expiry and handle automatic logout when token is expired
  useEffect(() => {
    if (!user?.token) {
      return undefined;
    }

    const interval = setInterval(() => {
      if (authService.isTokenExpired()) {
        authService.logout();
        setUser(null);
        window.location.href = "/login?session=expired";
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [user?.token]);

  // Attempt login with credentials, store user on success
  const login = async (email, password) => {
    try {
      setError(null);
      const data = await authService.login({ email, password });
      setUser(data);
      refreshProfile(data.token);
      return data;
    } catch (err) {
      const message =
        err.response?.data?.message || "An error occurred during login";
      setError(message);
      throw new Error(message);
    }
  };

  // Register a new user and preload profile data
  const register = async (userData) => {
    try {
      setError(null);
      const data = await authService.register(userData);
      setUser(data);
      refreshProfile(data.token);
      return data;
    } catch (err) {
      const message =
        err.response?.data?.message || "An error occurred during registration";
      setError(message);
      throw new Error(message);
    }
  };

  // Clear stored auth/session data locally
  const logout = () => {
    authService.logout();
    setUser(null);
    setProfile(null);
  };

  useEffect(() => {
    if (user?.token) {
      refreshProfile(user.token);
    } else {
      setProfile(null);
    }
  }, [user?.token, refreshProfile]);

  const value = {
    user,
    profile,
    token: user?.token || null,
    loading,
    error,
    login,
    register,
    logout,
    setError,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
