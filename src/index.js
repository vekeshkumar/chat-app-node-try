//Required imports
const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage,generateLocationMessage} = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')
//Starting the express 
const app = express()
const server = http.createServer(app) //refactoring
const io = socketio(server) //explicit purpose to send http server to socket.io

const port = process.env.PORT || 3000
//include the public directory path
const publicDirectoryPath = path.join(__dirname,'../public')
app.use(express.static(publicDirectoryPath))

// receiving the connection
io.on('connection',(socket)=>{ 
    //join room
    socket.on('join', (options, callback) => {
        //destructuring, call back to  add the user
        const { error, user } = addUser({ id: socket.id, ...options })
        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    //socket.emit, io.emit, socket.broadcast.emit
    //io.to.emit - to specific room
    //socket.broadcast.to.emit - not to specific person and but everyone in the chat room
    //socket which receives from send message
    socket.on('sendMessage',(message,callback)=>{
        //include user
        const user = getUser(socket.id)
        const filter = new Filter()
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    socket.on('disconnect',()=>{
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

    socket.on('sendLocation',(coords,callback)=>{
        //locationMessage
        const user = getUser(socket.id)
        io.emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })
})

server.listen(port,()=>{
    console.log(`Server is up on the port ${port}!`)
})