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

module.exports = profileRouter;