import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyColM-jAZvaN-TxaJV88-e_s0b9Kf0LChw",
  authDomain: "smart-mudi-khana.firebaseapp.com",
  projectId: "smart-mudi-khana",
  storageBucket: "smart-mudi-khana.firebasestorage.app",
  messagingSenderId: "855576125368",
  appId: "1:855576125368:web:605adb8a92ef9ddf5a394d",
  measurementId: "G-6DCLK1GWZ9",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("Firestore persistence failed: multiple tabs open");
  } else if (err.code === "unimplemented") {
    console.warn("Firestore persistence not supported in this browser");
  }
});
