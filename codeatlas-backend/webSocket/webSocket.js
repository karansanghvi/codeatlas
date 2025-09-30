const WebSocket = require("ws");

let wss; 

function initWebSocket(server) {
  wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    console.log("Client connected to WebSocket");

    ws.send(JSON.stringify({ message: "Connected to WebSocket" }));
  });
}

function broadcast(data) {
  if (!wss) return;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

module.exports = { initWebSocket, broadcast };
