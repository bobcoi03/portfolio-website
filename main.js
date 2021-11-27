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

const handleError = (err, res) => {
    res
      .status(500)
      .contentType("text/plain")
      .end("Oops! Something went wrong!");
};

const upload = multer({
    dest: __dirname + '/static'
    // you might also want to set some limits: https://github.com/expressjs/multer#limits
  });

//import search algos
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
        connection.query('SELECT * FROM users_information WHERE username = ? AND password = ?', [username,passw], (error, results, fields)=>{
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

//search Algo linear returns if value in array items
function linearSearch(items, value){
    for (i=0; i < items.length;i++){
        if (value == items[i]){
            return true;
        }
    }
    return false;
}
//post req for signup form @ /signup
app.post('/createAccount', function(req,res){
    var email = req.body.email;
    var username = req.body.username;
    var passw = req.body.password;
    var passwReenter = req.body.reenterPassword;

    // if email already in TABLE: users_information
    connection.query(`SELECT email FROM ${users_info}`, (err, result, fields)=>{
        if (err) throw err;
        let emailArray = [];

        for(let i=0; i < result.length; i++) {
            emailArray.push(result[i].email);
        }
        // checks if email already exits
        if (!(linearSearch(emailArray,email))){
            req.session.signedup = true;
            res.redirect('/setupAccount');
            res.end();

        } else {
            res.redirect('/signup');
            res.end();

        }
    });
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

app.get("/", express.static(path.join(__dirname, "./static")));

app.post("/upload", upload.single("sendImage"),(req,res)=> {

    const tempPath = req.file.path;
    const targetPath = path.join(__dirname, "/uploads/image.png");

    if (path.extname(req.file.originalname).toLowerCase() === ".png") {
        fs.rename(tempPath, targetPath, err => {
          if (err) return handleError(err, res);
  
          res
            .status(200)
            .contentType("text/plain")
            .end("File uploaded!");
        });
    } else {
        fs.unlink(tempPath, err => {
          if (err) return handleError(err, res);
  
          res
            .status(403)
            .contentType("text/plain")
            .end("Only .png files are allowed!");
        });
    }
});

app
    .get("/image.png", (req, res) => {
        res.sendFile(path.join(__dirname, "./uploads/image.png"));
    })
    .get('/scrap',(req,res) => {
        res.sendFile(__dirname + '/public/scrap.html');
    })

    .get('/', function(req, res){
    res.sendFile(__dirname + '/static/login.html');
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
   .use(express.static('static'));

io.on("connection", (socket) => {
    console.log("user connected");
    socket.on('disconnect', () => {
        console.log('user disconnected')
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














