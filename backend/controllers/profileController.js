const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { fullName, email, bloodType, phone, location } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Only allow donors to have blood type and donation-related fields
    if (user.role !== "donor" && bloodType) {
      return res
        .status(400)
        .json({ message: "Only donors can have blood type" });
    }

    // Update allowed fields
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (bloodType) user.bloodType = bloodType;
    if (phone) user.phone = phone;
    if (location) {
      user.location = {
        address: location.address || user.location?.address,
        coordinates: {
          lat: location.coordinates?.lat || user.location?.coordinates?.lat,
          lng: location.coordinates?.lng || user.location?.coordinates?.lng,
        },
      };
    }

    // Check if profile is complete (for donors)
    if (user.role === "donor") {
      user.isProfileComplete = !!(
        user.bloodType &&
        user.phone &&
        user.location?.address &&
        user.location?.coordinates?.lat &&
        user.location?.coordinates?.lng
      );
    } else {
      // For organizers, just check basic info
      user.isProfileComplete = !!(user.phone && user.location?.address);
    }

    await user.save();

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Upload profile picture
// @route   POST /api/profile/upload-picture
// @access  Private
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old image from Cloudinary if exists
    if (user.profilePicture?.publicId) {
      await cloudinary.uploader.destroy(user.profilePicture.publicId);
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "blood-donation/profiles",
      width: 500,
      height: 500,
      crop: "fill",
    });

    // Update user profile picture
    user.profilePicture = {
      url: result.secure_url,
      publicId: result.public_id,
    };

    await user.save();

    res.json({
      message: "Profile picture uploaded successfully",
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete profile picture
// @route   DELETE /api/profile/delete-picture
// @access  Private
const deleteProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.profilePicture?.publicId) {
      return res.status(400).json({ message: "No profile picture to delete" });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(user.profilePicture.publicId);

    // Remove from user document
    user.profilePicture = undefined;

    await user.save();

    res.json({ message: "Profile picture deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
};
