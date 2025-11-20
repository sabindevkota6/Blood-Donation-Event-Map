/*
 * Multer upload config
 * Uses memory storage and restricts files to images under 5MB.
 */
const multer = require("multer");

// Store uploaded files in memory (buffer) for immediate processing (e.g., Cloudinary upload)
const storage = multer.memoryStorage();

// Accept only image MIME types
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Export a configured multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

module.exports = upload;
