import React, { useState } from "react";
import "../assets/styles/signup.css";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/auth";

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

      await setDoc(doc(db, "users", userCred.user.uid), {
        fullName,
        phone,
        email,
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
    <div className="signup-screen">
      <div className="signup-container">
        <h1>Signup</h1>
        <p>Join us to discover amazing stories made just for kids!</p>

        <form className="login-form" onSubmit={handleSignup}>
          <div className="input-row">
            <div className="input-box">
              <label htmlFor="fullName">Full Name:</label>
              <input type="text" id="fullName" placeholder="John Doe"
                value={fullName} onChange={(e) => setFullName(e.target.value)} required />
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

          <p>Already have an account? <Link to="/login"><span>Login</span></Link></p>
        </form>
      </div>
    </div>
    <br/> <br/>
    </>
  );
}

export default Signup;
