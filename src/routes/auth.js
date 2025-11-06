const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const { validateSignUp } = require('../utils/validation');

const authRouter = express.Router();

authRouter.post('/signup', async (req, res) => {
    try {
        // validation for user data
        validateSignUp(req);

        // Extract data from req.body
        const { firstName, lastName, email, password } = req.body;

        // Encrypt password before saving to database
        const passwordHash = await bcrypt.hash(password, 10);

        // Create a new user
        const user = new User({
            firstName,
            lastName,
            email,
            password: passwordHash
        });

        // Save user
        await user.save();

        res.send("User signed up successfully");
    } catch (err) {

        return res.status(500).send("ERROR : " + err.message);
    }
});

authRouter.post('/login', async (req, res) => {
    try {
        // Extracted email and password from req.body
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email: email });
        if (!user) {
            throw new Error(" Invalid credentials !");
        }

        // Compare provided password with stored hashed password
        const isPasswordValid = await user.verifyPassword(password);
        if (isPasswordValid) {

            //create a jwt token using function defined in user model
            const token = await user.getJWT();

            //add that token in cookie and send response
            res.cookie("token", token, {
                expires: new Date(Date.now() + 8 * 3600000),

            });
            res.send(user);
        }

        else {
            throw new Error("Invalid Credentials !");
        }



    }
    catch (err) {
        res.status(500).send("Login failed - " + err.message);
    }

});

authRouter.post('/logout', async (req, res) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
    });
    res.send();
});


module.exports = authRouter;
