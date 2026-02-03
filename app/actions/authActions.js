'use server';

import { cookies, headers } from 'next/headers';
import { cache } from 'react';
// Removed top-level import to prevent client bundle leakage
// import { auth } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Create a session cookie for the authenticated user
 */
export async function createSession(idToken, checkAdmin = false) {
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

    try {
        // Dynamic import inside Server Action
        const { auth } = await import('@/lib/firebase-admin');

        // 1. Verify token to get UID
        let decodedToken;
        try {
            decodedToken = await auth.verifyIdToken(idToken);
        } catch (e) {
            console.error('Token verification failed:', e);
            return { success: false, error: 'Token verification failed.' };
        }

        // 2. Check User Role via custom claims
        const isAdmin = decodedToken.admin === true || decodedToken.role === 'admin';

        // 3. Enforce Role Access & Set Specific Cookie
        if (checkAdmin) {
            // Trying to login as Admin
            if (!isAdmin) {
                return { success: false, error: 'Access Denied: Not an admin.' };
            }
            // Create Session for Admin
            const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
            cookies().set('session_admin', sessionCookie, {
                maxAge: Math.floor(expiresIn / 1000),
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
            });
        } else {
            // Trying to login as User
            if (isAdmin) {
                // Deny Admins from using User Login to prevent accidental crossover
                return { success: false, error: 'Access Restricted: Admins must use the Admin Portal.' };
            }
            // Create Session for User
            const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
            cookies().set('session_user', sessionCookie, {
                maxAge: Math.floor(expiresIn / 1000),
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
            });
        }

        revalidatePath(checkAdmin ? '/admin' : '/', 'layout');
        return { success: true };
    } catch (error) {
        console.error('Session creation failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Sync user profile to Firestore
 */
export async function syncUser(uid, data) {
    try {
        const { db } = await import('@/lib/firebase-admin');
        await db.collection('users').doc(uid).set(data, { merge: true });
        return { success: true };
    } catch (error) {
        console.error('Error syncing user:', error);
        return { success: false };
    }
}

/**
 * Validate password against server-side policy
 */
export async function validatePasswordPolicy(password) {
    if (!password || typeof password !== 'string') {
        return { success: false, error: 'Password is required.' };
    }
    const hasMinLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    if (!hasMinLength || !hasUpper || !hasLower || !hasNumber || !hasSymbol) {
        return {
            success: false,
            error: 'Password must be at least 8 characters and include upper/lowercase, a number, and a symbol.'
        };
    }
    return { success: true };
}

/**
 * Remove the session cookie and log out
 */
export async function logoutAdmin() {
    cookies().set('session_admin', '', { maxAge: 0 });
    revalidatePath('/admin', 'layout');
    redirect('/admin/login');
}

export async function logoutUser() {
    cookies().set('session_user', '', { maxAge: 0 });
    revalidatePath('/', 'layout');
    redirect('/login');
}

/**
 * Remove the session cookie and log out
 * @deprecated Use logoutAdmin or logoutUser
 */
export async function logout() {
    // Default to user logout if called generically, or try both to be safe?
    // User requested "doesn't affect the other".
    // Safest default for generic 'Sign Out' in UI is assume User context unless specified.
    // Most 'logout' calls in the app currently are for users.
    await logoutUser();
}

export const getAdminSession = cache(async function getAdminSession() {
    const sessionCookie = cookies().get('session_admin')?.value;
    if (!sessionCookie) return null;
    try {
        const { auth } = await import('@/lib/firebase-admin');
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
        if (!(decodedClaims.admin === true || decodedClaims.role === 'admin')) {
            return null;
        }
        return { ...decodedClaims, _role: 'admin' };
    } catch (error) {
        return null;
    }
});

export const getUserSession = cache(async function getUserSession() {
    const sessionCookie = cookies().get('session_user')?.value;
    if (!sessionCookie) return null;
    try {
        const { auth } = await import('@/lib/firebase-admin');
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
        return { ...decodedClaims, _role: 'user' };
    } catch (error) {
        return null;
    }
});

/**
 * Verify session cookie
 * @deprecated Use getUserSession or getAdminSession
 */
export async function getSession() {
    // Default to User session for backward compatibility
    return getUserSession();
}

import crypto from 'crypto';

const OTP_EXPIRES_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RATE_WINDOW_MS = 10 * 60 * 1000;
const OTP_RATE_MAX = 3;
const OTP_VERIFY_RATE_WINDOW_MS = 10 * 60 * 1000;
const OTP_VERIFY_RATE_MAX = 10;

function generateOTP() {
    return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(code, salt) {
    return crypto.createHash('sha256').update(`${salt}:${code}`).digest('hex');
}

function getClientIp() {
    const forwarded = headers().get('x-forwarded-for') || '';
    return forwarded.split(',')[0].trim() || 'unknown';
}

import { sendOTPEmail } from './emailActions';

export async function generateAndSendOTP(email) {
    try {
        if (!email) return { success: false, error: 'Invalid email.' };
        const emailLower = email.toLowerCase();
        const otp = generateOTP();
        const expiresAt = Date.now() + OTP_EXPIRES_MS;
        const ip = getClientIp();

        const { db } = await import('@/lib/firebase-admin');

        // Rate limit by email + IP
        const rateKey = crypto.createHash('sha256').update(`${emailLower}|${ip}`).digest('hex');
        const rateRef = db.collection('otp_rate_limits').doc(rateKey);
        const rateSnap = await rateRef.get();
        const now = Date.now();
        if (rateSnap.exists) {
            const rateData = rateSnap.data();
            const windowStart = rateData.windowStart || now;
            if (now - windowStart < OTP_RATE_WINDOW_MS && rateData.count >= OTP_RATE_MAX) {
                return { success: false, error: 'Too many requests. Please try again later.' };
            }
            if (now - windowStart >= OTP_RATE_WINDOW_MS) {
                await rateRef.set({ count: 1, windowStart: now }, { merge: true });
            } else {
                await rateRef.set({ count: (rateData.count || 0) + 1, windowStart }, { merge: true });
            }
        } else {
            await rateRef.set({ count: 1, windowStart: now });
        }

        const verificationId = crypto.randomUUID();
        const salt = crypto.randomBytes(16).toString('hex');
        const otpHash = hashOtp(otp, salt);

        // Store in a 'otp_verifications' collection using random verificationId
        console.log(`Generating OTP for ${emailLower}...`);
        await db.collection('otp_verifications').doc(verificationId).set({
            email: emailLower,
            otpHash,
            salt,
            expiresAt,
            createdAt: new Date().toISOString(),
            attempts: 0,
            ip
        });
        console.log('OTP stored in DB.');

        // Send Email
        const result = await sendOTPEmail(email, otp);
        if (!result.success) {
            return { success: false, error: result.error };
        }

        return { success: true, verificationId };
    } catch (error) {
        console.error('Error generating OTP:', error);
        return { success: false, error: 'Failed to generate OTP: ' + error.message };
    }
}

export async function verifySignupOTP(verificationId, code) {
    try {
        if (!verificationId || !code) return { success: false, error: 'Invalid request.' };

        const { db } = await import('@/lib/firebase-admin');
        const ref = db.collection('otp_verifications').doc(verificationId);
        const snapshot = await ref.get();

        if (!snapshot.exists) {
            return { success: false, error: 'Invalid or expired code.' };
        }

        const data = snapshot.data();
        const ip = getClientIp();
        const emailLower = (data.email || '').toLowerCase();

        if (emailLower) {
            const verifyRateKey = crypto.createHash('sha256').update(`${emailLower}|${ip}`).digest('hex');
            const verifyRateRef = db.collection('otp_verify_rate_limits').doc(verifyRateKey);
            const verifyRateSnap = await verifyRateRef.get();
            const now = Date.now();
            if (verifyRateSnap.exists) {
                const rateData = verifyRateSnap.data();
                const windowStart = rateData.windowStart || now;
                if (now - windowStart < OTP_VERIFY_RATE_WINDOW_MS && rateData.count >= OTP_VERIFY_RATE_MAX) {
                    return { success: false, error: 'Too many attempts. Please try again later.' };
                }
                if (now - windowStart >= OTP_VERIFY_RATE_WINDOW_MS) {
                    await verifyRateRef.set({ count: 1, windowStart: now }, { merge: true });
                } else {
                    await verifyRateRef.set({ count: (rateData.count || 0) + 1, windowStart }, { merge: true });
                }
            } else {
                await verifyRateRef.set({ count: 1, windowStart: now });
            }
        }

        if (Date.now() > data.expiresAt) {
            await ref.delete();
            return { success: false, error: 'Code has expired.' };
        }

        if ((data.attempts || 0) >= OTP_MAX_ATTEMPTS) {
            await ref.delete();
            return { success: false, error: 'Too many attempts. Please request a new code.' };
        }

        const candidateHash = hashOtp(code, data.salt);
        if (data.otpHash !== candidateHash) {
            await ref.set({ attempts: (data.attempts || 0) + 1 }, { merge: true });
            return { success: false, error: 'Invalid code.' };
        }

        // Clean up used OTP
        await ref.delete();
        return { success: true };

    } catch (error) {
        console.error('Error verifying OTP:', error);
        return { success: false, error: 'Verification failed: ' + error.message };
    }
}

export async function verifyEmailChangeOtp(verificationId, code, newEmail) {
    try {
        const session = await getUserSession();
        if (!session) return { success: false, error: 'Unauthorized' };
        if (!verificationId || !code || !newEmail) return { success: false, error: 'Invalid request.' };

        const { db } = await import('@/lib/firebase-admin');
        const { auth } = await import('@/lib/firebase-admin');
        const ref = db.collection('otp_verifications').doc(verificationId);
        const snapshot = await ref.get();

        if (!snapshot.exists) {
            return { success: false, error: 'Invalid or expired code.' };
        }

        const data = snapshot.data();
        const ip = getClientIp();
        const emailLower = (data.email || '').toLowerCase();
        const newEmailLower = newEmail.toLowerCase();

        if (emailLower !== newEmailLower) {
            return { success: false, error: 'Email mismatch. Please request a new code.' };
        }

        if (emailLower) {
            const verifyRateKey = crypto.createHash('sha256').update(`${emailLower}|${ip}`).digest('hex');
            const verifyRateRef = db.collection('otp_verify_rate_limits').doc(verifyRateKey);
            const verifyRateSnap = await verifyRateRef.get();
            const now = Date.now();
            if (verifyRateSnap.exists) {
                const rateData = verifyRateSnap.data();
                const windowStart = rateData.windowStart || now;
                if (now - windowStart < OTP_VERIFY_RATE_WINDOW_MS && rateData.count >= OTP_VERIFY_RATE_MAX) {
                    return { success: false, error: 'Too many attempts. Please try again later.' };
                }
                if (now - windowStart >= OTP_VERIFY_RATE_WINDOW_MS) {
                    await verifyRateRef.set({ count: 1, windowStart: now }, { merge: true });
                } else {
                    await verifyRateRef.set({ count: (rateData.count || 0) + 1, windowStart }, { merge: true });
                }
            } else {
                await verifyRateRef.set({ count: 1, windowStart: now });
            }
        }

        if (Date.now() > data.expiresAt) {
            await ref.delete();
            return { success: false, error: 'Code has expired.' };
        }

        if ((data.attempts || 0) >= OTP_MAX_ATTEMPTS) {
            await ref.delete();
            return { success: false, error: 'Too many attempts. Please request a new code.' };
        }

        const candidateHash = hashOtp(code, data.salt);
        if (data.otpHash !== candidateHash) {
            await ref.set({ attempts: (data.attempts || 0) + 1 }, { merge: true });
            return { success: false, error: 'Invalid code.' };
        }

        await ref.delete();

        // Update Auth email (unique enforcement happens here)
        try {
            await auth.updateUser(session.uid, { email: newEmail });
        } catch (e) {
            const msg = e?.errorInfo?.message || e?.message || 'Failed to update auth email.';
            return { success: false, error: msg };
        }

        await db.collection('users').doc(session.uid).set({ email: newEmail, isVerified: true }, { merge: true });
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        console.error('Error verifying email change OTP:', error);
        return { success: false, error: 'Verification failed: ' + error.message };
    }
}
export async function verifyEmailOtp(verificationId, code) {
    try {
        const session = await getUserSession();
        if (!session) return { success: false, error: 'Unauthorized' };
        if (!verificationId || !code) return { success: false, error: 'Invalid request.' };

        const { db } = await import('@/lib/firebase-admin');
        const ref = db.collection('otp_verifications').doc(verificationId);
        const snapshot = await ref.get();

        if (!snapshot.exists) {
            return { success: false, error: 'Invalid or expired code.' };
        }

        const data = snapshot.data();
        const ip = getClientIp();
        const emailLower = (data.email || '').toLowerCase();
        const sessionEmail = (session.email || '').toLowerCase();

        if (!sessionEmail || emailLower !== sessionEmail) {
            return { success: false, error: 'Email mismatch. Please request a new code.' };
        }

        if (emailLower) {
            const verifyRateKey = crypto.createHash('sha256').update(`${emailLower}|${ip}`).digest('hex');
            const verifyRateRef = db.collection('otp_verify_rate_limits').doc(verifyRateKey);
            const verifyRateSnap = await verifyRateRef.get();
            const now = Date.now();
            if (verifyRateSnap.exists) {
                const rateData = verifyRateSnap.data();
                const windowStart = rateData.windowStart || now;
                if (now - windowStart < OTP_VERIFY_RATE_WINDOW_MS && rateData.count >= OTP_VERIFY_RATE_MAX) {
                    return { success: false, error: 'Too many attempts. Please try again later.' };
                }
                if (now - windowStart >= OTP_VERIFY_RATE_WINDOW_MS) {
                    await verifyRateRef.set({ count: 1, windowStart: now }, { merge: true });
                } else {
                    await verifyRateRef.set({ count: (rateData.count || 0) + 1, windowStart }, { merge: true });
                }
            } else {
                await verifyRateRef.set({ count: 1, windowStart: now });
            }
        }

        if (Date.now() > data.expiresAt) {
            await ref.delete();
            return { success: false, error: 'Code has expired.' };
        }

        if ((data.attempts || 0) >= OTP_MAX_ATTEMPTS) {
            await ref.delete();
            return { success: false, error: 'Too many attempts. Please request a new code.' };
        }

        const candidateHash = hashOtp(code, data.salt);
        if (data.otpHash !== candidateHash) {
            await ref.set({ attempts: (data.attempts || 0) + 1 }, { merge: true });
            return { success: false, error: 'Invalid code.' };
        }

        await ref.delete();
        await db.collection('users').doc(session.uid).set({ isVerified: true }, { merge: true });
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        console.error('Error verifying email OTP:', error);
        return { success: false, error: 'Verification failed: ' + error.message };
    }
}
