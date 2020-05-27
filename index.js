const express = require('express');
const app = express();
const http = require('http');
const server = http.Server(app);
const socketio = require('socket.io');
const io = socketio(server);
const router = require('./router');
const PORT = process.env.PORT || 5000;
const { addUser, removeUser, getUser, getUserInRoom } = require('./users');

io.on('connection', (socket) => {
    console.log('connected')
    socket.on('join', ({ name, room }, callback) => {

        const { error, user } = addUser({ id: socket.id, name, room });

        if (error) return callback(error);

        socket.emit('message', { user: "admin", text: `${user.name} welcome to the room ${user.room}` });
        socket.broadcast.to(user.room).emit('message', { user: "admin", text: `${user.name} has joined!` });

        socket.join(user.room);

        io.to(user.room).emit('roomData', { room: user.room, users: getUserInRoom(user.room) })


        callback();
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        if (!user) return message;
        io.to(user.room).emit('message', { user: user.name, text: message });
        io.to(user.room).emit('roomData', { room: user.room, users: getUserInRoom(user.room) });
        callback();
    })

    socket.on("disconnect", () => {
        const user = removeUser(socket.id)
        console.log("disconnected...")

        if (user) {
            io.to(user.room).emit('message', { user: "admin", text: `${user.name} has left` })
        }
    })

});

app.use(router);

server.listen(PORT, () => console.log(`Server Listening to port ${PORT}`));
