const express = require("express");
const router = express.Router();
const { buildArchitecture } = require("../services/architectureService");
const { getArchitecture, getRepoIdByURL } = require("../services/dbService");

router.post("/architecture", async (req, res) => {
  const { githubURL } = req.body;
  if (!githubURL) return res.status(400).json({ error: "githubURL required" });

  try {
    const repoId = await getRepoIdByURL(githubURL);
    if (repoId) {
      const cached = await getArchitecture(repoId);
      if (cached) return res.json({ cached: true, graph: cached });
    }

    const graph = await buildArchitecture(githubURL);
    res.json({ cached: false, graph });
  } catch (err) {
    console.error("Error building architecture:", err.message);
    res.status(500).json({ error: err.message });
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

module.exports = router;
