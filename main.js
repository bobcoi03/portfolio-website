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
const multer = require("multer");
const formidable = require("formidable");
const { emit } = require('process');
const SHA256 = require("crypto-js/sha256");
const { connect } = require('http2');

// socketio room number. Join on app.post('/joinRoom')
let roomNumber;
let userName;
// users_information TABLE in USERS DB;
const users_info = 'users_information';

// start mysql connection
var connection = mysql2.createConnection({
    host : 'localhost',
    user: 'bobcoi',
    password: 'Boby2003',
    database: 'USERS'
});

app.use(session({
    cookie: { maxAge: 8*60*1000},
    secret: 'secret LOLOL',
    resave: true,
    saveUninitialized: true
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// post req for login form @ /login
app.post('/auth', function(req,res){
    var username = req.body.username;
    var passw = req.body.password;

    if (username&&passw) {
        var decrypt_passw = SHA256(passw).toString();
        connection.query('SELECT * FROM users_information WHERE username = ? AND password = ?', [username, decrypt_passw], (error, results, fields)=>{
            if (results.length > 0) {
                req.session.loggedin = true;
                req.session.username = username;
                // set global userName variable
                userName = toString(username);
                res.redirect('/contacts');
            } else {
                res.send('Incorrect Username and/or Password!');
            }
            res.end();
        });
    }
});

//post req for signup form @ /signup
app.post('/createAccount', function(req,res){
    var phoneNumber = req.body.telephone;
    var email = req.body.email;
    var username = req.body.username;
    var passw = req.body.password;
    var passwReenter = req.body.reenterPassword;
    let emailArray = [];
    
    // if passw && passwRe not same
    if (!(passw === passwReenter)) {
        res.redirect('/signup');
    }

    // if email already in TABLE: users_information
    connection.query(`SELECT email FROM ${users_info}`, (err, result, fields)=>{
        if (err) throw err;

        for(let i=0; i < result.length; i++) {
            emailArray.push(result[i].email);
        }
    })
        // checks if email already exits --> add info to table db
    if (!(linearSearch(emailArray,email))){
        //encrypt passw
        passw = SHA256(passw).toString();
        var insert = `INSERT INTO users_information (username, email, password, id) VALUES ('${username}', '${email}','${passw.toString()}',3)`;
        
        connection.query(insert, (err,result)=> {
            if (err) throw err;
        })
        console.log(`Added User info of: ${username} into users_information`);
        
        req.session.signedup = true;
        res.redirect('/setupAccount');
        res.end();

    } else {
        res.redirect('/signup');
        res.end();

    }
    /*
    // if username already in TABLE: users_information;
    connection.query(`SELECT username FROM ${users_info}`, (err, result, fields)=> {
        if (err) throw err;
        // search algo
    });

    // INSERT INTO users_information (username,password,id)
    connection.query(`INSERT INTO ${users_info} (username, email, password) VALUES (${username},${email},${passw})`)
    */
})

// 
app.post('/goToChatRoom', (req,res)=> {
    // check if room already exists in table rooms @ DB Users;

    // Array of all room ids that already exists in TABLE rooms @ DATABASE Users
    let room_id_array = [];

    connection.query(`SELECT room_id FROM rooms`, (err, result) => {
        for (let i = 0; i < result.length; i++) {
            room_id_array.push(result[i].room_id);

            room_id_array.sort((a, b) => {
                return a - b;
            })
        }
    })

    connection.query(
        `SELECT * FROM rooms WHERE (user_1 = '${req.session.username}' AND user_2 = '${req.body.username}')
        OR (user_1 = '${req.body.username}' AND user_2 = '${req.session.username}')
    `, (err, result)=> {
        if (err) throw err;
        console.log(`Room already exists:\nResults: ${result[0]}`);
        // If room already exists
        if (result.length > 0) {
            roomNumber = result[0].room_id;
            console.log(roomNumber);
            io.on("connection", (socket) => {
                socket.join(roomNumber);

                io.to(roomNumber).emit('username_of_friend', req.body.username.toString());

                console.log(`User: ${req.session.username} Joined room: ${roomNumber}`);
            });
        // If room doesn't exist
        } else {

            let lastItem = room_id_array[room_id_array.length - 1];
            lastItem += 1;

            connection.query(`
            
                INSERT INTO rooms
                (room_id, user_1, user_2) VALUES 
                (${lastItem},'${req.session.username}','${req.body.username}')`, (err) => {
            
            if (err) throw err;
            
            io.on("connection", (socket) => {
                console.log(`CREATED NEW ROOM: ${lastItem}`);
                roomNumber = lastItem;
                socket.join(roomNumber);
                console.log(`User: ${req.session.username} Joined room: ${roomNumber}`);
            });

            })
        }
    })
    res.redirect('/home');
    res.end();
});

app.post('/upload', (req,res, next) => {
    uploadFolder = __dirname + '/uploads/images';

    var form = new formidable.IncomingForm({ uploadDir: uploadFolder });

    form.parse(req, (err, fields, files) => {
        if(err){
            next(err);
            return;
        }

        const file = files.sendImage;

        // creates a valid name by removing spaces
        const fileName = encodeURIComponent(file.originalFilename.replace(/\s/g, "-"));

        try {
            fs.renameSync(file.filepath, (`${uploadFolder}/${fileName}`));
            // send path to imagefile for display using socketio

            // for socketio
            path_to_file = `/images/${fileName}`;
            io.to(roomNumber).emit('path_to_image', path_to_file);

        } catch (err) {
            console.log(err);
        }
    });
    res.end();
});

app
    .get('/contacts', (req,res)=> {
        if (!(req.session.loggedin)) {
            res.redirect('/login');
        } else {
            res.sendFile(__dirname + '/static/contacts.html');
        }
    })
    .get('/rooms', (req,res) => {
        if (!(req.session.loggedin)){
            res.redirect('/login');
        } else{
            res.sendFile(__dirname + '/static/rooms.html');
        }
    })

    .get("/image.png", (req, res) => {
        res.sendFile(path.join(__dirname, "./uploads/image.png"));
    })
    .get('/scrap',(req,res) => {
        res.sendFile(__dirname + '/public/scrap.html');
    })

    .get('/', function(req, res){
        res.redirect('/login');
    })
    .get('/home', function(req,res) {
        if (req.method == 'post') {
            console.log("post request /home");
        }
        // user hasn't login send
        /*
        if (!(req.session.loggedin)) {
            res.redirect('/login');
        } else {
            res.sendFile(__dirname + '/static/index.html');
        }
        */
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
    .get('/setupAccount', function(req,res){
        // if user hasn't setup
        if (req.session.signedup) {
            res.sendFile(__dirname + '/views/setupAccount.html');
        } else {
            req.session.signedup = false;
            res.redirect('/signup');
        }
    })
       // can use http://localhost:${port}/filename 
    .use(express.static('static'))
    .use(express.static('uploads'))

io.on("connection", (socket) => {
    // on app.get("/contacts") or app.get("/home")

    socket.on('disconnect', () => {
        console.log('user disconnected')
    })
    // send = io.emit('x') & receive = socket.on('x')
    // receives chat msg, timeObj from user
    socket.on('chat message', (msg, stringTimeObj) => {
        io.to(roomNumber).emit('chat message', msg, stringTimeObj);
    })
    /* 
        Need to write something to send images > 1MB.
    */
});


httpServer.listen(port, '0.0.0.0', () => {
    console.log(`Server running at port: ${port}`);
});

console.log(userName);

//search Algo linear returns if value in array items
function linearSearch(items, value){
    for (i=0; i < items.length;i++){
        if (value == items[i]){
            return true;
        }
    }
    // returns false if items not in db
    return false;
}

const handleError = (err, res) => {
    res
      .status(500)
      .contentType("text/plain")
      .end("Oops! Something went wrong!");
};










