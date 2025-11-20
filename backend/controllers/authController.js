const User = require("../models/User");
const jwt = require("jsonwebtoken");

/*
 * Helper: generateToken
 * Returns a signed JWT for a user ID with expiration taken from env variables.
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

/*
 * Register a new user
 * Route: POST /api/auth/register
 * Access: Public
 */
const register = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    // Basic payload validation
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ message: "Please provide all fields" });
    }

    // Ensure email is unique
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    // Validate role value accepted by the app
    if (!["donor", "organizer"].includes(role)) {
      return res
        .status(400)
        .json({ message: "Invalid role. Choose donor or organizer" });
    }

    // Create the user document
    const user = await User.create({
      fullName,
      email,
      password,
      role,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/*
 * Login (authenticate) user
 * Route: POST /api/auth/login
 * Access: Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate credentials presence
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    // Look up user and include password for validation
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify password - compare hashed versions
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Verify account is active
    if (!user.isActive) {
      return res
        .status(401)
        .json({ message: "Your account has been deactivated" });
    }

    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/*
 * Get current user profile
 * Route: GET /api/auth/me
 * Access: Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/* Expose public controller handlers */
module.exports = {
  register,
  login,
  getMe,
};
