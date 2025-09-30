import express from "express";
const router = express.Router();

import { fetchRepoData, fetchRepoActivity } from "../services/githubService.js";
import { saveRepoData } from "../services/dbService.js";

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

export default router;
