const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/*
 * User model schema definition
 * Includes donor-specific fields such as donation counts and registration history
 */
const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Please provide your full name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["donor", "organizer"],
      required: [true, "Please select a role"],
      default: "donor",
    },
    bloodType: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    phone: {
      type: String,
    },
    location: {
      address: {
        type: String,
      },
      coordinates: {
        lat: {
          type: Number,
        },
        lng: {
          type: Number,
        },
      },
    },
    profilePicture: {
      url: {
        type: String,
      },
      publicId: {
        type: String,
      },
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    // Donation-specific fields (for donors only)
    totalDonations: {
      type: Number,
      default: 0,
    },
    lastDonationDate: {
      type: Date,
    },
    registeredEvents: [
      {
        eventId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Event",
        },
        registeredAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    donorEligibility: {
      type: String,
      enum: ["eligible", "not-eligible", "not-recorded"],
      default: "not-recorded",
    },
    // Organizer-specific fields (for organizers only)
    organization: {
      type: String,
    },
    memberSince: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Password hashing middleware
 * Hashes the password before saving when it has been changed.
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/*
 * Instance method: comparePassword
 * Compares a plain password with the stored hashed password.
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
