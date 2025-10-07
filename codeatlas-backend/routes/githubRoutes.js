import express from "express";
const router = express.Router();
import { fetchRepoData, fetchRepoActivity, fetchPullRequests } from "../services/githubService.js";
import { saveRepoData } from "../services/dbService.js";

// fetch files, repo info
router.post("/files", async (req, res) => {
  const { githubURL, token } = req.body;
  if (!githubURL || !token) return res.status(400).json({ error: "GitHub URL and token are required" });

  try {
    const data = await fetchRepoData(githubURL, token);
    await saveRepoData(githubURL, data.repoInfo, data.contributors, data.languages, data.files);
    res.json(data);
  } catch (err) {
    console.error("Error in /api/files:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/activity", async (req, res) => {
  const { githubURL, token } = req.body;
  if (!githubURL || !token) return res.status(400).json({ error: "GitHub URL and token are required" });

  try {
    const activity = await fetchRepoActivity(githubURL, token);
    res.json(activity);
  } catch (err) {
    console.error("Error in /api/activity:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/prs", async (req, res) => {
  const { githubURL, token } = req.body;
  if (!githubURL || !token) return res.status(400).json({ error: "GitHub URL and token are required" });

  try {
    const prs = await fetchPullRequests(githubURL, token);
    res.json(prs);
  } catch (err) {
    console.error("Error in /api/prs:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;

