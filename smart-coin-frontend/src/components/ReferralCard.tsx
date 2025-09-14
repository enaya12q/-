'use client';

import { useState } from 'react';

interface ReferralCardProps {
    referralCode: string;
    referralEarnings: number;
}

export default function ReferralCard({ referralCode, referralEarnings }: ReferralCardProps) {
    const [copied, setCopied] = useState(false);
    const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL}/auth?ref=${referralCode}`;

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(referralLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral Program</h3>

            <div className="space-y-4">
                <div>
                    <p className="text-sm text-gray-600 mb-2">Your Referral Earnings</p>
                    <p className="text-2xl font-bold text-indigo-600">${referralEarnings.toFixed(3)}</p>
                </div>

                <div>
                    <p className="text-sm text-gray-600 mb-2">Your Referral Link</p>
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            readOnly
                            value={referralLink}
                            className="flex-1 p-2 text-sm bg-gray-50 border border-gray-300 rounded-md"
                        />
                        <button
                            onClick={copyToClipboard}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                </div>

                <div className="text-sm text-gray-600">
                    <p>Earn 10% of all earnings from users who sign up using your referral link!</p>
                </div>
            </div>
        </div>
    );
}