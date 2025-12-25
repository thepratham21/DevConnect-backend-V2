
const express = require("express");
const Comment = require("../models/comment");
const Post = require("../models/post"); 
const { userAuth } = require('../middlewares/auth');

const commentRouter = express.Router();


commentRouter.post("/createComment/:postId", userAuth, async (req, res) => {
    const { postId } = req.params;
    const userId = req.user._id;
    const { content } = req.body;

    try {
        
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        
        const comment = await Comment.create({
            postId,
            userId,
            content,
            parentComment: null,
            isReply: false,
            depth: 0
        });

        
        await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

        
        const updatedPost = await Post.findById(postId);
        
        
        const populatedComment = await Comment.findById(comment._id)
            .populate("userId", "firstName lastName email photoUrl");

        return res.status(201).json({
            success: true,
            comment: populatedComment,
            commentsCount: updatedPost.commentsCount
        });
    } catch (error) {
        console.error("Create comment error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to add comment",
        });
    }
});


commentRouter.post("/reply/:commentId", userAuth, async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;
    const { content } = req.body;

    try {
        
        const parentComment = await Comment.findById(commentId);
        
        if (!parentComment) {
            return res.status(404).json({
                success: false,
                message: "Comment not found",
            });
        }

        
        await Post.findByIdAndUpdate(parentComment.postId, { $inc: { commentsCount: 1 } });

        
        const reply = await Comment.create({
            postId: parentComment.postId,
            userId,
            content,
            parentComment: commentId,
            isReply: true,
            depth: parentComment.depth + 1
        });

        
        const updatedPost = await Post.findById(parentComment.postId);
        

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
            commentsCount: updatedPost.commentsCount
        });
    } catch (error) {
        console.error("Reply error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to add reply",
        });
    }
});


commentRouter.get("/comments/:postId", userAuth, async (req, res) => {
    try {
        
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

        
        const commentMap = {};
        const rootComments = [];

        
        comments.forEach(comment => {
            
            const commentObj = comment.toObject();
            commentObj.replies = [];
            commentMap[comment._id] = commentObj;
            
            if (!comment.parentComment) {
                rootComments.push(commentMap[comment._id]);
            }
        });
        
        comments.forEach(comment => {
            if (comment.parentComment) {
                const parentId = comment.parentComment._id ? comment.parentComment._id.toString() : comment.parentComment.toString();
                if (commentMap[parentId]) {
                    commentMap[parentId].replies.push(commentMap[comment._id]);
                }
            }
        });

        // Sort replies by creation date
        Object.keys(commentMap).forEach(commentId => {
            if (commentMap[commentId].replies.length > 0) {
                commentMap[commentId].replies.sort((a, b) => 
                    new Date(a.createdAt) - new Date(b.createdAt)
                );
            }
        });

        // Sort root comments by creation date
        rootComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return res.json({
            success: true,
            comments: rootComments,
            allComments: comments 
        });
    } catch (error) {
        console.error("Error fetching comments:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch comments",
        });
    }
});


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

        
        await Post.findByIdAndUpdate(comment.postId, { $inc: { commentsCount: -1 } });
        await Comment.deleteMany({ parentComment: commentId });
        await comment.deleteOne();

        return res.json({
            success: true,
            message: "Comment deleted successfully",
        });
    } catch (error) {
        console.error("Delete comment error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete comment",
        });
    }
});

module.exports = commentRouter;