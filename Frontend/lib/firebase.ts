// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Validate that all required environment variables are present
const requiredEnvVars = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Check if any required environment variables are missing or contain placeholder values
const missingVars = Object.entries(requiredEnvVars).filter(([key, value]) => 
  !value || 
  value.includes('your-') || 
  value.includes('placeholder') ||
  value === 'your-api-key-here' ||
  value === 'your-project.firebaseapp.com' ||
  value === 'your-project-id' ||
  value === 'your-project.appspot.com' ||
  value === '123456789' ||
  value === 'your-app-id-here'
);

if (missingVars.length > 0) {
  console.error('Firebase configuration error: Missing or invalid environment variables:', 
    missingVars.map(([key]) => `NEXT_PUBLIC_FIREBASE_${key.toUpperCase()}`).join(', ')
  );
  console.error('Please check your .env.local file and ensure all Firebase configuration values are set correctly.');
}

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: requiredEnvVars.apiKey || "",
  authDomain: requiredEnvVars.authDomain || "",
  projectId: requiredEnvVars.projectId || "",
  storageBucket: requiredEnvVars.storageBucket || "",
  messagingSenderId: requiredEnvVars.messagingSenderId || "",
  appId: requiredEnvVars.appId || ""
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;