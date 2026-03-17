import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Use environment variables if available (for Netlify/Vercel deployments), 
// otherwise fallback to the local config file (for AI Studio)
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
};

const app = initializeApp(config);

// If using a custom project ID from env vars, default to '(default)' database unless specified.
// Otherwise, use the AI Studio specific database ID.
const customDbId = import.meta.env.VITE_FIREBASE_DATABASE_ID;
const isCustomProject = !!import.meta.env.VITE_FIREBASE_PROJECT_ID;
const dbId = customDbId || (isCustomProject ? '(default)' : firebaseConfig.firestoreDatabaseId);

export const db = getFirestore(app, dbId);
export const auth = getAuth(app);
export const storage = getStorage(app);

