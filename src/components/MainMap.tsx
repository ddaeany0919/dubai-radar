
"use client";

import { useEffect, useState } from 'react';
import { NaverMap, Container as MapDiv, Marker, useNavermaps, NavermapsProvider } from 'react-naver-maps';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import StoreBottomSheet from '@/components/StoreBottomSheet';

function MapContent() {
    const navermaps = useNavermaps();
    const [stores, setStores] = useState<any[]>([]);
    const { setSelectedStore } = useStore();

    useEffect(() => {
        fetchStores();

        const channel = supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'products' },
                () => fetchStores()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchStores = async () => {
        const { data: storesData } = await supabase.from('stores').select(`
      *,
      products (
        status,
        price
      )
    `);

        if (storesData) {
            setStores(storesData);
        }
    };

    return (
        <NaverMap
            defaultCenter={new navermaps.LatLng(37.3595704, 127.105399)}
            defaultZoom={15}
            className="w-full h-full"
        >
            {stores.map((store) => {
                const status = store.products?.[0]?.status || 'UNKNOWN';
                return (
                    <Marker
                        key={store.id}
                        position={new navermaps.LatLng(store.lat, store.lng)}
                        onClick={() => setSelectedStore(store)}
                    />
                );
            })}
        </NaverMap>
    );
}

export default function MainMap() {
    const clientId = '9me1g8fgsx'; // Hardcoded for debugging
    console.log("MainMap using Client ID:", clientId);

    return (
        <NavermapsProvider
            ncpClientId={clientId}
        >
            <MapDiv
                style={{ width: '100%', height: '100vh' }}
            >
                <MapContent />
            </MapDiv>
            <StoreBottomSheet />
        </NavermapsProvider>
    );
}
