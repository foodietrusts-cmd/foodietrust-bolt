// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBjeFGDRdOtINeLTdN2kwCIZmo8P7ludO0",
  authDomain: "foodietrust-staging.firebaseapp.com",
  projectId: "foodietrust-staging",
  storageBucket: "foodietrust-staging.firebasestorage.app",
  messagingSenderId: "317774032756",
  appId: "1:317774032756:web:ceadf3bf77180a1adb4621",
  measurementId: "G-T1XZWTB7GS"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
