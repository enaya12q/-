'use client';
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState, useEffect } from 'react';
import { Progress } from './ui/progress';
import toast from 'react-hot-toast';

interface AdCardProps {
    onComplete: () => Promise<void>;
    remainingAds: number;
    rewardPerAd: number;
}

export default function AdCard({ onComplete, remainingAds, rewardPerAd }: AdCardProps) {
    const [isWatching, setIsWatching] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentAdIndex, setCurrentAdIndex] = useState(0);
    const [dailyEarnings, setDailyEarnings] = useState(((50 - remainingAds) * rewardPerAd).toFixed(3));
    const [isFocused, setIsFocused] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const watchDuration = 30; // 30 seconds per ad

    // Handle window focus/blur
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && isWatching) {
                setIsPaused(true);
                toast.error('Please keep the window in focus to earn rewards!', { id: 'focus' });
            } else {
                setIsPaused(false);
            }
        };

        const handleFocus = () => {
            setIsFocused(true);
            setIsPaused(false);
        };

        const handleBlur = () => {
            if (isWatching) {
                setIsFocused(false);
                setIsPaused(true);
                toast.error('Please keep the window in focus to earn rewards!', { id: 'focus' });
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, [isWatching]);

    // Load persistent banner ad on component mount
    useEffect(() => {
        const bannerScript = document.createElement('script');
        bannerScript.async = true;
        bannerScript.setAttribute('data-cfasync', 'false');
        bannerScript.src = '//pl27623322.revenuecpmgate.com/07a0ea3dee3fc93775251a64a297df45/invoke.js';
        document.head.appendChild(bannerScript);

        // Create banner container if it doesn't exist
        if (!document.getElementById('container-07a0ea3dee3fc93775251a64a297df45')) {
            const container = document.createElement('div');
            container.id = 'container-07a0ea3dee3fc93775251a64a297df45';
            document.querySelector('.ad-banner-container')?.appendChild(container);
        }

        return () => {
            document.head.removeChild(bannerScript);
        };
    }, []);

    const loadAdScript = (scriptUrl: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = scriptUrl;

            script.onload = () => {
                toast.success('Ad loaded successfully');
                setTimeout(resolve, 1000); // Give the ad a second to initialize
            };

            script.onerror = () => {
                toast.error('Failed to load ad. Please try again.');
                reject(new Error('Failed to load ad script'));
            };

            document.head.appendChild(script);

            // Clean up script after a delay
            setTimeout(() => {
                if (document.head.contains(script)) {
                    document.head.removeChild(script);
                }
            }, 5000); // Remove script after 5 seconds
        });
    };

    const watchAd = async () => {
        try {
            setIsWatching(true);
            setProgress(0);
            setCurrentAdIndex(0);

            const adScripts = [
                '//pl27588635.revenuecpmgate.com/e4/06/54/e40654054912ec87321f8ae7b5b8475e.js',
                '//pl27623329.revenuecpmgate.com/3f/1b/ae/3f1bae06be8fb8243633dd02aa28465b.js'
            ];

            toast.loading('Starting ad session...', { id: 'adSession' });

            // Load first ad immediately
            await loadAdScript(adScripts[0]);

            // Start progress timer
            let elapsed = 0;
            const timer = setInterval(async () => {
                if (!isPaused) {
                    elapsed += 1;
                    const newProgress = (elapsed / watchDuration) * 100;
                    setProgress(newProgress);

                    // Load second ad at halfway point
                    if (elapsed === Math.floor(watchDuration / 2)) {
                        setCurrentAdIndex(1);
                        toast.loading('Loading next ad...', { id: 'adSession' });
                        try {
                            await loadAdScript(adScripts[1]);
                        } catch (_error) {
                            clearInterval(timer);
                            setIsWatching(false);
                            toast.error('Failed to load second ad. Please try again.', { id: 'adSession' });
                            return;
                        }
                    }

                    if (elapsed >= watchDuration) {
                        clearInterval(timer);
                        setIsWatching(false);
                        setProgress(100);
                        setCurrentAdIndex(0);
                        await onComplete();
                        const newEarnings = (parseFloat(dailyEarnings) + rewardPerAd).toFixed(3);
                        setDailyEarnings(newEarnings);
                        toast.success(`Congratulations! You earned $${rewardPerAd.toFixed(3)}. Total today: $${newEarnings}`, {
                            id: 'adSession',
                            duration: 5000
                        });
                    }
                }
            }, 1000);
        } catch (_error) {
            setIsWatching(false);
            toast.error('Failed to start ad session. Please try again.', { id: 'adSession' });
        }
    };

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Watch Ad to Earn</h3>
                    <div className="text-right">
                        <span className="text-sm text-gray-500 block">
                            Remaining today: {remainingAds}
                        </span>
                        <span className="text-sm text-indigo-600 font-medium block">
                            Earned today: ${dailyEarnings}
                        </span>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-gray-600">
                            Earn ${rewardPerAd.toFixed(3)} per ad view
                        </p>
                        {isWatching && (
                            <span className={`text-xs ${isFocused ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                                <span className={`w-2 h-2 rounded-full mr-1 ${isFocused ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                {isFocused ? 'Focused' : 'Stay Focused!'}
                            </span>
                        )}
                    </div>
                    {isWatching && (
                        <div className="space-y-2">
                            <div className="relative">
                                <Progress value={progress} className="h-2" />
                                <div
                                    className="absolute top-0 left-0 h-full bg-indigo-200 animate-pulse"
                                    style={{
                                        width: `${progress}%`,
                                        transition: 'width 0.5s ease-in-out'
                                    }}
                                />
                            </div>
                            <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>{`Ad ${currentAdIndex + 1}/2`}</span>
                                <span>{`${watchDuration - Math.floor(progress / (100 / watchDuration))}s remaining`}</span>
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={watchAd}
                    disabled={isWatching || remainingAds === 0}
                    className={`w-full py-2 px-4 rounded-md text-white font-medium ${isWatching || remainingAds === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                >
                    {isWatching ? `Watching Ad ${currentAdIndex + 1}/2...` : remainingAds === 0 ? 'Daily Limit Reached' : 'Watch Ad'}
                </button>
            </div>

            {/* Persistent Banner Ad Container */}
            <div className="ad-banner-container mt-6"></div>
        </>
    );
}