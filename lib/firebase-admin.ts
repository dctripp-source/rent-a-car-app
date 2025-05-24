//import { initializeApp, getApps, cert } from 'firebase-admin/app';
//import { getAuth } from 'firebase-admin/auth';

/*import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase/auth";

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
};

export function customInitApp() {
  if (getApps().length <= 0) {
    initializeApp(firebaseAdminConfig);
  }
}

customInitApp();
export const auth = getAuth();*/