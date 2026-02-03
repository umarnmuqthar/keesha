import 'dotenv/config';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let serviceAccount;
try {
    let jsonString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}';
    if (jsonString.startsWith("'") && jsonString.endsWith("'")) {
        jsonString = jsonString.slice(1, -1);
    }
    serviceAccount = JSON.parse(jsonString);
} catch (e) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', e);
    serviceAccount = {};
}

if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

if (!serviceAccount || Object.keys(serviceAccount).length === 0) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is missing or invalid.');
}

const adminApp = getApps().length ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(adminApp);
const auth = getAuth(adminApp);

const DRY_RUN = process.env.DRY_RUN === '1';
const BATCH_LIMIT = 500;

async function backfillUnverifiedUsers() {
    let pageToken = undefined;
    let totalProcessed = 0;
    let totalUnverified = 0;
    let totalUpdated = 0;

    while (true) {
        const list = await auth.listUsers(1000, pageToken);
        const unverified = list.users.filter((user) => user.emailVerified === false);
        totalProcessed += list.users.length;
        totalUnverified += unverified.length;

        if (unverified.length > 0) {
            if (DRY_RUN) {
                totalUpdated += unverified.length;
            } else {
                for (let i = 0; i < unverified.length; i += BATCH_LIMIT) {
                    const slice = unverified.slice(i, i + BATCH_LIMIT);
                    const batch = db.batch();
                    slice.forEach((user) => {
                        const ref = db.collection('users').doc(user.uid);
                        batch.set(ref, { isVerified: false }, { merge: true });
                    });
                    await batch.commit();
                    totalUpdated += slice.length;
                }
            }
        }

        if (!list.pageToken) break;
        pageToken = list.pageToken;
    }

    return {
        totalProcessed,
        totalUnverified,
        totalUpdated,
        dryRun: DRY_RUN
    };
}

backfillUnverifiedUsers()
    .then((result) => {
        console.log('Backfill complete:', result);
        process.exit(0);
    })
    .catch((err) => {
        console.error('Backfill failed:', err);
        process.exit(1);
    });
