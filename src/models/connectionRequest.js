const mongoose = require('mongoose');

const connectionRequestSchema = new mongoose.Schema({
    fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true,

    },

    toUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true,
    },

    status: {
        type: String,
        required: true,
        enum: {
            values: ['ignored', 'interested', 'accepted', 'rejected',],
            message: '{VALUE} is not supported'

        },

    }
},{
    timestamps: true,
});


//compound index 
connectionRequestSchema.index({fromUserId: 1, toUserId: 1});


//Prevent users from sending connection requests to themselves

connectionRequestSchema.pre('save', function (next){
    const connectionRequest = this;
    if(this.fromUserId.toString() === this.toUserId.toString()){
        throw new Error("You cannot send request to yourself !");
    }
    next();
})

const ConnectionRequest = mongoose.model('ConnectionRequest', connectionRequestSchema);

module.exports = ConnectionRequest;