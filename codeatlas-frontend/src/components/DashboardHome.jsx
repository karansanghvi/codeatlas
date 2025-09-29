import React from "react";
import AnalyzedProject from "./AnalyzedProject";
import "../assets/styles/dashboard.css";

function DashboardHome({
  fullName,
  setFullName,
  githubURL,
  setGithubURL,
  isAnalyzing,
  setIsAnalyzing,
  setActivePage,
}) {
  const handleAnalyzeClick = async () => {
    if (githubURL.trim() === "") {
      alert("Please enter a github url");
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
        if (data.repoInfo.notAccessible) {
          console.log("Repo is private and not accessible.");
        } else {
          console.log(
            `🔒 Repo is ${data.repoInfo.private ? "Private" : "Public"}`
          );
          setIsAnalyzing(true);
        }
      } else {
        console.error("❌ Error analyzing repo:", data.error);
      }
    } catch (err) {
      console.error("❌ Failed to analyze repo:", err);
    }
  };

  console.log("Full Name in DashboardHome:", setFullName);

  return (
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
  );
}

export default DashboardHome;
