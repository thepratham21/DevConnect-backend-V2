const express = require("express");
const Like = require("../models/like");

const { userAuth } = require('../middlewares/auth');



const likeRouter = express.Router();

/**
 * TOGGLE LIKE / UNLIKE
 */
likeRouter.post("/likes/:postId", userAuth, async (req, res) => {
    const { postId } = req.params;
    const userId = req.user._id;

    try {
        const existingLike = await Like.findOne({ postId, userId });

        if (existingLike) {
            await existingLike.deleteOne();

            return res.json({
                success: true,
                liked: false,
                message: "Post unliked",
            });
        }

        await Like.create({ postId, userId });

        return res.json({
            success: true,
            liked: true,
            message: "Post liked",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Like action failed",
        });
    }
});

module.exports = likeRouter;
