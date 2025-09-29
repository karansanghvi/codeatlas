import React, { useEffect, useState } from "react";
import "../assets/styles/analyzedProjects.css";
import { IoChevronBackOutline } from "react-icons/io5";
import ArchitectureGraph from "./ArchitectureGraph";
import ReactCalendarHeatmap from "react-calendar-heatmap";
import { Tooltip as ReactTooltip } from 'react-tooltip'

function FileTree({ files, level = 0, collapsedFolders = {}, toggleFolder }) {
  const rootFiles = files.filter(f => f.type === "file");
  const folders = files.filter(f => f.type === "folder").reduce((acc, folder) => {
    acc[folder.name] = folder.children;
    return acc;
  }, {});

  return (
    <ul className="file-tree">
      {rootFiles.map(file => (
        <li key={file.path} className="file-item" style={{ paddingLeft: `${level * 20}px` }}>
          📄 <a href={file.download_url} target="_blank" rel="noopener noreferrer">{file.name}</a>
        </li>
      ))}

      {Object.keys(folders).map(folder => (
        <li key={folder} className="folder-item" style={{ paddingLeft: `${level * 20}px` }}>
          <div className="folder-name" onClick={() => toggleFolder(folder)}>
            {collapsedFolders[folder] ? "📁" : "📂"} {folder}
          </div>
          {!collapsedFolders[folder] && (
            <FileTree 
              files={folders[folder]} 
              level={level + 1} 
              collapsedFolders={collapsedFolders} 
              toggleFolder={toggleFolder} 
            />
          )}
        </li>
      ))}
    </ul>
  );
}

function AnalyzedProject({ githubURL, setActivePage }) {
  const [files, setFiles] = useState([]);
  const [repoInfo, setRepoInfo] = useState(null);
  const [contributors, setContributors] = useState([])
  const [languages, setLanguages] = useState({});
  const [, setLoading] = useState(true);
  const [collapsedFolders, setCollapsedFolders] = useState({});
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);
  const [activity, setActivity] = useState(null);
  const [selectedCommits, setSelectedCommits] = useState([]);
  const [isTooltipModalOpen, setIsTooltipModalOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const repoName = githubURL?.split("/").slice(-1)[0] || "Project";
  const safeSetActivePage = setActivePage || (() => {});

  const toggleFolder = (folder) => {
    setCollapsedFolders(prev => ({ ...prev, [folder]: !prev[folder] }));
  };

  useEffect(() => {
    const fetchRepoData = async () => {
      if (!githubURL) return;
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ githubURL }),
        });
        const data = await res.json();
        setFiles(data.files || []);
        setRepoInfo(data.repoInfo);
        setContributors(data.contributors || []);
        setLanguages(data.languages || {});
      } catch (err) {
        console.error("Error fetching repo data: ", err);
      }
      setLoading(false);
    };
    fetchRepoData();
  }, [githubURL]);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!githubURL) return;
      try {
        const res = await fetch("http://localhost:5000/api/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ githubURL }),
        });
        const data = await res.json();
        setActivity(data);

        console.log("Fetched activity:", data);
        console.log("Commit details keys:", Object.keys(data.commitDetails || {}));
      } catch (err) {
        console.error("Error fetching activity: ", err);
      }
    };
    fetchActivity();
  }, [githubURL]);

  useEffect(() => {
    const container = document.querySelector(".analyzed-project-card"); // or whatever wrapper scrolls
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop > 300) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    const container = document.querySelector(".analyzed-project-card");
    if (container) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    console.log("showScrollButton:", showScrollButton);
  }, [showScrollButton]);

  return (
    <>
      <div className="analyzed-project-card">
        {githubURL && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button 
                className="back-button"
                onClick={() => safeSetActivePage("Projects")}
              >
                <IoChevronBackOutline size={20} />
              </button>
              <h1 className="card-title">{repoInfo?.name || repoName}</h1>
            </div>

            <a href={githubURL} target="_blank" rel="noopener noreferrer">
              <button className="dashboard-button">View On GitHub</button>
            </a>
          </div>
        )}

        <div className="dashboard-grid">
          {/* Repo Stats Card */}
          <div className="repo-card">
            <h3>Repo Stats</h3>
            <div className="repo-stats">
              ⭐ Stars: {repoInfo?.stargazers_count} <br />
              🍴 Forks: {repoInfo?.forks_count} <br />
              📝 Open Issues: {repoInfo?.open_issues_count} <br />
              🌿 License: {repoInfo?.license?.name || "N/A"}
            </div>
          </div>

          {/* Languages Card */}
          <div className="languages-card">
            <h3>Languages</h3>
            {Object.keys(languages || {}).map(lang => (
              <span key={lang} className="language-badge">{lang}: {languages[lang]} bytes</span>
            ))}
          </div>

          {/* Contributors Card */}
          <div className="contributors-card">
            <h3>Top Contributors</h3>
            <div className="contributors">
              {contributors?.map(c => (
                <img key={c.login} src={c.avatar_url} title={`${c.login} (${c.contributions} commits)`} />
              ))}
            </div>
          </div>

          {/* File Structure Card */}
          <div className="file-card">
            <h3 style={{ marginBottom: '5px' }}>File Structure</h3>
            <p style={{ marginBottom: '5px' }}>Explore the repository’s file structure by clicking the button below.</p>
            <button 
              className="view-button"
              onClick={() => setIsFileModalOpen(true)}
            >
              View Files
            </button>
          </div>
        </div>

        <br />

        {/* Code Architecture Card */}
        <div className="file-card">
          <div className="code-architecture-grid">
            <div>
              <h3 style={{ marginBottom: '5px' }}>Code Architecture</h3>
              <p style={{ marginBottom: '10px' }}>Graphical view of the codebase showing classes, functions, and their interconnections.</p>
            </div>
            <div>
              <button 
                className="dashboard-button"
                onClick={() => setIsArchModalOpen(true)}
              >
                View Architecture
              </button>
            </div>
          </div>
        </div>

        <br />

        {/* Activity and Analysis */}
        <div className="file-card">
          <h3 style={{ marginBottom: '5px' }}>Activity & Analysis</h3>
          <p>Visualizes repository activity over the past year with a commit heatmap and shows each contributor's total commits and details.</p>

          {activity && (
            <>
              {/* Commit Heatmap */}
              <div style={{ marginTop: '20px' }}>
                <ReactCalendarHeatmap
                  startDate={new Date(new Date().setMonth(new Date().getMonth() - 12))}
                  endDate={new Date()}
                  values={Object.entries(activity.heatmap || {}).map(([date, count]) => ({ date, count }))}
                  classForValue={(value) => {
                    if (!value) return "color-empty";
                    return `color-scale-${Math.min(value.count, 4)}`;
                  }}
                  gutterSize={2}
                  rectSize={12}
                  showWeekdayLabels={true}
                  onClick={(value) => {
                    if (!value) {
                      setSelectedCommits([]);
                      setIsTooltipModalOpen(true);
                      return;
                    }

                    // Normalize date to YYYY-MM-DD
                    let dateKey = value.date;
                    if (dateKey.includes('T')) {
                      dateKey = dateKey.split('T')[0];
                    }
                    // Replace slashes with dashes if commitDetails uses that
                    dateKey = dateKey.replace(/\//g, '-');

                    const commitsForDate = activity?.commitDetails?.[dateKey] || [];
                    setSelectedCommits(commitsForDate);
                    setIsTooltipModalOpen(true);

                    console.log("Clicked date:", value.date);
                    console.log("Normalized date key:", dateKey);
                    console.log("Commits:", commitsForDate);
                  }}
                />
                <ReactTooltip multiline={true} place="top" type="dark" effect="solid" />
              </div>

              {/* Contributor Analysis */}
              <h4>Contributors</h4>
              <div className="contributors-container">
                {activity.contributors.map(c => (
                  <div key={c.login} className="contributor-card">
                    <img src={c.avatar_url} alt={c.login} className="contributor-avatar" />
                    <div className="contributor-info">
                      <span className="contributor-name">{c.login}</span>
                      <span className="contributor-commits">{c.commits} commits</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <br />

        {/* Productivity And Contributions Card */}
        <div className="file-card">
          {activity?.contributors?.length > 0 && (() => {
            // Compute max values for scaling
            const maxCommits = Math.max(...activity.contributors.map(c => c.commits));
            const maxAdded = Math.max(...activity.contributors.map(c => c.linesAdded));
            const maxRemoved = Math.max(...activity.contributors.map(c => c.linesRemoved));
            const maxFiles = Math.max(...activity.contributors.map(c => c.filesChanged));

            // Find the top contributor by commits
            const topContributor = activity.contributors.reduce((top, c) => c.commits > top.commits ? c : top, activity.contributors[0]);

            return (
              <>
              <h3 style={{ marginBottom: '5px' }}>Productivity and Contributions</h3>
              <p style={{ marginBottom: '10px' }}>Displays each contributor's activity - commits, lines added/removed and files changed - while highlighting the top contributor and overall team contributions.</p>
              <h4>Top Contributor</h4>
              <div className="contributor-card">
                <img src={topContributor.avatar_url} alt={topContributor.login} className="contributor-avatar" />
                  <div className="contributor-info">
                    <span className="contributor-name">{topContributor.login}</span>
                    <span className="contributor-commits">{topContributor.commits} commits</span>
                  </div>
              </div>

              <br />

              <h4>Team Contribution Status</h4>
              <div className="contributors-metrics">
                {activity.contributors
                  .sort((a, b) => b.commits - a.commits)
                  .map(c => (
                  <div key={c.login} className="contributor-card">
                    <img src={c.avatar_url} alt={c.login} className="contributor-avatar" />
                    <div className="contributor-info">
                      <span className="contributor-name">{c.login}</span>

                      <div className="metric">
                        <span role="img" aria-label="commits"></span> Commits: {c.commits}
                        <div
                          className="metric-bar"
                          style={{ width: `${(c.commits / maxCommits) * 100}%`, backgroundColor: "#4caf50" }}
                        />
                      </div>

                      <div className="metric">
                        <span role="img" aria-label="lines-added"></span> Lines Added: {c.linesAdded}
                        <div
                          className="metric-bar"
                          style={{ width: `${(c.linesAdded / maxAdded) * 100}%`, backgroundColor: "#4caf50" }}
                        />
                      </div>

                      <div className="metric">
                        <span role="img" aria-label="lines-removed"></span> Lines Removed: {c.linesRemoved}
                        <div
                          className="metric-bar"
                          style={{ width: `${(c.linesRemoved / maxRemoved) * 100}%`, backgroundColor: "#f44336" }}
                        />
                      </div>

                      <div className="metric">
                        <span role="img" aria-label="files-changed"></span> Files Changed: {c.filesChanged}
                        <div
                          className="metric-bar"
                          style={{ width: `${(c.filesChanged / maxFiles) * 100}%`, backgroundColor: "#2196f3" }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <br />
              <h4>Code Churn</h4>
              <p style={{ marginBottom: '5px' }}>Files with the most changes and contributors touching them.</p>
              <div className="churn-list">
                {activity?.fileChurn?.map((file, idx) => {
                  const maxChanges = Math.max(...activity.fileChurn.map(f => f.totalChanges));
                  return (
                    <div key={idx} className="churn-item">
                      <div className="churn-file-info">
                        <span className="churn-filename">{file.filename}</span>
                        <span className="churn-total">Total Changes: {file.totalChanges}</span>
                      </div>
                      
                      <div className="churn-bar-container">
                        <div
                          className="churn-bar"
                          style={{ width: `${(file.totalChanges / maxChanges) * 100}%` }}
                        />
                      </div>

                      <div className="churn-contributors">
                        {file.contributors.map((c, i) => (
                          <img
                            key={i}
                            src={`https://github.com/${c}.png`} // show GitHub avatar
                            alt={c}
                            title={c}
                            className="contributor-avatar"
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              </>
            );
          })()}
        </div>

        <br />

        <div className="file-card">
          
        </div>


        {showScrollButton && (
          <button className="scroll-to-top" onClick={scrollToTop}>
            ⬆
          </button>
        )}
      </div>

      {/* Modal To See File Structure */}
      {isFileModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>File Structure</h2>
            <div className="modal-body">
              <FileTree 
                files={files} 
                collapsedFolders={collapsedFolders} 
                toggleFolder={toggleFolder} 
              />
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setIsFileModalOpen(false)}
                className="view-button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal To See Architecture */}
      {isArchModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Code Architecture</h2>
            <p>Visualize your codebase structure with an interactive graph showing files, classes, functions, and their dependencies. Great for understanding relationships, spotting complexity, and planning refactors.</p>
            <div className="modal-body">
              <ArchitectureGraph githubURL={githubURL} />
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setIsArchModalOpen(false)}
                className="view-button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal To Display The Commits */}
      {isTooltipModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content commits-modal">
            <h3>Commits for Selected Date</h3>
            <div className="modal-body commits-body">
              {selectedCommits.length === 0 ? (
                <p>No commits on this day.</p>
              ) : (
                <div className="commit-list">
                  {selectedCommits.map((c, index) => (
                    <div key={index} className="commit-card">
                      <div className="commit-user">{c.login}</div>
                      <div className="commit-message">{c.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setIsTooltipModalOpen(false)} 
                className="view-button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AnalyzedProject;
