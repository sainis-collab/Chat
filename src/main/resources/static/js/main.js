'use strict';

var usernamePage = document.querySelector("#username-page");
var chatPage = document.querySelector("#chat-page");
var usernameForm = document.querySelector("#usernameForm");
var messageForm = document.querySelector("#messageForm");
var messageInput = document.querySelector("#message");
var messageArea = document.querySelector("#messageArea");
var connectingElement = document.querySelector(".connecting");

var stopmClient = null;
var username = null;
var color = ['#2196F3', '#32c787', '#00BCD4', '#ff5652', '#ffc107', '#ff85af', '#FF9800', '#39bbb0'];

function connect(event){
    username = document.querySelector('#name').value.trim();
    if(username){
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        // FIX 1: Corrected class names 'SockJS' and library reference 'Stomp'
        var socket = new SockJS('/ws');
        stopmClient = Stomp.over(socket);
        stopmClient.connect({}, onConnected, onerror);
    }
    event.preventDefault();
}

function onConnected(){
    stopmClient.subscribe('/topic/public', onMessageRecieved);
    // FIX 2: Changed 'JASON' to 'JSON' and type to uppercase 'JOIN' to match Java logic
    stopmClient.send('/app/chat.addUser', {}, JSON.stringify({sender: username, type: 'JOIN'}));
    connectingElement.classList.add('hidden');
}

function onerror(){
    connectingElement.textContent = "Could not connect to websocket server. Please refresh this page and try";
    connectingElement.style.color = 'red';
}

function onMessageRecieved(payload){
    // FIX 2: Changed 'JASON' to 'JSON'
    var message = JSON.parse(payload.body);

    var messageElement = document.createElement('li');

    if(message.type === 'JOIN'){
        messageElement.classList.add('event-message');
        message.content = message.sender + ' joined!';
    } else if (message.type === 'LEAVE'){
        messageElement.classList.add('event-message');
        message.content = message.sender + ' left!';
    } else {
        messageElement.classList.add('chat-message');

        var avatarElement = document.createElement('i');
        // FIX 3: Used document.createTextNode for strings, not document.createElement
        var avatarText = document.createTextNode(message.sender[0]);
        avatarElement.appendChild(avatarText);
        avatarElement.style['background-color'] = getAvatarColor(message.sender);

        messageElement.appendChild(avatarElement);

        var usernameElement = document.createElement('span');
        var usernameText = document.createTextNode(message.sender);
        usernameElement.appendChild(usernameText);
        messageElement.appendChild(usernameElement);
    }

    var textElement = document.createElement('p');
    var messageText = document.createTextNode(message.content);
    textElement.appendChild(messageText);

    messageElement.appendChild(textElement);

    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
}

function sendmessage(event) {
    var messageContent = messageInput.value.trim();
    if(messageContent && stopmClient){
        var chatMessage = {
            sender: username,
            content: messageContent,
            type: 'CHAT' // FIX 5: Standardized payload to match expected Java enum mapping
        };
        // FIX 2: Changed 'JASON' to 'JSON' and endpoint to match ChatController mapping
        stopmClient.send('/app/chat.sendMessage', {}, JSON.stringify(chatMessage));

        // FIX 4: Correctly clears out the message field value
        messageInput.value = '';
    }

    event.preventDefault();
}

// FIX 6: Extracted helper function outside of sendmessage block scope
function getAvatarColor(messageSender){
    var hash = 0;
    for(var i = 0; i < messageSender.length; i++){
        hash = 31 * hash + messageSender.charCodeAt(i);
    }
    var index = Math.abs(hash % color.length);
    return color[index];
}

usernameForm.addEventListener('submit', connect, true);
messageForm.addEventListener('submit', sendmessage, true);