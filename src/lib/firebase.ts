import { initializeApp, getApps, FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfigString = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;

if (!firebaseConfigString) {
  throw new Error("Missing Firebase config. Please set NEXT_PUBLIC_FIREBASE_CONFIG in your .env.local file");
}

const firebaseConfig: FirebaseOptions = JSON.parse(firebaseConfigString);

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

const appId = process.env.NEXT_PUBLIC_APP_ID || 'varsity-group-pro';

export { app, auth, db, appId };
