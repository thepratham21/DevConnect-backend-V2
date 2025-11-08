require('dotenv').config(); //to use environment variables from .env file
const express = require('express');
const connectDB = require('./config/database');
const cors = require('cors');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');

//initializing express app
const app = express();

app.use(cors({
    origin: "http://localhost:5173", 
    credentials: true,

}


));
app.use(express.json()); //middleware that parses incoming JSON requests
app.use(cookieParser()); //middleware to parse cookies

//importing routes - auth, profile, request.
const authRouter = require('./routes/auth');
const profileRouter = require('./routes/profile');
const requestRouter = require('./routes/request');
const userRouter = require('./routes/user');

//using routes

app.use('/', authRouter);
app.use('/', profileRouter);
app.use('/', requestRouter);
app.use('/', userRouter);

//connecting to database

const PORT = process.env.PORT || 7000;

connectDB()
    .then(() => {
        console.log("Database connected successfully");
        app.listen(PORT, () => {
            console.log("Server is running on port 7000");

        })
    })
    .catch((err) => {
        console.log("Database connection failed");
    });
























