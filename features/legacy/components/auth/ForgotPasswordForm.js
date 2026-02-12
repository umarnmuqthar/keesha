'use client';

import React, { useState } from 'react';
import { Mail, ArrowRight, Lock } from 'lucide-react';

export default function ForgotPasswordForm({ onSendEmail, isLoading }) {
    const [step, setStep] = useState('email'); // 'email' -> 'sent'
    const [email, setEmail] = useState('');

    const handleSendEmail = async (e) => {
        e.preventDefault();
        const success = await onSendEmail(email);
        if (success) setStep('sent');
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Step 1: Email Input */}
            <form onSubmit={handleSendEmail} className="space-y-6">

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
                    <div className="relative">
                        <input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={step !== 'email'}
                            className={`w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-all placeholder:text-gray-400 pl-11 ${step !== 'email' ? 'bg-gray-50 text-gray-500' : ''}`}
                            required
                        />
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    </div>
                </div>

                {step === 'sent' && (
                    <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700 animate-in fade-in slide-in-from-top-2">
                        If an account exists for <span className="font-semibold">{email}</span>, we sent a reset link. Please check your inbox.
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#FF385C] hover:bg-[#ff2449] disabled:bg-[#FF385C]/70 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-[0_4px_14px_rgba(255,56,92,0.3)] disabled:shadow-none flex items-center justify-center gap-2 transform active:scale-[0.98]"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            {step === 'email' ? 'Send Reset Link' : 'Resend Reset Link'}
                            {!isLoading && <ArrowRight size={18} />}
                        </>
                    )}
                </button>
            </form>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-medium pt-4 border-t border-gray-50 mt-6">
                <Lock size={12} />
                <span>SECURE BANK-LEVEL ENCRYPTION</span>
            </div>
        </div>
    );
}
