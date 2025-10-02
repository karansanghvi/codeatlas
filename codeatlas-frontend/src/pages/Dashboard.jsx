import React, { useEffect, useState } from "react";
import "../assets/styles/dashboard.css";
import { getAuth, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/auth";
import DashboardHome from "../components/DashboardHome";
import Projects from "../components/Projects";
import Settings from "../components/Settings";
import { Link, useNavigate } from "react-router-dom";

function Dashboard() {
  const [fullName, setFullName] = useState(() => {
    return localStorage.getItem("fullName") || "";
  });
  const [githubURL, setGithubURL] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activePage, setActivePage] = useState("Dashboard");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserName = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setFullName(userDoc.data().fullName);
        }
      }
    };
    fetchUserName();
  }, []);

  useEffect(() => {
    if (fullName) {
      localStorage.setItem("fullName", fullName);
    }
  }, [fullName]);

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
        window.open(project.github_url, "_blank");
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
      setFullName("");
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  return (
    <>
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">CodeAtlas</div>
        <ul className="sidebar-menu">
          {["Dashboard", "Projects", "Settings"].map((item) => (
            <li
              key={item}
              className={activePage === item ? "active" : ""}
              onClick={() => {
                setActivePage(item);
                setIsAnalyzing(false); 
              }}
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
          <input 
            type="text" 
            placeholder="Search..." 
            className="search-bar" 
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            autoFocus
          />
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

        {activePage === "Dashboard" && (
          <DashboardHome
            fullName={fullName}
            setFullName={setFullName}
            githubURL={githubURL}
            setGithubURL={setGithubURL}
            isAnalyzing={isAnalyzing}
            setIsAnalyzing={setIsAnalyzing}
            setActivePage={setActivePage}  
          />
        )}
        {activePage === "Projects" && <Projects />}
        {activePage === "Settings" && <Settings />}
      </main>
    </div>

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
            {searchQuery === "" && recentSearches.length === 0 && <p style = {{color: 'black'}}>No Recent Searches</p>}

            <ul className="recent-list">
              {searchQuery === ""
                ? recentSearches.map((item, idx) => <li key={idx}>{item}</li>)
                : searchResults.length > 0
                  ? searchResults.map(project => (
                      <li key={project.id} onClick={() => window.open(project.github_url, "_blank")}>
                        {project.name}
                      </li>
                    ))
                  : searchError && <li>{searchError}</li>
              }
            </ul>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default Dashboard;
