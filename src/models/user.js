const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        minLength: 2,
        maxLength: 30

    },

    lastName: {
        type: String
    },

    email: {
        type: String,
        lowercase: true,
        required: true,
        unique: true,
        trim: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Invalid credentials !");
            }
        }

    },

    age: {
        type: Number,
        required: false,
    },

    password: {
        type: String,
        required: true,
        validate(value) {
            if (!validator.isStrongPassword(value)) {
                throw new Error("Enter strong password !");
            }
        }
    },

    gender: {
        type: String,
        //custom validator
        validate(value) {
            if (!['male', 'female', 'other'].includes(value)) {
                throw new Error("Gender data is not valid");
            }
        }
    },

    photoUrl: {
        type: String,
        default: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.vecteezy.com%2Ffree-vector%2Fdefault-profile-picture&psig=AOvVaw2em66hLnw6OVUR6jo-FIYA&ust=1759985628134000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCKiAj8bnk5ADFQAAAAAdAAAAABAE',
        validate(value) {
            if (!validator.isURL(value)) {
                throw new Error("Invalid : " + value);
            }
        }

    },

    about: {
        type: String,
        required: false,
    },

    skills: {
        type: [String],
        default: [],
    }



}, { timestamps: true })

userSchema.methods.getJWT = async function () {
    const user = this;

    const token = await jwt.sign({ _id: user._id }, "AmrendraBahubali@777" , { expiresIn: '1d' });

    return token;
}

userSchema.methods.verifyPassword = async function (password) {
    const user = this;

    const isPasswordValid = await bcrypt.compare(password, user.password);

    return isPasswordValid;
}

const User = mongoose.model('User', userSchema);

module.exports = User;