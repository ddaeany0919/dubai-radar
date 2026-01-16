import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { X, Check, AlertCircle, Heart, Bell } from 'lucide-react';
import OwnerOnboarding from './OwnerOnboarding';
import OwnerPostEditor from './OwnerPostEditor';
import StorePostsGallery from './StorePostsGallery';

export default function StoreBottomSheet() {
    const { selectedStore, isBottomSheetOpen, setBottomSheetOpen, favorites, toggleFavorite, notifications, toggleNotification } = useStore();
    const closeBottomSheet = () => setBottomSheetOpen(false);
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Owner & Stock State
    const [isOwner, setIsOwner] = useState(false);
    const [stockCount, setStockCount] = useState<number>(0);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [galleryRefreshKey, setGalleryRefreshKey] = useState(0);

    useEffect(() => {
        setMounted(true);
        supabase.auth.getUser().then(({ data: { user } }) => {
            setCurrentUser(user);
        });
    }, []);

    // Reset state when modal closes
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
            .single();

        if (data) {
            setProduct(data);
            setStockCount(data.stock_count || 0);

            // Auto-login if owner matches
            if (user && data.owner_id === user.id) {
                setIsOwner(true);
            }
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

            if (count !== undefined) {
                updates.stock_count = count;
            }

            const { data: existing, error: fetchError } = await supabase
                .from('products')
                .select('id')
                .eq('store_id', selectedStore.id)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
            }

            let error;

            if (existing) {
                const result = await supabase
                    .from('products')
                    .update(updates)
                    .eq('store_id', selectedStore.id);
                error = result.error;
            } else {
                const result = await supabase
                    .from('products')
                    .insert({
                        store_id: selectedStore.id,
                        ...updates
                    });
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

    if (!mounted || !isBottomSheetOpen || !selectedStore) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center">
            <div
                className="absolute inset-0 bg-gray-500/50 backdrop-blur-sm"
                onClick={closeBottomSheet}
            />

            <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">

                {showOnboarding ? (
                    <OwnerOnboarding
                        storeId={selectedStore.id}
                        storeName={selectedStore.name}
                        onSuccess={handleOnboardingSuccess}
                    />
                ) : (
                    <>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{selectedStore.name}</h2>
                                <p className="text-sm text-gray-500 mt-1">{selectedStore.address || '주소 정보 없음'}</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={async () => {
                                        if (Notification.permission !== 'granted') {
                                            const permission = await Notification.requestPermission();
                                            if (permission !== 'granted') return;
                                        }
                                        toggleNotification(selectedStore.id);
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <Bell
                                        className={`w-6 h-6 transition-colors ${notifications.includes(selectedStore.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                                            }`}
                                    />
                                </button>
                                <button
                                    onClick={() => toggleFavorite(selectedStore.id)}
                                    className="p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <Heart
                                        className={`w-6 h-6 transition-colors ${favorites.includes(selectedStore.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'
                                            }`}
                                    />
                                </button>
                                <button onClick={closeBottomSheet} className="p-2 hover:bg-gray-100 rounded-full">
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                <span className="text-gray-600">현재 상태</span>
                                <span className={`font-bold ${product?.status === 'AVAILABLE' ? 'text-green-600' :
                                    product?.status === 'SOLD_OUT' ? 'text-red-600' : 'text-gray-400'
                                    }`}>
                                    {product?.status === 'AVAILABLE' ? '재고 있음' :
                                        product?.status === 'SOLD_OUT' ? '품절' : '정보 없음'}
                                </span>
                            </div>
                            {product?.status === 'AVAILABLE' && product?.stock_count > 0 && (
                                <p className="text-sm text-green-600 font-semibold mt-2">
                                    현재 {product.stock_count}개 남음
                                </p>
                            )}
                            <p className="text-xs text-gray-400 mt-2 text-right">
                                마지막 업데이트: {product?.last_check_time ? new Date(product.last_check_time).toLocaleString() : '-'}
                            </p>
                        </div>

                        {isOwner ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-gray-700">재고 수량:</span>
                                    <input
                                        type="number"
                                        value={stockCount}
                                        onChange={(e) => setStockCount(Number(e.target.value))}
                                        className="px-3 py-2 border rounded-lg w-20 font-bold"
                                    />
                                    <span className="text-sm text-gray-600">개</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleUpdateStock('AVAILABLE', stockCount)}
                                        disabled={loading}
                                        className="flex flex-col items-center justify-center p-4 bg-green-50 border-2 border-green-500 rounded-xl hover:bg-green-100 active:scale-95 transition-all"
                                    >
                                        <Check className="w-8 h-8 text-green-600 mb-2" />
                                        <span className="font-bold text-green-700">입고 처리</span>
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStock('SOLD_OUT', 0)}
                                        disabled={loading}
                                        className="flex flex-col items-center justify-center p-4 bg-red-50 border-2 border-red-500 rounded-xl hover:bg-red-100 active:scale-95 transition-all"
                                    >
                                        <AlertCircle className="w-8 h-8 text-red-600 mb-2" />
                                        <span className="font-bold text-red-700">품절 처리</span>
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
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleUpdateStock('AVAILABLE')}
                                    disabled={loading}
                                    className="flex flex-col items-center justify-center p-4 bg-green-50 border-2 border-green-500 rounded-xl hover:bg-green-100 active:scale-95 transition-all"
                                >
                                    <Check className="w-8 h-8 text-green-600 mb-2" />
                                    <span className="font-bold text-green-700">재고 있어요</span>
                                </button>
                                <button
                                    onClick={() => handleUpdateStock('SOLD_OUT')}
                                    disabled={loading}
                                    className="flex flex-col items-center justify-center p-4 bg-red-50 border-2 border-red-500 rounded-xl hover:bg-red-100 active:scale-95 transition-all"
                                >
                                    <AlertCircle className="w-8 h-8 text-red-600 mb-2" />
                                    <span className="font-bold text-red-700">품절이에요</span>
                                </button>
                            </div>
                        )}

                        <div className="mt-6">
                            <StorePostsGallery
                                key={galleryRefreshKey}
                                storeId={selectedStore.id}
                                stockCount={product?.stock_count}
                            />
                        </div>

                        {!isOwner && (
                            <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
                                <button
                                    onClick={handleOwnerClick}
                                    className="w-full py-3 text-sm text-gray-500 hover:text-gray-700 font-medium"
                                >
                                    사장님이신가요? 재고 관리하기
                                </button>
                                <button
                                    onClick={() => {
                                        setIsOwner(true);
                                        alert('🕵️ 개발자 모드: 강제로 사장님 권한을 획득했습니다.');
                                    }}
                                    className="text-xs text-gray-300 hover:text-gray-400 w-full"
                                >
                                    (Dev Mode)
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>,
        document.body
    );
}
