import express from "express";
import cors from "cors";
import githubRoutes from "./routes/githubRoutes.js";
import projectsRoutes from "./routes/projectRoutes.js";
import architectureRoutes from "./routes/architectureRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", githubRoutes);
app.use("/api", projectsRoutes);
app.use("/api", architectureRoutes);

// Start HTTP Server
app.listen(5000, () => console.log("🚀 Server running on port 5000"));
