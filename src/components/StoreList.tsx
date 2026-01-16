
"use client";

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { Heart, MapPin, AlertCircle, Check } from 'lucide-react';

export default function StoreList() {
    const [stores, setStores] = useState<any[]>([]);
    const {
        favorites,
        toggleFavorite,
        setSelectedStore,
        setViewMode,
        userLocation,
        setUserLocation,
        setBottomSheetOpen,
        showOnlyInStock,
        searchQuery
    } = useStore();
    const [sortBy, setSortBy] = useState<'distance' | 'price'>('distance');
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        const { data } = await supabase.from('stores').select(`
      *,
      products (
        status,
        price,
        stock_count
      )
    `);
        if (data) setStores(data);
    };

    const requestLocation = () => {
        setIsLoadingLocation(true);
        if (!navigator.geolocation) {
            alert('GPS를 지원하지 않는 브라우저입니다.');
            setIsLoadingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                setIsLoadingLocation(false);
            },
            (error) => {
                console.error(error);
                alert('위치 정보를 가져올 수 없습니다. 권한을 확인해주세요.');
                setIsLoadingLocation(false);
            }
        );
    };

    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLng = (lng2 - lng1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    };

    const filteredStores = stores.filter(store => {
        const matchesStock = showOnlyInStock ? (store.products?.[0]?.stock_count || 0) > 0 : true;
        const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            store.address?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFavorites = showOnlyFavorites ? favorites.includes(store.id) : true;
        return matchesStock && matchesSearch && matchesFavorites;
    });

    const sortedStores = [...filteredStores].sort((a, b) => {
        if (sortBy === 'price') {
            const priceA = a.products?.[0]?.price || 999999;
            const priceB = b.products?.[0]?.price || 999999;
            return priceA - priceB;
        }
        if (sortBy === 'distance' && userLocation) {
            const distA = calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
            const distB = calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
            return distA - distB;
        }
        return a.id - b.id;
    });

    return (
        <div className="w-full h-screen bg-gray-50 dark:bg-gray-900 overflow-y-auto pb-20 pt-[140px] transition-colors duration-500">
            {/* Ad Banner */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 text-white shadow-lg mx-4 rounded-3xl mb-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                <div className="relative flex justify-between items-center">
                    <div>
                        <p className="font-black text-xl mb-1">📢 두바이 초콜릿 택배 배송!</p>
                        <p className="text-sm font-medium opacity-90 italic">집에서 편하게 받아보세요 (광고)</p>
                    </div>
                    <button className="bg-white text-orange-600 px-5 py-2.5 rounded-2xl text-sm font-black shadow-xl active:scale-95 transition-all">
                        보러가기
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="px-4 mb-4 flex gap-2 overflow-x-auto scrollbar-hide py-2">
                <button
                    onClick={() => {
                        setSortBy('distance');
                        if (!userLocation) requestLocation();
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm whitespace-nowrap flex items-center gap-2 border ${sortBy === 'distance'
                        ? 'bg-black dark:bg-gray-100 text-white dark:text-black border-black dark:border-gray-100'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                        }`}
                >
                    <MapPin className="w-4 h-4" />
                    {userLocation ? '거리순' : '내 주변 찾기'}
                </button>

                <button
                    onClick={() => setSortBy('price')}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm whitespace-nowrap border ${sortBy === 'price'
                        ? 'bg-black dark:bg-gray-100 text-white dark:text-black border-black dark:border-gray-100'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                        }`}
                >
                    가격순
                </button>

                <button
                    onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm whitespace-nowrap flex items-center gap-2 border ${showOnlyFavorites
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                        }`}
                >
                    <Heart className={`w-4 h-4 ${showOnlyFavorites ? 'fill-white' : ''}`} />
                    찜한 가게만
                </button>
            </div>

            {/* List */}
            <div className="px-4 space-y-3">
                {isLoadingLocation && (
                    <div className="text-center py-4 text-gray-500">
                        📍 위치 정보를 가져오는 중입니다...
                    </div>
                )}

                {sortedStores.map((store) => {
                    const status = store.products?.[0]?.status || 'UNKNOWN';
                    const isFav = favorites.includes(store.id);
                    const distance = userLocation
                        ? calculateDistance(userLocation.lat, userLocation.lng, store.lat, store.lng)
                        : null;

                    return (
                        <div key={store.id} className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all active:scale-[0.98]">
                            <div className="flex justify-between items-start">
                                <div
                                    className="flex-1 cursor-pointer"
                                    onClick={() => {
                                        setSelectedStore(store);
                                        setViewMode('map');
                                        setBottomSheetOpen(true);
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-black text-xl text-gray-900 dark:text-gray-100">{store.name}</h3>
                                        {distance !== null && (
                                            <span className="text-[10px] font-black tracking-tighter text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-lg">
                                                {distance < 1
                                                    ? `${Math.round(distance * 1000)}m`
                                                    : `${distance.toFixed(1)}km`}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">{store.address || '주소 정보 없음'}</p>

                                    <div className="mt-4 flex items-center gap-2 flex-wrap">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${status === 'AVAILABLE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            status === 'SOLD_OUT' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                            }`}>
                                            {status === 'AVAILABLE' ? '재고 있음' :
                                                status === 'SOLD_OUT' ? '품절' : '정보 없음'}
                                        </span>
                                        <span className={`px-3 py-1.5 text-white text-xs font-black rounded-2xl shadow-lg bg-gradient-to-br ${(store.products?.[0]?.stock_count || 0) > 0
                                            ? 'from-green-400 to-green-600'
                                            : 'from-gray-400 to-gray-500'
                                            }`}>
                                            🍪 {store.products?.[0]?.stock_count || 0}개 남음
                                        </span>
                                        {store.products?.[0]?.price > 0 && (
                                            <span className="text-base font-black text-gray-900 dark:text-gray-100 ml-1">
                                                {store.products[0].price.toLocaleString()}원
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(store.id);
                                    }}
                                    className="p-2"
                                >
                                    <Heart
                                        className={`w-6 h-6 transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-gray-300'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
