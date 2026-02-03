'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle } from 'lucide-react'; // Assuming CheckCircle import
import PasswordStrength from './PasswordStrength';

export default function SignupFlow({ onSubmit, isLoading, onBack }) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [emailSuggestion, setEmailSuggestion] = useState('');

    const suggestEmail = (email) => {
        if (!email.includes('@')) return '';
        const domain = email.split('@')[1];
        if (domain && domain.length > 2) {
            const common = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
            // Very simple distance check or direct startWith
            // Enhanced check could go here
            if (domain === 'gmial.com') return email.replace('gmial.com', 'gmail.com');
        }
        return '';
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (field === 'email') {
            setEmailSuggestion(suggestEmail(value));
        }
    };

    const handleContinue = (e) => {
        e.preventDefault();
        if (step === 1 && formData.name && formData.email) {
            setStep(2);
        } else if (step === 2 && formData.password) {
            onSubmit(formData);
        }
    };

    return (
        <form onSubmit={handleContinue} className="space-y-6">
            {/* Steps Indicator */}
            <div className="flex justify-center gap-2 mb-8">
                <div className={`h-1 w-8 rounded-full transition-colors ${step >= 1 ? 'bg-[#FF385C]' : 'bg-gray-200'}`} />
                <div className={`h-1 w-8 rounded-full transition-colors ${step >= 2 ? 'bg-[#FF385C]' : 'bg-gray-200'}`} />
                <div className={`h-1 w-8 rounded-full transition-colors ${step >= 3 ? 'bg-[#FF385C]' : 'bg-gray-200'}`} />
            </div>

            {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Full Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Umar Muqthar"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="w-full bg-[#F9FAFB] border-0 text-gray-900 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#FF385C]/20 focus:bg-white transition-all placeholder:text-gray-400"
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
                        <input
                            type="email"
                            placeholder="name@company.com"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            className="w-full bg-[#F9FAFB] border-0 text-gray-900 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#FF385C]/20 focus:bg-white transition-all placeholder:text-gray-400"
                            required
                        />
                        {emailSuggestion && (
                            <button
                                type="button"
                                onClick={() => handleChange('email', emailSuggestion)}
                                className="text-xs text-[#FF385C] hover:underline ml-1"
                            >
                                Did you mean {emailSuggestion}?
                            </button>
                        )}
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Create Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                className="w-full bg-[#F9FAFB] border-0 text-gray-900 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#FF385C]/20 focus:bg-white transition-all placeholder:text-gray-400 pr-12"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        <PasswordStrength password={formData.password} />
                    </div>
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#FF385C] hover:bg-[#ff2449] disabled:bg-[#FF385C]/70 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-[0_4px_14px_rgba(255,56,92,0.3)] disabled:shadow-none flex items-center justify-center gap-2 transform active:scale-[0.98] mt-6"
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <span>{step === 1 ? 'Continue' : 'Create Account'}</span>
                )}
            </button>

            <div className="text-center pt-2">
                <button
                    type="button"
                    onClick={step === 1 ? onBack : () => setStep(step - 1)}
                    className="text-sm text-gray-500 hover:text-gray-800 transition-colors font-medium"
                >
                    {step === 1 ? 'Already have an account? Sign in' : 'Back'}
                </button>
            </div>
        </form>
    );
}
