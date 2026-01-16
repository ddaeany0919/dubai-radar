
"use client";

import dynamic from 'next/dynamic';

import { useStore } from '@/store/useStore';
import StoreList from '@/components/StoreList';
import StoreBottomSheet from '@/components/StoreBottomSheet';
import SearchBar from '@/components/SearchBar';
import LoadingScreen from '@/components/LoadingScreen';
import ThemeWatcher from '@/components/ThemeWatcher';
import { Map, List } from 'lucide-react';
import { useState, useEffect } from 'react';

const MainMap = dynamic(() => import('@/components/RawNaverMap'), {
    ssr: false,
    loading: () => <div className="w-full h-screen flex items-center justify-center bg-gray-100 font-bold text-gray-400 italic">쿠프 굽는 중...</div>
});

export default function Home() {
    const { viewMode, setViewMode } = useStore();
    const [isAppLoading, setIsAppLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsAppLoading(false), 2500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <main className="relative w-full h-screen overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-500">
            <ThemeWatcher />
            {isAppLoading && <LoadingScreen />}

            <SearchBar />

            {viewMode === 'map' ? (
                <>
                    <MainMap />
                    <StoreBottomSheet />
                </>
            ) : <StoreList />}

            {/* View Toggle Button */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
                <button
                    onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
                    className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full shadow-lg hover:scale-105 transition-transform font-bold"
                >
                    {viewMode === 'map' ? (
                        <>
                            <List className="w-5 h-5" />
                            목록보기
                        </>
                    ) : (
                        <>
                            <Map className="w-5 h-5" />
                            지도보기
                        </>
                    )}
                </button>
            </div>
        </main>
    );
}
