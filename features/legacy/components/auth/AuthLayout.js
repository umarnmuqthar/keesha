'use client';

import React from 'react';
import Link from 'next/link';

export default function AuthLayout({ children, title, subtitle }) {
    return (
        <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-4 relative font-sans overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-[#FF385C]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                <div className="absolute top-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-[#FF385C]/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-32 left-[20%] w-[70vw] h-[70vw] bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

                {/* Subtle grid pattern overlay */}
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.02]"></div>
            </div>

            <style jsx global>{`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 10s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>

            <div className="w-full max-w-[480px] bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.04)] p-8 md:p-10 border border-white/20 relative z-10 transition-all duration-300 hover:shadow-[0_12px_50px_rgba(0,0,0,0.06)]">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-[#FF385C] mb-2 tracking-tight">Keesha</h1>
                    {title && <h2 className="text-xl font-bold text-gray-900 mb-1">{title}</h2>}
                    {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
                </div>

                {children}
            </div>

            <div className="mt-8 flex gap-6 text-xs text-gray-400 font-medium relative z-10">
                <Link href="https://keesha.money/privacypolicy" target="_blank" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
                <Link href="https://keesha.money/termsandconditions" target="_blank" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
                <Link href="https://keesha.money/contact-us" target="_blank" className="hover:text-gray-600 transition-colors">Contact Us</Link>
            </div>
        </div>
    );
}
