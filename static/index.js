var socket = io();

var messages = document.getElementById('messages');
var form = document.getElementById('sendButtonForm');
var input = document.getElementById('chatBox');
var chatBox = document.getElementById("chat-box");

var screenWidth = window.innerWidth;

form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
        socket.emit('chat message', input.value);
        input.value = '';
    }
});

socket.on('chat message', function(msg) {
    var item = document.createElement('p');
    item.textContent = msg;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

function keyboardResize(){
    document.getElementById("chat-box").style.height = "170px";
}

// detect of user is on mobile return true or false
function detectMob() {
    return ( ( window.innerWidth <= 800 ) && ( window.innerHeight <= 600 ) );
  }


