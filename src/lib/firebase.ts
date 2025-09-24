// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const env = (typeof import.meta !== 'undefined' ? (import.meta as any).env : {}) as Record<string, string | undefined>;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-api-key",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy-project.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy-project.appspot.com",
  messagingSenderId: env.VITE_SENDER_ID || env.NEXT_PUBLIC_SENDER_ID || "123456789",
  appId: env.VITE_FIREBASE_APP_ID || env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef",
  measurementId: env.VITE_MEASUREMENT_ID || env.NEXT_PUBLIC_MEASUREMENT_ID || "G-ABCDEF",
};

// Initialize Firebase with error handling
let app: any = null;
let db: any = null;
let auth: any = null;
let storage: any = null;

try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
} catch (error) {
  console.warn("Firebase initialization failed - running in demo mode:", error);
  // Create mock objects for development
  db = null;
  auth = null;
  storage = null;
}

export { db, auth, storage };
