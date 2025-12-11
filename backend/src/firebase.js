import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
  FIREBASE_CONFIG,
} = process.env;

// When running inside Firebase (Functions/Emulator), let the platform supply credentials.
const isFirebaseManaged = !!FIREBASE_CONFIG;

let app;
if (isFirebaseManaged) {
  app = initializeApp();
} else {
  const hasServiceKeyEnv = FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY;
  const credential = hasServiceKeyEnv
    ? cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      })
    : applicationDefault();

  app = initializeApp({
    credential,
    projectId: FIREBASE_PROJECT_ID,
  });
}

export const db = getFirestore(app);
