import React, { useState } from "react";
import "../assets/styles/signup.css";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/auth";
import bcrypt from "bcryptjs";

function Signup() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      const hashedPassword = await bcrypt.hash(password, 10);

      await setDoc(doc(db, "users", userCred.user.uid), {
        fullName,
        phone,
        email,
        password: hashedPassword,
      });

      alert("Account created successfully!");
      navigate("/");
    } catch (error) {
      alert("❌ " + error.message);
      setFullName("");
      setPhone("");
      setEmail("");
      setPassword("")
    }
  };

  return (
    <>
    <header className="app-header">
      <Link to="/" style={{ textDecoration: 'none' }}>
        <h1 className="title">CodeAtlas</h1>
      </Link>
    </header>
    <div className="signup-screen">

      <div className="signup-content">
        <h1>Signup</h1>
  
        <form className="login-form" onSubmit={handleSignup}>
          <div className="input-row">
            <div className="input-box">
              <label htmlFor="fullName">Full Name:</label>
              <input type="text" id="fullName" placeholder="John Doe"
                value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ marginRight: '10px' }} required />
            </div>

            <div className="input-box">
              <label htmlFor="phoneNumber">Phone Number:</label>
              <input type="text" id="phoneNumber" placeholder="+91 XXXXX XXXXX"
                value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

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

          <button type="submit" className="login-btn">Signup</button>

          <p>Already have an account? <Link to="/login" style={{ textDecoration: 'none' }}><span>Login</span></Link></p>
        </form>
      </div>
    </div>
    <br/> <br/>
    </>
  );
}

export default Signup;
