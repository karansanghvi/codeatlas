import React, { useEffect, useState } from "react";
import "../assets/styles/analyzedProjects.css";
import { IoChevronBackOutline } from "react-icons/io5";
import ArchitectureGraph from "./ArchitectureGraph";
import ReactCalendarHeatmap from "react-calendar-heatmap";
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line} from "recharts";
import CommitsByDayTooltip from "./analyzedProject/CommitsByDayTooltip";
import CommitsOverTimeTooltip from "./analyzedProject/CommitsOverTimeTooltip";
import { PieChart, Pie, Cell, Legend } from "recharts";
import CustomTooltip from "./analyzedProject/CustomTooltip";

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
};

const ChurnTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const contributors = payload[0].payload.contributors;
    return (
      <div style={{ background: "#fff", padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}>
        <strong>{label}</strong>
        <div>Total Changes: {payload[0].value}</div>
        <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
          {contributors.map((c, i) => (
            <img
              key={i}
              src={`https://github.com/${c}.png`}
              alt={c}
              title={c}
              style={{ width: "25px", height: "25px", borderRadius: "50%" }}
            />
          ))}
        </div>
      </div>
    );
  }
  return null;
};

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
  const [pullRequests, setPullRequests] = useState([]);
  const [devHours, setDevHours] = useState({});
  const [devStreaks, setDevStreaks] = useState({});
  const [showScrollButton, setShowScrollButton] = useState(false);

  const repoName = githubURL?.split("/").slice(-1)[0] || "Project";
  const safeSetActivePage = setActivePage || (() => {});

  const toggleFolder = (folder) => {
    setCollapsedFolders(prev => ({ ...prev, [folder]: !prev[folder] }));
  };

  // Fetch Repo Data
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

  // Fetch Activity Data with Polling
  useEffect(() => {
    let lastCommitSha = null; 

    const fetchActivity = async () => {
      if (!githubURL) return;
      try {
        const res = await fetch("http://localhost:5000/api/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ githubURL }),
        });
        const data = await res.json();

        console.log("📦 API /activity response:", data);
        console.log("📝 commitDetails sample:", Object.values(data.commitDetails)?.[0]?.slice(0, 3));

        if (data?.commitDetails) {
          const allCommits = Object.values(data.commitDetails).flat();
          const latestCommit = allCommits[0]; 

          if (latestCommit && latestCommit.sha !== lastCommitSha) {
            console.log("🚀 New commit detected:", latestCommit);
            lastCommitSha = latestCommit.sha;
            setActivity(data); 
          }
        }
      } catch (err) {
        console.error("Error fetching activity:", err);
      }
    };

    fetchActivity(); 
    const interval = setInterval(fetchActivity, 30000); 
    return () => clearInterval(interval);
  }, [githubURL]);

  // Dev Hours
  useEffect(() => {
    if (!activity?.commitDetails) return;

    const devHours = {};

    Object.values(activity.commitDetails).flat().forEach(commit => {
      const dev = commit.login;
      const date = new Date(commit.date);
      if (isNaN(date)) return; // Skip bad dates
      const hour = date.getHours();
      if (!devHours[dev]) devHours[dev] = Array(24).fill(0);
      devHours[dev][hour]++;
    });

    setDevHours(devHours);
  }, [activity]);

  // Dev Streaks
  useEffect(() => {
    if (!activity?.commitDetails) return;

    const devDates = {};

    Object.values(activity.commitDetails).flat().forEach(commit => {
      const dev = commit.login;
      const date = new Date(commit.date);
      if (isNaN(date)) return; // Skip bad dates
      const dateStr = date.toISOString().split("T")[0];
      if (!devDates[dev]) devDates[dev] = new Set();
      devDates[dev].add(dateStr);
    });

    const devStreaks = {};

    Object.entries(devDates).forEach(([dev, datesSet]) => {
      const dates = Array.from(datesSet).sort();
      let longest = 0, current = 0, prev = null;

      dates.forEach(d => {
        const date = new Date(d);
        if (prev && (date - prev === 86400000)) {
          current++;
        } else {
          current = 1;
        }
        longest = Math.max(longest, current);
        prev = date;
      });

      devStreaks[dev] = { longestStreak: longest };
    });

    setDevStreaks(devStreaks);
  }, [activity]);

  // Fetch Pull Requests
  useEffect(() => {
    const fetchPRs = async () => {
      if (!githubURL) return;
      try {
        const res = await fetch("http://localhost:5000/api/prs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ githubURL }),
        });
        const data = await res.json();
        setPullRequests(data);
      } catch (err) {
        console.error("Error fetching PRs:", err);
      }
    };

    fetchPRs();
  }, [githubURL]);

  // Go To Top Page
  useEffect(() => {
    const container = document.querySelector(".analyzed-project-card"); 
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

  // Compute total commits by hour across all devs
  const totalHoursData = Array(24).fill(0);

    Object.values(devHours || {}).forEach(hoursArr => {
      hoursArr.forEach((count, hour) => {
        totalHoursData[hour] += count;
      });
    });

    const pieData = Object.entries(devHours).flatMap(([dev, hoursArr]) =>
    hoursArr.map((count, hour) => ({
      name: `${hour}:00`,
      value: count,
      contributors: count > 0 ? [{ dev, count }] : []
    }))
  ).filter(d => d.value > 0);


  const renderLabel = ({ name }) => name;

  // Some colors for pie slices
  const COLORS = [
    "#0088FE", "#00C49F", "#FFBB28", "#FF8042",
    "#8884d8", "#82ca9d", "#ffc658", "#d0ed57",
    "#a4de6c", "#8dd1e1", "#83a6ed", "#ff6f61",
    "#ff9f40", "#36a2eb", "#4bc0c0", "#9966ff",
    "#ffcd56", "#c9cbcf", "#f87171", "#34d399",
    "#60a5fa", "#fbbf24", "#a78bfa", "#10b981"
  ];

  // Commits By Day Of Week
  const commitsByDay = {};
    if (activity?.commitDetails) {
      Object.values(activity.commitDetails).flat().forEach(commit => {
        const day = new Date(commit.date).toLocaleDateString('en-US', { weekday: 'short' });
        commitsByDay[day] = (commitsByDay[day] || 0) + 1;
      });
    }

    const commitsByDayData = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day => {
    const allCommits = activity?.commitDetails ? Object.values(activity.commitDetails).flat() : [];
    
    const commits = allCommits.filter(c => new Date(c.date).toLocaleDateString('en-US', { weekday: 'short' }) === day);
    const contributors = [...new Set(commits.map(c => c.login))];

    return {
      day,
      commits: commits.length,
      contributors
    };
  });

  // Commit Trend Over Time
  const commitsOverTimeData = [];

  if (activity?.commitDetails) {
    // Flatten all commits
    const allCommits = Object.values(activity.commitDetails).flat();

    // Group by date
    const commitsByDate = {};

    allCommits.forEach(commit => {
      const date = new Date(commit.date).toISOString().split("T")[0]; // YYYY-MM-DD
      if (!commitsByDate[date]) commitsByDate[date] = { count: 0, contributors: new Set() };
      commitsByDate[date].count += 1;
      commitsByDate[date].contributors.add(commit.login);
    });

    // Convert to array for recharts
    commitsOverTimeData.push(
      ...Object.keys(commitsByDate)
        .sort()
        .map(date => ({
          date,
          commits: commitsByDate[date].count,
          contributors: Array.from(commitsByDate[date].contributors)
        }))
    );
  }

    // Average Commit Time Per Contributor
    const avgCommitTime = {};
    if (activity?.commitDetails) {
      Object.values(activity.commitDetails).flat().forEach(commit => {
        const dev = commit.login;
        const hour = new Date(commit.date).getHours();
        if (!avgCommitTime[dev]) avgCommitTime[dev] = [];
        avgCommitTime[dev].push(hour);
      });
    }

    const avgCommitTimeData = Object.entries(avgCommitTime).map(([dev, hours]) => {
      const avgHour = Math.round(hours.reduce((a,b) => a+b, 0) / hours.length);
      return { dev, avgHour };
  });

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
              {activity?.contributors?.length > 0 && (
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
              )}
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
              <div className="contributors-container">
                <div className="contributor-card">
                  <img src={topContributor.avatar_url} alt={topContributor.login} className="contributor-avatar" />
                  <div className="contributor-info">
                    <span className="contributor-name">{topContributor.login}</span>
                    <span className="contributor-commits">{topContributor.commits} commits</span>
                  </div>
                </div>
              </div>

              <br />

              <h4>Team Contribution Status</h4>
              <div className="contributors-metrics">
                {activity.contributors
                  .sort((a, b) => b.commits - a.commits)
                  .map(c => (
                  <div className="contributor-container">
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
                  </div>
                ))}
              </div>

              <br />
              <h4>Code Churn</h4>
              <p style={{ marginBottom: '5px' }}>Files with the most changes and contributors touching them.</p>
              <div className="churn-list">
                {activity?.fileChurn?.length > 0 && (
                  <div style={{ width: "100%", height: 400 }}>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={activity.fileChurn.map(f => ({
                          filename: f.filename.split('/').pop(),
                          totalChanges: f.totalChanges,
                          contributors: f.contributors,
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                      >
                        <XAxis dataKey="filename" angle={-45} textAnchor="end" interval={0} />
                        <YAxis />
                        <Tooltip content={<ChurnTooltip />} />
                        <Bar dataKey="totalChanges" fill="#FF4B00" barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              </>
            );
          })()}
        </div>

        <br />

        {/* Collaboration Insights */}
        <div className="file-card">
          <h3 style={{ marginBottom: '5px' }}>Collaboration Insights</h3>
          <h4>PR Review</h4>
          <p style={{ marginBottom: '5px' }}>Displays each pull request’s details including the message, author, review comments, and current status (open or closed)</p>
            {pullRequests.length === 0 ? (
              <p className="no-pr">No PRs found</p>
              ) : (
              <div className="pr-list">
                {pullRequests.map(pr => (
                  <div key={pr.number} className="pr-card">
                    <div className="pr-header">
                      <a href={pr.url} target="_blank" rel="noopener noreferrer" className="pr-title">{pr.title}</a>
                      <span className={`pr-status ${pr.state}`}>{pr.state.toUpperCase()}</span>
                    </div>

                    <p className="pr-author"><strong>Author:</strong> {pr.author}</p>
                    {pr.merged_at && <p className="pr-merged"><strong>Merged at:</strong> {pr.merged_at}</p>}
                    {pr.merged_by && <p className="pr-merged-by"><strong>Merged by:</strong> {pr.merged_by}</p>}
                    {pr.draft && <p className="pr-draft">Draft PR</p>}
                    {pr.milestone && <p className="pr-milestone"><strong>Milestone:</strong> {pr.milestone}</p>}

                    {pr.labels.length > 0 && (
                      <p className="pr-labels">
                        <strong>Labels:</strong> {pr.labels.join(', ')}
                      </p>
                    )}
                    {pr.assignees.length > 0 && (
                      <p className="pr-assignees">
                        <strong>Assignees:</strong> {pr.assignees.join(', ')}
                      </p>
                    )}

                    <p className="pr-comments">
                      <strong>Comments:</strong> {pr.comments} | <strong>Review Comments:</strong> {pr.review_comments}
                    </p>

                    <p className="pr-size">
                      <strong>Changes:</strong> +{pr.additions} / -{pr.deletions} | <strong>Files changed:</strong> {pr.changed_files}
                    </p>

                    <details className="pr-reviews">
                      <summary>Reviews ({pr.reviews.length})</summary>
                      {pr.reviews.length === 0 ? (
                        <p className="no-reviews">No reviews yet.</p>
                      ) : (
                        pr.reviews.map((r, idx) => (
                          <div key={idx} className="review-card">
                            <p><strong>{r.reviewer}</strong> - {r.state} <span className="review-date">({r.submitted_at})</span></p>
                            {r.body && <p className="review-body">{r.body}</p>}
                          </div>
                        ))
                      )}
                    </details>
                  </div>
                ))}
              </div>
            )}
        </div>

        <br />

        {/* Time Based Insights */}
        <div className="file-card">
          <h3 style={{ marginBottom: '5px' }}>Time Based Insights</h3>
          <div style={{ display: 'grid', gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: '20px' }}>
            <div>
              <h4>Active Commit Hours</h4>
              <p>This chart visualizes the hours of the day when contributors are most active, showing the distribution of commits across different times.</p>
              <div style={{ width: "100%", height: 400 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={renderLabel}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h4>Longest Commit Streaks</h4>
              <p>Shows the longest consecutive days each contributor has made commits, highlighting consistency and dedication over time.</p>
              {Object.entries(devStreaks || {}).map(([dev, stats]) => (
                // <p key={dev}><strong>{dev}:</strong> {stats.longestStreak} days</p>
                <div className="contributors-container">
                  <div className="contributor-card" key={dev}>
                    <div className="contributor-info">
                      <span className="contributor-name">{dev}</span>
                      <span className="contributor-commits">Longest Streak: {stats.longestStreak} days</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <br />

          <h4 style={{ marginBottom: '5px' }}>Commits By Day Of Week</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={commitsByDayData}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip content={<CommitsByDayTooltip />} />
              <Bar dataKey="commits" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>

          <br />

          <h4 style={{ marginBottom: '5px' }}>Commit Trend Over Time</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={commitsOverTimeData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip content={<CommitsOverTimeTooltip />} />
              <Line type="monotone" dataKey="commits" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>

          <br />
          <h4>Average Commit Time Per Contributor</h4>
            <div className="contributors-metrics">
              {avgCommitTimeData.map(d => (
                <div className="contributor-container" key={d.dev}>
                  <div className="contributor-card">
                    <div className="contributor-info">
                      <span className="contributor-name">{d.dev}</span>
                      <span className="contributor-commits"><b>Avg Commit Time:</b> {d.avgHour}:00</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
