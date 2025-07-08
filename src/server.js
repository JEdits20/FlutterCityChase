const WebSocket = require('ws');

const User = require('./user');

const wss = new WebSocket.Server({ port: 8080 });

test = true;

wss.on('connection', (ws) => {
  console.log('Client connected');

  verified = false;
  deviceId = '';
  _lastId = '';
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    if(data.id == null || data.type == null) return;
    if(_lastId == data.id){
      ws.send(JSON.stringify({ type: 'confirmation', id: _lastId}));
      return;
    }
    _lastId = data.id;
    if(!verified){
      if(data.type === 'identification' && data.id != null && data.id != ''){
        verified = true;
        deviceId = data.id
        try{
          new User(ws, data.id);
        }catch{
          console.log('NO USER INIT')
        }
      }else{
        ws.send(JSON.stringify({ type: 'confirmation', id: data.id}));
        ws.close();
      }
    }


    if (data.type === 'confirmation') {
      handleConfirmation(data.id);
    } else {
      handleIncomingMessage(data, deviceId);
      ws.send(JSON.stringify({ type: 'confirmation', id: data.id}));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

function handleIncomingMessage(data, id) {
  if(!User.users.has(id)) return;
  userById = User.users.get(id);
  userById.handleMessage(data);
}

function handleConfirmation(messageId) {
  if (User.pendingMessages.has(messageId)) {
    console.log('Confirmation received for message ID:', messageId);
    User.pendingMessages.delete(messageId);
  }
}

console.log('WebSocket server is running on ws://localhost:8080');