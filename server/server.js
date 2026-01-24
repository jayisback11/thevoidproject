const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

app.use(cors());

const server = http.createServer(app);

const isLocal = process.env.NODE_ENV !== 'production';
var origin = "";

if (isLocal) {
    origin = "http://localhost:3000";
    console.log("Running on my machine 💻");
} else {
    origin = "https://thevoidproject.vercel.app";
    console.log("Running on the live server 🚀");
}

const io = new Server(server, {
    cors: {
        origin: origin, 
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


const rooms = {};  //show current users in room

io.on('connection', (socket) => {
    socket.on('join_room', ({ username, room }) => {
        socket.join(room);

        if (!rooms[room]) rooms[room] = [];
        rooms[room].push({ id: socket.id, username });

        io.to(room).emit(
            'room_users',
            rooms[room].map(u => u.username)
        );
    });

    socket.on('disconnect', () => {
        for (const room in rooms) {
            rooms[room] = rooms[room].filter(u => u.id !== socket.id);
            io.to(room).emit(
                'room_users',
                rooms[room].map(u => u.username)
            );
        }
    });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));