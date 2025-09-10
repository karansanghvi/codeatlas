import React from 'react'
import AnalyzedProject from './AnalyzedProject';
import "../assets/styles/dashboard.css";

function DashboardHome({fullName, githubURL, setGithubURL, isAnalyzing, setIsAnalyzing, setActivePage}) {

  const handleAnalyzeClick = () => {
    if (githubURL.trim() !== "") {
        setIsAnalyzing(true);
    } else {
        alert("Please enter a github url");
    }
  };

  return (
    <>
      <div>
        {isAnalyzing ? (
          <AnalyzedProject githubURL={githubURL} setActivePage={setActivePage} />
        ) : (
          <>
            <section className="welcome-section">
              <h1>Hello {fullName || "User"} 👋</h1>
            </section>

            {/* Analyze A New Project */}
            <section className="project-input-section">
              <h2 className="section-title">Analyze a New Project</h2>

              {/* GitHub Input */}
              <div className="github-option">
                <input
                  type="text"
                  placeholder="Paste your GitHub repo URL..."
                  className="repo-input"
                  value={githubURL}
                  onChange={(e) => setGithubURL(e.target.value)}
                />
                <button
                  className="dashboard-button"
                  onClick={handleAnalyzeClick}
                >
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
    </>
  )
}

export default DashboardHome
