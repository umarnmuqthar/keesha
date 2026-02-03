'use client';

import React from 'react';
import AuthContainer from '@/app/components/auth/AuthContainer';

export default function LoginPage() {
    return <AuthContainer initialMode="login" />;
}
