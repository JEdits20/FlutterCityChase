const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

const pendingMessages = new Map();
const retryDelay = 3000;
test = true;

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    if (data.type === 'confirmation') {
      handleConfirmation(data.id);
    } else {
      handleIncomingMessage(ws, data);
      ws.send(JSON.stringify({ type: 'confirmation', id: data.id}));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

function handleIncomingMessage(ws, data) {
  console.log('Received message:', data.data);
  // Here you can process the incoming message as needed
  // For example, you can send a response back to the client
  if(test){
    test = false;
    sendMessageWithRetry(ws, {data : (data.data + " is a good example for a server response to a different client")})
  }
  
}

function sendMessageWithRetry(ws, message) {
  const messageId = Date.now().toString();
  const messageWithId = { ...message, id: messageId };

  pendingMessages.set(messageId, messageWithId);
  ws.send(JSON.stringify(messageWithId));

  setTimeout(() => {
    if (pendingMessages.has(messageId)) {
      console.log('Resending message:', messageWithId);
      ws.send(JSON.stringify(messageWithId));
    }
  }, retryDelay);
}

function handleConfirmation(messageId) {
  if (pendingMessages.has(messageId)) {
    console.log('Confirmation received for message ID:', messageId);
    pendingMessages.delete(messageId);
  }
}

console.log('WebSocket server is running on ws://localhost:8080');