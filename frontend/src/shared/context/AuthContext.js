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

  useEffect(() => {
    // Check if user exists and token is still valid
    const user = authService.getValidUser();
    if (user) {
      setUser(user);
      refreshProfile(user.token);
    }
    setLoading(false);

    // Set up periodic token expiration check (every minute)
    const interval = setInterval(() => {
      if (authService.isTokenExpired()) {
        authService.logout();
        setUser(null);
        // Optionally redirect to login
        window.location.href = "/login?session=expired";
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

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
