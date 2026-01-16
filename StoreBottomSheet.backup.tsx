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

    useEffect(() => {
        setMounted(true);
        supabase.auth.getUser().then(({ data: { user } }) => {
            setCurrentUser(user);
        });
    }, []);

    // Reset state when store changes or modal closes
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
            // If count is 0, treat as SOLD_OUT
            const finalStatus = (count === 0) ? 'SOLD_OUT' : status;

            const updates: any = {
                status: finalStatus,
                last_check_time: new Date().toISOString(),
            };

            if (count !== undefined) {
                updates.stock_count = count;
            }

            // 1. Check if product record exists
            const { data: existing, error: fetchError } = await supabase
                .from('products')
                .select('id')
                .eq('store_id', selectedStore.id)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is 'Row not found'
                throw fetchError;
            }

            let error;

            if (existing) {
                // 2. Update existing record
                const result = await supabase
                    .from('products')
                    .update(updates)
                    .eq('store_id', selectedStore.id);
                error = result.error;
            } else {
                // 3. Insert new record if not exists
                const result = await supabase
                    .from('products')
                    .insert({
                        store_id: selectedStore.id,
                        ...updates
                    });
                error = result.error;
            }

            if (error) throw error;

            // Log User Report (Owner Action)
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
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {/* Transparent Backdrop */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'transparent'
                }}
                onClick={closeBottomSheet}
            />

            {/* Modal Content */}
            <div
                style={{
                    position: 'relative',
                    zIndex: 10,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(12px)',
                    width: '90%',
                    maxWidth: '400px',
                    borderRadius: '24px',
                    padding: '24px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    maxHeight: '90vh',
                    overflowY: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Close Button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', margin: 0 }}>{selectedStore.name}</h2>
                        <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px', margin: 0 }}>{selectedStore.address || '주소 정보 없음'}</p>
                    </div>
                    <button
                        onClick={closeBottomSheet}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '8px',
                            cursor: 'pointer',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: '10px'
                        }}
                    >
                        <X size={24} color="#9CA3AF" />
                    </button>
                </div>

                {showOnboarding ? (
                    <OwnerOnboarding
                        storeId={selectedStore.id}
                        storeName={selectedStore.name}
                        onSuccess={handleOnboardingSuccess}
                    />
                ) : (
                    <>
                        {/* Status Card */}
                        <div style={{ backgroundColor: '#F9FAFB', borderRadius: '16px', padding: '20px', border: '1px solid #F3F4F6', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <span style={{ fontSize: '14px', fontWeight: '600', color: '#6B7280' }}>현재 재고 상태</span>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={async () => {
                                            if (Notification.permission !== 'granted') {
                                                const permission = await Notification.requestPermission();
                                                if (permission !== 'granted') return;
                                            }
                                            toggleNotification(selectedStore.id);
                                        }}
                                        style={{
                                            backgroundColor: 'white',
                                            border: '1px solid #E5E7EB',
                                            borderRadius: '50%',
                                            width: '36px',
                                            height: '36px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                        }}
                                    >
                                        <Bell
                                            size={18}
                                            className={notifications.includes(selectedStore.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                                            color={notifications.includes(selectedStore.id) ? '#FACC15' : '#D1D5DB'}
                                            fill={notifications.includes(selectedStore.id) ? '#FACC15' : 'none'}
                                        />
                                    </button>
                                    <button
                                        onClick={() => toggleFavorite(selectedStore.id)}
                                        style={{
                                            backgroundColor: 'white',
                                            border: '1px solid #E5E7EB',
                                            borderRadius: '50%',
                                            width: '36px',
                                            height: '36px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                        }}
                                    >
                                        <Heart
                                            size={18}
                                            className={favorites.includes(selectedStore.id) ? 'fill-red-500 text-red-500' : 'text-gray-300'}
                                            color={favorites.includes(selectedStore.id) ? '#EF4444' : '#D1D5DB'}
                                            fill={favorites.includes(selectedStore.id) ? '#EF4444' : 'none'}
                                        />
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '12px', height: '12px', borderRadius: '50%',
                                    backgroundColor: product?.status === 'AVAILABLE' ? '#22C55E' : product?.status === 'SOLD_OUT' ? '#EF4444' : '#D1D5DB',
                                    boxShadow: product?.status === 'AVAILABLE' ? '0 0 10px rgba(34,197,94,0.5)' : 'none'
                                }} />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{
                                        fontSize: '24px', fontWeight: '900',
                                        color: product?.status === 'AVAILABLE' ? '#16A34A' : product?.status === 'SOLD_OUT' ? '#DC2626' : '#9CA3AF'
                                    }}>
                                        {product?.status === 'AVAILABLE' ? '재고 있음!' :
                                            product?.status === 'SOLD_OUT' ? '품절이에요' : '정보 없음'}
                                    </span>
                                    {product?.status === 'AVAILABLE' && product?.stock_count > 0 && (
                                        <span style={{ fontSize: '14px', color: '#16A34A', fontWeight: '600' }}>
                                            (현재 {product.stock_count}개 남음)
                                        </span>
                                    )}
                                </div>
                            </div>
                            <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '12px', textAlign: 'right' }}>
                                업데이트: {product?.last_check_time ? new Date(product.last_check_time).toLocaleTimeString() : '-'}
                            </p>
                        </div>

                        {/* Owner Actions */}
                        {isOwner ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.3s ease-in-out' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>재고 수량:</span>
                                    <input
                                        type="number"
                                        value={stockCount}
                                        onChange={(e) => setStockCount(Number(e.target.value))}
                                        style={{
                                            padding: '8px 12px', borderRadius: '8px', border: '1px solid #D1D5DB',
                                            width: '80px', fontSize: '16px', fontWeight: 'bold'
                                        }}
                                    />
                                    <span style={{ fontSize: '14px', color: '#6B7280' }}>개</span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <button
                                        onClick={() => handleUpdateStock('AVAILABLE', stockCount)}
                                        disabled={loading}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                            padding: '16px', borderRadius: '16px', border: 'none',
                                            backgroundColor: '#22C55E', color: 'white', cursor: 'pointer',
                                            boxShadow: '0 4px 6px -1px rgba(34, 197, 94, 0.3)',
                                            opacity: loading ? 0.7 : 1
                                        }}
                                    >
                                        <Check size={28} style={{ marginBottom: '4px' }} />
                                        <span style={{ fontWeight: 'bold' }}>입고 처리</span>
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStock('SOLD_OUT', 0)}
                                        disabled={loading}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                            padding: '16px', borderRadius: '16px', border: 'none',
                                            backgroundColor: '#1F2937', color: 'white', cursor: 'pointer',
                                            boxShadow: '0 4px 6px -1px rgba(31, 41, 55, 0.3)',
                                            opacity: loading ? 0.7 : 1
                                        }}
                                    >
                                        <AlertCircle size={28} style={{ marginBottom: '4px' }} />
                                        <span style={{ fontWeight: 'bold' }}>품절 처리</span>
                                    </button>
                                </div>
                                <OwnerPostEditor
                                    storeId={selectedStore.id}
                                    onPostCreated={fetchProductStatus}
                                />
                            </div>
                        )}

                        {/* 사장님 포스트 갤러리 */}
                        <div style={{ marginTop: '24px' }}>
                            <StorePostsGallery
                                storeId={selectedStore.id}
                                stockCount={product?.stock_count}
                            />
                        </div>

                        {/* 사장님 로그인 버튼 (제일 아래) */}
                        {!isOwner && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '24px' }}>
                                <button
                                    onClick={handleOwnerClick}
                                    style={{
                                        width: '100%', padding: '12px',
                                        backgroundColor: 'transparent', border: 'none', borderTop: '1px solid #F3F4F6',
                                        color: '#9CA3AF', fontSize: '14px', fontWeight: '500', cursor: 'pointer'
                                    }}
                                >
                                    사장님이신가요? 재고 관리하기
                                </button>

                                {/* Developer Mode Toggle */}
                                <button
                                    onClick={() => {
                                        setIsOwner(true);
                                        alert('🕵️ 개발자 모드: 강제로 사장님 권한을 획득했습니다.');
                                    }}
                                    style={{
                                        fontSize: '10px', color: '#E5E7EB', background: 'none', border: 'none', cursor: 'pointer', alignSelf: 'center'
                                    }}
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
