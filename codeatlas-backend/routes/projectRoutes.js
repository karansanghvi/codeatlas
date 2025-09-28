const express = require("express");
const router = express.Router();
const pool = require("../db/index");
const { route } = require("./githubRoutes");

// get all repos
router.get("/repositories", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name, github_url, stars, forks FROM repositories WHERE private = false ORDER BY id DESC"
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Failed to fetch repositories: ", err.message);
        res.status(500).json({
            error: "Failed to fetch repositories"
        });
    }
});

// delete repo by id
router.delete("/repositories/:id", async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query("DELETE FROM repositories WHERE id = $1", [id]);
        res.json({ message: "Repository deleted successfully" });
    } catch (err) {
        console.error("Failed to delete repository:", err.message);
        res.status(500).json({ error: "Failed to delete repository" });
    }
});

module.exports = router;