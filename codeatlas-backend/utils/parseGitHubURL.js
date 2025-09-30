// function parseGitHubURL(url) {
//   try {
//     const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)(\/|$)/);
//     if (!match) throw new Error("Invalid GitHub URL");
//     return { owner: match[1], repo: match[2] };
//   } catch (err) {
//     console.error("❌ URL parsing failed:", err.message);
//     return null;
//   }
// }

// module.exports = parseGitHubURL;
// utils/parseGitHubURL.js

export default function parseGitHubURL(url) {
  try {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)(\/|$)/);
    if (!match) throw new Error("Invalid GitHub URL");
    return { owner: match[1], repo: match[2] };
  } catch (err) {
    console.error("❌ URL parsing failed:", err.message);
    return null;
  }
}
