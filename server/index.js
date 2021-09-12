const express = require('express');
const socketio = require('socket.io');

const http = require('http');

const {addUser,removeUser,getUser,getUsersInRoom}=require('./users.js'); 
const PORT = process.env.PORT || 5000;
const router=require('./router');
const app = express();

const server = http.createServer(app);
const io = require('socket.io')(server,{
    cors:{
        origin:'*',
    }
});

io.on('connection',(socket)=>{
    
    socket.on('join',({name,room},callback)=>{
        const {error,user}=addUser({id:socket.id,name,room});

        if(error) return callback(error);
        socket.emit('message',{user:'admin',text:`${user.name}, welcome to the room ${user.room}`});
        socket.broadcast.to(user.room).emit('message',{user:'admin',text:`${user.name}, has joined`});

        socket.join(user.room);
        io.to(user.room).emit('roomData', {room: user.room,users: getUsersInRoom(user.room)});

        callback();
    });

    socket.on('sendMessage',(message,callback)=>{
        let user=getUser(socket.id);

        io.to(user.room).emit('message',{user:user.name,text:message});
        io.to(user.room).emit('roomData',{room:user.room,users:getUsersInRoom(user.room)});
        callback();
    });

    socket.on('disconnect',()=>{
        const user =removeUser(socket.id);
        if(user){
            io.to(user.room).emit('message' ,{user:'admin',text:`${user.name} has left.`})
        }
    });
});
app.use(require('cors')())
app.use(router);

server.listen(PORT, () => console.log('Server has started on port',PORT));