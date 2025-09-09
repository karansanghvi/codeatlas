const express = require("express");
const router = express.Router();
const pool = require("../db/index");
const { route } = require("./githubRoutes");

// get all repos
router.get("/repositories", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name, github_url, stars, forks FROM repositories ORDER BY id DESC"
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Failed to fetch repositories: ", err.message);
        res.status(500).json({
            error: "Failed to fetch repositories"
        });
    }
});

module.exports = router;