const User = require("../models/User");
const Event = require("../models/Event");
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

    // If user is an organizer, calculate their stats
    let userProfile = user.toObject();

    if (user.role === "organizer") {
      // Count events organized by this user
      const eventsOrganized = await Event.countDocuments({
        organizer: user._id,
      });

      // Calculate total attendees across all their events
      const events = await Event.find({ organizer: user._id })
        .sort({ eventDate: -1 })
        .limit(10);
      const totalAttendees = await Event.find({ organizer: user._id }).then(
        (allEvents) =>
          allEvents.reduce(
            (sum, event) => sum + (event.currentAttendees || 0),
            0
          )
      );

      userProfile.eventsOrganized = eventsOrganized;
      userProfile.totalAttendees = totalAttendees;

      // Generate achievements for organizers
      const achievements = [];

      if (eventsOrganized >= 1) {
        const firstEvent = await Event.findOne({ organizer: user._id }).sort({
          createdAt: 1,
        });
        achievements.push({
          title: "First Event",
          description: "Successfully organized first blood donation event",
          date: firstEvent?.createdAt,
        });
      }

      if (totalAttendees >= 100) {
        achievements.push({
          title: "100 Donors Milestone",
          description: "Reached 100 total donors across all events",
          date: null,
        });
      }

      if (eventsOrganized >= 10) {
        achievements.push({
          title: "10 Events Organized",
          description: "Organized 10+ successful blood donation events",
          date: null,
        });
      }

      if (eventsOrganized >= 50) {
        achievements.push({
          title: "50 Events Organized",
          description:
            "Reached the milestone of organizing 50 blood donation events",
          date: null,
        });
      }

      userProfile.achievements = achievements;
      userProfile.eventHistory = events.map((event) => ({
        _id: event._id,
        name: event.eventTitle,
        attendees: event.currentAttendees || 0,
        date: event.eventDate,
      }));
    }

    if (user.role === "donor") {
      // Fetch registered events for donors
      const registeredEventIds =
        user.registeredEvents?.map((re) => re.eventId) || [];
      const donationHistory = await Event.find({
        _id: { $in: registeredEventIds },
      })
        .sort({ eventDate: -1 })
        .limit(10)
        .select("eventTitle currentAttendees eventDate");

      // Generate achievements for donors based on total donations
      const achievements = [];
      const totalDonations = user.totalDonations || 0;

      if (totalDonations >= 1) {
        const firstDonation = user.registeredEvents?.[0];
        achievements.push({
          title: "First Donation",
          description: "Completed your first blood donation",
          date: firstDonation?.registeredAt,
        });
      }

      if (totalDonations >= 5) {
        achievements.push({
          title: "5 Donations",
          description: "Saved lives with 5 blood donations",
          date: null,
        });
      }

      if (totalDonations >= 10) {
        achievements.push({
          title: "10 Donations",
          description: "Reached 10 donations milestone",
          date: null,
        });
      }

      if (totalDonations >= 25) {
        achievements.push({
          title: "25 Donations",
          description: "Heroic milestone of 25 blood donations",
          date: null,
        });
      }

      userProfile.achievements = achievements;
      userProfile.donationHistory = donationHistory.map((event) => ({
        _id: event._id,
        name: event.eventTitle,
        attendees: event.currentAttendees || 0,
        date: event.eventDate,
      }));
    }

    res.json(userProfile);
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
    const {
      fullName,
      email,
      bloodType,
      phone,
      location,
      organization,
      memberSince,
    } = req.body;

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

    // Only allow organizers to have organization fields
    if (user.role !== "organizer" && (organization || memberSince)) {
      return res
        .status(400)
        .json({ message: "Only organizers can have organization details" });
    }

    // Update allowed fields
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (bloodType) user.bloodType = bloodType;
    if (phone) user.phone = phone;
    if (organization) user.organization = organization;
    if (memberSince) user.memberSince = memberSince;
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
    } else if (user.role === "organizer") {
      // For organizers, check organization-specific fields
      user.isProfileComplete = !!(
        user.organization &&
        user.memberSince &&
        user.phone &&
        user.location?.address &&
        user.location?.coordinates?.lat &&
        user.location?.coordinates?.lng
      );
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
