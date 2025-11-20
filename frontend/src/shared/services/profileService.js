import axios from "axios";
import API_URL from "../config/api";

/* profileService: API helpers for profile CRUD and media upload */
const profileService = {
  /* Retrieve current user's profile (requires token) */
  getProfile: async (token) => {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.get(`${API_URL}/profile`, config);
    return response.data;
  },

  /* Update profile details */
  updateProfile: async (profileData, token) => {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.put(`${API_URL}/profile`, profileData, config);
    return response.data;
  },

  /* Mark profile complete - wrapper for updateProfile */
  completeProfile: async (profileData, token) => {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const response = await axios.put(`${API_URL}/profile`, profileData, config);
    return response.data;
  },

  /* Upload a profile image; uses multipart form data */
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

  /* Delete uploaded profile image */
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
