/*
 * Authentication related routes
 * - register, login are public
 * - getMe is protected and returns the current user
 */
const express = require("express");
const router = express.Router();
const { register, login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

// Register and login endpoints (public)
router.post("/register", register);
router.post("/login", login);

// Protected endpoint to retrieve current user
router.get("/me", protect, getMe);

module.exports = router;
