const express = require("express");
const router = express.Router();
const { fetchRepoData } = require("../services/githubService");
const { saveRepoData } = require("../services/dbService");

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
    console.error("❌ Error in /api/files:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
