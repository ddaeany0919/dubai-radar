
"use client";

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';

export default function RawNaverMap() {
    const mapRef = useRef<HTMLDivElement>(null);
    const { setSelectedStore } = useStore();
    const mapInstance = useRef<any>(null);

    const initMap = () => {
        if (!mapRef.current || !window.naver) return;

        const location = new window.naver.maps.LatLng(37.3595704, 127.105399);
        const mapOptions = {
            center: location,
            zoom: 15,
        };

        const map = new window.naver.maps.Map(mapRef.current, mapOptions);
        mapInstance.current = map;

        fetchStores(map);
    };

    const fetchStores = async (map: any) => {
        const { data: storesData } = await supabase.from('stores').select(`
      *,
      products (
        status,
        price
      )
    `);

        if (storesData) {
            storesData.forEach((store: any) => {
                const marker = new window.naver.maps.Marker({
                    position: new window.naver.maps.LatLng(store.lat, store.lng),
                    map: map
                });

                window.naver.maps.Event.addListener(marker, 'click', () => {
                    console.log("Marker clicked:", store.name);
                    setSelectedStore(store);
                });
            });
        }
    };

    return (
        <>
            <Script
                src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=9me1g8fgsx"
                strategy="afterInteractive"
                onLoad={() => initMap()}
                onReady={() => {
                    if (window.naver && !mapInstance.current) {
                        initMap();
                    }
                }}
            />
            <div ref={mapRef} style={{ width: '100%', height: '100vh' }} />
        </>
    );
}
