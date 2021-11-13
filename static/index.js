var socket = io();

var messages = document.getElementById('messages');
var form = document.getElementById('sendButtonForm');
var input = document.getElementById('chatBox');
var chatBox = document.getElementById("chat-box");
var goRound = 0;
var messageIdNumber = 1;

// returns date object of current time
function currentTimeDateObj(){
    const date = new Date();

    return date;
}
// convert image to base64 returns base64 format from users local file system
function encodeImageFileAsURL(element) {
    console.log("encodeImageFileAsUrl() is called");
    var file = element.files[0];
    console.log('file object: ', file);
    var reader = new FileReader();
    reader.onloadend = function() {
      console.log(`RESULT of ${file.name}`, reader.result)
      socket.emit("imageBlob", reader.result.toString(), currentTimeDateObj().toString(), file.name.toString());
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


