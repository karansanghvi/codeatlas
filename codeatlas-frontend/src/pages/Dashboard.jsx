import React, { useEffect, useState } from "react";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import DashboardHome from "../components/DashboardHome";
import Projects from "../components/Projects";
import Settings from "../components/Settings";
import AnalyzedProject from "../components/AnalyzedProject";
import "../assets/styles/dashboard.css";
import logo from "../assets/images/logo.png";

function Dashboard() {
  const [fullName, setFullName] = useState(() => localStorage.getItem("fullName") || "");
  const [activePage, setActivePage] = useState("Dashboard");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [userProjects, setUserProjects] = useState([]);
  const [selectedRepoURL, setSelectedRepoURL] = useState(null);
  const [githubURL, setGithubURL] = useState(""); 
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const navigate = useNavigate();

  // Fetch logged-in user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setFullName(data.fullName || "");
          setUserProjects(data.analyzedRepos || []);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (fullName) {
      localStorage.setItem("fullName", fullName);
    }
  }, [fullName]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearchModal(true);
      }

      if (e.key === 'Escape') {
        setShowSearchModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSearchError("");

    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/repositories");
      const projects = await res.json();

      const filtered = projects.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults(filtered);
    } catch (err) {
      console.error(err);
      setSearchError("Failed to fetch projects");
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      if (searchResults.length > 0) {
        const project = searchResults[0];
        setSelectedRepoURL(project.github_url);
        setShowSearchModal(false);
        setRecentSearches(prev => [project.name, ...prev.filter(name => name !== project.name)]);
        setSearchQuery("");
        setSearchResults([]);
      } else {
        setSearchError("Project not found");
      }
    }
  };

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      localStorage.removeItem("fullName");
      localStorage.removeItem("userData");
      setFullName("");
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <>
      <div className="dashboard-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="logo">
            <div>
              <img src={logo} alt="CodeAtlas Logo" width={40} height={30} />
            </div>
            <div>
              <h1>CodeAtlas</h1>
            </div>
          </div>
          <ul className="sidebar-menu">
            {["Dashboard", "Projects", "Settings"].map((item) => (
              <li
                key={item}
                className={activePage === item ? "active" : ""}
                onClick={() => setActivePage(item)}
              >
                {item}
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {/* Top bar */}
          <div className="top-bar">
            <div className="search-input-container">
              <input 
                type="text" 
                placeholder="Search..." 
                className="search-bar" 
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => setShowSearchModal(true)}
              />
              <span className="shortcut-hint">Ctrl + K</span>
            </div>
            {fullName ? (
              <div className="dropdown">
                <button
                  className="dashboard-button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {fullName} ▾
                </button>

                {dropdownOpen && (
                  <div className="dropdown-menu">
                    <Link to="/profile" style={{ textDecoration: 'none' }}>
                      <button className="dropdown-item">View Profile</button>
                    </Link>
                    <button className="dropdown-item" onClick={handleLogout}>Logout</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login">
                <button className="dashboard-button">Login</button>
              </Link>
            )}
          </div>

          {/* Main content area */}
          {selectedRepoURL ? (
            <AnalyzedProject 
              githubURL={selectedRepoURL} 
              setActivePage={() => setSelectedRepoURL(null)} 
            />
          ) : activePage === "Dashboard" ? (
            <DashboardHome
              fullName={fullName}
              setFullName={setFullName}
              githubURL={githubURL}       
              setGithubURL={setGithubURL} 
              isAnalyzing={isAnalyzing}
              setIsAnalyzing={setIsAnalyzing}
              setActivePage={setActivePage}  
            />
          ) : activePage === "Projects" ? (
            <Projects />
          ) : (
            <Settings />
          )}
        </main>
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <div className="search-modal-overlay">
          <div className="search-modal">
            <div className="search-header">
              <input
                type="text"
                placeholder="Search documentation"
                className="search-input"
                autoFocus
              />
              <span className="esc-hint">esc</span>
            </div>

            <div className="recent-section">
              <h4>Recent</h4>
              <ul className="recent-list">
                {searchQuery === "" ? (
                  recentSearches.length === 0 ? (
                    userProjects.length > 0 ? (
                      userProjects.map((repo, idx) => (
                        <li
                          key={idx}
                          onClick={() => {
                            setSelectedRepoURL(repo.url);
                            setShowSearchModal(false);
                          }}
                        >
                          {repo.url.split("/").pop()}
                        </li>
                      ))
                    ) : (
                      <li style={{ color: "black" }}>No Projects Found</li>
                    )
                  ) : (
                    recentSearches.map((item, idx) => <li key={idx}>{item}</li>)
                  )
                ) : searchResults.length > 0 ? (
                  searchResults.map((project) => (
                    <li
                      key={project.id}
                      onClick={() => {
                        setSelectedRepoURL(project.github_url);
                        setShowSearchModal(false);
                      }}
                    >
                      {project.name}
                    </li>
                  ))
                ) : (
                  <li style={{ color: "black" }}>{searchError}</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Dashboard;
