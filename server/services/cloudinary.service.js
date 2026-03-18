import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with your credentials from .env.local
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(buffer) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'study-buddy-notes' },
      (error, result) => {
        if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        } else {
          reject(error);
        }
      }
    );

    uploadStream.end(buffer);
  });
}