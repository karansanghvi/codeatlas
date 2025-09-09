const express = require("express");
const cors = require("cors");
const githubRoutes = require("./routes/githubRoutes");
const projectsRoutes = require("./routes/projectRoutes");
const architectureRoutes = require("./routes/architectureRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", githubRoutes);
app.use("/api", projectsRoutes);
app.use("/api", architectureRoutes);

app.listen(5000, () => console.log("🚀 Server running on port 5000"));
