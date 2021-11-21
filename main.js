const express = require('express');
const os = require('os');
const path = require('path');
const app = express();
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer, {
    maxHttpBuffersize: 1e9,
});
const fs = require("fs");
var session = require('express-session');
var bodyParser = require('body-parser');
var mysql2 = require('mysql2');
const { request } = require('http');
const port = 5000;

//start mysql connection
var connection = mysql2.createConnection({
    host : 'localhost',
    user: 'bobcoi',
    password: 'Boby2003',
    database: 'login'
});

app.use(session({
    secret: 'secret LOLOL',
    resave: true,
    saveUninitialized: true
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/auth', function(req,res){
    var username = req.body.username;
    var passw = req.body.password;
    if (username&&passw) {
        connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username,passw], (error, results, fields)=>{
            if (results.length > 0) {
                req.session.loggedin = true;
                req.session.username = username;
                res.redirect('/home');
            } else {
                res.send('Incorrect Username and/or Password!');
            }

            res.end();
        });
    }
});

app
    .get('/', function(req, res){
    res.sendFile(__dirname + '/static/signup.html');
    })
    .get('/home', function(req,res) {
        if (req.session.loggedin) {
            res.send('Welcome back, ' + req.session.username + '!');
        } else {
            res.send('Please login to view this page!');
        }
        res.end();
        res.sendFile(__dirname + '/static/index.html');
    })
    .get('/login', function(req,res) {
        
    res.sendFile(__dirname + '/static/login.html');
    })
    .get('/signup', function(req,res) {
    res.sendFile(__dirname + '/static/signup.html');
    })
    .get('/friends', function(req,res){
    res.sendFile(__dirname + '/static/friends.html');
    })
// can use http://localhost:${port}/filename 
app.use(express.static('static'));

io.on("connection", (socket) => {
    console.log("user connected");
    socket.on('disconnect', () => {
        console.log('user disconnected')
    })
    /* log server messages on client
       arguments = array like object which contains all arguments of log() 
    */
    function log() {
        var array = ['Message from server: '];
        array.push.apply(array, arguments);
        socket.emit('log', array);

    }

    // event 
    socket.on('message', function(message, room) {
        log('Client said: ', message);
        //sends message to the room only
        socket.in(room).emit('message', message, room);
    })

    // event for creating or joining a room
    socket.on('create or join', function(room){
        log('Received request to create or join room: ' + room);

        var clientsInRoom = io.sockets.adapter.rooms[room];
        var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
        log(`Room ${room} now has ${numClients} client(s)`);


        // create room if noone in room
        if (numClients===0){
            socket.join(room);
            log(`Client ID: ${socket.id} created room: ${room}`);

        } else if (numClients===1) {
            log(`Client ID: ${socket.id} joined room: ${room}`);
        } else {
            socket.emit('full', room);
        }
    })

    //utilities event
    socket.on('ipaddr', function(){
        var ifaces = os.networkInterfaces();
        for (var dev in ifaces) {
            ifaces[dev].forEach(function(details){
                if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
                    socket.emit('ipaddr', details.address);
                };
            });
        }
    })

    //Event notifying other clients when client leaves room
    socket.on('bye', function(){
        console.log('received bye');
    })

    // send = io.emit('x') & receive = socket.on('x')
    // receives chat msg, timeObj from user
    socket.on('chat message', (msg, stringTimeObj) => {
        io.emit('chat message', msg, stringTimeObj);
    })

    /* 
        Need to write something to send images > 1MB.



    */
    // Event for sending images blobs that are less than 800kb. 
    socket.on('imageBlob', (imageBlob, stringTimeObj, filename) => {
        console.log(`server receives base64 of ${filename}: `, imageBlob);
        io.emit('imageBlob', imageBlob, stringTimeObj);
    })
});

httpServer.listen(port, () => {
    console.log(`Server running at port: ${port}`);
});
