import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
    api_key: process.env.CLOUDINARY_API_KEY || '12345',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'secret'
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'skillswap_avatars',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
    }
});

export const upload = multer({ storage });
export { cloudinary };
