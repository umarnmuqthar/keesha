'use client';

import React, { useState } from 'react';
import ProfileImageUploader from '../ProfileImageUploader'; // Reusing existing component if possible, or adapting
import { Camera } from 'lucide-react';

// Simplified Uploader for Onboarding (if ProfileImageUploader styles don't match, we might need to adjust or inline a simple wrapper)
// Let's assume we can reuse ProfileImageUploader but we might need to style it to match the Auth card.
// Or we can build a simple one here for the specific onboarding look.
// Given the "Power-Packed" requirement, reusing the cropper is good.
// The existing ProfileImageUploader has its own styles module. Let's try to wrap it or replicate a simpler version if it's too tied to the profile page styles.
// Actually, looking at ProfileImageUploader code, it imports styles from `./ProfileImageUploader.module.css`.
// I will create a focused `OnboardingProfileForm.js`.

export default function UserProfileForm({ onSubmit, isLoading, defaultEmail, defaultName }) {
    const [formData, setFormData] = useState({
        name: defaultName || '',
        email: defaultEmail || '',
        dob: '',
        gender: '',
        phoneNumber: '', // Removed currency, added phoneNumber
        photo: null // Base64 string
    });

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePhotoUpload = (base64) => {
        handleChange('photo', base64);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Construct payload without currency, maybe add default currency if backend requires it, or handle it in backend
        onSubmit({
            ...formData,
            currency: 'INR' // Defaulting to INR as per phone number context, or we can omit if optional
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-6">
                <div className="relative inline-block">
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 mx-auto">
                        {formData.photo ? (
                            <img src={formData.photo} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <Camera className="text-gray-400" size={32} />
                        )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-[#FF385C] text-white p-2 rounded-full cursor-pointer hover:bg-[#ff2449] transition-colors shadow-sm">
                        <Camera size={14} />
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => handlePhotoUpload(reader.result);
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />
                    </label>
                </div>
                {/* Removed optional text below photo */}
            </div>

            <div className="space-y-4">
                {/* Read-only Name and Email */}
                <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Name</div>
                        <div className="font-semibold text-gray-900">{formData.name || 'User'}</div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Email</div>
                        <div className="font-semibold text-gray-900">{formData.email}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Date of Birth</label>
                        <input
                            type="date"
                            value={formData.dob}
                            onChange={(e) => handleChange('dob', e.target.value)}
                            className="w-full bg-[#F9FAFB] border-0 text-gray-900 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#FF385C]/20 focus:bg-white transition-all text-sm"
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Gender</label>
                        <select
                            value={formData.gender}
                            onChange={(e) => handleChange('gender', e.target.value)}
                            className="w-full bg-[#F9FAFB] border-0 text-gray-900 rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-[#FF385C]/20 focus:bg-white transition-all appearance-none"
                            required
                        >
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 ml-1">Phone Number</label>
                    <div className="relative">
                        <div className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-center bg-gray-100 border-r border-gray-200 rounded-l-xl text-gray-600 font-medium z-10">
                            +91
                        </div>
                        <input
                            type="tel"
                            placeholder="98765 43210"
                            value={formData.phoneNumber}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, ''); // Only numbers
                                if (val.length <= 10) handleChange('phoneNumber', val);
                            }}
                            className="w-full bg-[#F9FAFB] border-0 text-gray-900 rounded-xl px-4 py-3.5 pl-20 focus:ring-2 focus:ring-[#FF385C]/20 focus:bg-white transition-all placeholder:text-gray-400"
                            required
                            minLength={10}
                        />
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#FF385C] hover:bg-[#ff2449] disabled:bg-[#FF385C]/70 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-[0_4px_14px_rgba(255,56,92,0.3)] disabled:shadow-none flex items-center justify-center gap-2 transform active:scale-[0.98] mt-6"
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    'Complete Setup'
                )}
            </button>
        </form>
    );
}
