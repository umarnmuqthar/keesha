'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import AuthLayout from '@/app/components/auth/AuthLayout';

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const oobCode = searchParams.get('oobCode') || '';

    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('loading'); // loading | ready | done | error
    const [error, setError] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        let isMounted = true;

        const verifyCode = async () => {
            if (!oobCode) {
                if (isMounted) {
                    setStatus('error');
                    setError('Invalid or missing reset code.');
                }
                return;
            }

            try {
                const userEmail = await verifyPasswordResetCode(auth, oobCode);
                if (isMounted) {
                    setEmail(userEmail);
                    setStatus('ready');
                }
            } catch (err) {
                if (isMounted) {
                    setStatus('error');
                    setError('This reset link is invalid or has expired.');
                }
            }
        };

        verifyCode();
        return () => {
            isMounted = false;
        };
    }, [oobCode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await confirmPasswordReset(auth, oobCode, password);
            setStatus('done');
            router.push('/login?reset=success');
        } catch (err) {
            setError('Failed to reset password. Please request a new link.');
        }
    };

    return (
        <AuthLayout title="Reset Password" subtitle="Create a new password for your account">
            {status === 'loading' && (
                <div className="text-sm text-gray-500">Verifying reset link...</div>
            )}

            {status === 'error' && (
                <div className="text-sm text-red-600">{error}</div>
            )}

            {status === 'ready' && (
                <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                        Resetting password for <span className="font-semibold">{email}</span>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 ml-1">New Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-all placeholder:text-gray-400"
                            required
                            minLength={6}
                        />
                    </div>

                    {error && <div className="text-sm text-red-600">{error}</div>}

                    <button
                        type="submit"
                        className="w-full bg-[#FF385C] hover:bg-[#ff2449] text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-[0_4px_14px_rgba(255,56,92,0.3)] flex items-center justify-center gap-2 transform active:scale-[0.98]"
                    >
                        Reset Password
                    </button>
                </form>
            )}
        </AuthLayout>
    );
}
