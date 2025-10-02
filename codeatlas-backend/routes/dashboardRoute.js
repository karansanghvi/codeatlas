// dashboardRoute.js
import express from "express";
const router = express.Router();
import pool from "../db/index.js";

// get dashboard stats for a user
router.get("/dashboard/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    // Total projects analyzed
    const projectsRes = await pool.query(
      "SELECT COUNT(*) AS total FROM repositories r JOIN user_repos ur ON r.id = ur.repo_id WHERE ur.user_id = $1",
      [userId]
    );
    const totalProjects = projectsRes.rows[0].total;

    // Most used languages
    const langRes = await pool.query(
      `SELECT language, SUM(bytes) AS total_bytes 
       FROM languages l
       JOIN repositories r ON l.repo_id = r.id
       JOIN user_repos ur ON r.id = ur.repo_id
       WHERE ur.user_id = $1
       GROUP BY language
       ORDER BY total_bytes DESC
       LIMIT 5`,
      [userId]
    );
    const languages = langRes.rows;

    // Most active repository (by commits/contributions)
    const activeRepoRes = await pool.query(
      `SELECT r.name, SUM(c.contributions) AS total_contrib 
       FROM contributors c
       JOIN repositories r ON c.repo_id = r.id
       JOIN user_repos ur ON r.id = ur.repo_id
       WHERE ur.user_id = $1
       GROUP BY r.name
       ORDER BY total_contrib DESC
       LIMIT 1`,
      [userId]
    );
    const mostActiveRepo = activeRepoRes.rows[0];

    // Recent activity (last 5 analyzed repos)
    const recentRes = await pool.query(
      `SELECT r.name, ur.analyzed_at
       FROM user_repos ur
       JOIN repositories r ON ur.repo_id = r.id
       WHERE ur.user_id = $1
       ORDER BY ur.analyzed_at DESC
       LIMIT 5`,
      [userId]
    );
    const recentActivity = recentRes.rows;

    res.json({ totalProjects, languages, mostActiveRepo, recentActivity });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

export default router;
