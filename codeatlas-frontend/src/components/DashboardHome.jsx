import React, { useState } from "react";
import AnalyzedProject from "./AnalyzedProject";
import "../assets/styles/dashboard.css";
import { auth, db } from "../firebase/auth";
import { arrayUnion, doc, updateDoc } from "firebase/firestore";

function DashboardHome({
  fullName,
  setFullName,
  githubURL,
  setGithubURL,
  isAnalyzing,
  setIsAnalyzing,
  setActivePage,
}) {

  const [showPrivateModal, setShowPrivateModal] = useState(false);

  const handleAnalyzeClick = async () => {
    if (githubURL.trim() === "") {
      alert("Please enter a GitHub URL");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubURL }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.repoInfo.notAccessible || data.repoInfo.private) {
          console.log("Repo is private and not accessible.");
          setShowPrivateModal(true);
          setGithubURL("");
          return; 
        } else {
          console.log(`Repo is Public ✅`);
          setIsAnalyzing(true);

          const user = auth.currentUser;
          if (user) {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
              analyzedRepos: arrayUnion({
                url: githubURL,
                analyzedAt: new Date(),
              }),
            });
            console.log("Repo URL saved for user.");

            setGithubURL("");
          }
        }
      }

    } catch (err) {
      console.error("❌ Failed to analyze repo:", err);
    }
  };

  console.log("Full Name in DashboardHome:", setFullName);

  return (
    <>
    <div>
      {isAnalyzing ? (
        <AnalyzedProject githubURL={githubURL} setActivePage={setActivePage} />
      ) : (
        <>
          {/* Welcome Section */}
          <section className="welcome-section">
            <h1>Hello {fullName || "User"} 👋</h1>
          </section>

          {/* Analyze A New Project */}
          <section className="project-input-section">
            <h2 className="section-title">Analyze a New Project</h2>

            <div className="github-option">
              <input
                type="text"
                placeholder="Paste your GitHub repo URL..."
                className="repo-input"
                value={githubURL}
                onChange={(e) => setGithubURL(e.target.value)}
              />
              <button className="dashboard-button" onClick={handleAnalyzeClick}>
                Analyze
              </button>
            </div>
          </section>

          {/* Cards Section */}
          <section className="cards-section">
            <div className="card">Recent Project</div>
            <div className="card">Resources</div>
            <div className="card">Performance</div>
            <div className="card">To-Do List</div>
          </section>

          {/* Bottom Section */}
          <section className="bottom-section">
            <div className="card">Recent Projects</div>
            <div className="card">Upcoming Lessons</div>
          </section>
        </>
      )}
    </div>

    {showPrivateModal && (
      <div className="modal-overlay">
        <div className="modal">
          <h2>Private Repository</h2>
          <p>This repository is private and cannot be analyzed. Please make it public to proceed with the analysis.</p>
          <br />
          <button 
            onClick={() => setShowPrivateModal(false)} 
            className="project-button"
          > 
            Ok
          </button>
        </div>
      </div>
    )}
    </>
  );
}

export default DashboardHome;