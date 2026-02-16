// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyA-kLyNNxhS7l4i7D8SreRbpet0Z4vts6M",
    authDomain: "kafalaty-9bda9.firebaseapp.com",
    projectId: "kafalaty-9bda9",
    storageBucket: "kafalaty-9bda9.firebasestorage.app",
    messagingSenderId: "675827188271",
    appId: "1:675827188271:web:d0273d7e682fdf5751bcda",
    measurementId: "G-J3YY9THBQS"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
