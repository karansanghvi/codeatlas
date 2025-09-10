import React, { useEffect, useState } from "react";
import "../assets/styles/dashboard.css";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/auth";
import DashboardHome from "../components/DashboardHome";
import Projects from "../components/Projects";
import Analytics from "../components/Analytics";
import Settings from "../components/Settings";
import { Link } from "react-router-dom";

function Dashboard() {
  const [fullName, setFullName] = useState("");
  const [githubURL, setGithubURL] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activePage, setActivePage] = useState("Dashboard");

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

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">CodeAtlas</div>
        <ul className="sidebar-menu">
          {["Dashboard", "Projects", "Analytics", "Settings"].map((item) => (
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
          <input type="text" placeholder="Search..." className="search-bar" />
          {/* <div className="user-profile">{fullName || "User"}</div> */}
          <Link to="/login">
            <button className="dashboard-button">Login</button>
          </Link>
        </div>

        {activePage === "Dashboard" && (
          <DashboardHome
            fullName={fullName}
            githubURL={githubURL}
            setGithubURL={setGithubURL}
            isAnalyzing={isAnalyzing}
            setIsAnalyzing={setIsAnalyzing}
            setActivePage={setActivePage}  
          />
        )}
        {activePage === "Projects" && <Projects />}
        {activePage === "Analytics" && <Analytics />} 
        {activePage === "Settings" && <Settings />}
      </main>
    </div>
  );
}

export default Dashboard;
