// socket.js
const socketIO = require("socket.io");
const crypto = require("crypto");

//Function to generate a unique room ID for two users - Encrypted using SHA256
const getSecretRoomId = (userId, targetUserId) => {
    return crypto
        .createHash('sha256')
        .update([userId, targetUserId].sort().join("_"))
        .digest('hex');
}

const initializeSocket = (server) => {

    const io = socketIO(server, {
        cors: {
            origin: "http://localhost:5173",
            credentials: true,
        }
    });

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        // JOIN ROOM
        socket.on("joinChat", ({ userId, targetUserId }) => {
            const roomId = getSecretRoomId(userId, targetUserId);
            socket.join(roomId);
            console.log(`User ${userId} joined room: ${roomId}`);
        });

        // RECEIVE MESSAGE FROM CLIENT
        socket.on("sendMessage", (msg) => {
            const roomId = [msg.senderId, msg.receiverId].sort().join("_");

            // Send to all clients in room
            io.to(roomId).emit("receiveMessage", msg);
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });
};

module.exports = initializeSocket;