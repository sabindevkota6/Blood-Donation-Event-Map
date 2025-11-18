const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
} = require("../controllers/profileController");
const { protect } = require("../middleware/auth");

// All routes are protected
router.use(protect);

// Profile routes
router.get("/", getProfile);
router.put("/", updateProfile);
router.post(
  "/upload-picture",
  upload.single("profilePicture"),
  uploadProfilePicture
);
router.delete("/delete-picture", deleteProfilePicture);

module.exports = router;
