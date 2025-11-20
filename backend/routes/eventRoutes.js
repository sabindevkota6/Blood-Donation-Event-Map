/*
 * Event-related routes
 * Includes endpoints for both organizers (CRUD) and donors (register/cancel)
 */
const express = require("express");
const router = express.Router();
const {
  createEvent,
  getAllEvents,
  getMyEvents,
  getEvent,
  updateEvent,
  cancelEvent,
  deleteEvent,
  checkEligibility,
  registerForEvent,
  cancelRegistration,
  getDashboardStats,
} = require("../controllers/eventController");
const { protect } = require("../middleware/auth");

// Public endpoints
router.get("/dashboard/stats", getDashboardStats);
router.get("/", getAllEvents);
router.get("/:id", getEvent);

// Organizer-only endpoints (require auth)
router.post("/", protect, createEvent);
router.get("/organizer/my-events", protect, getMyEvents);
router.put("/:id", protect, updateEvent);
router.post("/:id/cancel", protect, cancelEvent);
router.delete("/:id", protect, deleteEvent);

// Donor-specific endpoints (require auth)
router.post("/:id/check-eligibility", protect, checkEligibility);
router.post("/:id/register", protect, registerForEvent);
router.post("/:id/cancel-registration", protect, cancelRegistration);

module.exports = router;
