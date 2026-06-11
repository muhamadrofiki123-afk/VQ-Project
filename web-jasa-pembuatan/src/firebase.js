import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword, // <-- Alat baru untuk Register
  signInWithEmailAndPassword      // <-- Alat baru untuk Login
} from "firebase/auth";

// 1. Paste kodemu di dalam kotak config ini
const firebaseConfig = {
    apiKey: "AIzaSyB8uzpITPDznzQGILi9GIt1_CffsD2ypG0",
  authDomain: "vq-project-3ede4.firebaseapp.com",
  projectId: "vq-project-3ede4",
  storageBucket: "vq-project-3ede4.firebasestorage.app",
  messagingSenderId: "37831910436",
  appId: "1:37831910436:web:67960f471ad782ab81a4b1",
  measurementId: "G-CP264SFGBR"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

// Fungsi Google
export const logInWithGoogle = () => signInWithPopup(auth, provider);
export const logOut = () => signOut(auth);

// Fungsi Email & Password (Baru)
export const registerWithEmail = (email, password) => createUserWithEmailAndPassword(auth, email, password);
export const loginWithEmail = (email, password) => signInWithEmailAndPassword(auth, email, password);