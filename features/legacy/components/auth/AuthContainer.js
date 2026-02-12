'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from './AuthLayout';
import AuthEntry from './AuthEntry';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import OTPVerification from './OTPVerification';
import UserProfileForm from './UserProfileForm';
import Celebration from './Celebration';
import { auth, storage } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { createSession, syncUser, generateAndSendOTP, verifySignupOTP, validatePasswordPolicy } from '@/app/actions/authActions';

export default function AuthContainer({ initialMode = 'login' }) {
    const router = useRouter();

    // view options: 'login', 'signup-form', 'otp', 'profile', 'celebration', 'forgot-password'
    const [view, setView] = useState(initialMode === 'login' ? 'login' : (initialMode === 'forgot-password' ? 'forgot-password' : 'signup-form'));
    const [mode, setMode] = useState(initialMode); // 'login', 'signup', 'forgot-password'

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [tempData, setTempData] = useState(null); // { email, password, name }
    const [isSyncingProfile, setIsSyncingProfile] = useState(false);

    // Reset view when mode changes externally
    useEffect(() => {
        if (initialMode === 'login') {
            setMode('login');
            setView('login');
        } else if (initialMode === 'forgot-password') {
            setMode('forgot-password');
            setView('forgot-password');
        } else {
            setMode('signup');
            setView('signup-form');
        }
    }, [initialMode]);

    // --- Forgot Password Handlers ---
    const handleForgotPasswordSendEmail = async (email) => {
        setLoading(true);
        setError('');
        try {
            const actionCodeSettings = {
                url: `${window.location.origin}/reset-password`,
                handleCodeInApp: true
            };
            await sendPasswordResetEmail(auth, email, actionCodeSettings);
            setLoading(false);
            return true;
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/invalid-email') {
                setError('Invalid email address.');
            } else if (err.code === 'auth/user-not-found') {
                // Keep this generic to avoid enumeration hints
                setError('If an account exists, a reset link has been sent.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many attempts. Please try again later.');
            } else {
                setError('Failed to send reset email. Please try again.');
            }
            setLoading(false);
            return false;
        }
    };

    // --- Signup Handler ---
    const handleSignupSubmit = async ({ name, email, password }) => {
        setLoading(true);
        setError('');
        try {
            // 1. Proceed to OTP Flow
            // Store data temporarily for persistence and profile creation
            setTempData({ name, email, password });

            // Send Real OTP
            const result = await generateAndSendOTP(email);
            if (!result.success) {
                setError(result.error || 'Failed to send verification code.');
                setLoading(false);
                return;
            }
            setTempData({ name, email, password, verificationId: result.verificationId });

            setView('otp');
            setLoading(false);

        } catch (err) {
            console.error('Signup Error', err);
            setError(err.message || 'Signup failed.');
            setLoading(false);
        }
    };

    // --- Login Handler ---
    const handleLoginSubmit = async ({ email, password }) => {
        setLoading(true);
        setError('');
        try {
            // LOGIN LOGIC
            // Directly attempt login
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();
            const result = await createSession(idToken);
            if (result.success) {
                router.push('/');
            } else {
                setError(result.error || 'Login failed');
                setLoading(false);
            }
        } catch (err) {
            console.error('Login Error', err);
            if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                setError('Invalid email or password.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many failed attempts. Please try again later.');
            } else {
                setError(err.message || 'Authentication failed.');
            }
            setLoading(false);
        }
    };

    // --- OTP Handler ---
    const handleOTPVerify = async (code) => {
        setLoading(true);
        setError('');

        try {
            // Verify Real OTP
            const result = await verifySignupOTP(tempData?.verificationId, code);

            if (result.success) {
                // Verify success -> Go to Profile (or create account immediately if we skipped profile)
                // We have name from Signup, so we could technically use it.
                // But let's go to Profile step to be safe (maybe dob/gender).
                setView('profile');
            } else {
                setError(result.error || 'Invalid code.');
            }
        } catch (err) {
            console.error('OTP Verify Error', err);
            setError('Verification failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (!tempData?.email) return;
        setLoading(true);
        setError('');
        try {
            const result = await generateAndSendOTP(tempData.email);
            if (result.success) {
                setTempData(prev => ({ ...prev, verificationId: result.verificationId }));
                // Optional: Show success toast
            } else {
                setError(result.error || 'Failed to resend code.');
            }
        } catch (err) {
            setError('Failed to resend code.');
        } finally {
            setLoading(false);
        }
    };

    // --- Profile/Create Account Handler ---
    const handleProfileSubmit = async (data) => {
        // data = { name, dob, gender, currency, photo }
        setLoading(true);
        // Create Account now
        try {
            const { email, password } = tempData;

            // 1. Validate password policy server-side
            const policyResult = await validatePasswordPolicy(password);
            if (!policyResult.success) {
                setError(policyResult.error || 'Password does not meet requirements.');
                setLoading(false);
                return;
            }

            // 2. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // 3. Update Profile
            await updateProfile(userCredential.user, { displayName: data.name });

            // 4. Create Session ASAP
            const idToken = await userCredential.user.getIdToken(true);
            const result = await createSession(idToken);

            if (result.success) {
                // 5. Upload photo to Storage (if any) and sync profile in background
                setIsSyncingProfile(true);
                (async () => {
                    let photoUrl = null;
                    if (data.photo) {
                        const photoRef = ref(storage, `users/${userCredential.user.uid}/profile.jpg`);
                        await uploadString(photoRef, data.photo, 'data_url');
                        photoUrl = await getDownloadURL(photoRef);
                    }

                    await syncUser(userCredential.user.uid, {
                        name: data.name,
                        email,
                        dob: data.dob,
                        gender: data.gender,
                        currency: data.currency,
                        photoUrl,
                        isVerified: true,
                        createdAt: new Date().toISOString()
                    });
                    setIsSyncingProfile(false);
                })().catch((err) => {
                    console.error('Profile sync failed:', err);
                    setIsSyncingProfile(false);
                });

                setView('celebration');
            } else {
                setError('Session creation failed.');
                setLoading(false);
            }

        } catch (err) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Email is linked to another account. Please login.');
            } else {
                setError('Setup failed. Please try again.');
            }
            setLoading(false);
        }
    };

    const handleCelebrationComplete = () => {
        router.push('/');
        router.refresh();
    };

    // Determine Titles
    let title = mode === 'login' ? 'Welcome Back' : 'Create Account';
    let subtitle = mode === 'login' ? 'Sign in to manage your finances' : 'Join Keesha to track your wealth';

    if (mode === 'forgot-password') {
        title = 'Reset Password';
        subtitle = 'Enter your email to receive a code';
    }

    if (view === 'otp') {
        title = 'Check your email';
        subtitle = ''; // Let component handle the description to avoid duplication
    } else if (view === 'profile') {
        title = 'Tell us about yourself';
        subtitle = 'Basic info to set up your account';
    } else if (view === 'celebration') {
        title = '';
        subtitle = '';
    }

    return (
        <AuthLayout title={title} subtitle={subtitle}>
            {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-sm text-red-600 animate-in fade-in slide-in-from-top-2">
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    {error}
                </div>
            )}

            {isSyncingProfile && (
                <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3 text-sm text-blue-700 animate-in fade-in slide-in-from-top-2">
                    <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                    Finishing setup… You can continue while we wrap things up.
                </div>
            )}

            {view === 'entry' && (
                <AuthEntry onEmailSelect={() => setView('signup-form')} />
            )}

            {view === 'login' && (
                <LoginForm
                    mode={mode}
                    onSubmit={handleLoginSubmit}
                    isLoading={loading}
                    onForgotPassword={() => { }}
                />
            )}

            {view === 'signup-form' && (
                <SignupForm
                    onSubmit={handleSignupSubmit}
                    isLoading={loading}
                    initialValues={tempData}
                />
            )}

            {view === 'forgot-password' && (
                <ForgotPasswordForm
                    onSendEmail={handleForgotPasswordSendEmail}
                    isLoading={loading}
                />
            )}

            {view === 'otp' && (
                <OTPVerification
                    email={tempData?.email}
                    onVerify={handleOTPVerify}
                    onResend={handleResendOTP}
                    onEditEmail={() => setView(mode === 'signup' ? 'signup-form' : 'entry')}
                    isLoading={loading}
                    error={error}
                />
            )}

            {view === 'profile' && (
                <UserProfileForm
                    onSubmit={handleProfileSubmit}
                    isLoading={loading}
                    defaultEmail={tempData?.email}
                    // Pass name if we have it
                    defaultName={tempData?.name}
                />
            )}

            {view === 'celebration' && (
                <Celebration onComplete={handleCelebrationComplete} />
            )}
        </AuthLayout>
    );
}
