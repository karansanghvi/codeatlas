const express = require("express");
const cors = require("cors");
const http = require("http");

const githubRoutes = require("./routes/githubRoutes");
const projectsRoutes = require("./routes/projectRoutes");
const architectureRoutes = require("./routes/architectureRoutes");
const { initWebSocket, broadcast } = require("./webSocket/webSocket");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", githubRoutes);
app.use("/api", projectsRoutes);
app.use("/api", architectureRoutes);

// Create HTTP server
const server = http.createServer(app);

// Init WebSocket
initWebSocket(server);

app.post("/api/push-simulate", (req, res) => {
  const data = req.body;
  broadcast(data);
  res.sendStatus(200);
});

// Start HTTP + WebSocket server
server.listen(5000, () => console.log("🚀 Server + WebSocket running on port 5000"));
