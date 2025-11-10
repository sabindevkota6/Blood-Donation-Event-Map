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
  registerForEvent,
  cancelRegistration,
  getDashboardStats,
} = require("../controllers/eventController");
const { protect } = require("../middleware/auth");

// Public routes
router.get("/dashboard/stats", getDashboardStats);
router.get("/", getAllEvents);
router.get("/:id", getEvent);

// Protected routes - Organizers
router.post("/", protect, createEvent);
router.get("/organizer/my-events", protect, getMyEvents);
router.put("/:id", protect, updateEvent);
router.post("/:id/cancel", protect, cancelEvent);
router.delete("/:id", protect, deleteEvent);

// Protected routes - Donors
router.post("/:id/register", protect, registerForEvent);
router.post("/:id/cancel-registration", protect, cancelRegistration);

module.exports = router;
