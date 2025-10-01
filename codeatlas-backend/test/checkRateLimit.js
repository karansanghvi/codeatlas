import dotenv from "dotenv";
import { Octokit } from "@octokit/rest";

dotenv.config({ path: "../.env" }); 

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const checkRateLimit = async () => {
  try {
    const { data } = await octokit.rest.rateLimit.get();
    console.log("Rate limit info:", data.rate);
  } catch (err) {
    console.error("❌ Failed to fetch rate limit:", err.message);
  }
};

checkRateLimit();
