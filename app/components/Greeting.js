"use client";

import { useState, useEffect } from 'react';

export default function Greeting({ name }) {
    const [greeting, setGreeting] = useState('Welcome back');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good morning');
        else if (hour < 18) setGreeting('Good afternoon');
        else setGreeting('Good evening');
    }, []);

    return (
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {greeting}, {name}!
        </h1>
    );
}
