const User = require("./user");

class Lobby {
  static lobbies = new Map();
  static usersInMenu = [];

  constructor(gameName, host) {
    this.gameName = gameName;
    this.users = [host]; 
    this.usernames = [host.getUsername()];
    Lobby.lobbies.set(gameName, this);
    console.log(this.users[0].getUsername())
    if(Lobby.usersInMenu == null) return;
    Lobby.usersInMenu.forEach(user => {
      user.sendMessageWithRetry(gameName, 'menuUpdate');
    });
  }

  join(user) {
    this.usernames.push(user.getUsername());
    user.sendMessageWithRetry(this.usernames, "userList");
    setTimeout(() => {
        user.sendMessageWithRetry(this.usernames, "userList");
    }, 500);
    this.users.forEach(u => {
      console.log(u.getUsername());
      setTimeout(() => {
        u.sendMessageWithRetry(user.getUsername(), 'userAdd');
      }, 500);
      u.sendMessageWithRetry(user.getUsername(), 'userAdd');
    });
    this.users.push(user);
  }

  leave(user) {
    this.usernames = this.usernames.filter(username => username !== user.getUsername);
    this.users = this.users.filter(u => u != user);
    this.users.forEach(u => {
      u.sendMessageWithRetry(user.getUsername(), 'userRemove');
    });
  }

  handleMessage(sendingUser, data){
    this.users.forEach(user => {
      if(sendingUser != user) user.sendMessageWithRetry(data.data)
    });
  }

  static getLobbyNames(){
    return Array.from(Lobby.lobbies.keys());
  }

}

module.exports = Lobby;