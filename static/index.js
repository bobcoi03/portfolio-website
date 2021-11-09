var socket = io();

var messages = document.getElementById('messages');
var form = document.getElementById('sendButtonForm');
var input = document.getElementById('chatBox');
var chatBox = document.getElementById("chat-box");
var goRound = 0;
var messageIdNumber = 1;

function startRecording() {
    alert("Microphone is pressed");
}

function displayImg() {
    var file = document.getElementById('file-input').files[0];
    //call the filereader
    var reader  = new FileReader();
    reader.onload = function(e)  {
        //create the img tag
        var image = document.createElement("img");
        //get the image
        image.src = e.target.result;
        //resize the image
        image.style.width = '100%';
        image.style.height = '100%';

        var imgBox = document.createElement('div');
        imgBox.className = 'messageImgBox';
        imgBox.id = "imgBoxId";

        messages.appendChild(imgBox);
        getImgBoxId = document.getElementById("imgBoxId");
        getImgBoxId.appendChild(image);
     }
     reader.readAsDataURL(file);
}

form.addEventListener('submit', function(e) {
    var screenWidth = window.innerWidth;
    var screenHeight = window.innerHeight;
    const date = new Date();
    e.preventDefault();
    if (input.value) {
        socket.emit('chat message', input.value, date.toString());
        input.value = '';
    }
});

socket.on('chat message', function(msg, stringTimeObj) {
    var item = document.createElement('div');
    var displayDate = document.createElement('div');
    displayDate.className = 'messageBox-hover';
    displayDate.textContent = stringTimeObj;
    item.className = 'messageBox';

    if (goRound % 2 == 0) {
        item.style.float = 'right';
        item.style.clear = 'left';
        displayDate.style.float = 'right';
        goRound += 1;
    } else {
        item.style.marginLeft = '2vw';
        item.style.float = 'left';
        item.style.clear = 'right';
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


