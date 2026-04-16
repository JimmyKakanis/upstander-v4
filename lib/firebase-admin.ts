import * as admin from 'firebase-admin';

// Validate required environment variables
const requiredEnvVars = {
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  // Only warn in development, throw in production if critical
  console.warn(
    `Missing required Firebase Admin environment variables: ${missingVars.join(', ')}. ` +
    `API routes using Firebase Admin will fail.`
  );
}

if (!admin.apps.length) {
  try {
    // Only attempt initialization if keys are present
    if (requiredEnvVars.FIREBASE_PROJECT_ID && requiredEnvVars.FIREBASE_CLIENT_EMAIL && requiredEnvVars.FIREBASE_PRIVATE_KEY) {
        admin.initializeApp({
        credential: admin.credential.cert({
            projectId: requiredEnvVars.FIREBASE_PROJECT_ID,
            clientEmail: requiredEnvVars.FIREBASE_CLIENT_EMAIL,
            privateKey: requiredEnvVars.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        });
    }
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

// Export these but they might be unsafe to use if init failed
// We will check for admin.apps.length in API routes to be safe
const db = admin.apps.length ? admin.firestore() : {} as FirebaseFirestore.Firestore;
const auth = admin.apps.length ? admin.auth() : {} as admin.auth.Auth;

export { admin, db, auth };
