const express = require('express');
const User = require('../models/user');

const { userAuth } = require('../middlewares/auth');
const ConnectionRequest = require('../models/connectionRequest');

const requestRouter = express.Router();

requestRouter.post('/request/send/:status/:toUserId', userAuth, async (req, res) => {

    try {

        const fromUserId = req.user._id;
        const toUserId = req.params.toUserId;
        const status = req.params.status;

        const allowedStatuses = ['interested', 'ignored'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value" + status });
        }

        //Check if the toUserId exists
        const toUser = await User.findById(toUserId);
        if (!toUser) {
            res.status(404).json({ message: "User not found" });
        }

        //If there is an existing pending request from the same user, prevent sending another request
        const existingRequest = await ConnectionRequest.findOne({
            $or: [
                { fromUserId, toUserId },
                { fromUserId: toUserId, toUserId: fromUserId },
            ],
        });

        if (existingRequest) {
            return res.status(400).json({ message: "Connection request already exists !" });
        }




        const connectionRequest = new ConnectionRequest({
            fromUserId,
            toUserId,
            status,
        });

        const data = await connectionRequest.save();

        res.json({
            message: req.user.firstName + " is " + status + " in " + toUser.firstName,
            data: data
        })

    }
    catch (err) {
        res.status(400).send("Error :" + err.message);
    }


});

requestRouter.post('/request/review/:status/:requestId', userAuth, async (req, res) => {

    try {
        const loggedInUser = req.user;

        
        const status = req.params.status;
        const requestId = req.params.requestId;

        //Only 'accepted' or 'rejected' are allowed
        const allowedStatuses = ['accepted', 'rejected'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value" + status });
        }

        //Find the connection request by ID and ensure it is directed to the logged-in user and is in 'interested' status
        const connectionRequest = await ConnectionRequest.findOne({
            _id: requestId,
            toUserId: loggedInUser._id,
            status: 'interested'

        });

        if (!connectionRequest) {
            return res.status(404).json({ message: "Request not found" });
        }
        
        //Update the status of the connection request
        connectionRequest.status = status;

        const data = await connectionRequest.save();

        res.json({
            message: "Request " + status + " successfully",
            data: data
        });




    } catch (err) {
        res.status(400).send("Error :" + err.message);
    }

})

module.exports = requestRouter;
