const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
} = require("../controllers/profileController");
const { protect } = require("../middleware/auth");

// Configure multer for file upload
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Not an image! Please upload an image."), false);
    }
  },
});

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
