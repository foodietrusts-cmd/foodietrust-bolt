// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const env = (typeof import.meta !== 'undefined' ? (import.meta as any).env : {}) as Record<string, string | undefined>;

// Fallback configuration for development
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: env.VITE_SENDER_ID || env.NEXT_PUBLIC_SENDER_ID || "123456789",
  appId: env.VITE_FIREBASE_APP_ID || env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef",
  measurementId: env.VITE_MEASUREMENT_ID || env.NEXT_PUBLIC_MEASUREMENT_ID || "G-ABCDEF123",
};

// Check if we have real Firebase config
const hasRealConfig = env.VITE_FIREBASE_API_KEY || env.NEXT_PUBLIC_FIREBASE_API_KEY;

let app: any;
let db: any;
let auth: any;
let storage: any;

try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
  
  if (!hasRealConfig) {
    console.warn('🔥 Firebase using demo configuration - real functionality disabled');
  }
} catch (error) {
  console.warn('🔥 Firebase initialization failed, using mock mode:', error);
  // Create mock objects for when Firebase fails
  db = null;
  auth = null;
  storage = null;
}

export { db, auth, storage };
export const isFirebaseConfigured = hasRealConfig && db && auth && storage;
