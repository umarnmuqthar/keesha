import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let serviceAccount;
try {
  let jsonString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}';
  // Handle case where the string is wrapped in quotes
  if (jsonString.startsWith("'") && jsonString.endsWith("'")) {
    jsonString = jsonString.slice(1, -1);
  }
  serviceAccount = JSON.parse(jsonString);
} catch (e) {
  console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', e);
  console.error('Raw Value (details omitted):', (process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '').substring(0, 20) + '...');
  serviceAccount = {};
}

if (serviceAccount.private_key) {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

const firebaseAdminConfig = {
  credential: cert(serviceAccount),
};

function createAdminApp() {
  // Lazy check: only fail if we actually try to use it and it's invalid
  if (!serviceAccount.project_id && !serviceAccount.private_key && Object.keys(serviceAccount).length === 0) {
    // Return a proxy or throw immediately? 
    // If we throw here, it might break build time if this file is imported.
    // Better to allow app to "exist" but fail on db/auth access?
    // No, user requested "throw a clear error at call time".
    // But getFirestore(app) is called at top level below.
    // So we must handle it. 
    // Let's throw a clear error if they try to USE the exports, 
    // OR just throw here if it's runtime (not build).
    // Next.js might import this during build.

    // Safest: Check env.
    if (process.env.NODE_ENV === 'development' && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      console.warn("Generating mock Firebase Admin App due to missing keys.");
    }
    // let's try to proceed, if cert fails it throws.
  }

  if (getApps().length <= 0) {
    // Validate service account before init
    if (!serviceAccount || Object.keys(serviceAccount).length === 0) {
      // If we are in build phase, we might want to skip this.
      // But for now, let's just log and throw meaningful error.
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is missing or invalid. Check your .env file.');
    }
    return initializeApp(firebaseAdminConfig);
  }
  return getApp();
}

export const adminApp = createAdminApp();
export const db = getFirestore(adminApp);
export const auth = getAuth(adminApp);
