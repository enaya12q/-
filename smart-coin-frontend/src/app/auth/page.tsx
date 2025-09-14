'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';

export default function Auth() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const searchParams = useSearchParams();
    const supabase = createClientComponentClient();
    const ref = searchParams.get('ref'); // Get referral code from URL if present

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
                    data: {
                        referralCode: ref // Store referral code in user metadata
                    }
                }
            });

            if (error) throw error;
            setMessage('Check your email for the login link!');
        } catch (error) {
            setMessage('Error sending magic link. Please try again.');
            console.error('Auth error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-md mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="bg-white py-8 px-4 shadow rounded-lg sm:px-10">
                    <div className="sm:mx-auto sm:w-full sm:max-w-md">
                        <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-8">
                            Sign in to Smart Coin Labs
                        </h2>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading
                                    ? 'bg-indigo-400 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                                    }`}
                            >
                                {loading ? 'Sending magic link...' : 'Send magic link'}
                            </button>
                        </div>

                        {message && (
                            <p className={`mt-2 text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'
                                }`}>
                                {message}
                            </p>
                        )}
                    </form>
                </div>
            </main>
        </div>
    );
}