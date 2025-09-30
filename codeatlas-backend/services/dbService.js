import pool from "../db/index.js";

async function saveRepoData(githubURL, repoInfo, contributors, languages, files)  {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // insert/update repository
        const repoResult = await client.query(
            `INSERT INTO repositories (github_url, name, stars, forks, issues, license, private)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (github_url) DO UPDATE SET 
                stars = EXCLUDED.stars,
                forks = EXCLUDED.forks,
                issues = EXCLUDED.issues,
                license = EXCLUDED.license,
                private = EXCLUDED.private
            RETURNING id`,
            [
                githubURL,
                repoInfo.name,
                repoInfo.stargazers_count,
                repoInfo.forks_count,
                repoInfo.open_issues_count,
                repoInfo.license?.name || "N/A",
                repoInfo.private || false,
            ]
        );

        const repoId = repoResult.rows[0].id;

        // Clear old contributors
        await client.query("DELETE FROM contributors WHERE repo_id = $1", [repoId]);
        for (const c of contributors) {
            await client.query(
                `INSERT INTO contributors (repo_id, login, avatar_url, contributions)
                VALUES ($1, $2, $3, $4)`,
                [repoId, c.login, c.avatar_url, c.contributions]
            );
        }

        // Clear old languages
        await client.query("DELETE FROM languages WHERE repo_id = $1", [repoId]);
        for (const [lang, bytes] of Object.entries(languages)) {
            await client.query(
                `INSERT INTO languages (repo_id, language, bytes)
                VALUES ($1, $2, $3)`,
                [repoId, lang, bytes]
            );
        }

        // Clear old files
        await client.query("DELETE FROM files WHERE repo_id = $1", [repoId]);
        const insertFilesRecursively = async (filesList) => {
            for (const f of filesList) {
                await client.query(
                    `INSERT INTO files (repo_id, path, type, download_url)
                    VALUES ($1, $2, $3, $4)`,
                    [repoId, f.path, f.type, f.download_url || null]
                );
                if (f.children) {
                    await insertFilesRecursively(f.children);
                }
            }
        };
        await insertFilesRecursively(files);

        await client.query("COMMIT");
        return repoId;
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
}

// save or update architecture graph (interactive code architecture visualization)
async function saveArchitecture(repoId, graph) {
    const client = await pool.connect();
    try {
        await client.query(
            `INSERT INTO architectures (repo_id, graph, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (repo_id) DO UPDATE SET
                graph = EXCLUDED.graph,
                updated_at = NOW()`,
            [repoId, graph]
        );
    } finally {
        client.release();
    }
}

// get architecture graph by repo id
async function getArchitecture(repoId) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT graph from architectures WHERE repo_id = $1`,
            [repoId]
        );
        return result.rows[0] ? result.rows[0].graph : null;
    } finally {
        client.release();
    }
}

// get repo_id by githubURL (helper)
async function getRepoIdByURL(githubURL) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT id FROM repositories WHERE github_url = $1`,
            [githubURL]
        );
        return result.rows[0] ? result.rows[0].id : null;
    } finally {
        client.release();
    }
}

// module.exports = { saveRepoData, saveArchitecture, getArchitecture, getRepoIdByURL };
export { saveRepoData, saveArchitecture, getArchitecture, getRepoIdByURL };
