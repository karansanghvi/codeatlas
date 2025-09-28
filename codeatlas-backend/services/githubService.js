require("dotenv").config();
const { Octokit } = require("@octokit/rest");
const parseGitHubURL = require("../utils/parseGitHubURL");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN || "your-fallback-token-here"
});

// Recursive fetch of file tree
async function getFilesRecursively(owner, repo, path = "", depth = 0, maxDepth = 2) {
  if (depth > maxDepth) return [];

  try {
    const { data } = await octokit.rest.repos.getContent({ owner, repo, path });

    const files = await Promise.all(
      data.map(async (item) => {
        if (item.type === "dir") {
          const children = await getFilesRecursively(owner, repo, item.path, depth + 1, maxDepth);
          return { ...item, children };
        }
        return item;
      })
    );

    return files;
  } catch (err) {
    console.error(`❌ Failed to fetch path "${path}":`, err.message);
    return [];
  }
}

// Format GitHub API response
function mapFiles(data) {
  return data.map((item) =>
    item.type === "dir"
      ? {
          name: item.name,
          path: item.path,
          type: "folder",
          children: mapFiles(item.children || []),
        }
      : {
          name: item.name,
          path: item.path,
          type: "file",
          size: item.size,
          download_url: item.download_url,
        }
  );
}

// Main service to get repo info
async function fetchRepoData(githubURL) {
  const parsed = parseGitHubURL(githubURL);
  if (!parsed) throw new Error("Invalid GitHub URL");

  const { owner, repo } = parsed;
  console.log(`👤 Owner: ${owner}, 📦 Repo: ${repo}`);

  let repoInfo = {};
  let contributors = [];
  let languages = {};
  let files = [];

  try {
    // Repo info
    const res = await octokit.rest.repos.get({ owner, repo });
    repoInfo = res.data;
    console.log(`🔒 Repo privacy: ${repoInfo.private ? "Private" : "Public"}`);

    // Contributors
    try {
      contributors = (await octokit.rest.repos.listContributors({ owner, repo, per_page: 10 })).data;
    } catch (err) {
      console.warn("⚠️ Failed to fetch contributors:", err.message);
    }

    // Languages
    try {
      languages = (await octokit.rest.repos.listLanguages({ owner, repo })).data;
    } catch (err) {
      console.warn("⚠️ Failed to fetch languages:", err.message);
    }

    // File tree
    const rawFiles = await getFilesRecursively(owner, repo, "", 0, 2);
    files = mapFiles(rawFiles);

  } catch (err) {
    if (err.status === 404) {
      console.warn("⚠️ Repo not found or private without access");
      repoInfo = { private: true, notAccessible: true, name: repo, owner: { login: owner } };
    } else {
      throw err; // Other errors bubble up
    }
  }

  return { repoInfo, contributors, languages, files };
}

// get repo activity: commits (for heatmap + contributor stats)
async function fetchRepoActivity(githubURL) {
  const parsed = parseGitHubURL(githubURL);
  if (!parsed) throw new Error("Invalid Github URL");
  const { owner, repo } = parsed;

  // fetch contributors 
  let contributors = [];
  try {
    const { data } = await octokit.rest.repos.listContributors({
      owner,
      repo,
      per_page: 30
    });

    contributors = data.map(c => ({
      login: c.login,
      avatar_url: c.avatar_url,
      commits: c.contributions
    }));
  } catch (err) {
    console.warn("Failed to fetch contributors:", err.message);
  }

  // fetch commits for heatmap + commitDetails
  let heatmap = {};
  let commitDetails = {};
  try {
    const { data: commits } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      per_page: 100,   
    });

    commits.forEach(commit => {
      const dateKey = new Date(commit.commit.author.date).toISOString().split("T")[0];

      // heatmap counts
      heatmap[dateKey] = (heatmap[dateKey] || 0) + 1;

      // commit details
      if (!commitDetails[dateKey]) commitDetails[dateKey] = [];
      commitDetails[dateKey].push({
        login: commit.author?.login || commit.commit.author.name,
        message: commit.commit.message,
        sha: commit.sha
      });
    });
  } catch (err) {
    console.warn("Failed to fetch commits:", err);
  }

  return { contributors, heatmap, commitDetails };
}


module.exports = { fetchRepoData, fetchRepoActivity };
