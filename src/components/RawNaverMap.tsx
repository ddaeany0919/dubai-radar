
"use client";

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';

declare global {
    interface Window {
        naver: any;
    }
}

export default function RawNaverMap() {
    const mapRef = useRef<HTMLDivElement>(null);
    const { setSelectedStore, setBottomSheetOpen, selectedStore } = useStore();
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
        price,
        stock_count
      )
    `);

        if (storesData) {
            storesData.forEach((store: any) => {
                const stockCount = store.products?.[0]?.stock_count || 0;
                const status = store.products?.[0]?.status;

                // Choose cookie marker image based on stock level
                let markerImage = '/cookie-marker-transparent-final.png'; // Default

                if (status === 'SOLD_OUT' || stockCount === 0) {
                    markerImage = '/cookie-marker-sad.png'; // Sad cookie (sold out)
                } else if (stockCount >= 50) {
                    markerImage = '/cookie-marker-happy.png'; // Happy cookie (plenty)
                } else if (stockCount >= 20) {
                    markerImage = '/cookie-marker-normal.png'; // Normal cookie (medium)
                } else if (stockCount >= 1) {
                    markerImage = '/cookie-marker-worried.png'; // Worried cookie (low stock)
                }

                const marker = new window.naver.maps.Marker({
                    position: new window.naver.maps.LatLng(store.lat, store.lng),
                    map: map,
                    icon: {
                        url: markerImage,
                        size: new window.naver.maps.Size(64, 64),
                        scaledSize: new window.naver.maps.Size(64, 64),
                        origin: new window.naver.maps.Point(0, 0),
                        anchor: new window.naver.maps.Point(32, 32)
                    }
                });

                window.naver.maps.Event.addListener(marker, 'click', () => {
                    console.log("Marker clicked! Opening bottom sheet for:", store.name);
                    setSelectedStore(store);
                    setBottomSheetOpen(true);
                });

                // Add stock count badge overlay if available (larger size)
                if (stockCount && stockCount > 0) {
                    const badgeContent = `
                        <div style="
                            position: absolute;
                            top: -12px;
                            right: -12px;
                            background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
                            color: white;
                            font-size: 14px;
                            font-weight: bold;
                            padding: 4px 8px;
                            border-radius: 16px;
                            box-shadow: 0 3px 6px rgba(0,0,0,0.3);
                            white-space: nowrap;
                            pointer-events: none;
                            border: 2.5px solid white;
                            min-width: 28px;
                            text-align: center;
                        ">
                            ${stockCount}
                        </div>
                    `;

                    const overlay = new window.naver.maps.OverlayView();
                    overlay.onAdd = function () {
                        const layer = this.getPanes().overlayLayer;
                        const div = document.createElement('div');
                        div.innerHTML = badgeContent;
                        div.style.position = 'absolute';
                        div.style.width = '64px';
                        div.style.height = '64px';
                        div.style.pointerEvents = 'none';
                        layer.appendChild(div);
                        this._div = div;
                    };

                    overlay.draw = function () {
                        if (!this._div) return;
                        const projection = this.getProjection();
                        const position = new window.naver.maps.LatLng(store.lat, store.lng);
                        const pixelPosition = projection.fromCoordToOffset(position);
                        this._div.style.left = (pixelPosition.x - 32) + 'px';
                        this._div.style.top = (pixelPosition.y - 32) + 'px';
                    };

                    overlay.onRemove = function () {
                        if (this._div && this._div.parentNode) {
                            this._div.parentNode.removeChild(this._div);
                        }
                        this._div = null;
                    };

                    overlay.setMap(map);
                }
            });
        }
    };

    // Move map center when selectedStore changes
    useEffect(() => {
        if (selectedStore && mapInstance.current && window.naver) {
            const newCenter = new window.naver.maps.LatLng(selectedStore.lat, selectedStore.lng);
            mapInstance.current.setCenter(newCenter);
            mapInstance.current.setZoom(16); // Zoom in a bit
        }
    }, [selectedStore]);

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
