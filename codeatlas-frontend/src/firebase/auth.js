import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCFJT3yz1OA3MJo3AOSallkfS5SSfV4shI",
  authDomain: "codeatlas-9d170.firebaseapp.com",
  projectId: "codeatlas-9d170",
  storageBucket: "codeatlas-9d170.firebasestorage.app",
  messagingSenderId: "406743187585",
  appId: "1:406743187585:web:cd2ea8cd6372ed84790d80",
  measurementId: "G-8ZGBTH3S8E"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth};
