// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA2wVHOE3vUBAAwAVcl1-8_SKpbmD7ogLc",
  authDomain: "hisab-kitab-a28de.firebaseapp.com",
  projectId: "hisab-kitab-a28de",
  storageBucket: "hisab-kitab-a28de.firebasestorage.app",
  messagingSenderId: "384764045118",
  appId: "1:384764045118:web:5f0e46528b62331752ae6f",
  measurementId: "G-TV1D4P8ZWC"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);


