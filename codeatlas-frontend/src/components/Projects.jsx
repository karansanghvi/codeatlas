import React, { useEffect, useState } from "react";
import AnalyzedProject from "./AnalyzedProject";
import "../assets/styles/analyzedProjects.css";
import "../assets/styles/projects.css";

function Projects() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRepoURL, setSelectedRepoURL] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [repoToDelete, setRepoToDelete] = useState(null);

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
    <>
    <div className="projects-section">
      <h2>Projects</h2>
      <div className="projects-grid">
        {repos.map((repo) => (
          <div key={repo.id} className="project-card">
            <h3>{repo.name}</h3>
            <br />
            <div className="button-container">
              <button
                className="project-button"
                onClick={() => setSelectedRepoURL(repo.github_url)}
              >
                View 
              </button>
              <button
                className="delete-button"
                onClick={() => {
                  setRepoToDelete(repo);
                  setShowDeleteModal(true);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>

    {showDeleteModal && (
      <div className="modal-overlay">
        <div className="modal">
          <p>Are you sure you want to delete <b>{repoToDelete?.name}</b>?</p>
          <div className="modal-actions">
            <button
              onClick={async () => {
                try {
                  await fetch(`http://localhost:5000/api/repositories/${repoToDelete.id}`, {
                    method: "DELETE",
                  });
                  // remove deleted repo from state
                  setRepos(repos.filter((r) => r.id !== repoToDelete.id));
                  setShowDeleteModal(false);
                } catch (err) {
                  console.error("Failed to delete repo:", err);
                }
              }}
              className="yes-button"
            >
              Yes
            </button>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="no-button"
            >
              No
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default Projects;
