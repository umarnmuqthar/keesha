'use client';

import React, { useEffect } from 'react';
import { Network, Wallet, CreditCard, Coins, Banknote } from 'lucide-react';

export default function Celebration({ onComplete }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, 3000);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="flex flex-col items-center justify-center h-64 text-center animate-in fade-in zoom-in duration-500">
            <div className="relative w-32 h-32 mb-8">
                {/* Central Node */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <div className="w-16 h-16 bg-[#FF385C] rounded-full flex items-center justify-center shadow-lg shadow-[#FF385C]/30 animate-pulse">
                        <Network color="white" size={32} />
                    </div>
                </div>

                {/* Satellite Nodes - Money Icons */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-[spin_4s_linear_infinite]">
                    <div className="relative w-32 h-32">
                        {/* Top */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-sm">
                            <Wallet className="text-[#FF385C]" size={18} />
                        </div>
                        {/* Right */}
                        <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-sm">
                            <CreditCard className="text-[#FF385C]" size={18} />
                        </div>
                        {/* Bottom */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-sm">
                            <Coins className="text-[#FF385C]" size={18} />
                        </div>
                        {/* Left */}
                        <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-sm">
                            <Banknote className="text-[#FF385C]" size={18} />
                        </div>
                    </div>
                </div>

                {/* Connecting Lines (Decorative) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 animate-[spin_8s_linear_infinite_reverse]" viewBox="0 0 100 100">
                    <line x1="50" y1="50" x2="50" y2="10" stroke="#FF385C" strokeWidth="2" />
                    <line x1="50" y1="50" x2="90" y2="50" stroke="#FF385C" strokeWidth="2" />
                    <line x1="50" y1="50" x2="50" y2="90" stroke="#FF385C" strokeWidth="2" />
                    <line x1="50" y1="50" x2="10" y2="50" stroke="#FF385C" strokeWidth="2" />
                </svg>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">Setting up your command center...</h3>
            <p className="text-gray-500 text-sm">Personalizing your dashboard</p>
        </div>
    );
}
