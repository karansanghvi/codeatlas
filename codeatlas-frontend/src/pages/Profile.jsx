import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/auth";
import logo from "../assets/images/logo.png";
import "../assets/styles/profile.css";

function Profile() {
  const [userData, setUserData] = useState(() => {
    const savedData = localStorage.getItem("userData");
    return savedData
      ? JSON.parse(savedData)
      : { fullName: "", phone: "", emailAddress: "" };
  });

  const [isEditing, setIsEditing] = useState(false); // toggle edit mode

  // useEffect(() => {
  //   const fetchUserData = async () => {
  //     const auth = getAuth();
  //     const user = auth.currentUser;

  //     if (user) {
  //       try {
  //         const userRef = doc(db, "users", user.uid);
  //         const userSnap = await getDoc(userRef);

  //         if (userSnap.exists()) {
  //           const data = userSnap.data();
  //           const fetchedData = {
  //             fullName: data.fullName || "",
  //             phone: data.phone || "",
  //             emailAddress: data.email || user.email || "",
  //           };
  //           setUserData(fetchedData);
  //           localStorage.setItem("userData", JSON.stringify(fetchedData));
  //         } else {
  //           console.log("No such user document!");
  //         }
  //       } catch (error) {
  //         console.error("Error fetching user data:", error);
  //       }
  //     }
  //   };

  //   if (!userData.fullName && !userData.emailAddress) {
  //     fetchUserData();
  //   }
  // }, []);
  useEffect(() => {
    const fetchUserData = async () => {
      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            const fetchedData = {
              fullName: data.fullName || "",
              phone: data.phone || "",
              emailAddress: data.email || user.email || "",
            };
            setUserData(fetchedData);
            localStorage.setItem("userData", JSON.stringify(fetchedData));
          } else {
            console.log("No such user document!");
            setUserData({ fullName: "", phone: "", emailAddress: user.email });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData(); 
  }, []);


  const handleChange = (e) => {
    const { id, value } = e.target;
    const updatedData = { ...userData, [id]: value };
    setUserData(updatedData);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();

    if (!isEditing) {
      // Enable editing
      setIsEditing(true);
    } else {
      // Save changes to Firebase
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          const userRef = doc(db, "users", user.uid);
          await setDoc(userRef, {
            fullName: userData.fullName,
            phone: userData.phone,
            email: userData.emailAddress,
          }, { merge: true });

          localStorage.setItem("userData", JSON.stringify(userData));
          setIsEditing(false); // disable editing
          alert("Profile updated successfully!");
        }
      } catch (error) {
        console.error("Error updating profile:", error);
        alert("Failed to update profile. Try again.");
      }
    }
  };

  return (
    <>
      <header className="app-header">
        <Link to="/" style={{ textDecoration: "none" }}>
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
      <div className="profile-screen">
        <div className="profile-content">
          <h1>Profile</h1>

          <form className="login-form" onSubmit={handleEditSave}>
            <div className="input-box">
              <label htmlFor="fullName">Full Name:</label>
              <input
                type="text"
                id="fullName"
                placeholder="John Doe"
                style={{ marginRight: "10px" }}
                value={userData.fullName}
                onChange={handleChange}
                readOnly={!isEditing}
              />
            </div>

            <div className="input-box">
              <label htmlFor="phone">Phone Number:</label>
              <input
                type="text"
                id="phone"
                placeholder="+91 XXXXX XXXXX"
                value={userData.phone}
                onChange={handleChange}
                readOnly={!isEditing}
              />
            </div>

            <div className="input-box">
              <label htmlFor="emailAddress">Email Address:</label>
              <input
                type="email"
                id="emailAddress"
                placeholder="john.doe@gmail.com"
                value={userData.emailAddress}
                onChange={handleChange}
                readOnly={!isEditing}
              />
            </div>

            <button type="submit" className="login-btn">
              {isEditing ? "Save Profile" : "Edit Profile"}
            </button>
          </form>
        </div>
      </div>
      <br />
      <br />
    </>
  );
}

export default Profile;
