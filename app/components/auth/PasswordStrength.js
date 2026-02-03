'use client';

import React from 'react';

export default function PasswordStrength({ password }) {
    if (!password) return null;

    const getStrength = (pass) => {
        let score = 0;
        if (pass.length > 5) score++;
        if (pass.length > 8) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;
        return Math.min(score, 5);
    };

    const strength = getStrength(password);

    const getColor = (s) => {
        if (s <= 2) return 'bg-gray-300';
        if (s <= 3) return 'bg-yellow-400';
        return 'bg-[#FF385C]';
    };

    return (
        <div className="mt-2 flex gap-1 h-1">
            {[1, 2, 3, 4, 5].map((level) => (
                <div
                    key={level}
                    className={`flex-1 rounded-full transition-all duration-300 ${level <= strength ? getColor(strength) : 'bg-gray-100'
                        }`}
                />
            ))}
        </div>
    );
}
