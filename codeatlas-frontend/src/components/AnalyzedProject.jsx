import React, { useEffect, useState } from "react";
import "../assets/styles/analyzedProjects.css";
import { IoChevronBackOutline } from "react-icons/io5";
import ArchitectureGraph from "./ArchitectureGraph";

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
  const [contributors, setContributors] = useState([]);
  const [languages, setLanguages] = useState({});
  const [, setLoading] = useState(true);
  const [collapsedFolders, setCollapsedFolders] = useState({});
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);

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
        console.error(err);
      }
      setLoading(false);
    };
    fetchRepoData();
  }, [githubURL]);

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
              <button className="view-button">Go To GitHub</button>
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
            <p style={{ marginBottom: '5px' }}>Click the below button to view the file structure</p>
            <button 
              className="dashboard-button"
              onClick={() => setIsFileModalOpen(true)}
            >
              View
            </button>
          </div>
        </div>

        <br />

        {/* Code Architecture Card */}
        <div className="file-card">
          <h3 style={{ marginBottom: '5px' }}>Code Architecture</h3>
          <p style={{ marginBottom: '10px' }}>Visualize classes, functions, and dependencies</p>
          <button 
            className="dashboard-button"
            onClick={() => setIsArchModalOpen(true)}
          >
            View Architecture
          </button>
        </div>
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
    </>
  );
}

export default AnalyzedProject;
