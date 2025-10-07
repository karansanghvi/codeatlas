import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase/auth"; 
import { doc, setDoc } from "firebase/firestore";
import "../assets/styles/projects.css";

function Settings() {
  const [user, setUser] = useState(null);
  const [inputToken, setInputToken] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault(); 
    if (!inputToken.trim()) return alert("Token cannot be empty");
    if (!user) return alert("You must be logged in to save token");

    try {
      await setDoc(
        doc(db, "users", user.uid),
        { githubToken: inputToken.trim() },
        { merge: true }
      );
      alert("Token saved successfully!");
      setInputToken(""); 
    } catch (err) {
      console.error("Error saving token:", err);
      alert("Failed to save token.");
    }
  };

  if (loading) return <p>Loading...</p>;

  if (!user)
    return (
      <p className="text-center mt-10">
        Please log in to set your GitHub token.
      </p>
    );

  return (
    <div className="projects-section">
      <h2>Settings</h2>
      <p style={{ marginBottom: "20px", marginTop:"20px" }}>
        Your GitHub token allows this app to access your private repositories and fetch data from GitHub. 
        This is required to view repository details, contributors, languages, and activity in your dashboard.
      </p>
      <p style={{ marginBottom: "20px" }}>
        If you don't have a token, you can create one by visiting 
        <a 
          href="https://github.com/settings/tokens" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ marginLeft: "5px", color: "#0366d6" }}
        >
          GitHub Personal Access Tokens
        </a>.
        Make sure to select the <strong>repo</strong> and <strong>read:user</strong> scopes for proper access.
      </p>
      <form onSubmit={handleSave}>
        <div className="input-box">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="githubToken" style={{ marginBottom: '5px', display: 'block' }}>
                Enter GitHub Token:
              </label>
              <input 
                id="githubToken"
                type="password"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="Enter your GitHub token"
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
            <div>
              <button 
                type="submit"
                className="project-button"
              >
                Save Token
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Settings;
