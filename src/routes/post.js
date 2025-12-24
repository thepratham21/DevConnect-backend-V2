const express = require('express');
const Post = require("../models/post.js");
const Like = require("../models/like");
const Comment = require("../models/comment");

const { userAuth } = require('../middlewares/auth');

const postRouter = express.Router();


postRouter.post("/posts/createPost", userAuth, async (req, res) => {
    try {
        const newPost = await Post.create({
            author: req.user._id,
            content: req.body.content,
        });

        return res.status(201).json({
            success: true,
            post: newPost,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to create post",
        });
    }
});


postRouter.get("/posts", userAuth, async (req, res) => {
    try {
        const posts = await Post.find()
            .populate("author", "firstName lastName email")
            .sort({ createdAt: -1 });

        return res.json({
            success: true,
            posts,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch feed",
        });
    }
});



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

        
        await Like.deleteMany({ postId });
        await Comment.deleteMany({ postId });

        
        await post.deleteOne();

        return res.json({
            success: true,
            message: "Post deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete post",
        });
    }
});


module.exports = postRouter;