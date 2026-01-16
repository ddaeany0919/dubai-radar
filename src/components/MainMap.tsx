
"use client";

import { useEffect, useState } from 'react';
import { NaverMap, Container as MapDiv, Marker, useNavermaps, NavermapsProvider } from 'react-naver-maps';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import StoreBottomSheet from '@/components/StoreBottomSheet';

function MapContent() {
    const navermaps = useNavermaps();
    const [stores, setStores] = useState<any[]>([]);
    const { setSelectedStore, setBottomSheetOpen } = useStore();

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
                return (
                    <Marker
                        key={store.id}
                        position={new navermaps.LatLng(store.lat, store.lng)}
                        onClick={() => {
                            setBottomSheetOpen(true);
                            setSelectedStore(store);
                        }}
                        icon={{
                            url: '/cookie-marker.png',
                            size: new navermaps.Size(64, 64),
                            scaledSize: new navermaps.Size(64, 64),
                            origin: new navermaps.Point(0, 0),
                            anchor: new navermaps.Point(32, 32)
                        }}
                    />
                );
            })}
        </NaverMap>
    );
}

export default function MainMap() {
    const clientId = '9me1g8fgsx';

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
