import { db, auth } from '@/lib/firebase-admin';
import { getSession } from './authActions';
import { redirect } from 'next/navigation';

// Initialization moved to lib/firebase-admin.js

// Auth and DB are imported from lib

const ADMIN_EMAIL = 'admin@keesha.money';

/**
 * Verify if the current user is the admin
 */
async function verifyAdmin() {
    const session = await getSession();
    // Check for custom claim OR hardcoded email (as backup/during transition)
    if (!session || (!session.admin && session.email !== ADMIN_EMAIL)) {
        return false;
    }
    return true;
}

/**
 * Fetch all users for the admin dashboard
 */
export async function getAdminUsers() {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
        throw new Error('Unauthorized');
    }

    try {
        // List batch of users, 1000 at a time.
        const listUsersResult = await auth.listUsers(1000);
        const users = listUsersResult.users.map(userRecord => ({
            uid: userRecord.uid,
            email: userRecord.email,
            displayName: userRecord.displayName || 'N/A',
            photoURL: userRecord.photoURL,
            phoneNumber: userRecord.phoneNumber || 'N/A',
            metadata: {
                creationTime: userRecord.metadata.creationTime,
                lastSignInTime: userRecord.metadata.lastSignInTime,
            }
        }));
        return { success: true, users };
    } catch (error) {
        console.error('Error fetching users:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Seed the admin user (One-time use)
 */
export async function seedAdminUser(password) {
    try {
        // Check if admin exists
        try {
            await auth.getUserByEmail(ADMIN_EMAIL);
            console.log('Admin user already exists.');
            return { success: true, message: 'Admin already exists' };
        } catch (error) {
            if (error.code !== 'auth/user-not-found') {
                throw error;
            }
        }

        // Create admin user
        await auth.createUser({
            email: ADMIN_EMAIL,
            password: password,
            displayName: 'Admin',
        });

        // Also create in Firestore if needed, though primarily Auth is used for login
        await db.collection('users').doc(ADMIN_EMAIL).set({
            email: ADMIN_EMAIL,
            role: 'admin',
            createdAt: new Date()
        });

        return { success: true, message: 'Admin created successfully' };
    } catch (error) {
        console.error('Error seeding admin:', error);
        return { success: false, error: error.message };
    }
}
