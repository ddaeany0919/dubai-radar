"use client";

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';

export default function NotificationManager() {
    const { notifications } = useStore();

    useEffect(() => {
        // Subscribe to product changes
        const channel = supabase
            .channel('notification-channel')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'products' },
                async (payload) => {
                    const newProduct = payload.new as any;

                    // Check if we are subscribed to this store AND status changed to AVAILABLE
                    if (
                        notifications.includes(newProduct.store_id) &&
                        newProduct.status === 'AVAILABLE'
                    ) {
                        // Fetch store name for better notification
                        const { data: store } = await supabase
                            .from('stores')
                            .select('name')
                            .eq('id', newProduct.store_id)
                            .single();

                        const storeName = store?.name || '찜한 가게';

                        // Send Browser Notification
                        if (Notification.permission === 'granted') {
                            new Notification('📢 두바이 초콜릿 재고 알림!', {
                                body: `${storeName}에 재고가 들어왔어요! 빨리 확인해보세요.`,
                                icon: '/cookie-marker.png' // Use our cute cookie icon
                            });
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [notifications]); // Re-subscribe if notifications list changes (though logic inside handles it, dependency ensures freshness)

    return null; // This component renders nothing
}
