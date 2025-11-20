// Event model: stores event details, attendees and helper methods
const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    // Organizer (user who created the event)
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Basic event information
    eventTitle: {
      type: String,
      required: true,
      trim: true,
    },
    organizationName: {
      type: String,
      required: true,
      trim: true,
    },
    // Timing & scheduling details
    eventDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    eventTime: {
      type: String,
      required: true,
    },
    // Location and coordinates for map integration
    location: {
      type: String,
      required: true,
      trim: true,
    },
    locationCoordinates: {
      lat: {
        type: Number,
        required: false,
      },
      lng: {
        type: Number,
        required: false,
      },
    },
    // Capacity & attendee tracking
    expectedCapacity: {
      type: Number,
      required: true,
      min: 1,
    },
    currentAttendees: {
      type: Number,
      default: 0,
    },
    // Required blood types for the event
    bloodTypesNeeded: [
      {
        type: String,
        enum: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"],
      },
    ],
    eventDescription: {
      type: String,
      required: true,
    },
    eligibilityRequirements: [
      {
        type: String,
      },
    ],
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
    },
    // Attendees list with quick status
    attendees: [
      {
        donor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        registeredAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["registered", "attended", "cancelled"],
          default: "registered",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Database indexes to help query performances
// (organizer, event date, text search on title/location)
eventSchema.index({ organizer: 1, eventDate: -1 });
eventSchema.index({ eventDate: 1, status: 1 });
eventSchema.index({ location: "text", eventTitle: "text" });

// Virtual for checking if event is full
eventSchema.virtual("isFull").get(function () {
  return this.currentAttendees >= this.expectedCapacity;
});

// Method to update event status based on date
eventSchema.methods.updateStatus = function () {
  const now = new Date();
  const startOfEvent = new Date(this.eventDate);
  const endOfEvent = this.endDate
    ? new Date(this.endDate)
    : new Date(this.eventDate);

  if (this.status === "cancelled") {
    return this.status;
  }

  const parseTimePortion = (baseDate, raw) => {
    if (!raw) {
      return null;
    }

    const cleaned = raw.trim();
    if (!cleaned) {
      return null;
    }

    const parts = cleaned.split(/\s+/);
    if (parts.length < 2) {
      return null;
    }

    const timePart = parts[0];
    const modifier = parts[1].toUpperCase();

    const timeSegments = timePart.split(":");
    let hours = parseInt(timeSegments[0], 10);
    let minutes = timeSegments[1] ? parseInt(timeSegments[1], 10) : 0;

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return null;
    }

    if (modifier === "PM" && hours < 12) {
      hours += 12;
    }

    if (modifier === "AM" && hours === 12) {
      hours = 0;
    }

    const dateTime = new Date(baseDate);
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime;
  };

  let startDateTime = null;
  let endDateTime = null;

  if (typeof this.eventTime === "string" && this.eventTime.trim().length > 0) {
    const segments = this.eventTime.split("-").map((segment) => segment.trim());
    startDateTime = parseTimePortion(startOfEvent, segments[0]);
    endDateTime = parseTimePortion(endOfEvent, segments[1]);

    if (startDateTime && endDateTime && endDateTime <= startDateTime) {
      // Handle events that end after midnight
      endDateTime.setDate(endDateTime.getDate() + 1);
    }
  }

  if (startDateTime || endDateTime) {
    const effectiveStart = startDateTime || startOfEvent;
    let effectiveEnd = endDateTime;

    if (!effectiveEnd) {
      effectiveEnd = new Date(endOfEvent);
      effectiveEnd.setHours(23, 59, 59, 999);
    }

    if (now < effectiveStart) {
      this.status = "upcoming";
    } else if (now >= effectiveStart && now <= effectiveEnd) {
      this.status = "ongoing";
    } else {
      this.status = "completed";
    }

    return this.status;
  }

  // Fallback logic when we cannot parse time information
  const startDay = new Date(startOfEvent);
  startDay.setHours(0, 0, 0, 0);

  const endDay = new Date(endOfEvent);
  endDay.setHours(23, 59, 59, 999);

  if (now < startDay) {
    this.status = "upcoming";
  } else if (now > endDay) {
    this.status = "completed";
  } else {
    this.status = "ongoing";
  }

  return this.status;
};

// Pre-save middleware to update current attendees count
eventSchema.pre("save", function (next) {
  if (!this.endDate) {
    this.endDate = this.eventDate;
  }

  if (this.attendees) {
    this.currentAttendees = this.attendees.filter(
      (attendee) =>
        attendee.status === "registered" || attendee.status === "attended"
    ).length;
  }
  next();
});

module.exports = mongoose.model("Event", eventSchema);
