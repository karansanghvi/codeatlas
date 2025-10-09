import express from "express";
const router = express.Router();

import { buildArchitecture } from "../services/architectureService.js";
import { getArchitecture, getRepoIdByURL } from "../services/dbService.js";


router.post("/architecture", async (req, res) => {
  const { githubURL } = req.body;
  if (!githubURL) return res.status(400).json({ error: "githubURL required" });

  try {
    console.log("Received GitHub URL:", githubURL);
    const repoId = await getRepoIdByURL(githubURL);
    console.log("Repo ID:", repoId);

    if (repoId) {
      const cached = await getArchitecture(repoId);
      if (cached) {
        console.log("Returning cached architecture");
        return res.json({ cached: true, graph: cached });
      }
    }

    console.log("Building architecture...");
    const graph = await buildArchitecture(githubURL);
    console.log("Graph built:", graph);
    res.json({ cached: false, graph });
  } catch (err) {
    console.error("Error building architecture:", err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});


router.get("/architecture", async (req, res) => {
  const githubURL = req.query.githubURL;
  if (!githubURL) return res.status(400).json({ error: "githubURL query required" });

  try {
    const repoId = await getRepoIdByURL(githubURL);
    if (!repoId) return res.status(404).json({ error: "Repository not found" });

    const cached = await getArchitecture(repoId);
    if (!cached) return res.status(404).json({ error: "Architecture not found" });

    res.json({ graph: cached });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
