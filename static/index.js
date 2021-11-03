var socket = io();

var messages = document.getElementById('messages');
var form = document.getElementById('sendButtonForm');
var input = document.getElementById('chatBox');
var chatBox = document.getElementById("chat-box");
var goRound = 0;
var messageIdNumber = 1;

form.addEventListener('submit', function(e) {
    var screenWidth = window.innerWidth;
    var screenHeight = window.innerHeight;
    const date = new Date();
    e.preventDefault();
    if (input.value) {
        socket.emit('chat message', input.value, date.getMinutes().toString(), date.getHours().toString());
        input.value = '';
    }
});

function getHeightOfPreviousMessage(messageId) {
    // returns height for gapBetweenMessageBoxes
    var heightOfGapBox = 0;
    var previousMsg = document.getElementById(messageIdNumber -1);
    heightOfGapBox = previousMsg.style.height;

    return heightOfGapBox; 
}

socket.on('chat message', function(msg, minutes, hours) {
    var item = document.createElement('div');
    var gapBetweenMessageBoxes = document.createElement('div');
    if (goRound % 2 == 0) {
        item.className = 'messageBoxRight';
    } else {
        item.className = 'messageBoxLeft';
    }
    goRound += 1;
    item.textContent = msg;
    item.id = messageIdNumber;
    messageIdNumber += 1;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

//function keyboardResize(){
//    document.getElementById("chat-box").style.height = "170px";
//}

// detect of user is on mobile return true or false
function detectMob() {
    return ( ( window.innerWidth <= 850 ) && ( window.innerHeight <= 600 ) );
  }


