const express = require('express');
const { userAuth } = require('../middlewares/auth');
const chatRouter = express.Router();
const User = require('../models/user');


chatRouter.get("/user/:id", userAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("firstName lastName");

        res.json({
            fullName: `${user.firstName} ${user.lastName}`
        });

    } catch (err) {
        res.status(500).json({ error: "Failed to fetch user" });
    }
});

module.exports = chatRouter;
