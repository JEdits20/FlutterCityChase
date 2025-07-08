const WebSocket = require('ws')
const Lobby = require("./lobby");
const retryDelay = 3000;

class User {
  static pendingMessages = new Map();
  static users = new Map();
  static usersInMenu = [];

  constructor(ws, id) {
    if (User.users.has(id)) {
      if(this.cache == null) this.cache = [];
      var userById = User.users.get(id);
      if(userById.ws.readyState == WebSocket.CONNECTING || userById.ws.readyState == WebSocket.OPEN){
        ws.close();
        setTimeout(() => {
        this.sendMessageWithRetry(Lobby.getLobbyNames(), 'list');
      }, 500);
        throw new Error(`User with ID ${id} already exists.`);
      }else{
        userById.ws.close();
        userById.ws = ws;
        this.ws = ws; 
        this.sendCache();
        setTimeout(() => {
        this.sendMessageWithRetry(Lobby.getLobbyNames(), 'list');
        setTimeout(() => {
        this.sendMessageWithRetry(Lobby.getLobbyNames(), 'list');
      }, 500);
      }, 500);
        throw new Error(`User overridden.`);
        
      }
    }else{
      this.cache = [];
      this.ws = ws; 
      User.users.set(id, this);
      Lobby.usersInMenu.push(this);
      setTimeout(() => {
        this.sendMessageWithRetry(Lobby.getLobbyNames(), 'list');
      }, 500);
    }
  }

  handleMessage(data){
    console.log(data.type)
    if(data.type == 'join'){
      if(Lobby.lobbies.has(data.lobby)){
        this.username = data.username;
        this.lobby = Lobby.lobbies.get(data.lobby);
        this.lobby.join(this);
      }
      Lobby.usersInMenu = Lobby.usersInMenu.filter(ws => ws !== this.ws)
    }else if(data.type == 'host'){
      this.username = data.username;
      this.lobby = new Lobby(data.lobby, this);
      Lobby.usersInMenu = Lobby.usersInMenu.filter(ws => ws !== this.ws)
    }else if(data.type == 'update'){
      if(this.lobby != null) this.lobby.handleMessage(this, data);
    }else if(data.type == 'leave'){
      if(this.lobby != null) this.lobby.leave(this)
        Lobby.usersInMenu.push(this);
    }
  }

  getUsername(){
    return this.username;
  }

  sendCache(){
    this.cache.forEach(element => {
      this.sendMessageWithRetry(element);
    });
  }

  sendMessageWithRetry(message, type = 'update') {
    console.log(message)
    if(this.ws.readyState != WebSocket.OPEN){
      if(this.lobby != null) this.cache.push(message);
      return;
    } 
    const messageId = Date.now().toString();
    const messageWithId = { data: message, id: messageId, type: type };

    User.pendingMessages.set(messageId, messageWithId);
    this.ws.send(JSON.stringify(messageWithId));

    setTimeout(() => {
      if (User.pendingMessages.has(messageId)) {
        console.log('Resending message:', messageWithId);
        this.ws.send(JSON.stringify(messageWithId));
      }
    }, retryDelay);
  }

}

module.exports = User;