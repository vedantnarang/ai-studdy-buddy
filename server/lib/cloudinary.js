import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a buffer to Cloudinary.
 * @param {Buffer} buffer - The file buffer
 * @param {string} fileName - Original file name (used for public_id)
 * @returns {Promise<{url: string, publicId: string}>}
 */
export async function uploadToCloudinary(buffer, fileName) {
  // Convert buffer to base64 data URI
  const base64 = buffer.toString('base64');
  const dataUri = `data:image/auto;base64,${base64}`;

  // Strip extension for public_id
  const baseName = fileName.replace(/\.[^/.]+$/, '');

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'study-buddy/images',
    public_id: `${baseName}_${Date.now()}`,
    resource_type: 'image',
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

/**
 * Delete an image from Cloudinary by public ID.
 * @param {string} publicId
 */
export async function deleteFromCloudinary(publicId) {
  await cloudinary.uploader.destroy(publicId);
}

export default cloudinary;
