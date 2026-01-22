const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://thevoidproject.vercel.app", // Your NEW Vercel URL
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // When a user joins a specific room
    socket.on("join_room", (data) => {
        socket.join(data.room);
        console.log(`User ${data.username} joined room: ${data.room}`);
    });

    // When a user sends a message to a room
    socket.on("send_message", (data) => {
        // This broadcasts the message to everyone in the room EXCEPT the sender
        socket.to(data.room).emit("receive_message", data);
    });

    socket.on("disconnect", () => {
        console.log("User Disconnected", socket.id);
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));