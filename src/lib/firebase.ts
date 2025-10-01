// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";

const env = (typeof import.meta !== 'undefined' ? (import.meta as any).env : {}) as Record<string, string | undefined>;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBjeFGDRdOtINeLTdN2kwCIZmo8P7ludO0",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "foodietrust-staging.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "foodietrust-staging",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "foodietrust-staging.firebasestorage.app",
  messagingSenderId: env.VITE_SENDER_ID || env.NEXT_PUBLIC_SENDER_ID || "317774032756",
  appId: env.VITE_FIREBASE_APP_ID || env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:317774032756:web:ceadf3bf77180a1adb4621",
  measurementId: env.VITE_MEASUREMENT_ID || env.NEXT_PUBLIC_MEASUREMENT_ID || "G-T1XZWTB7GS",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Export callable function for AI search
export const aiMultiProvider = httpsCallable(functions, "aiMultiProvider");
