const express = require("express");
const router = express.Router();
const { fetchRepoData } = require("../services/githubService");
const { fetchRepoActivity } = require("../services/githubService");
const { saveRepoData } = require("../services/dbService");

// fetch files, repo info
router.post("/files", async (req, res) => {
  const { githubURL } = req.body;
  console.log("📥 Incoming request:", githubURL);

  if (!githubURL) {
    return res.status(400).json({ error: "GitHub URL is required" });
  }

  try {
    const data = await fetchRepoData(githubURL);

    await saveRepoData(githubURL, data.repoInfo, data.contributors, data.languages, data.files);

    res.json(data);
  } catch (err) {
    console.error("Error in /api/files:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// fetch repository activity (heatmap + contributor analysis)
router.post("/activity", async (req, res) => {
  const { githubURL } = req.body;
  if (!githubURL) return res.status(400).json({ error: "Github URL is required" });

  try {
    const activity = await fetchRepoActivity(githubURL);
    res.json(activity);
  } catch (err) {
    console.err("Error in /api/activity:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
