const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a buffer directly to Cloudinary using upload_stream.
 *
 * @param {Buffer} buffer - Image buffer from multer.memoryStorage()
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'nexo/profile',
        transformation: [
          {
            width: 500,
            height: 500,
            crop: 'fill',
            gravity: 'face',
            quality: 'auto',
            fetch_format: 'webp'
          }
        ]
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

module.exports = {
  cloudinary,
  uploadToCloudinary
};