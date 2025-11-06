const express = require('express');
const { userAuth } = require('../middlewares/auth');
const ConnectionRequest = require('../models/connectionRequest');
const User = require('../models/user');



const userRouter = express.Router();






//get all the pending connection requests for the loggendIn user
userRouter.get('/user/requests/received', userAuth, async (req, res) => {
    try {
        const loggedInUser = req.user;

        const connectionsRequests = await ConnectionRequest.find({
            toUserId: loggedInUser._id,
            status: 'interested'
        }).populate('fromUserId', ['firstName', 'lastName', 'photoUrl', 'skills', 'about']);

        res.json({
            message: "Connection requests fetched successfully",
            data: connectionsRequests,
        });
    } catch (err) {
        res.status(400).send("Error :" + err.message);
    }
});

userRouter.get('/user/connections', userAuth, async (req, res) => {
    try {
        const loggedInUser = req.user;

        const connectionsRequests = await ConnectionRequest.find({
            $or: [
                { toUserId: loggedInUser._id, status: 'accepted' },
                { fromUserId: loggedInUser._id, status: 'accepted' }
            ],
        }).populate('fromUserId toUserId', ['firstName', 'lastName', 'photoUrl', 'skills', 'about']);

        const data = connectionsRequests.map((row) => {
            if (row.fromUserId._id.toString() === loggedInUser._id.toString()) {
                return row.toUserId;
            } else {
                return row.fromUserId;
            }
        })

        res.json({

            data
        })
    } catch (err) {
        res.status(400).send("Error :" + err.message);
    }
});

userRouter.get('/feed', userAuth, async (req, res) => {
    try {

        const loggedInUser = req.user;

        const page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;
        limit = limit > 50 ? 50 : limit;

        const skip = (page - 1) * limit;

        //find all the requests ( sent + received )
        const connectionRequests = await ConnectionRequest.find({
            $or: [
                { fromUserId: loggedInUser._id },
                { toUserId: loggedInUser._id },
            ]
        }).select("fromUserId toUserId");

        //added the users from user's connections to set because we don't want to see them in feed
        const hideUsersFromFeed = new Set();
        connectionRequests.forEach(req => {
            hideUsersFromFeed.add(req.fromUserId.toString());
            hideUsersFromFeed.add(req.toUserId.toString());
        });

        //doing DB call to get users who are not present in set and _id != loggedIn._id
        const feedUsers = await User.find({
            $and: [
                { _id: { $nin: Array.from(hideUsersFromFeed) } },
                { _id: { $ne: loggedInUser._id } },
            ],
        }).select(['firstName', 'lastName', 'photoUrl', 'skills', 'about', 'gender', 'age']).skip(skip).limit(limit);

        res.json({ data: feedUsers, });
    } catch (err) {
        res.status(400).json({
            message: "Error : "
        })
    }
})

module.exports = userRouter;