'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Header from '@/components/Header';
import AdCard from '@/components/AdCard';
import ReferralCard from '@/components/ReferralCard';

interface UserStats {
    balance: number;
    referralEarnings: number;
    referralCode: string;
    remainingAds: number;
}

export default function Dashboard() {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClientComponentClient();

    const fetchStats = useCallback(async () => {
        try {
            const response = await fetch('/api/ads/stats', {
                headers: {
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch stats');

            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    }, [supabase.auth]);

    const handleAdComplete = async () => {
        try {
            const response = await fetch('/api/ads/view', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                }
            });

            if (!response.ok) throw new Error('Failed to record ad view');

            // Refresh stats after successful ad view
            fetchStats();
        } catch (error) {
            console.error('Error recording ad view:', error);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="text-center">Loading...</div>
                </main>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="text-center text-red-600">Failed to load dashboard data</div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* Stats Overview */}
                <div className="mb-8">
                    <h2 className="text-lg font-medium text-gray-900">Overview</h2>
                    <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-gray-500 truncate">Total Balance</dt>
                                <dd className="mt-1 text-3xl font-semibold text-indigo-600">
                                    ${stats.balance.toFixed(3)}
                                </dd>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-gray-500 truncate">Referral Earnings</dt>
                                <dd className="mt-1 text-3xl font-semibold text-indigo-600">
                                    ${stats.referralEarnings.toFixed(3)}
                                </dd>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-gray-500 truncate">Remaining Ads Today</dt>
                                <dd className="mt-1 text-3xl font-semibold text-indigo-600">
                                    {stats.remainingAds}
                                </dd>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <AdCard
                        onComplete={handleAdComplete}
                        remainingAds={stats.remainingAds}
                        rewardPerAd={0.002}
                    />

                    <ReferralCard
                        referralCode={stats.referralCode}
                        referralEarnings={stats.referralEarnings}
                    />
                </div>

                {/* Permanent Ad Banner */}
                <div className="mt-8">
                    <script
                        async
                        data-cfasync="false"
                        src="//pl27623322.revenuecpmgate.com/07a0ea3dee3fc93775251a64a297df45/invoke.js"
                    />
                    <div id="container-07a0ea3dee3fc93775251a64a297df45" />
                </div>
            </main>
        </div>
    );
}