// backend/routes/like.js - UPDATED
const express = require("express");
const Like = require("../models/like");
const Post = require("../models/post");
const { userAuth } = require('../middlewares/auth');

const likeRouter = express.Router();

likeRouter.post("/likes/:postId", userAuth, async (req, res) => {
    const { postId } = req.params;
    const userId = req.user._id;

    try {
        // Check if post exists
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found",
            });
        }

        const existingLike = await Like.findOne({ postId, userId });

        if (existingLike) {
            // Unlike: Remove like and decrement counter
            await existingLike.deleteOne();
            await Post.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } });

            return res.json({
                success: true,
                liked: false,
                message: "Post unliked",
                likesCount: post.likesCount - 1
            });
        }

        // Like: Add like and increment counter
        await Like.create({ postId, userId });
        await Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } });

        return res.json({
            success: true,
            liked: true,
            message: "Post liked",
            likesCount: post.likesCount + 1
        });
    } catch (error) {
        console.error("Like error:", error);
        return res.status(500).json({
            success: false,
            message: "Like action failed",
        });
    }
});

module.exports = likeRouter;