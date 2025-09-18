import admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT env var is required for Firebase Admin.');
  }
  const credential = admin.credential.cert(JSON.parse(serviceAccountJson));
  admin.initializeApp({
    credential,
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export const db = admin.firestore();
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;
