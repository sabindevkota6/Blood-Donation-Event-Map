const Event = require("../models/Event");
const User = require("../models/User");

const parseTimeStringToMinutes = (timeString = "") => {
  if (typeof timeString !== "string") {
    return null;
  }

  const trimmed = timeString.trim();
  if (!trimmed) {
    return null;
  }

  const [timePart, modifierRaw] = trimmed.split(/\s+/);
  if (!timePart || !modifierRaw) {
    return null;
  }

  const modifier = modifierRaw.toUpperCase();
  const [hoursPart, minutesPart = "0"] = timePart.split(":");

  let hours = parseInt(hoursPart, 10);
  const minutes = parseInt(minutesPart, 10);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  if (modifier === "PM" && hours < 12) {
    hours += 12;
  }

  if (modifier === "AM" && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
};

const parseEventTimeRange = (eventTime = "") => {
  if (typeof eventTime !== "string") {
    return null;
  }

  const parts = eventTime.split("-");
  if (parts.length !== 2) {
    return null;
  }

  const startMinutes = parseTimeStringToMinutes(parts[0]);
  const endMinutes = parseTimeStringToMinutes(parts[1]);

  if (startMinutes === null || endMinutes === null) {
    return null;
  }

  return { startMinutes, endMinutes };
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private (Organizers only)
exports.createEvent = async (req, res) => {
  try {
    // Check if user is an organizer
    if (req.user.role !== "organizer") {
      return res.status(403).json({
        message: "Only organizers can create events",
      });
    }

    const {
      eventTitle,
      organizationName,
      startDate,
      endDate,
      eventDate: legacyEventDate,
      eventTime,
      location,
      locationCoordinates,
      expectedCapacity,
      bloodTypesNeeded,
      eventDescription,
      eligibilityRequirements,
      contactEmail,
      contactPhone,
    } = req.body;

    // Validate required fields
    const eventStartDate = startDate || legacyEventDate;
    const eventEndDate = endDate || eventStartDate;

    if (
      !eventTitle ||
      !organizationName ||
      !eventStartDate ||
      !eventEndDate ||
      !eventTime ||
      !location ||
      !expectedCapacity ||
      !bloodTypesNeeded ||
      !eventDescription ||
      !contactEmail ||
      !contactPhone
    ) {
      return res.status(400).json({
        message: "Please provide all required fields",
      });
    }

    // Validate blood types
    if (!Array.isArray(bloodTypesNeeded) || bloodTypesNeeded.length === 0) {
      return res.status(400).json({
        message: "Please select at least one blood type",
      });
    }

    // Check for duplicate event title among active events only
    const normalizeRegexInput = (value) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const matchingEvents = await Event.find({
      eventTitle: {
        $regex: new RegExp(`^${normalizeRegexInput(eventTitle.trim())}$`, "i"),
      },
    });

    const hasActiveDuplicate = matchingEvents.some((eventDoc) => {
      const evaluatedStatus = eventDoc.updateStatus();
      return evaluatedStatus === "upcoming" || evaluatedStatus === "ongoing";
    });

    if (hasActiveDuplicate) {
      return res.status(400).json({
        message:
          "An event with this title already exists. Please choose a different title.",
      });
    }

    // Validate date is not in the past
    const eventDateObj = new Date(eventStartDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDateObj.setHours(0, 0, 0, 0);

    if (eventDateObj < today) {
      return res.status(400).json({
        message: "Event date cannot be in the past",
      });
    }

    const eventEndDateObj = new Date(eventEndDate);
    eventEndDateObj.setHours(0, 0, 0, 0);

    if (eventEndDateObj < eventDateObj) {
      return res.status(400).json({
        message: "End date must be on or after the start date",
      });
    }

    const timeRange = parseEventTimeRange(eventTime);

    if (!timeRange) {
      return res.status(400).json({
        message: "Invalid event time format",
      });
    }

    if (
      eventEndDateObj.getTime() === eventDateObj.getTime() &&
      timeRange.endMinutes <= timeRange.startMinutes
    ) {
      return res.status(400).json({
        message: "End time must be after start time",
      });
    }

    // Create event
    const event = await Event.create({
      organizer: req.user.id,
      eventTitle,
      organizationName,
      eventDate: eventStartDate,
      endDate: eventEndDate,
      eventTime,
      location,
      locationCoordinates,
      expectedCapacity,
      bloodTypesNeeded,
      eventDescription,
      eligibilityRequirements: eligibilityRequirements || [],
      contactEmail,
      contactPhone,
    });

    res.status(201).json({
      message: "Event created successfully",
      event,
    });
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({
      message: "Error creating event",
      error: error.message,
    });
  }
};

// @desc    Get all events (with filters)
// @route   GET /api/events
// @access  Public
// @desc    Get dashboard statistics
// @route   GET /api/events/dashboard/stats
// @access  Public
exports.getDashboardStats = async (req, res) => {
  try {
    // Count active events (upcoming and ongoing, exclude cancelled)
    const activeEventsCount = await Event.countDocuments({
      status: { $in: ["upcoming", "ongoing"] },
    });

    // Count registered donors (users with donor role)
    const registeredDonorsCount = await User.countDocuments({
      role: "donor",
    });

    res.status(200).json({
      activeEvents: activeEventsCount,
      registeredDonors: registeredDonorsCount,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      message: "Error fetching dashboard statistics",
      error: error.message,
    });
  }
};

exports.getAllEvents = async (req, res) => {
  try {
    const {
      status,
      bloodType,
      location,
      organizer,
      date,
      search,
      page = 1,
      limit = 6,
    } = req.query;

    const query = { status: { $ne: "cancelled" } };
    const andClauses = [];

    if (status) {
      // If status is 'active', include both 'upcoming' and 'ongoing'
      if (status === "active") {
        query.status = { $in: ["upcoming", "ongoing"] };
      } else {
        query.status = status;
      }
    }

    if (bloodType) {
      query.bloodTypesNeeded = bloodType;
    }

    if (location && !search) {
      query.location = { $regex: location, $options: "i" };
    }

    if (organizer) {
      query.organizer = organizer;
    }

    if (search && search.trim()) {
      const searchValue = search.trim();
      andClauses.push({
        $or: [
          { location: { $regex: searchValue, $options: "i" } },
          { eventTitle: { $regex: searchValue, $options: "i" } },
          { organizationName: { $regex: searchValue, $options: "i" } },
        ],
      });
    }

    if (date) {
      const searchDate = new Date(date);
      if (!Number.isNaN(searchDate.getTime())) {
        const startOfDay = new Date(searchDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        andClauses.push({
          $or: [
            {
              eventDate: {
                $gte: startOfDay,
                $lt: endOfDay,
              },
            },
            {
              eventDate: { $lte: startOfDay },
              endDate: { $gte: startOfDay },
            },
          ],
        });
      }
    }

    if (andClauses.length > 0) {
      query.$and = andClauses;
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalEvents = await Event.countDocuments(query);

    // Get paginated events
    const events = await Event.find(query)
      .populate("organizer", "fullName email profilePicture organization")
      .sort({ eventDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Update status for each event
    for (let event of events) {
      const previousStatus = event.status;
      const updatedStatus = event.updateStatus();
      if (updatedStatus !== previousStatus) {
        await event.save();
      }
    }

    res.status(200).json({
      count: events.length,
      total: totalEvents,
      page: pageNum,
      totalPages: Math.ceil(totalEvents / limitNum),
      hasMore: pageNum < Math.ceil(totalEvents / limitNum),
      events,
    });
  } catch (error) {
    console.error("Get events error:", error);
    res.status(500).json({
      message: "Error fetching events",
      error: error.message,
    });
  }
};

// @desc    Get events by organizer
// @route   GET /api/events/my-events
// @access  Private (Organizers only)
exports.getMyEvents = async (req, res) => {
  try {
    if (req.user.role !== "organizer") {
      return res.status(403).json({
        message: "Only organizers can access this route",
      });
    }

    const events = await Event.find({ organizer: req.user.id }).sort({
      eventDate: -1,
    });

    // Update status for each event (only save if changed)
    const updatePromises = events.map(async (event) => {
      const previousStatus = event.status;
      const updatedStatus = event.updateStatus();
      if (updatedStatus !== previousStatus) {
        return event.save();
      }
      return null;
    });

    // Execute all updates in parallel
    await Promise.all(updatePromises);

    res.status(200).json({
      count: events.length,
      events,
    });
  } catch (error) {
    console.error("Get my events error:", error);
    res.status(500).json({
      message: "Error fetching your events",
      error: error.message,
    });
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("organizer", "fullName email phone profilePicture organization")
      .populate("attendees.donor", "fullName email bloodType");

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // Update status
    event.updateStatus();
    await event.save();

    res.status(200).json({ event });
  } catch (error) {
    console.error("Get event error:", error);
    res.status(500).json({
      message: "Error fetching event",
      error: error.message,
    });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Event organizer only)
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // Check if user is the organizer
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized to update this event",
      });
    }

    // Don't allow updating completed or cancelled events
    if (event.status === "completed" || event.status === "cancelled") {
      return res.status(400).json({
        message: `Cannot update ${event.status} event`,
      });
    }

    const {
      eventTitle,
      organizationName,
      startDate,
      endDate,
      eventDate,
      eventTime,
      location,
      locationCoordinates,
      expectedCapacity,
      bloodTypesNeeded,
      eventDescription,
      eligibilityRequirements,
      contactEmail,
      contactPhone,
    } = req.body;

    // Update fields
    if (eventTitle) event.eventTitle = eventTitle;
    if (organizationName) event.organizationName = organizationName;

    let updatedStartDate = null;

    if (startDate || eventDate) {
      updatedStartDate = startDate || eventDate;
      const newStartDate = new Date(updatedStartDate);

      if (Number.isNaN(newStartDate.getTime())) {
        return res.status(400).json({
          message: "Invalid start date provided",
        });
      }

      event.eventDate = newStartDate;
    }

    const comparisonStart = updatedStartDate
      ? new Date(updatedStartDate)
      : new Date(event.eventDate);

    if (endDate) {
      const newEndDate = new Date(endDate);

      if (Number.isNaN(newEndDate.getTime())) {
        return res.status(400).json({
          message: "Invalid end date provided",
        });
      }

      if (newEndDate < comparisonStart) {
        return res.status(400).json({
          message: "End date must be on or after the start date",
        });
      }

      event.endDate = newEndDate;
    }

    if (eventTime) event.eventTime = eventTime;
    if (location) event.location = location;
    if (locationCoordinates) event.locationCoordinates = locationCoordinates;
    if (expectedCapacity) event.expectedCapacity = expectedCapacity;
    if (bloodTypesNeeded) event.bloodTypesNeeded = bloodTypesNeeded;
    if (eventDescription) event.eventDescription = eventDescription;
    if (eligibilityRequirements)
      event.eligibilityRequirements = eligibilityRequirements;
    if (contactEmail) event.contactEmail = contactEmail;
    if (contactPhone) event.contactPhone = contactPhone;

    if (!event.endDate || new Date(event.endDate) < new Date(event.eventDate)) {
      event.endDate = event.eventDate;
    }

    const parsedRange = parseEventTimeRange(event.eventTime);

    if (!parsedRange) {
      return res.status(400).json({
        message: "Invalid event time format",
      });
    }

    const startDay = new Date(event.eventDate);
    startDay.setHours(0, 0, 0, 0);
    const endDay = new Date(event.endDate || event.eventDate);
    endDay.setHours(0, 0, 0, 0);

    if (endDay.getTime() === startDay.getTime()) {
      if (parsedRange.endMinutes <= parsedRange.startMinutes) {
        return res.status(400).json({
          message: "End time must be after start time",
        });
      }
    }

    await event.save();

    res.status(200).json({
      message: "Event updated successfully",
      event,
    });
  } catch (error) {
    console.error("Update event error:", error);
    res.status(500).json({
      message: "Error updating event",
      error: error.message,
    });
  }
};

// @desc    Cancel event (non-destructive)
// @route   POST /api/events/:id/cancel
// @access  Private (Event organizer only)
exports.cancelEvent = async (req, res) => {
  try {
    if (req.user.role !== "organizer") {
      return res.status(403).json({
        message: "Only organizers can cancel events",
      });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized to cancel this event",
      });
    }

    if (event.status === "cancelled") {
      return res.status(400).json({
        message: "Event is already cancelled",
      });
    }

    if (event.status === "completed") {
      return res.status(400).json({
        message: "Cannot cancel an event that is completed",
      });
    }

    event.status = "cancelled";

    if (Array.isArray(event.attendees) && event.attendees.length > 0) {
      event.attendees.forEach((attendee) => {
        if (attendee.status === "registered") {
          attendee.status = "cancelled";
        }
      });
    }

    await event.save();

    res.status(200).json({
      message: "Event cancelled successfully",
      event,
    });
  } catch (error) {
    console.error("Cancel event error:", error);
    res.status(500).json({
      message: "Error cancelling event",
      error: error.message,
    });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Event organizer only)
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // Check if user is the organizer
    if (event.organizer.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized to delete this event",
      });
    }

    await event.deleteOne();

    res.status(200).json({
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({
      message: "Error deleting event",
      error: error.message,
    });
  }
};

// @desc    Register for event (for donors)
// @route   POST /api/events/:id/register
// @access  Private (Donors only)
exports.registerForEvent = async (req, res) => {
  try {
    if (req.user.role !== "donor") {
      return res.status(403).json({
        message: "Only donors can register for events",
      });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    // Check if event is full
    if (event.isFull) {
      return res.status(400).json({
        message: "Event is full",
      });
    }

    // Check if already registered
    const alreadyRegistered = event.attendees.some(
      (attendee) => attendee.donor.toString() === req.user.id
    );

    if (alreadyRegistered) {
      return res.status(400).json({
        message: "You are already registered for this event",
      });
    }

    // Add donor to attendees
    event.attendees.push({
      donor: req.user.id,
      status: "registered",
    });

    await event.save();

    res.status(200).json({
      message: "Successfully registered for event",
      event,
    });
  } catch (error) {
    console.error("Register for event error:", error);
    res.status(500).json({
      message: "Error registering for event",
      error: error.message,
    });
  }
};

// @desc    Cancel event registration
// @route   POST /api/events/:id/cancel-registration
// @access  Private (Donors only)
exports.cancelRegistration = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const attendeeIndex = event.attendees.findIndex(
      (attendee) => attendee.donor.toString() === req.user.id
    );

    if (attendeeIndex === -1) {
      return res.status(400).json({
        message: "You are not registered for this event",
      });
    }

    // Update status to cancelled
    event.attendees[attendeeIndex].status = "cancelled";
    await event.save();

    res.status(200).json({
      message: "Registration cancelled successfully",
      event,
    });
  } catch (error) {
    console.error("Cancel registration error:", error);
    res.status(500).json({
      message: "Error cancelling registration",
      error: error.message,
    });
  }
};
