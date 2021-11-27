var socket = io();

// Important notice
/* 
    Starting with Chrome 47, getUserMedia()
    requests are only allowed from secure origins: HTTPS or localhost.
*/

var messages = document.getElementById('messages');
var form = document.getElementById('sendButtonForm');
var input = document.getElementById('chatBox');
var chatBox = document.getElementById("chat-box");
var goRound = 0;
var messageIdNumber = 1;
var video = document.getElementById("displayVideoId");
var streamGlobal;
// returns date object of current time
function currentTimeDateObj(){
    const date = new Date();
    return date;
}

// call this first when user presses video call icon

// Get access to the camera!
function getPermissionToAccessCamera(){
    if(window.navigator.mediaDevices && window.navigator.mediaDevices.getUserMedia) {
        console.log("Yo dude navigator is here");
        // Not adding `{ audio: true }` since we only want video now
        window.navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(function(stream) {
            streamGlobal = stream;
            video.srcObject = streamGlobal;
            video.play();
        });
    }
}

function stopStreamedVideo(){
    console.log("removeVideoElem is called");
    const stream = video.srcObject;
    const tracks = stream.getTracks();

    tracks.forEach(function(track){
        track.stop();
    });

    video.srcObject = null;
}

// convert image to base64 returns base64 format from users local file system
function encodeImageFileAsURL(element) {
    console.log("encodeImageFileAsUrl() is called");
    var file = element.files[0];
    console.log('file object: ', file);
    var reader = new FileReader();
    reader.onloadend = function() {
      console.log(`RESULT of ${file.name}`, reader.result)
      // sends base64 data of Img to server-side 
      socket.emit("imageBlob", reader.result, currentTimeDateObj().toString(), file.name.toString(), function(error, message){
          console.log(error);
          console.log(message);
      }
      );
    }
    reader.readAsDataURL(file);
}
// When send button is pressed
form.addEventListener('submit', function(e) {
    var screenWidth = window.innerWidth;
    var screenHeight = window.innerHeight;
    e.preventDefault();
    if (input.value) {
        socket.emit('chat message', input.value, currentTimeDateObj().toString());
        input.value = '';
    }
});

//receives io.emit('imageBlob') from main.js
socket.on('imageBlob', function(dataUrl, stringTimeObj) {
    var displayDate = document.createElement('div');
    displayDate.className = 'messageImgBox-hover';
    displayDate.textContent = stringTimeObj;
    displayDate.style.float = 'right';

    var imageObj = new Image();
    imageObj.className = "messageImgBox";
    imageObj.src = dataUrl;

    messages.appendChild(imageObj);
    messages.appendChild(displayDate);
    messages.appendChild(document.createElement('br'));
});

// receives io.emit('chat message') from main.js or server-side
socket.on('chat message', function(msg, stringTimeObj) {
    var item = document.createElement('div');
    var displayDate = document.createElement('div');
    displayDate.className = 'messageBox-hover';
    displayDate.textContent = stringTimeObj;
    item.className = 'messageBox';

    if (goRound % 2 == 0) {
        item.style.float = 'right';
        displayDate.style.float = 'right';
        goRound += 1;
    } else {
        item.style.marginLeft = '2vw';
        item.style.float = 'left';
        displayDate.style.float = 'left'; 
        goRound += 1;
    }
    item.textContent = msg;
    item.id = messageIdNumber;
    messageIdNumber += 1;

    messages.appendChild(item);
    messages.appendChild(displayDate);
    messages.appendChild(document.createElement('br'));

    window.scrollTo(0, document.body.scrollHeight);
});

// detect of user is on mobile return true or false
function detectMob() {
    return ( ( window.innerWidth <= 850 ) && ( window.innerHeight <= 600 ) );
  }

function callback(err){
    console.log(err);
}


/*
const from = new google.maps.LatLng(lat1, lng1);
const to = new google.maps.LatLng(lat2, lng2);
const distance =  google.maps.geometry.spherical.computeDistanceBetween(from,to);
// returns dictionary-like object containing ip_address (public ip), isp_name, city, longitude, latitude, timezone 
function httpGetAsync(url, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200)
        callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", url, true); // true for asynchronous
    xmlHttp.send(null);
}

var url = "https://ipgeolocation.abstractapi.com/v1/?api_key=795a9c083a3a41dda54f258e8e342fee";

httpGetAsync(url, callback);

*/





