/**
 * Migration script to add 'status' field to all debt accounts
 * Accounts with netBalance !== 0 -> 'Active'
 * Accounts with netBalance === 0 -> 'Closed'
 * 
 * Run with: node scripts/migrate-debt-status.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const admin = require('firebase-admin');

// Initialize Firebase Admin using environment variable
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');

    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function migrateDebtStatus() {
    console.log('Starting debt status migration...');

    try {
        const snapshot = await db.collection('debt_accounts').get();

        if (snapshot.empty) {
            console.log('No debt accounts found.');
            return;
        }

        console.log(`Found ${snapshot.docs.length} debt accounts.`);

        let updatedCount = 0;
        let errorCount = 0;

        for (const doc of snapshot.docs) {
            try {
                const accountData = doc.data();

                // Calculate net balance from transactions
                const transSnapshot = await db.collection('debt_accounts')
                    .doc(doc.id)
                    .collection('transactions')
                    .get();

                let netBalance = 0;
                transSnapshot.docs.forEach(tDoc => {
                    const tData = tDoc.data();
                    const amount = parseFloat(tData.amount || 0);
                    if (tData.type === 'GIVE') netBalance += amount;
                    else if (tData.type === 'GOT') netBalance -= amount;
                });

                // Determine status based on netBalance
                const status = netBalance !== 0 ? 'Active' : 'Closed';

                // Update the document
                await db.collection('debt_accounts').doc(doc.id).update({
                    status: status,
                    netBalance: netBalance // Also store the calculated netBalance
                });

                console.log(`✓ Updated "${accountData.name}": netBalance=${netBalance}, status=${status}`);
                updatedCount++;

            } catch (error) {
                console.error(`✗ Error updating doc ${doc.id}:`, error.message);
                errorCount++;
            }
        }

        console.log('\n--- Migration Complete ---');
        console.log(`Updated: ${updatedCount}`);
        console.log(`Errors: ${errorCount}`);

    } catch (error) {
        console.error('Migration failed:', error);
    }

    process.exit(0);
}

migrateDebtStatus();
