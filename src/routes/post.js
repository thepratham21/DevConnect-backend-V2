
const express = require('express');
const Post = require("../models/post.js");
const Like = require("../models/like");
const Comment = require("../models/comment");
const { userAuth } = require('../middlewares/auth');
const multer = require('multer');
const cloudinary = require('../utils/cloudinary');
const sharp = require('sharp');

const postRouter = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 4 // Max 4 files
    },
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const mimetype = filetypes.test(file.mimetype);
        
        if (mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'));
    }
});


const compressImage = async (buffer, mimetype) => {
    try {
        let sharpInstance = sharp(buffer);
        
        
        const metadata = await sharpInstance.metadata();
        
        // Determine output format based on input
        const isTransparent = mimetype.includes('png') || mimetype.includes('gif');
        const outputFormat = isTransparent ? 'png' : 'jpeg';
        
        // Resize if image is too large
        if (metadata.width > 2000 || metadata.height > 2000) {
            sharpInstance = sharpInstance.resize({
                width: 1200,
                height: 1200,
                fit: 'inside',
                withoutEnlargement: true
            });
        }
        
        // Compress with settings
        if (outputFormat === 'jpeg') {
            sharpInstance = sharpInstance.jpeg({ 
                quality: 80,
                mozjpeg: true
            });
        } else {
            sharpInstance = sharpInstance.png({ 
                quality: 80,
                compressionLevel: 6
            });
        }
        
        // Convert to buffer
        const compressedBuffer = await sharpInstance.toBuffer();
        
        // If compression made it larger, use original 
        if (compressedBuffer.length > buffer.length) {
            return {
                buffer: buffer,
                mimetype: mimetype,
                format: mimetype.split('/')[1],
                size: buffer.length
            };
        }
        
        return {
            buffer: compressedBuffer,
            mimetype: `image/${outputFormat}`,
            format: outputFormat,
            size: compressedBuffer.length
        };
    } catch (error) {
        console.error('Image compression error:', error);
        throw new Error('Failed to compress image');
    }
};

// Create post with text and images
postRouter.post("/posts/createPost", 
    userAuth, 
    upload.array('images', 4),
    async (req, res) => {
        try {
            const { content } = req.body;

            if (!content && (!req.files || req.files.length === 0)) {
                return res.status(400).json({
                    success: false,
                    message: 'Post must contain either text or images'
                });
            }

            let imageArray = [];
            let uploadErrors = [];
            
            if (req.files && req.files.length > 0) {
                for (let i = 0; i < req.files.length; i++) {
                    const file = req.files[i];
                    
                    try {
                        // Compress image before upload
                        const compressedImage = await compressImage(file.buffer, file.mimetype);
                        
                        // Convert buffer to base64 string for Cloudinary
                        const b64 = compressedImage.buffer.toString('base64');
                        const dataURI = `data:${compressedImage.mimetype};base64,${b64}`;
                        
                        // Upload to Cloudinary with timeout
                        const result = await Promise.race([
                            cloudinary.uploader.upload(dataURI, {
                                folder: "devconnect/posts",
                                resource_type: "image",
                                timeout: 30000
                            }),
                            new Promise((_, reject) => 
                                setTimeout(() => reject(new Error('Upload timeout')), 30000)
                            )
                        ]);

                        imageArray.push({
                            url: result.secure_url,
                            publicId: result.public_id,
                            width: result.width,
                            height: result.height,
                            format: result.format,
                            bytes: result.bytes
                        });
                        
                    } catch (uploadError) {
                        console.error(`Upload error for image ${i + 1}:`, uploadError.message);
                        uploadErrors.push({
                            imageIndex: i + 1,
                            error: uploadError.message
                        });
                        // Continue with next image
                    }
                }
                
                // If ALL images failed to upload but we have content, continue with post
                if (imageArray.length === 0 && content && content.trim()) {
                    // Continue with text-only post
                }
                // If no images AND no content, return error
                else if (imageArray.length === 0 && (!content || !content.trim())) {
                    return res.status(400).json({
                        success: false,
                        message: 'Failed to upload images and no text content provided'
                    });
                }
            }

            // Create new post
            const newPost = new Post({
                author: req.user._id,
                content: content || '',
                images: imageArray
            });

            await newPost.save();
            await newPost.populate("author", "firstName lastName email photoUrl");

            const response = {
                success: true,
                post: newPost,
                message: `Post created successfully${imageArray.length > 0 ? ` with ${imageArray.length} image(s)` : ''}`
            };

            
            if (uploadErrors.length > 0) {
                response.warning = `${uploadErrors.length} image(s) failed to upload`;
            }

            return res.status(201).json(response);
            
        } catch (error) {
            console.error('Create post error:', error);
            
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File size too large. Maximum 10MB per image'
                });
            }
            
            if (error.message === 'Only image files are allowed (JPEG, PNG, GIF, WebP)') {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(err => err.message);
                return res.status(400).json({
                    success: false,
                    message: messages.join(', ')
                });
            }
            
            return res.status(500).json({
                success: false,
                message: "Failed to create post"
            });
        }
    }
);

// Get all posts
postRouter.get("/posts", userAuth, async (req, res) => {
    try {
        const posts = await Post.find()
            .populate("author", "firstName lastName email photoUrl")
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            posts,
        });
    } catch (error) {
        console.error('Fetch posts error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch feed",
        });
    }
});

// Get post feed
postRouter.get("/posts/feed", userAuth, async (req, res) => {
    try {
        const posts = await Post.find()
            .populate("author", "firstName lastName email photoUrl")
            .sort({ createdAt: -1 })
            .limit(50);

        return res.json({
            success: true,
            posts,
        });
    } catch (error) {
        console.error('Fetch feed error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch feed",
        });
    }
});

// Get single post by ID
postRouter.get("/posts/:postId", userAuth, async (req, res) => {
    const { postId } = req.params;

    try {
        const post = await Post.findById(postId)
            .populate("author", "firstName lastName email photoUrl");

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }

        return res.json({
            success: true,
            post,
        });
    } catch (error) {
        console.error('Fetch single post error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch post",
        });
    }
});

// Delete post
postRouter.delete("/posts/delete/:postId", userAuth, async (req, res) => {
    const { postId } = req.params;

    try {
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }

        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to delete this post",
            });
        }

        // Delete images from Cloudinary if post has images
        if (post.images && post.images.length > 0) {
            try {
                for (const image of post.images) {
                    if (image.publicId) {
                        await cloudinary.uploader.destroy(image.publicId);
                    }
                }
            } catch (cloudinaryError) {
                console.error('Failed to delete images from Cloudinary:', cloudinaryError);
                
            }
        }

        // Delete associated likes and comments
        await Like.deleteMany({ postId });
        await Comment.deleteMany({ postId });
        await post.deleteOne();

        return res.json({
            success: true,
            message: "Post deleted successfully",
        });
    } catch (error) {
        console.error('Delete post error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete post",
        });
    }
});

module.exports = postRouter;