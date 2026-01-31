'use server';

import { cookies } from 'next/headers';
import { auth } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Create a session cookie for the authenticated user
 */
export async function createSession(idToken, checkAdmin = false) {
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    if (checkAdmin) {
        // Verify token to get UID and check DB
        try {
            const decodedToken = await auth.verifyIdToken(idToken);
            const { getFirestore } = await import('firebase-admin/firestore');
            const db = getFirestore();
            const userDoc = await db.collection('users').doc(decodedToken.uid).get();

            if (!userDoc.exists || userDoc.data().isAdmin !== true) {
                return { success: false, error: 'Access Denied: Not an admin.' };
            }
        } catch (e) {
            console.error('Admin verification failed:', e);
            return { success: false, error: 'Verification failed.' };
        }
    }

    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    cookies().set('session', sessionCookie, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/'
    });

    revalidatePath('/', 'layout');
    return { success: true };
}

/**
 * Sync user profile to Firestore
 */
export async function syncUser(uid, data) {
    try {
        const { getFirestore } = await import('firebase-admin/firestore');
        const db = getFirestore();
        await db.collection('users').doc(uid).set(data, { merge: true });
        return { success: true };
    } catch (error) {
        console.error('Error syncing user:', error);
        return { success: false };
    }
}

/**
 * Remove the session cookie and log out
 */
export async function logout() {
    cookies().set('session', '', { maxAge: 0 });
    revalidatePath('/', 'layout');
    redirect('/login');
}

/**
 * Verify session cookie
 */
export async function getSession() {
    const sessionCookie = cookies().get('session')?.value;
    if (!sessionCookie) return null;

    try {
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
        return decodedClaims;
    } catch (error) {
        return null;
    }
}
