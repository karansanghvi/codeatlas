import React, { useEffect, useState } from "react";
import AnalyzedProject from "./AnalyzedProject";
import "../assets/styles/analyzedProjects.css";
import "../assets/styles/projects.css";

function Projects() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRepoURL, setSelectedRepoURL] = useState(null);

  // Fetch repos from backend
  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/repositories");
        const data = await res.json();
        setRepos(data);
      } catch (err) {
        console.error("Failed to fetch repos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRepos();
  }, []);

  if (loading) return <p>Loading projects...</p>;
  if (!repos.length) return <p>No projects found.</p>;

  if (selectedRepoURL) {
    return (
      <div>
        <AnalyzedProject githubURL={selectedRepoURL} />
      </div>
    );
  }

  return (
    <div className="projects-section">
      <h2>Projects</h2>
      <div className="projects-grid">
        {repos.map((repo) => (
          <div key={repo.id} className="project-card">
            <h3>{repo.name}</h3>
            <br />
            <button
              className="project-button"
              onClick={() => setSelectedRepoURL(repo.github_url)}
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Projects;
