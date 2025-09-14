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

interface Transaction {
    id: string;
    user_id: string;
    type: string;
    amount: number;
    created_at: string;
}

export default function Dashboard() {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [withdrawalAmount, setWithdrawalAmount] = useState(0.1);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [withdrawalError, setWithdrawalError] = useState('');
    const [withdrawalSuccess, setWithdrawalSuccess] = useState('');
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

    const fetchTransactions = useCallback(async () => {
        try {
            const response = await fetch('/api/wallet/transactions', {
                headers: {
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch transactions');

            const data = await response.json();
            setTransactions(data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
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

            // Refresh stats and transactions after successful ad view
            fetchStats();
            fetchTransactions();
        } catch (error) {
            console.error('Error recording ad view:', error);
        }
    };

    const handleWithdrawal = async () => {
        setWithdrawalError('');
        setWithdrawalSuccess('');
        setIsWithdrawing(true);

        try {
            const session = (await supabase.auth.getSession()).data.session;
            if (!session) {
                throw new Error('User not authenticated.');
            }

            const response = await fetch('/api/wallet/withdraw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ amount: withdrawalAmount })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Withdrawal failed.');
            }

            setWithdrawalSuccess(data.message || 'Withdrawal successful!');
            setWithdrawalAmount(0.1); // Reset amount
            fetchStats(); // Refresh stats to show updated balance
            fetchTransactions(); // Refresh transactions to show withdrawal
        } catch (error: any) {
            setWithdrawalError(error.message || 'An unexpected error occurred.');
            console.error('Withdrawal error:', error);
        } finally {
            setIsWithdrawing(false);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchTransactions();
    }, [fetchStats, fetchTransactions]);

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

                {/* Withdrawal Section */}
                <div className="mt-8 bg-white shadow overflow-hidden rounded-lg p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Withdraw Funds</h3>
                    <div className="flex items-center space-x-4">
                        <input
                            type="number"
                            step="0.01"
                            min="0.1"
                            value={withdrawalAmount}
                            onChange={(e) => setWithdrawalAmount(parseFloat(e.target.value))}
                            className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Amount to withdraw (min $0.1)"
                        />
                        <button
                            onClick={handleWithdrawal}
                            disabled={stats.balance < 0.1 || withdrawalAmount < 0.1 || withdrawalAmount > stats.balance || isWithdrawing}
                            className={`px-4 py-2 rounded-md text-white font-medium ${stats.balance < 0.1 || withdrawalAmount < 0.1 || withdrawalAmount > stats.balance || isWithdrawing
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700'
                                }`}
                        >
                            {isWithdrawing ? 'Processing...' : 'Withdraw'}
                        </button>
                    </div>
                    {withdrawalError && <p className="mt-2 text-sm text-red-600">{withdrawalError}</p>}
                    {withdrawalSuccess && <p className="mt-2 text-sm text-green-600">{withdrawalSuccess}</p>}
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-8">
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

                {/* Transaction History */}
                <div className="mt-8 bg-white shadow overflow-hidden rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Transaction History</h3>
                    </div>
                    <div className="border-t border-gray-200">
                        <dl>
                            {transactions.length === 0 ? (
                                <div className="px-4 py-5 sm:px-6 text-gray-500">No transactions yet.</div>
                            ) : (
                                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0">Amount</dd>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0">Date</dd>
                                </div>
                            )}
                            {transactions.map((transaction, index) => (
                                <div
                                    key={transaction.id}
                                    className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                                        } px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6`}
                                >
                                    <dt className="text-sm font-medium text-gray-500">{transaction.type}</dt>
                                    <dd
                                        className={`mt-1 text-sm sm:mt-0 ${transaction.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'
                                            }`}
                                    >
                                        {transaction.type === 'withdrawal' ? '-' : '+'}${Math.abs(transaction.amount).toFixed(3)}
                                    </dd>
                                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0">
                                        {new Date(transaction.created_at).toLocaleString()}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>
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