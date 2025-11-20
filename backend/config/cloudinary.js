/*
 * Cloudinary helper config
 * Validates env variables, configures cloudinary client, and provides upload/delete helpers.
 */
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
  process.env;

const missingEnvVars = [
  ["CLOUDINARY_CLOUD_NAME", CLOUDINARY_CLOUD_NAME],
  ["CLOUDINARY_API_KEY", CLOUDINARY_API_KEY],
  ["CLOUDINARY_API_SECRET", CLOUDINARY_API_SECRET],
].filter(([, value]) => !value);

if (missingEnvVars.length > 0) {
  const missingKeys = missingEnvVars.map(([key]) => key).join(", ");
  throw new Error(
    `Missing Cloudinary configuration. Please set: ${missingKeys}`
  );
}

// Configure the Cloudinary client
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

/*
 * uploadToCloudinary(buffer, folder)
 * Uploads an image buffer to Cloudinary under an optionally specified folder.
 */
const uploadToCloudinary = (buffer, folder = "blood-donation-app/profiles") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "auto",
        transformation: [
          { width: 500, height: 500, crop: "limit" },
          { quality: "auto" },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/*
 * deleteFromCloudinary(publicId)
 * Removes an image resource from Cloudinary by its public id.
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    throw error;
  }
};

module.exports = { cloudinary, uploadToCloudinary, deleteFromCloudinary };
