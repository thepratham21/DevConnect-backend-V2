
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
            required: false,
            maxlength: 1000,
            trim: true,
        },
        
        
        images: [{
            url: { type: String, required: true },
            publicId: { type: String, required: true },
            caption: { type: String, default: '', maxlength: 200 },
            width: Number,
            height: Number,
            format: String,
            bytes: Number
        }],

        
        
        // COUNTERS - For performance
        likesCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        
        commentsCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        
        isEdited: {
            type: Boolean,
            default: false,
        }
    },
    { 
        timestamps: true 
    }
);

// Indexes
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ likesCount: -1 }); 
postSchema.index({ commentsCount: -1 }); 

module.exports = mongoose.model('Post', postSchema);