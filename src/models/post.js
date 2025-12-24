const mongoose = require('mongoose');


const postSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            required: true,
            maxlength: 280,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);