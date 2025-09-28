import { v2 as cloudinary } from 'cloudinary';

console.log(
  "Cloudinary env:",
  process.env.CLOUDINARY_CLOUD_NAME,
  process.env.CLOUDINARY_API_KEY ? "loaded" : "MISSING",
  process.env.CLOUDINARY_API_SECRET ? "loaded" : "MISSING"
);

export const CloudinaryConfig = {
  provide: 'CLOUDINARY',
  useFactory: () => {
    return cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  },
};