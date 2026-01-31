
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load .env manually for simplicity
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        if (line && line.indexOf('=') !== -1 && !line.startsWith('#')) {
            const [key, ...val] = line.split('=');
            let value = val.join('=').trim();
            // Remove single quotes if present
            if (value.startsWith("'") && value.endsWith("'")) {
                value = value.slice(1, -1);
            }
            // Remove double quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            process.env[key.trim()] = value;
        }
    });
}

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountKey) {
    console.error('Error: FIREBASE_SERVICE_ACCOUNT_KEY not found in .env');
    process.exit(1);
}

let serviceAccount;
try {
    serviceAccount = JSON.parse(serviceAccountKey);
    // Fix private key newlines if they are escaped literal \n strings
    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
} catch (e) {
    console.error('Error parsing service account key:', e);
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixLoanStatuses() {
    console.log('Checking all loans...');
    const snapshot = await db.collection('loans').get();

    for (const doc of snapshot.docs) {
        const loan = doc.data();
        const paymentsSnap = await doc.ref.collection('payments').get();
        const paidDates = new Set(paymentsSnap.docs.map(d => d.id));
        const schedule = loan.schedule || [];

        let allPaid = false;
        if (schedule.length > 0) {
            allPaid = schedule.every(p => paidDates.has(p.date));
        }

        if (allPaid && loan.status !== 'Closed') {
            console.log(`Fixing loan: ${loan.name} (${doc.id}) -> Closed`);
            await doc.ref.update({ status: 'Closed' });
        } else if (!allPaid && loan.status === 'Closed') {
            // Optional: Re-open if not paid? User didn't ask for this, but good for consistency.
            // console.log(`Fixing loan: ${loan.name} (${doc.id}) -> Active`);
            // await doc.ref.update({ status: 'Active' });
        }
    }
    console.log('Done.');
}

fixLoanStatuses();
