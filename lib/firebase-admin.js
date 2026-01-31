import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
);

if (serviceAccount.private_key) {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

const firebaseAdminConfig = {
  credential: cert(serviceAccount),
};

function createAdminApp() {
  if (getApps().length <= 0) {
    return initializeApp(firebaseAdminConfig);
  }
  return getApp();
}

export const adminApp = createAdminApp();
export const db = getFirestore(adminApp);
export const auth = getAuth(adminApp);
