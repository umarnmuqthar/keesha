'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle, Lock } from 'lucide-react';

export default function OTPVerification({ email, onVerify, onResend, onEditEmail, isLoading, error }) {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timeLeft, setTimeLeft] = useState(60);
    const inputRefs = useRef([]);

    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [timeLeft]);

    const handleChange = (index, value) => {
        if (isLoading || isNaN(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (isLoading) return;
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        if (isLoading) return;
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
        const newOtp = [...otp];
        pastedData.forEach((digit, i) => {
            if (i < 6 && !isNaN(digit)) newOtp[i] = digit;
        });
        setOtp(newOtp);
        if (pastedData.length === 6) {
            inputRefs.current[5].focus();
        }
    };

    const maskEmail = (email) => {
        if (!email) return '';
        const [name, domain] = email.split('@');
        return `${name[0]}***@${domain}`;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center space-y-2">
                <div className="text-gray-500 flex flex-col items-center gap-1">
                    <span>We&apos;ve sent a code to <span className="font-semibold text-gray-900">{maskEmail(email)}</span></span>
                    {onEditEmail && (
                        <button
                            onClick={onEditEmail}
                            className="text-xs font-semibold text-[#FF385C] hover:text-[#ff2449] hover:underline transition-all"
                            disabled={isLoading}
                        >
                            Wrong email?
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col items-center gap-4">
                <div className="flex justify-center gap-4">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={el => inputRefs.current[index] = el}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={handlePaste}
                            disabled={isLoading}
                            className={`w-14 h-14 text-center text-2xl font-bold bg-[#F9FAFB] rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#FF385C]/10 disabled:opacity-50 disabled:cursor-not-allowed ${digit ? 'border-[#FF385C] bg-white' : 'border-transparent focus:border-[#FF385C] focus:bg-white'
                                } ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''}`}
                            autoComplete="off"
                        />
                    ))}
                </div>
                {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600 animate-in fade-in slide-in-from-top-1">
                        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </div>
                )}
            </div>

            <button
                onClick={() => onVerify(otp.join(''))}
                disabled={otp.some(d => d === '') || isLoading}
                className="w-full bg-[#FF385C] hover:bg-[#ff2449] disabled:bg-[#FF385C]/70 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-[0_4px_14px_rgba(255,56,92,0.3)] disabled:shadow-none flex items-center justify-center gap-2 transform active:scale-[0.98]"
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    'Verify & Continue'
                )}
            </button>

            <div className="text-center">
                {timeLeft > 0 ? (
                    <p className="text-sm text-gray-400 font-medium">
                        Didn&apos;t get it? <span className="text-gray-600 font-medium">Resend in 0:{timeLeft.toString().padStart(2, '0')}</span>
                    </p>
                ) : (
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-sm text-gray-400 font-medium">Didn&apos;t get it?</span>
                        <button
                            onClick={() => {
                                setTimeLeft(60);
                                onResend();
                            }}
                            disabled={isLoading}
                            className="text-sm font-bold text-[#FF385C] hover:text-[#ff2449] transition-colors disabled:opacity-50"
                        >
                            Resend Code
                        </button>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-medium pt-4 border-t border-gray-50 mt-6">
                <Lock size={12} />
                <span>SECURE BANK-LEVEL ENCRYPTION</span>
            </div>
        </div>
    );
}
