const express = require('express');
const path = require('path');
const http = require("http");
const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const port = 5000;

app
    .get('/', function(req, res){
    res.sendFile(__dirname + '/static/signup.html');
    })
    .get('/home', function(req,res) {
    res.sendFile(__dirname + '/static/index.html');
    })
    .get('/login', function(req,res) {
    res.sendFile(__dirname + '/static/login.html');
    })
    .get('/signup', function(req,res) {
    res.sendFile(__dirname + '/static/signup.html');
    });
// can use http://localhost:${port}/filename 
app.use(express.static('static'));

io.on("connection", (socket) => {
    console.log("user connected");
    socket.on('disconnect', () => {
        console.log('user disconnected')
    })
    // send = socket.emit('x') & receive = socket.on('x')
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg)
    })
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
