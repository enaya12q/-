'use client';

import { Suspense } from 'react';
import Header from '@/components/Header';
import AuthContent from './AuthContent';

export default function Auth() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <Suspense fallback={<div>Loading...</div>}>
                <AuthContent />
            </Suspense>
        </div>
    );
}