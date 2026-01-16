
"use client";

import React, { useState, useEffect } from 'react';

export default function LoadingScreen() {
    const [progress, setProgress] = useState(0);
    const [msgIndex, setMsgIndex] = useState(0);
    const messages = [
        "쿠키 반죽 중...",
        "초코칩 뿌리는 중...",
        "오븐 예열 중...",
        "맛있게 굽는 중...",
        "포장하는 중!"
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 1;
            });
        }, 30);

        const msgInterval = setInterval(() => {
            setMsgIndex(prev => (prev + 1) % messages.length);
        }, 800);

        return () => {
            clearInterval(interval);
            clearInterval(msgInterval);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[100000] bg-white flex flex-col items-center justify-center">
            {/* Cookie Animation */}
            <div className="relative w-32 h-32 mb-8">
                <div className="absolute inset-0 bg-[#F5D4B1] rounded-full animate-bounce shadow-inner border-4 border-[#D4A373]">
                    {/* Chocolate Chips */}
                    <div className="absolute top-4 left-6 w-3 h-3 bg-[#4A2C2A] rounded-full" />
                    <div className="absolute top-10 left-12 w-4 h-4 bg-[#4A2C2A] rounded-full" />
                    <div className="absolute top-6 right-8 w-3 h-3 bg-[#4A2C2A] rounded-full" />
                    <div className="absolute bottom-6 left-10 w-3 h-3 bg-[#4A2C2A] rounded-full" />
                </div>
                {/* Steam */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-1">
                    <div className="w-1 h-4 bg-gray-200 rounded-full animate-pulse blur-sm" />
                    <div className="w-1 h-6 bg-gray-100 rounded-full animate-pulse delay-75 blur-sm" />
                    <div className="w-1 h-4 bg-gray-200 rounded-full animate-pulse delay-150 blur-sm" />
                </div>
            </div>

            <h2 className="text-2xl font-black text-gray-800 mb-2">{messages[msgIndex]}</h2>

            {/* Progress Bar */}
            <div className="w-64 h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                <div
                    className="h-full bg-[#22C55E] transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <p className="mt-4 text-gray-400 font-bold tracking-widest uppercase text-xs">
                Dubai Radar Loading... {progress}%
            </p>
        </div>
    );
}
