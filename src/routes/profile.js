const express = require('express');
const { userAuth } = require('../middlewares/auth');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const validator = require('validator');
const { validateEditProfileData } = require('../utils/validation');

const profileRouter = express.Router();

profileRouter.get('/profile/view', userAuth, async (req, res) => {

    try {

        //get user from req object    
        const user = req.user;

        //send user profile data as response
        res.send(user);
    }
    catch (err) {
        res.status(500).send("Error : " + err.message);
    }


});

profileRouter.patch('/profile/edit', userAuth, async (req,res) => {
    try{
        if(!validateEditProfileData){
            throw new Error("Invalid edit request !");
        }

        const loggedInUser = req.user;

        Object.keys(req.body).forEach(function(key) {
            loggedInUser[key] = req.body[key];
        });

        loggedInUser.save();

        res.json({message : "Profile updated successfully",
            data : loggedInUser
        })
    }
    catch(err){
        res.status(400).send("Error : " + err.message);
    }
});

profileRouter.put('/profile/password', userAuth, async (req,res) => {
    try{
        const {oldPassword, newPassword} = req.body;
        if(!oldPassword || !newPassword){
            throw new Error("Missing required fields !");
        }

        const loggedInUser = req.user;
        const isPasswordValid = await loggedInUser.verifyPassword(oldPassword);
        if(!isPasswordValid){
            throw new Error("Invalid old password !");
        }

        const newHashedPassword = await bcrypt.hash(newPassword,10);
        loggedInUser.password = newHashedPassword;
        await loggedInUser.save();

        res.send("Password updated successfully !");

    }
    catch(err){
        res.status(400).send("Error : " + err.message);
    }
})

// Add this endpoint to profile.js for public profile viewing:

profileRouter.get('/profile/view/:userId', userAuth, async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Find user by ID
        const user = await User.findById(userId)
            .select('firstName lastName email photoUrl age gender about skills title location github linkedin website');
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }

        // Return user profile (public info only)
        res.json({
            success: true,
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                photoUrl: user.photoUrl,
                age: user.age,
                gender: user.gender,
                about: user.about,
                skills: user.skills || [],
                
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Error: " + err.message
        });
    } 
});

module.exports = profileRouter;