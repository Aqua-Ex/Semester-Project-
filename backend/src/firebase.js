import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
  GOOGLE_APPLICATION_CREDENTIALS,
} = process.env;

const hasServiceKeyEnv = FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY;

const credential = hasServiceKeyEnv
  ? cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  : applicationDefault();

const app = initializeApp({
  credential,
  projectId: FIREBASE_PROJECT_ID,
});

export const db = getFirestore(app);
