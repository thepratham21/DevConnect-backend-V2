const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 1000
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    isReply: {
        type: Boolean,
        default: false
    },
    depth: {
        type: Number,
        default: 0,
        min: 0,
        max: 5 // Limit nesting depth to prevent infinite loops
    }
}, {
    timestamps: true
});

// Indexes for better performance
commentSchema.index({ postId: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ userId: 1 });

// Prevent circular references
commentSchema.pre('save', function(next) {
    if (this.parentComment && this.parentComment.equals(this._id)) {
        return next(new Error('A comment cannot be a parent of itself'));
    }
    
    // Limit depth to prevent too deep nesting
    if (this.depth > 5) {
        return next(new Error('Maximum comment nesting depth exceeded'));
    }
    
    next();
});

module.exports = mongoose.model('Comment', commentSchema);