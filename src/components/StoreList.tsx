
"use client";

import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { Heart, MapPin, AlertCircle, Check } from 'lucide-react';

export default function StoreList() {
    const [stores, setStores] = useState<any[]>([]);
    const { favorites, toggleFavorite, setSelectedStore, setViewMode } = useStore();
    const [sortBy, setSortBy] = useState<'distance' | 'price'>('distance');

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        const { data } = await supabase.from('stores').select(`
      *,
      products (
        status,
        price
      )
    `);
        if (data) setStores(data);
    };

    const sortedStores = [...stores].sort((a, b) => {
        if (sortBy === 'price') {
            const priceA = a.products?.[0]?.price || 999999;
            const priceB = b.products?.[0]?.price || 999999;
            return priceA - priceB;
        }
        // Distance sort would require user location, for now just ID or Name
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
            <div className="px-4 mb-4 flex gap-2">
                <button
                    onClick={() => setSortBy('distance')}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${sortBy === 'distance' ? 'bg-black text-white' : 'bg-white text-gray-600 border'
                        }`}
                >
                    거리순
                </button>
                <button
                    onClick={() => setSortBy('price')}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${sortBy === 'price' ? 'bg-black text-white' : 'bg-white text-gray-600 border'
                        }`}
                >
                    가격순
                </button>
            </div>

            {/* List */}
            <div className="px-4 space-y-3">
                {sortedStores.map((store) => {
                    const status = store.products?.[0]?.status || 'UNKNOWN';
                    const isFav = favorites.includes(store.id);

                    return (
                        <div key={store.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start">
                                <div
                                    className="flex-1 cursor-pointer"
                                    onClick={() => {
                                        setSelectedStore(store);
                                        setViewMode('map'); // Go to map when clicked
                                    }}
                                >
                                    <h3 className="font-bold text-lg text-gray-900">{store.name}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{store.address || '주소 정보 없음'}</p>

                                    <div className="mt-3 flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                                                status === 'SOLD_OUT' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {status === 'AVAILABLE' ? '재고 있음' :
                                                status === 'SOLD_OUT' ? '품절' : '정보 없음'}
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
