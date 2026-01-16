import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { X, Check, AlertCircle, Heart } from 'lucide-react';

export default function StoreBottomSheet() {
    const { selectedStore, isBottomSheetOpen, setBottomSheetOpen, favorites, toggleFavorite } = useStore();
    const closeBottomSheet = () => setBottomSheetOpen(false);
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (selectedStore) {
            fetchProductStatus();
        }
    }, [selectedStore]);

    const fetchProductStatus = async () => {
        if (!selectedStore) return;
        const { data } = await supabase
            .from('products')
            .select('*')
            .eq('store_id', selectedStore.id)
            .single();
        setProduct(data);
    };

    const handleReport = async (type: 'HAVE' | 'NO_HAVE') => {
        if (!selectedStore) return;
        setLoading(true);

        try {
            await supabase.from('user_reports').insert({
                store_id: selectedStore.id,
                report_type: type,
            });

            const newStatus = type === 'HAVE' ? 'AVAILABLE' : 'SOLD_OUT';
            await supabase
                .from('products')
                .update({
                    status: newStatus,
                    last_check_time: new Date().toISOString()
                })
                .eq('store_id', selectedStore.id);

            await fetchProductStatus();
            alert('제보가 반영되었습니다! 감사합니다.');
        } catch (error) {
            console.error(error);
            alert('오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    console.log("BottomSheet Render Check:", { mounted, isBottomSheetOpen, selectedStore });

    if (!mounted || !isBottomSheetOpen || !selectedStore) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-end justify-center pointer-events-none">
            {/* Backdrop (optional, for clicking outside to close) */}
            <div
                className="absolute inset-0 bg-black/20 pointer-events-auto"
                onClick={closeBottomSheet}
            />

            {/* Bottom Sheet Content */}
            <div className="bg-white w-full max-w-md rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.2)] p-6 pointer-events-auto animate-slide-up">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{selectedStore.name}</h2>
                        <p className="text-sm text-gray-500 mt-1">{selectedStore.address || '주소 정보 없음'}</p>
                    </div>
                    <div className="flex gap-2">
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
                    <p className="text-xs text-gray-400 mt-2 text-right">
                        마지막 업데이트: {product?.last_check_time ? new Date(product.last_check_time).toLocaleString() : '-'}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => handleReport('HAVE')}
                        disabled={loading}
                        className="flex flex-col items-center justify-center p-4 bg-green-50 border-2 border-green-500 rounded-xl hover:bg-green-100 active:scale-95 transition-all"
                    >
                        <Check className="w-8 h-8 text-green-600 mb-2" />
                        <span className="font-bold text-green-700">재고 있어요</span>
                    </button>
                    <button
                        onClick={() => handleReport('NO_HAVE')}
                        disabled={loading}
                        className="flex flex-col items-center justify-center p-4 bg-red-50 border-2 border-red-500 rounded-xl hover:bg-red-100 active:scale-95 transition-all"
                    >
                        <AlertCircle className="w-8 h-8 text-red-600 mb-2" />
                        <span className="font-bold text-red-700">품절이에요</span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
