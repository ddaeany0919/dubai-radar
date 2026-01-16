
"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { X, Check, AlertCircle, Heart, Bell, ChevronLeft, Clock, Store } from 'lucide-react';
import OwnerOnboarding from './OwnerOnboarding';
import OwnerPostEditor from './OwnerPostEditor';
import StorePostsGallery from './StorePostsGallery';

export default function StoreBottomSheet() {
    const {
        selectedStore,
        selectedStores,
        setSelectedStore,
        setSelectedStores,
        isBottomSheetOpen,
        setBottomSheetOpen,
        favorites,
        toggleFavorite,
        notifications,
        toggleNotification
    } = useStore();

    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [stockCount, setStockCount] = useState<number>(0);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [galleryRefreshKey, setGalleryRefreshKey] = useState(0);

    const closeBottomSheet = () => {
        setBottomSheetOpen(false);
        setSelectedStores(null);
    };

    useEffect(() => {
        setMounted(true);
        supabase.auth.getUser().then(({ data: { user } }) => {
            setCurrentUser(user);
        });
    }, []);

    useEffect(() => {
        if (!isBottomSheetOpen) {
            setIsOwner(false);
            setStockCount(0);
            setShowOnboarding(false);
        }
    }, [isBottomSheetOpen]);

    useEffect(() => {
        if (selectedStore) {
            setIsOwner(false);
            setShowOnboarding(false);
            fetchProductStatus();
        }
    }, [selectedStore]);

    const fetchProductStatus = async () => {
        if (!selectedStore) return;

        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        const { data } = await supabase
            .from('products')
            .select('*')
            .eq('store_id', selectedStore.id)
            .maybeSingle();

        if (data) {
            setProduct(data);
            setStockCount(data.stock_count || 0);
            if (user && data.owner_id === user.id) {
                setIsOwner(true);
            }
        } else {
            setProduct(null);
            setStockCount(0);
        }
    };

    const handleUpdateStock = async (status: 'AVAILABLE' | 'SOLD_OUT', count?: number) => {
        if (!selectedStore) return;
        setLoading(true);

        try {
            const finalStatus = (count === 0) ? 'SOLD_OUT' : status;
            const updates: any = {
                status: finalStatus,
                last_check_time: new Date().toISOString(),
            };
            if (count !== undefined) updates.stock_count = count;

            const { data: existing, error: fetchError } = await supabase
                .from('products')
                .select('id')
                .eq('store_id', selectedStore.id)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

            let error;
            if (existing) {
                const result = await supabase.from('products').update(updates).eq('store_id', selectedStore.id);
                error = result.error;
            } else {
                const result = await supabase.from('products').insert({ store_id: selectedStore.id, ...updates });
                error = result.error;
            }

            if (error) throw error;

            await supabase.from('user_reports').insert({
                store_id: selectedStore.id,
                report_type: status === 'AVAILABLE' ? 'HAVE' : 'NO_HAVE',
                description: `Owner update: ${count} items`
            });

            await fetchProductStatus();
            alert('재고 상태가 업데이트되었습니다.');
        } catch (error: any) {
            console.error('Stock Update Error:', error);
            alert(`업데이트 실패: ${error.message || '알 수 없는 오류'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleOwnerClick = () => {
        if (product?.owner_id && product.owner_id !== currentUser?.id) {
            alert('이미 다른 사장님이 등록한 가게입니다.');
            return;
        }
        setShowOnboarding(true);
    };

    const handleOnboardingSuccess = () => {
        setShowOnboarding(false);
        setIsOwner(true);
        fetchProductStatus();
    };

    if (!mounted || !isBottomSheetOpen || (!selectedStore && !selectedStores)) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={closeBottomSheet}
            />

            {/* Modal Container */}
            <div className="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] p-6 sm:p-8 max-h-[85vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-20 duration-500 border border-white/20 dark:border-gray-800 scrollbar-hide">

                {/* Drag Handle (Visual Only) */}
                <div className="flex justify-center mb-6">
                    <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>

                {/* Multiple Stores List View */}
                {selectedStores && !selectedStore && (
                    <div className="space-y-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <Store className="w-6 h-6 text-[#22C55E]" />
                                    주변 가게 목록
                                </h2>
                                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1">
                                    이 구역에 <span className="text-[#22C55E]">{selectedStores.length}개</span>의 가게가 있어요
                                </p>
                            </div>
                            <button onClick={closeBottomSheet} className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-90">
                                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {selectedStores.map((store) => {
                                const stock = store.products?.[0]?.stock_count || 0;
                                return (
                                    <button
                                        key={store.id}
                                        onClick={() => setSelectedStore(store)}
                                        className="w-full flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-800/40 rounded-[30px] border border-transparent hover:border-[#22C55E] hover:bg-white dark:hover:bg-gray-800 transition-all group active:scale-[0.98]"
                                    >
                                        <div className="flex-1 text-left overflow-hidden">
                                            <h3 className="font-black text-gray-900 dark:text-gray-100 group-hover:text-[#22C55E] transition-colors truncate">{store.name}</h3>
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 truncate">{store.address}</p>
                                        </div>
                                        <div className="flex items-center gap-3 ml-4">
                                            <span className={`px-3 py-1.5 rounded-2xl text-xs font-black shadow-sm ${stock > 0
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {stock}개
                                            </span>
                                            <div className="w-8 h-8 rounded-2xl bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600 flex items-center justify-center text-gray-300 group-hover:text-[#22C55E] group-hover:border-[#22C55E] transition-all">
                                                <Check className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Single Store Detail View */}
                {selectedStore && (
                    <div className="animate-in fade-in slide-in-from-right-10 duration-500">
                        {showOnboarding ? (
                            <OwnerOnboarding
                                storeId={selectedStore.id}
                                storeName={selectedStore.name}
                                onSuccess={handleOnboardingSuccess}
                            />
                        ) : (
                            <div className="space-y-8">
                                {/* Header */}
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            {selectedStores && (
                                                <button
                                                    onClick={() => setSelectedStore(null)}
                                                    className="flex items-center gap-1 text-xs font-black text-[#22C55E] hover:underline"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                    목록으로 돌아가기
                                                </button>
                                            )}
                                            <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100 leading-tight">
                                                {selectedStore.name}
                                            </h2>
                                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
                                                {selectedStore.address || '주소 정보 없음'}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={closeBottomSheet}
                                                className="p-3 bg-gray-100 dark:bg-gray-800 rounded-3xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-90 shadow-sm"
                                            >
                                                <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex items-center gap-3">
                                        <a
                                            href={`https://map.naver.com/p/search/${encodeURIComponent(selectedStore.name + ' ' + (selectedStore.address || ''))}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 h-12 flex items-center justify-center gap-2 bg-[#22C55E] hover:bg-[#16A34A] text-white font-black rounded-2xl shadow-lg shadow-green-500/20 transition-all active:scale-95"
                                        >
                                            <span className="text-lg">N</span>
                                            <span>길찾기</span>
                                        </a>
                                        <button
                                            onClick={async () => {
                                                if (Notification.permission !== 'granted') {
                                                    const permission = await Notification.requestPermission();
                                                    if (permission !== 'granted') return;
                                                }
                                                toggleNotification(selectedStore.id);
                                            }}
                                            className={`w-12 h-12 flex items-center justify-center rounded-2xl border-2 transition-all active:scale-90 ${notifications.includes(selectedStore.id)
                                                ? 'bg-yellow-400 border-yellow-400 text-white shadow-lg shadow-yellow-500/30'
                                                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400'
                                                }`}
                                        >
                                            <Bell className={`w-6 h-6 ${notifications.includes(selectedStore.id) ? 'fill-white' : ''}`} />
                                        </button>
                                        <button
                                            onClick={() => toggleFavorite(selectedStore.id)}
                                            className={`w-12 h-12 flex items-center justify-center rounded-2xl border-2 transition-all active:scale-90 ${favorites.includes(selectedStore.id)
                                                ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/30'
                                                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400'
                                                }`}
                                        >
                                            <Heart className={`w-6 h-6 ${favorites.includes(selectedStore.id) ? 'fill-white' : ''}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Stock Card */}
                                <div className="bg-gray-900 dark:bg-white p-8 rounded-[40px] text-white dark:text-gray-900 shadow-2xl relative overflow-hidden group">
                                    {/* Decoration Circles */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#22C55E]/20 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-[#22C55E]/30 transition-all duration-700" />
                                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full -ml-12 -mb-12 blur-xl" />

                                    <div className="relative space-y-6">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Realtime Stock</span>
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-wider shadow-sm ${product?.status === 'AVAILABLE'
                                                ? 'bg-[#22C55E] text-white'
                                                : 'bg-red-500 text-white'
                                                }`}>
                                                {product?.status === 'AVAILABLE' ? '🍪 IN STOCK' : '🚫 SOLD OUT'}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-6xl font-black tabular-nums tracking-tighter">
                                                        {product?.stock_count || 0}
                                                    </span>
                                                    <span className="text-2xl font-bold opacity-60 italic">개</span>
                                                </div>
                                                {product?.price > 0 && (
                                                    <p className="text-xl font-black text-[#22C55E]">
                                                        {product.price.toLocaleString()}원
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                <div className="w-10 h-10 bg-white/10 dark:bg-black/5 rounded-2xl flex items-center justify-center mb-2">
                                                    <Clock className="w-5 h-5 opacity-60" />
                                                </div>
                                                <p className="text-[9px] font-black text-gray-500 uppercase">Updated</p>
                                                <p className="text-xs font-bold font-mono">
                                                    {product?.last_check_time
                                                        ? new Date(product.last_check_time).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                                        : '--:--:--'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Owner Controls */}
                                {isOwner && (
                                    <div className="space-y-6 bg-gray-50 p-7 rounded-[35px] border border-gray-100 animate-in fade-in duration-500">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-black text-gray-900">재고 수동 관리</h3>
                                            <div className="flex items-center gap-3 bg-white p-1.5 px-4 rounded-2xl border border-gray-200 shadow-sm focus-within:border-[#22C55E] focus-within:ring-4 focus-within:ring-[#22C55E]/5 transition-all">
                                                <input
                                                    type="number"
                                                    value={stockCount}
                                                    onChange={(e) => setStockCount(Number(e.target.value))}
                                                    style={{ appearance: 'textfield', MozAppearance: 'textfield' }}
                                                    className="w-14 bg-transparent text-right font-black text-xl focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <span className="text-sm font-bold text-gray-400">개</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => handleUpdateStock('AVAILABLE', stockCount)}
                                                disabled={loading}
                                                className={`
                                                        flex flex-col items-center justify-center p-6 rounded-[30px] shadow-sm transition-all duration-300 group active:scale-95 disabled:opacity-50 border-2
                                                        ${product?.status === 'AVAILABLE'
                                                        ? 'bg-green-50 border-[#22C55E] shadow-green-100'
                                                        : 'bg-white border-gray-100 hover:border-[#22C55E]'}
                                                    `}
                                            >
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all ${product?.status === 'AVAILABLE' ? 'bg-[#22C55E] text-white' : 'bg-green-50 text-[#22C55E]'}`}>
                                                    <Check className="w-6 h-6" />
                                                </div>
                                                <span className={`font-black text-sm transition-colors ${product?.status === 'AVAILABLE' ? 'text-green-700' : 'text-gray-500'}`}>입고 완료</span>
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStock('SOLD_OUT', 0)}
                                                disabled={loading}
                                                className={`
                                                        flex flex-col items-center justify-center p-6 rounded-[30px] shadow-sm transition-all duration-300 group active:scale-95 disabled:opacity-50 border-2
                                                        ${product?.status === 'SOLD_OUT'
                                                        ? 'bg-red-50 border-red-500 shadow-red-100'
                                                        : 'bg-white border-gray-100 hover:border-red-500'}
                                                    `}
                                            >
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all ${product?.status === 'SOLD_OUT' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-500'}`}>
                                                    <AlertCircle className="w-6 h-6" />
                                                </div>
                                                <span className={`font-black text-sm transition-colors ${product?.status === 'SOLD_OUT' ? 'text-red-700' : 'text-gray-500'}`}>품절 안내</span>
                                            </button>
                                        </div>

                                        <OwnerPostEditor
                                            storeId={selectedStore.id}
                                            onPostCreated={() => {
                                                fetchProductStatus();
                                                setGalleryRefreshKey(prev => prev + 1);
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Owner Post / Gallery Section */}
                                <div className="space-y-4">
                                    <StorePostsGallery
                                        key={galleryRefreshKey}
                                        storeId={selectedStore.id}
                                        stockCount={product?.stock_count}
                                    />
                                </div>

                                {/* Footer Tools */}
                                {!isOwner && (
                                    <div className="pt-4 flex flex-col gap-3">
                                        <button
                                            onClick={handleOwnerClick}
                                            className="w-full py-5 rounded-[25px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-black text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-[0.98]"
                                        >
                                            가게 사장님이신가요? 인증하기
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsOwner(true);
                                                alert('🕵️ 개발자 모드: 사장님 권한을 강제로 획득했습니다.');
                                            }}
                                            className="text-[10px] uppercase tracking-widest font-black text-gray-300 dark:text-gray-600 hover:text-gray-400 w-full py-2 transition-colors uppercase"
                                        >
                                            [ Entering Developer Mode ]
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
