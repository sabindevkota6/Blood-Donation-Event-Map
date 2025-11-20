/*
 * Profile Controller
 * Handles retrieval and updates to user profiles, including
 * computed summaries for donors and organizers.
 */
const User = require("../models/User");
const Event = require("../models/Event");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../config/cloudinary");
const asyncHandler = require("../middleware/asyncHandler");

// TTL and in-memory cache for computed profile summaries
const PROFILE_CACHE_TTL_MS = 2 * 60 * 1000;
const profileStatsCache = new Map();

/* Cache accessor: Returns cached profile data if fresh */
const getCachedProfileData = (key) => {
  const entry = profileStatsCache.get(key);
  if (!entry) {
    return null;
  }
  if (Date.now() - entry.timestamp > PROFILE_CACHE_TTL_MS) {
    profileStatsCache.delete(key);
    return null;
  }
  return entry.data;
};

/* Cache setter: Store computed profile data with a timestamp */
const setCachedProfileData = (key, data) => {
  profileStatsCache.set(key, { data, timestamp: Date.now() });
};

/* Cache invalidation helper: remove cached entries for a user */
const clearCachedProfileData = (userId) => {
  profileStatsCache.delete(`donor:${userId}`);
  profileStatsCache.delete(`organizer:${userId}`);
};

/* Build profile summary for organizers, using Mongo aggregations.
 * Returns computed fields like event counts, recent events and achievements.
 */
const buildOrganizerProfileData = async (user) => {
  const cacheKey = `organizer:${user._id.toString()}`;
  const cached = getCachedProfileData(cacheKey);
  if (cached) {
    return cached;
  }

  const organizerStats = await Event.aggregate([
    {
      $match: { organizer: user._id },
    },
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              totalEvents: { $sum: 1 },
              totalAttendees: {
                $sum: { $ifNull: ["$currentAttendees", 0] },
              },
            },
          },
        ],
        recentEvents: [
          { $sort: { eventDate: -1 } },
          {
            $project: {
              _id: 1,
              eventTitle: 1,
              eventDate: 1,
              currentAttendees: { $ifNull: ["$currentAttendees", 0] },
            },
          },
          { $limit: 10 },
        ],
        firstEvent: [
          { $sort: { createdAt: 1 } },
          { $limit: 1 },
          { $project: { createdAt: 1 } },
        ],
      },
    },
  ]);

  const summary = organizerStats?.[0]?.summary?.[0] || {
    totalEvents: 0,
    totalAttendees: 0,
  };
  const recentEvents = organizerStats?.[0]?.recentEvents || [];
  const firstEventDate =
    organizerStats?.[0]?.firstEvent?.[0]?.createdAt || null;

  // Build achievements based on aggregated stats
  const achievements = [];

  if (summary.totalEvents >= 1) {
    achievements.push({
      title: "First Event",
      description: "Successfully organized first blood donation event",
      date: firstEventDate,
    });
  }

  if (summary.totalAttendees >= 100) {
    achievements.push({
      title: "100 Donors Milestone",
      description: "Reached 100 total donors across all events",
      date: null,
    });
  }

  if (summary.totalEvents >= 10) {
    achievements.push({
      title: "10 Events Organized",
      description: "Organized 10+ successful blood donation events",
      date: null,
    });
  }

  if (summary.totalEvents >= 50) {
    achievements.push({
      title: "50 Events Organized",
      description:
        "Reached the milestone of organizing 50 blood donation events",
      date: null,
    });
  }

  const data = {
    eventsOrganized: summary.totalEvents,
    totalAttendees: summary.totalAttendees,
    achievements,
    eventHistory: recentEvents.map((event) => ({
      _id: event._id,
      name: event.eventTitle,
      attendees: event.currentAttendees || 0,
      date: event.eventDate,
    })),
  };

  // Cache the computed organizer profile summary
  setCachedProfileData(cacheKey, data);
  return data;
};

/* Build profile summary for donors.
 * Includes donation history and derived achievements.
 */
const buildDonorProfileData = async (user) => {
  const cacheKey = `donor:${user._id.toString()}`;
  const cached = getCachedProfileData(cacheKey);
  if (cached) {
    return cached;
  }

  const registeredEventIds =
    user.registeredEvents?.map((re) => re.eventId) || [];
  const donationHistory = await Event.find({
    _id: { $in: registeredEventIds },
  })
    .sort({ eventDate: -1 })
    .limit(10)
    .select("eventTitle currentAttendees eventDate");

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

  const data = {
    achievements,
    donationHistory: donationHistory.map((event) => ({
      _id: event._id,
      name: event.eventTitle,
      attendees: event.currentAttendees || 0,
      date: event.eventDate,
    })),
  };

  // Cache computed donor profile data
  setCachedProfileData(cacheKey, data);
  return data;
};

/* Controller: Get user profile (with role-specific computed data) */
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  let userProfile = user.toObject();

  if (user.role === "organizer") {
    Object.assign(userProfile, await buildOrganizerProfileData(user));
  }

  if (user.role === "donor") {
    Object.assign(userProfile, await buildDonorProfileData(user));
  }

  res.json(userProfile);
});

/* Controller: Update profile details for current user */
const updateProfile = asyncHandler(async (req, res) => {
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

  if (user.role !== "donor" && bloodType) {
    return res.status(400).json({ message: "Only donors can have blood type" });
  }

  if (user.role !== "organizer" && (organization || memberSince)) {
    return res
      .status(400)
      .json({ message: "Only organizers can have organization details" });
  }

  if (phone && phone !== user.phone) {
    const phoneExists = await User.findOne({
      phone: phone,
      _id: { $ne: user._id },
    });

    if (phoneExists) {
      return res.status(400).json({
        message: "This phone number is already registered to another user",
      });
    }
  }

  if (email && email !== user.email) {
    return res.status(400).json({
      message: "Email address cannot be changed",
    });
  }

  if (fullName) user.fullName = fullName;
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

  const hasValidLocation =
    user.location?.address &&
    typeof user.location?.coordinates?.lat === "number" &&
    typeof user.location?.coordinates?.lng === "number";

  if (user.role === "donor") {
    user.isProfileComplete = Boolean(user.bloodType && hasValidLocation);
  } else if (user.role === "organizer") {
    user.isProfileComplete = Boolean(
      user.organization && user.memberSince && hasValidLocation
    );
  }

  await user.save();

  res.json(user);
});

/* Controller: Upload a profile picture using Cloudinary */
const uploadProfilePicture = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Please upload an image" });
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const previousPublicId = user.profilePicture?.publicId;

  const result = await uploadToCloudinary(
    req.file.buffer,
    "blood-donation-app/profiles"
  );

  user.profilePicture = {
    url: result.secure_url,
    publicId: result.public_id,
  };

  await user.save();

  if (previousPublicId) {
    deleteFromCloudinary(previousPublicId).catch((cloudinaryError) =>
      console.error(
        "Failed to delete previous Cloudinary asset:",
        cloudinaryError
      )
    );
  }

  res.json({
    message: "Profile picture uploaded successfully",
    profilePicture: user.profilePicture,
  });
});

/* Controller: Delete a user's profile picture from Cloudinary */
const deleteProfilePicture = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!user.profilePicture?.publicId) {
    return res.status(400).json({ message: "No profile picture to delete" });
  }

  await deleteFromCloudinary(user.profilePicture.publicId);

  user.profilePicture = undefined;

  await user.save();

  res.json({ message: "Profile picture deleted successfully" });
});

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  clearCachedProfileData,
};
