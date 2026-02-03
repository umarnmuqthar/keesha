import { getSession } from './authActions';
// import { db, auth } from '@/lib/firebase-admin'; // REMOVED

const ADMIN_EMAIL = 'admin@keesha.money';

/**
 * Verify if the current user is the admin
 */
async function verifyAdmin() {
    const session = await getSession();
    // Check for custom claim
    if (!session || (!session.admin && session.role !== 'admin')) {
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
        const { auth } = await import('@/lib/firebase-admin');
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
        const { auth, db } = await import('@/lib/firebase-admin');

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
        const userRecord = await auth.createUser({
            email: ADMIN_EMAIL,
            password: password,
            displayName: 'Admin',
        });

        // Set custom admin claims for role-based access
        await auth.setCustomUserClaims(userRecord.uid, { admin: true, role: 'admin' });

        // Also create in Firestore if needed for profile data
        await db.collection('users').doc(userRecord.uid).set({
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

/**
 * Set custom admin claims for the existing admin user
 */
export async function setAdminClaimsForCurrentAdmin() {
    try {
        const { auth } = await import('@/lib/firebase-admin');
        const userRecord = await auth.getUserByEmail(ADMIN_EMAIL);
        await auth.setCustomUserClaims(userRecord.uid, { admin: true, role: 'admin' });
        return { success: true, message: 'Admin claims set successfully' };
    } catch (error) {
        console.error('Error setting admin claims:', error);
        return { success: false, error: error.message };
    }
}
