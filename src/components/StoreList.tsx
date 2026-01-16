
"use client";

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { Heart, MapPin, AlertCircle, Check } from 'lucide-react';

export default function StoreList() {
    const [stores, setStores] = useState<any[]>([]);
    const { favorites, toggleFavorite, setSelectedStore, setViewMode, userLocation, setUserLocation, setBottomSheetOpen } = useStore();
    const [sortBy, setSortBy] = useState<'distance' | 'price'>('distance');
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

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

    const sortedStores = [...stores].sort((a, b) => {
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
        <div className="w-full h-screen bg-gray-50 overflow-y-auto pb-20">
            {/* Ad Banner */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 text-white shadow-md mb-4">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-bold text-lg">📢 두바이 초콜릿 택배 배송!</p>
                        <p className="text-sm opacity-90">집에서 편하게 받아보세요 (광고)</p>
                    </div>
                    <button className="bg-white text-orange-500 px-3 py-1 rounded-full text-xs font-bold">
                        보러가기
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="px-4 mb-4 flex gap-2 overflow-x-auto">
                <button
                    onClick={() => {
                        setSortBy('distance');
                        if (!userLocation) requestLocation();
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-colors whitespace-nowrap flex items-center gap-1 ${sortBy === 'distance' ? 'bg-black text-white' : 'bg-white text-gray-600 border'
                        }`}
                >
                    <MapPin className="w-4 h-4" />
                    {userLocation ? '거리순' : '내 주변 찾기'}
                </button>
                <button
                    onClick={() => setSortBy('price')}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-colors whitespace-nowrap ${sortBy === 'price' ? 'bg-black text-white' : 'bg-white text-gray-600 border'
                        }`}
                >
                    가격순
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
                        <div key={store.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start">
                                <div
                                    className="flex-1 cursor-pointer"
                                    onClick={() => {
                                        setSelectedStore(store);
                                        setViewMode('map');
                                        setBottomSheetOpen(true); // Auto-open bottom sheet
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-lg text-gray-900">{store.name}</h3>
                                        {distance !== null && (
                                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                {distance < 1
                                                    ? `${Math.round(distance * 1000)}m`
                                                    : `${distance.toFixed(1)}km`}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{store.address || '주소 정보 없음'}</p>

                                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                                            status === 'SOLD_OUT' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {status === 'AVAILABLE' ? '재고 있음' :
                                                status === 'SOLD_OUT' ? '품절' : '정보 없음'}
                                        </span>
                                        <span className={`px-3 py-1.5 text-white text-sm font-bold rounded-full shadow-md bg-gradient-to-r ${(store.products?.[0]?.stock_count || 0) > 0
                                                ? 'from-green-500 to-green-600'
                                                : 'from-gray-400 to-gray-500'
                                            }`}>
                                            🍪 {store.products?.[0]?.stock_count || 0}개 남음
                                        </span>
                                        {store.products?.[0]?.price > 0 && (
                                            <span className="text-sm font-bold text-gray-900">
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
