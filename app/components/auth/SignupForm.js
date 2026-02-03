'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, Mail, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function SignupForm({ onSubmit, isLoading, initialValues }) {
    const [name, setName] = useState(initialValues?.name || '');
    const [email, setEmail] = useState(initialValues?.email || '');
    const [password, setPassword] = useState(initialValues?.password || '');
    const [showPassword, setShowPassword] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const togglePasswordVisibility = () => {
        setIsAnimating(true);
        setTimeout(() => {
            setShowPassword(!showPassword);
            setIsAnimating(false);
        }, 150);
    };

    const getStrength = (pass) => {
        let strength = 0;
        if (pass.length > 5) strength += 1;
        if (pass.length > 7) strength += 1;
        if (/[A-Z]/.test(pass)) strength += 1;
        if (/[0-9]/.test(pass)) strength += 1;
        if (/[^A-Za-z0-9]/.test(pass)) strength += 1;
        return strength;
    };

    const strength = getStrength(password);
    const getStrengthColor = (s) => {
        if (s === 0) return 'bg-gray-200';
        if (s < 3) return 'bg-red-500';
        if (s < 5) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getStrengthText = (s) => {
        if (s === 0) return '';
        if (s < 3) return 'Weak';
        if (s < 5) return 'Medium';
        return 'Strong';
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ name, email, password });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Google Auth on Top */}
            <button className="w-full bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center">
                <div className="flex-grow border-t border-gray-100"></div>
                <span className="flex-shrink-0 mx-4 text-xs font-medium text-gray-400 uppercase tracking-wider">OR</span>
                <div className="flex-grow border-t border-gray-100"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Full Name</label>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isLoading}
                            className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-all placeholder:text-gray-400 pl-11"
                            required
                        />
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
                    <div className="relative">
                        <input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-all placeholder:text-gray-400 pl-11"
                            required
                        />
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            className={`w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#FF385C]/20 focus:border-[#FF385C] transition-all duration-200 ease-in-out placeholder:text-gray-400 pl-11 pr-12 ${isAnimating ? 'opacity-50 blur-[2px] scale-[0.99]' : 'opacity-100 blur-0 scale-100'
                                }`}
                            required
                        />
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <div className={`transition-all duration-300 ${isAnimating ? 'rotate-180 scale-75 opacity-50' : 'rotate-0 scale-100 opacity-100'}`}>
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </div>
                        </button>
                    </div>
                    {/* Password Strength Meter */}
                    {password && (
                        <div className="pt-2 ml-1 animate-in fade-in slide-in-from-top-1">
                            <div className="flex gap-1.5 h-1.5 mb-1.5">
                                <div className={`flex-1 rounded-full transition-all duration-300 ${strength >= 1 ? getStrengthColor(strength) : 'bg-gray-100'}`}></div>
                                <div className={`flex-1 rounded-full transition-all duration-300 ${strength >= 3 ? getStrengthColor(strength) : 'bg-gray-100'}`}></div>
                                <div className={`flex-1 rounded-full transition-all duration-300 ${strength >= 5 ? getStrengthColor(strength) : 'bg-gray-100'}`}></div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className={`text-xs font-medium transition-colors duration-300 ${strength < 3 ? 'text-red-500' : strength < 5 ? 'text-yellow-600' : 'text-green-600'
                                    }`}>
                                    {getStrengthText(strength)}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                    Min 8 chars, mixed case & symbols
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#FF385C] hover:bg-[#ff2449] disabled:bg-[#FF385C]/70 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-[0_4px_14px_rgba(255,56,92,0.3)] disabled:shadow-none flex items-center justify-center gap-2 transform active:scale-[0.98]"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            'Continue'
                        )}
                    </button>
                </div>
            </form>

            <div className="text-center text-sm font-medium text-gray-600 mt-2">
                <p>
                    Already have an account?{' '}
                    <Link href="/login" className="text-[#FF385C] hover:text-[#ff2449]">
                        Login
                    </Link>
                </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-medium pt-4 border-t border-gray-50 mt-6">
                <Lock size={12} />
                <span>SECURE BANK-LEVEL ENCRYPTION</span>
            </div>
        </div>
    );
}
