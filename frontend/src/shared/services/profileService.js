import axios from "axios";
import API_URL from "../config/api";

const profileService = {
  // Get user profile
  getProfile: async (token) => {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.get(`${API_URL}/profile`, config);
    return response.data;
  },

  // Update profile
  updateProfile: async (profileData, token) => {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.put(`${API_URL}/profile`, profileData, config);
    return response.data;
  },

  // Complete profile (same as update, but semantically different)
  completeProfile: async (profileData, token) => {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.put(`${API_URL}/profile`, profileData, config);
    return response.data;
  },

  // Upload profile picture
  uploadProfilePicture: async (formData, token) => {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    };
    const response = await axios.post(
      `${API_URL}/profile/upload-picture`,
      formData,
      config
    );
    return response.data;
  },

  // Delete profile picture
  deleteProfilePicture: async (token) => {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.delete(
      `${API_URL}/profile/delete-picture`,
      config
    );
    return response.data;
  },
};

export default profileService;
