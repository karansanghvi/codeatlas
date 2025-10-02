import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/auth";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import AnalyzedProject from "./AnalyzedProject";
import "../assets/styles/analyzedProjects.css";
import "../assets/styles/projects.css";
import no_user from "../assets/images/user-avatar.png";
import no_projects from "../assets/images/no_project.png";
import { Link } from "react-router-dom";

function Projects() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRepoURL, setSelectedRepoURL] = useState(null);
  const [user, setUser] = useState(null);
  const [repoToDelete, setRepoToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Fetch only current user's analyzed repos from Firestore
  useEffect(() => {
    if (!user) return;

    const fetchRepos = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setRepos(userData.analyzedRepos || []);
        } else {
          console.log("No user data found");
          setRepos([]);
        }
      } catch (err) {
        console.error("Failed to fetch user repos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, [user]);

  if (!user) {
    return (
      <div className="not-logged-in">
        <img 
          src={no_user}  
          alt="Please login"
          className="login-image"
        />
        <h2 className="login-message">Please login to view your projects.</h2>
        <br />
        <button className="project-button">
          <Link to="/login" style={{ textDecoration: 'none', color: 'white' }}>
            Go to Login
          </Link>
        </button>
      </div>
    );
  }

  if (loading) return (
    <div className="not-logged-in">
      <img 
        src={no_user}  
        alt="Please login"
        className="login-image"
      />
      <h2 className="login-message">Please login to view your projects.</h2>
      <br />
      <button className="project-button">
        <Link to="/login" style={{ textDecoration: 'none', color: 'white' }}>
          Go to Login
        </Link>
      </button>
    </div>
  );
  if (!repos.length) return (
    <div className="not-logged-in">
      <img 
        src={no_projects}  
        alt="Please login"
        className="login-image"
      />
      <h2 className="login-message">No Projects Found.</h2>
      <br />
    </div>
  );

  if (selectedRepoURL) {
    return (
      <AnalyzedProject 
        githubURL={selectedRepoURL} 
        setActivePage={() => setSelectedRepoURL(null)} 
      />
    );
  }

  // Delete repo from Firestore
  const handleDeleteRepo = async (repo) => {
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        analyzedRepos: arrayRemove(repo)
      });
      setRepos(repos.filter((r) => r.url !== repo.url));
      setShowDeleteModal(false);
    } catch (err) {
      console.error("Failed to delete repo:", err);
    }
  };

  return (
    <>
      <div className="projects-section">
        <h2>Projects</h2>
        <div className="projects-grid">
          {repos.map((repo, index) => (
            <div key={index} className="project-card">
              <h3>{repo.url.split("/").slice(-2).join("/")}</h3> 
              <p>Analyzed at: {new Date(repo.analyzedAt?.seconds * 1000 || repo.analyzedAt).toLocaleString()}</p>
              <div className="button-container">
                <button
                  className="project-button"
                  onClick={() => setSelectedRepoURL(repo.url)}
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
            <p>Are you sure you want to delete <b>{repoToDelete?.url.split("/").slice(-2).join("/")}</b>?</p>
            <div className="modal-actions">
              <button
                onClick={() => handleDeleteRepo(repoToDelete)}
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
