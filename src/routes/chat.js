const express = require("express");
const { userAuth } = require("../middlewares/auth");
const { Chat } = require("../models/chat");
const mongoose = require("mongoose");

const chatRouter = express.Router();

chatRouter.get("/chat/:targetUserId", userAuth, async (req, res) => {
    const { targetUserId } = req.params;
    const userId = req.user._id;

    // Validate targetUserId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
        return res.status(400).json({
            success: false,
            error: "Invalid user ID format"
        });
    }

    try {
        // Convert to ObjectId for query
        const targetUserObjectId = new mongoose.Types.ObjectId(targetUserId);
        const currentUserObjectId = new mongoose.Types.ObjectId(userId);

        // Find or create chat with populated data
        let chat = await Chat.findOne({
            participants: { $all: [currentUserObjectId, targetUserObjectId] },
        })
        .populate({
            path: "messages.senderId",
            select: "firstName lastName _id",
        })
        .populate({
            path: "participants",
            select: "firstName lastName _id email profilePicture",
        });

        if (!chat) {
            // Create a new chat
            chat = new Chat({
                participants: [currentUserObjectId, targetUserObjectId],
                messages: [],
            });
            
            await chat.save();
            
            // Fetch the newly created chat with populated participants
            chat = await Chat.findById(chat._id)
                .populate({
                    path: "participants",
                    select: "firstName lastName _id email profilePicture",
                });
        }

        // Find the other user (the one we're chatting with)
        const otherUser = chat.participants.find(
            participant => participant._id.toString() !== userId.toString()
        );

        // Transform the response for easier frontend consumption
        const response = {
            success: true,
            chatId: chat._id,
            participants: chat.participants,
            messages: chat.messages || [],
            otherUser: otherUser || null,
            currentUser: chat.participants.find(
                participant => participant._id.toString() === userId.toString()
            )
        };

        res.json(response);
    } catch (err) {
        console.error("Chat fetch error:", err);
        res.status(500).json({ 
            success: false, 
            error: "Server error while fetching chat",
            message: err.message 
        });
    }
});

// Add this endpoint to get all chats for the current user
chatRouter.get("/chats", userAuth, async (req, res) => {
    const userId = req.user._id;

    try {
        // Find all chats where the user is a participant
        const chats = await Chat.find({
            participants: userId
        })
        .populate({
            path: "participants",
            select: "firstName lastName email _id profilePicture"
        })
        .populate({
            path: "messages.senderId",
            select: "firstName lastName _id"
        })
        .sort({ updatedAt: -1 }) // Sort by latest activity
        .lean();

        // Transform the data to get the other user's info and last message
        const formattedChats = chats.map(chat => {
            // Find the other participant (not the current user)
            const otherParticipant = chat.participants.find(
                participant => participant._id.toString() !== userId.toString()
            );
            
            // Get the last message
            const lastMessage = chat.messages.length > 0 
                ? chat.messages[chat.messages.length - 1]
                : null;

            return {
                chatId: chat._id,
                otherUser: otherParticipant || null,
                lastMessage: lastMessage ? {
                    text: lastMessage.text,
                    senderId: lastMessage.senderId?._id,
                    senderName: lastMessage.senderId?.firstName,
                    timestamp: lastMessage.createdAt || chat.updatedAt
                } : null,
                unreadCount: 0, // You can implement unread count later
                updatedAt: chat.updatedAt,
                messageCount: chat.messages.length
            };
        });

        res.json({
            success: true,
            chats: formattedChats
        });
    } catch (err) {
        console.error("Error fetching chats:", err);
        res.status(500).json({ 
            success: false, 
            error: "Server error while fetching chats" 
        });
    }
});

module.exports = chatRouter;