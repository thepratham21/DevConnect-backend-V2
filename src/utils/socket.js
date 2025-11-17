

const socket = require('socket.io');

const initializeSocket = (server) => {

    //socket.io setup
    const socket = require('socket.io');
    const io = socket(server, {
        cors: {
            origin: "http://localhost:5173",
            credentials: true,
        }
    });

    io.on('connection', (socket) => {
        socket.on('joinChat', () => {

        });

        socket.on('sendMessage', () => {

        });

        socket.on('disconnect', () => {

        });
    });

}

module.exports = initializeSocket;
