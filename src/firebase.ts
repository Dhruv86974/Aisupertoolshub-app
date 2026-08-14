import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuration from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyC1bPOIQ-E_06ZxuTCX8Oxwk7meh4hXfaA",
  authDomain: "mindful-option-jzp2g.firebaseapp.com",
  projectId: "mindful-option-jzp2g",
  storageBucket: "mindful-option-jzp2g.firebasestorage.app",
  messagingSenderId: "873305106488",
  appId: "1:873305106488:web:d517255a21f876d6d8decd",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-aisupertoolshub-ed12c8af-0de6-4766-a5b3-85d8f6e82b8e");

export default app;
