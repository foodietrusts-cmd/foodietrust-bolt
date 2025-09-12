import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
