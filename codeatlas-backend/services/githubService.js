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

  // Repo info
  const repoInfo = (await octokit.rest.repos.get({ owner, repo })).data;

  // Contributors
  let contributors = [];
  try {
    contributors = (await octokit.rest.repos.listContributors({ owner, repo, per_page: 10 })).data;
  } catch (err) {
    console.warn("⚠️ Failed to fetch contributors:", err.message);
  }

  // Languages
  let languages = {};
  try {
    languages = (await octokit.rest.repos.listLanguages({ owner, repo })).data;
  } catch (err) {
    console.warn("⚠️ Failed to fetch languages:", err.message);
  }

  // File tree
  const rawFiles = await getFilesRecursively(owner, repo, "", 0, 2);
  const files = mapFiles(rawFiles);

  return { repoInfo, contributors, languages, files };
}

module.exports = { fetchRepoData };
