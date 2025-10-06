import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/auth";
import logo from "../assets/images/logo.png";
import "../assets/styles/login.css";
import CustomAlert from "../components/custom/CustomAlert";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alert, setAlert] = useState({ message: "", type: "" });

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setAlert({
        message: "Login successful!!",
        type: "success"
      });
      navigate("/");
    } catch (error) {
      setAlert({
        message: "User not found or incorrect credentials. Please try again.",
        type: "error"
      });
      console.log("User not found", error);
      setEmail("");
      setPassword("");
    }
  };

  return (
    <>
    <header className="app-header">
      <Link to="/" style={{ textDecoration: 'none' }}>
        <div className="logo">
          <div>
            <img src={logo} alt="CodeAtlas Logo" width={40} height={30} />
          </div>
          <div>
            <h1>CodeAtlas</h1>
          </div>
        </div>
      </Link>
    </header>
    <div className="login-screen">
      <div className="login-content">
        <h1>Login</h1>
        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-box">
            <label htmlFor="emailAddress">Email Address:</label>
            <input type="email" id="emailAddress" placeholder="john.doe@gmail.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="input-box">
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" placeholder="Password"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <button type="submit" className="login-btn">Login</button>

          <p>Don't have an account? <Link to="/signup" style={{ textDecoration: 'none' }}><span>Signup</span></Link></p>
        </form>
      </div>
    </div>

    <CustomAlert
      message={alert.message}
      type={alert.type}
      onClose={() => setAlert({
        message: "",
        type: ""
      })}
    />
    </>
  );
}

export default Login;
