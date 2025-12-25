
const express = require('express');
const { userAuth } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { uploadLimiter } = require('../middlewares/rateLimiter');
const cloudinary = require('../utils/cloudinary');
const Post = require('../models/post');

const imageRouter = express.Router();

// Upload single image
imageRouter.post('posts/upload', 
    userAuth,
    uploadLimiter,
    upload.single('image'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No image file uploaded'
                });
            }

            // Extract image info from multer-cloudinary result
            const imageInfo = {
                url: req.file.path,
                publicId: req.file.filename,
                format: req.file.format,
                bytes: req.file.size,
                width: req.file.width,
                height: req.file.height
            };

            
            console.log('Image uploaded successfully by user:', req.user._id);

            res.json({
                success: true,
                message: 'Image uploaded successfully',
                image: imageInfo
            });

        } catch (error) {
            console.error('Image upload error:', error);
            
            
            if (error.message.includes('Only JPEG, PNG, GIF, and WebP')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
            
            if (error.message.includes('File too large')) {
                return res.status(400).json({
                    success: false,
                    message: 'File size exceeds 5MB limit'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Image upload failed. Please try again.'
            });
        }
    }
);

// Delete image
imageRouter.delete('/delete/:publicId', userAuth, async (req, res) => {
    try {
        const { publicId } = req.params;

        
        const postUsingImage = await Post.findOne({ 'images.publicId': publicId });
        if (postUsingImage) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete image that is being used in a post'
            });
        }

        // Delete from Cloudinary
        const result = await cloudinary.uploader.destroy(publicId);

        if (result.result === 'ok') {
            res.json({
                success: true,
                message: 'Image deleted successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Image not found in Cloudinary'
            });
        }
    } catch (error) {
        console.error('Delete image error:', error);
        
        if (error.message.includes('Invalid public_id')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid image ID'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to delete image from server'
        });
    }
});

module.exports = imageRouter;