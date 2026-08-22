import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';

// Intercept and cleanly neutralize background Firebase network/auth failures
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (reason) {
      const errMsg = reason.message || String(reason);
      const errCode = reason.code;
      if (
        errCode === 'auth/network-request-failed' ||
        errMsg.includes('auth/network-request-failed') ||
        errMsg.includes('network-request-failed') ||
        errMsg.includes('the client is offline')
      ) {
        event.preventDefault();
        console.warn("[Firebase] Intercepted and neutralized background network/auth failure cleanly:", errMsg);
      }
    }
  });

  window.addEventListener('error', (event) => {
    const errMsg = event.message || '';
    if (
      errMsg.includes('auth/network-request-failed') ||
      errMsg.includes('network-request-failed') ||
      errMsg.includes('the client is offline')
    ) {
      event.preventDefault();
      console.warn("[Firebase] Intercepted and neutralized global error failure cleanly:", errMsg);
    }
  });
}

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

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Dynamic resilient Firestore setup
let activeDb: Firestore;
try {
  activeDb = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  }, "ai-studio-aisupertoolshub-ed12c8af-0de6-4766-a5b3-85d8f6e82b8e");
} catch (e) {
  console.warn("Could not load custom named database with custom settings, trying default with custom settings:", e);
  try {
    activeDb = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  } catch (err2) {
    console.warn("Could not initialize custom named or default database with initializeFirestore, falling back to getFirestore:", err2);
    activeDb = getFirestore(app);
  }
}

export let db = activeDb;

// Method to switch live database instance to default
export function switchToDefaultDatabase() {
  try {
    db = getFirestore(app);
    console.log("[Firebase] Switched database instance to default successfully.");
  } catch (err) {
    console.error("[Firebase] Error switching to default database:", err);
  }
}

// Helper to wait for Firebase Auth to restore session on page mount
function waitForAuthInit(): Promise<void> {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve();
      return;
    }

    // Check if we expect a logged-in session based on local storage
    let hasSession = false;
    if (typeof window !== 'undefined') {
      try {
        const savedUser = localStorage.getItem('hub_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed && parsed.isLoggedIn) {
            hasSession = true;
          }
        }
      } catch (e) {}
    }

    if (!hasSession) {
      resolve();
      return;
    }

    let resolved = false;
    const unsubscribe = auth.onAuthStateChanged(() => {
      if (!resolved) {
        resolved = true;
        unsubscribe();
        resolve();
      }
    });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        unsubscribe();
        resolve();
      }
    }, 1500);
  });
}

// Wrapper for robust database queries
export async function executeResilientDbOp<T>(op: (currentDb: Firestore) => Promise<T>): Promise<T> {
  await waitForAuthInit();
  try {
    return await op(db);
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (
      errMsg.includes('closing') || 
      errMsg.includes('hidden') || 
      errMsg.includes('not-found') || 
      errMsg.includes('disabled') ||
      errMsg.includes('precondition')
    ) {
      console.warn("[Firebase] Detected database state exception. Switching to default database and retrying...", errMsg);
      switchToDefaultDatabase();
      return await op(db);
    }
    throw err;
  }
}

export default app;
