
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create storage engine for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'devconnect/posts', // Folder name in Cloudinary
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: [{ width: 1200, height: 1200, crop: 'limit' }], // Auto-resize
        quality: 'auto:good' // Auto-optimize quality
    }
});

// Configure multer with the storage engine
const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Check file type
        const allowedTypes = process.env.ALLOWED_FILE_TYPES.split(',');

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true); // Accept file
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
        }
    }
});

module.exports = upload;