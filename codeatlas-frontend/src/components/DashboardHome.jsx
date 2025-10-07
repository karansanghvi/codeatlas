import React, { useEffect, useState } from "react";
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
  const [githubToken, setGithubToken] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("githubToken");
    if (token) setGithubToken(token);
  }, []);

  // const handleAnalyzeClick = async () => {
  //   if (githubURL.trim() === "") {
  //     alert("Please enter a GitHub URL");
  //     return;
  //   }

  //   try {
  //     const res = await fetch("http://localhost:5000/api/files", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ githubURL }),
  //     });

  //     const data = await res.json();

  //     if (res.ok) {
  //       if (data.repoInfo.notAccessible || data.repoInfo.private) {
  //         console.log("Repo is private and not accessible.");
  //         setShowPrivateModal(true);
  //         setGithubURL("");
  //         return; 
  //       } else {
  //         console.log(`Repo is Public ✅`);
  //         setIsAnalyzing(true);

  //         const user = auth.currentUser;
  //         if (user) {
  //           const userRef = doc(db, "users", user.uid);
  //           await updateDoc(userRef, {
  //             analyzedRepos: arrayUnion({
  //               url: githubURL,
  //               analyzedAt: new Date(),
  //             }),
  //           });
  //           console.log("Repo URL saved for user.");

  //           setGithubURL("");
  //         }
  //       }
  //     }

  //   } catch (err) {
  //     console.error("❌ Failed to analyze repo:", err);
  //   }
  // };
  const handleAnalyzeClick = async () => {
    if (githubURL.trim() === "") {
      alert("Please enter a GitHub URL");
      return;
    }

    if (!githubToken) {
      alert("Please enter your GitHub token in Settings before analyzing a repo.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/files", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `token ${githubToken}`
         },
        body: JSON.stringify({ githubURL, token: githubToken }),
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
      } else {
        console.error("Failed to analyze repo:", data.error);
        alert(data.error);
      }

    } catch (err) {
      console.error("❌ Failed to analyze repo:", err);
      alert("Failed to analyze repo. Check token or URL.");
    }
  };

  console.log("Full Name in DashboardHome:", setFullName);

  return (
    <>
    <div>
      {isAnalyzing ? (
        <AnalyzedProject githubURL={githubURL} setActivePage={setActivePage} githubToken={githubToken} />
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

          <br />

          <h2 className="section-title">Features Of CodeAtlas</h2>

          <section className="cards-section">
            <div className="card">
              <h3>Repo Overview</h3>
              <p>Get a complete snapshot of your repository, including its current status, main programming languages, top contributors, and overall file structure for quick insights.</p>
            </div>

            <div className="card">
              <h3>Code Architecture</h3>
              <p>Visualize your entire codebase with an interactive graph showing files, classes, functions, and their dependencies. Easily understand relationships, spot complex areas, and plan refactors.</p>
            </div>

            <div className="card">
              <h3>Activity & Analysis</h3>
              <p>Track repository activity over the past year with a commit heatmap. Click on any date to see detailed commits and contributors, and view a list of all contributors with their total commit counts.</p>
            </div>

            <div className="card">
              <h3>Productivity & Contributions</h3>
              <p>Monitor each contributor’s activity, including commits, lines added/removed, and files changed. Highlight top contributors and see code churn for the most frequently modified files.</p>
            </div>
          </section>

          {/* Bottom Section */}
          <section className="bottom-section">
            <div className="card">
              <h3>Collaboration Insights</h3>
              <p>Review pull request activity in detail, including PR messages, authors, review comments, and current status, to improve collaboration and code quality.</p>
            </div>

            <div className="card">
              <h3>Time-Based Insights</h3>
              <p>Analyze commit patterns over time with charts showing active hours, commits by day, trends, streaks, and average commit times per contributor to understand productivity patterns.</p>
            </div>
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