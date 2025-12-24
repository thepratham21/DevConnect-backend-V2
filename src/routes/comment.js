const express = require("express");
const Comment = require("../models/comment");
const { userAuth } = require('../middlewares/auth');

const commentRouter = express.Router();

// Create top-level comment
commentRouter.post("/createComment/:postId", userAuth, async (req, res) => {
    const { postId } = req.params;
    const userId = req.user._id;
    const { content } = req.body;

    try {
        const comment = await Comment.create({
            postId,
            userId,
            content,
            parentComment: null,
            isReply: false,
            depth: 0
        });

        // Populate user data
        const populatedComment = await Comment.findById(comment._id)
            .populate("userId", "firstName lastName email photoUrl");

        return res.status(201).json({
            success: true,
            comment: populatedComment,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to add comment",
        });
    }
});

// Create reply to a comment
commentRouter.post("/reply/:commentId", userAuth, async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;
    const { content } = req.body;

    try {
        // Find parent comment
        const parentComment = await Comment.findById(commentId);
        
        if (!parentComment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found",
            });
        }

        // Create reply
        const reply = await Comment.create({
            postId: parentComment.postId,
            userId,
            content,
            parentComment: commentId,
            isReply: true,
            depth: parentComment.depth + 1
        });

        // Populate user data
        const populatedReply = await Comment.findById(reply._id)
            .populate("userId", "firstName lastName email photoUrl")
            .populate({
                path: 'parentComment',
                select: '_id content',
                populate: {
                    path: 'userId',
                    select: 'firstName lastName'
                }
            });

        return res.status(201).json({
            success: true,
            comment: populatedReply,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to add reply",
        });
    }
});

// Get comments for a post (with nested replies)
commentRouter.get("/comments/:postId", userAuth, async (req, res) => {
    try {
        // Get all comments for this post
        const comments = await Comment.find({ postId: req.params.postId })
            .populate("userId", "firstName lastName email photoUrl")
            .populate({
                path: 'parentComment',
                select: '_id content',
                populate: {
                    path: 'userId',
                    select: 'firstName lastName'
                }
            })
            .sort({ createdAt: 1 });

        // Create a map for quick lookup
        const commentMap = {};
        const rootComments = [];

        // First pass: create map and identify root comments
        comments.forEach(comment => {
            // Convert to plain object
            const commentObj = comment.toObject();
            commentObj.replies = [];
            commentMap[comment._id] = commentObj;
            
            if (!comment.parentComment) {
                rootComments.push(commentMap[comment._id]);
            }
        });

        // Second pass: build nested structure
        comments.forEach(comment => {
            if (comment.parentComment) {
                const parentId = comment.parentComment._id ? comment.parentComment._id.toString() : comment.parentComment.toString();
                if (commentMap[parentId]) {
                    commentMap[parentId].replies.push(commentMap[comment._id]);
                }
            }
        });

        // Sort replies by creation date (oldest first)
        Object.keys(commentMap).forEach(commentId => {
            if (commentMap[commentId].replies.length > 0) {
                commentMap[commentId].replies.sort((a, b) => 
                    new Date(a.createdAt) - new Date(b.createdAt)
                );
            }
        });

        // Sort root comments by creation date (newest first)
        rootComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return res.json({
            success: true,
            comments: rootComments,
            allComments: comments // Keep flat for backward compatibility
        });
    } catch (error) {
        console.error("Error fetching comments:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch comments",
        });
    }
});

// Delete comment
commentRouter.delete("/delete/:commentId", userAuth, async (req, res) => {
    const { commentId } = req.params;

    try {
        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found",
            });
        }

        if (comment.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to delete this comment",
            });
        }

        // Also delete all replies to this comment
        await Comment.deleteMany({ parentComment: commentId });
        
        await comment.deleteOne();

        return res.json({
            success: true,
            message: "Comment deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete comment",
        });
    }
});

module.exports = commentRouter;