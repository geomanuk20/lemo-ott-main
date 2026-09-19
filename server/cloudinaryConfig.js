const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video/') || file.originalname.match(/\.(mp4|mkv|webm|avi|mov)$/i);
    return {
      folder: 'video_ott_uploads',
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: isVideo 
        ? ['mp4', 'mkv', 'webm', 'avi', 'mov'] 
        : ['jpg', 'png', 'jpeg', 'webp', 'gif']
    };
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024, // 10 GB max upload file size
    fieldSize: 100 * 1024 * 1024
  }
});

module.exports = { cloudinary, upload };
