
"use client";

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';

declare global {
    interface Window {
        naver: any;
        MarkerClustering: any;
    }
}

export default function RawNaverMap() {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const clustererInstance = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const {
        setSelectedStore,
        setBottomSheetOpen,
        selectedStore,
        showOnlyInStock,
        searchQuery
    } = useStore();

    const initMap = () => {
        if (!mapRef.current || !window.naver) return;

        const location = new window.naver.maps.LatLng(37.3595704, 127.105399);
        const mapOptions = {
            center: location,
            zoom: 15,
            minZoom: 8,
            maxZoom: 20,
        };

        const map = new window.naver.maps.Map(mapRef.current, mapOptions);
        mapInstance.current = map;

        fetchStores(map);
    };

    const fetchStores = async (map: any) => {
        if (!map) return;

        let query = supabase.from('stores').select(`
            *,
            products (
                status,
                price,
                stock_count
            )
        `);

        const { data: storesData } = await query;

        if (storesData) {
            let filteredData = showOnlyInStock
                ? storesData.filter((s: any) => (s.products?.[0]?.stock_count || 0) > 0)
                : storesData;

            if (searchQuery) {
                const lowerQuery = searchQuery.toLowerCase();
                filteredData = filteredData.filter((s: any) =>
                    s.name.toLowerCase().includes(lowerQuery) ||
                    (s.address && s.address.toLowerCase().includes(lowerQuery))
                );

                if (filteredData.length > 0 && mapInstance.current) {
                    const firstMatch = filteredData[0];
                    const center = new window.naver.maps.LatLng(firstMatch.lat, firstMatch.lng);
                    mapInstance.current.morph(center, 15);
                }
            }

            if (clustererInstance.current) {
                clustererInstance.current.setMap(null);
            }
            markersRef.current.forEach(m => m.setMap(null));
            markersRef.current = [];

            const markers: any[] = [];

            filteredData.forEach((store: any) => {
                const stockCount = store.products?.[0]?.stock_count || 0;
                const status = store.products?.[0]?.status;

                let markerImage = '/cookie-marker-normal.png';
                if (status === 'SOLD_OUT' || stockCount === 0) {
                    markerImage = '/cookie-marker-sad.png';
                } else if (stockCount >= 50) {
                    markerImage = '/cookie-marker-happy.png';
                } else if (stockCount >= 1 && stockCount < 20) {
                    markerImage = '/cookie-marker-worried.png';
                }

                const isSoldOut = stockCount === 0;
                const badgeColor = isSoldOut
                    ? 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)'
                    : 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)';

                const markerContent = `
                    <div style="position: relative; width: 64px; height: 64px; cursor: pointer;">
                        <img src="${markerImage}" style="width: 64px; height: 64px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));" />
                        <div style="
                            position: absolute;
                            top: -8px;
                            left: 42px;
                            transform: translateY(-40%);
                            background: ${badgeColor};
                            color: white;
                            font-size: 13px;
                            font-weight: 900;
                            padding: 3px 8px;
                            border-radius: 12px;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                            white-space: nowrap;
                            border: 2px solid white;
                            min-width: 28px;
                            text-align: center;
                            z-index: 10;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">
                            ${stockCount}
                        </div>
                    </div>
                `;

                const marker = new window.naver.maps.Marker({
                    position: new window.naver.maps.LatLng(store.lat, store.lng),
                    icon: {
                        content: markerContent,
                        size: new window.naver.maps.Size(64, 64),
                        anchor: new window.naver.maps.Point(32, 32)
                    }
                });

                marker.stockCount = stockCount;
                marker.storeData = store;

                window.naver.maps.Event.addListener(marker, 'click', () => {
                    setSelectedStore(store);
                    setBottomSheetOpen(true);
                });

                markers.push(marker);
            });

            markersRef.current = markers;

            if (window.MarkerClustering) {
                const clusterer = new window.MarkerClustering({
                    minClusterSize: 2,
                    maxZoom: 17,
                    map: map,
                    markers: markers,
                    disableClickZoom: true,
                    gridSize: 220,
                    icons: [
                        {
                            content: '<div style="cursor:pointer;width:64px;height:64px;background:#22C55E;border-radius:50%;border:4px solid white;box-shadow:0 8px 20px rgba(0,0,0,0.4);display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-weight:900;"><span style="font-size:12px;margin-bottom:-2px;">🍪</span><span class="cluster-text"></span></div>',
                            size: new window.naver.maps.Size(64, 64),
                            anchor: new window.naver.maps.Point(32, 32)
                        },
                        {
                            content: '<div style="cursor:pointer;width:74px;height:74px;background:#16A34A;border-radius:50%;border:4px solid white;box-shadow:0 10px 25px rgba(0,0,0,0.5);display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-weight:900;"><span style="font-size:14px;margin-bottom:-2px;">🍪</span><span class="cluster-text" style="font-size:20px;"></span></div>',
                            size: new window.naver.maps.Size(74, 74),
                            anchor: new window.naver.maps.Point(37, 37)
                        }
                    ],
                    indexGenerator: [100, 500],
                    stylingFunction: function (clusterMarker: any) {
                        const instance = clustererInstance.current;
                        if (instance && instance._clusters) {
                            const cluster = instance._clusters.find((c: any) => c._clusterMarker === clusterMarker);
                            if (cluster && cluster._clusterMember) {
                                const totalStock = cluster._clusterMember.reduce((sum: number, m: any) => sum + (m.stockCount || 0), 0);
                                const textEl = clusterMarker.getElement().querySelector('.cluster-text');
                                if (textEl) textEl.textContent = totalStock;

                                if (!clusterMarker._hasClickEvent) {
                                    clusterMarker._hasClickEvent = true;
                                    window.naver.maps.Event.addListener(clusterMarker, 'click', () => {
                                        const bounds = cluster.getBounds();
                                        const currentZoom = map.getZoom();
                                        const currentCenter = map.getCenter();
                                        map.fitBounds(bounds);
                                        const targetZoom = map.getZoom();
                                        const targetCenter = map.getCenter();
                                        map.setZoom(currentZoom, false);
                                        map.setCenter(currentCenter);
                                        let finalZoom = targetZoom;
                                        if (targetZoom <= currentZoom) {
                                            finalZoom = currentZoom + 2;
                                        } else if (targetZoom > currentZoom + 3) {
                                            finalZoom = currentZoom + 3;
                                        }
                                        map.morph(targetCenter, finalZoom);
                                    });
                                }
                            }
                        }
                    }
                });
                clustererInstance.current = clusterer;
                setTimeout(() => {
                    if (clustererInstance.current) {
                        clustererInstance.current._redraw();
                    }
                }, 500);
            }
        }
    };

    const userMarkerRef = useRef<any>(null);
    const hasInitialPan = useRef(false);

    const updateUserMarker = (lat: number, lng: number, shouldPan: boolean = false) => {
        if (!mapInstance.current || !window.naver) return;
        const location = new window.naver.maps.LatLng(lat, lng);

        if (userMarkerRef.current) {
            userMarkerRef.current.setPosition(location);
        } else {
            userMarkerRef.current = new window.naver.maps.Marker({
                position: location,
                map: mapInstance.current,
                icon: {
                    content: `
                        <div style="position: relative; width: 24px; height: 24px;">
                            <div style="position: absolute; width: 100%; height: 100%; background: #4285F4; border-radius: 50%; opacity: 0.3; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                            <div style="position: absolute; top: 4px; left: 4px; width: 16px; height: 16px; background: #4285F4; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>
                        </div>
                        <style>
                            @keyframes ping {
                                75%, 100% { transform: scale(3); opacity: 0; }
                            }
                        </style>
                    `,
                    anchor: new window.naver.maps.Point(12, 12)
                },
                zIndex: 1000
            });
        }

        if (shouldPan || !hasInitialPan.current) {
            mapInstance.current.morph(location, 17);
            hasInitialPan.current = true;
        }
    };

    const handleMyLocation = async () => {
        // Force immediate update and pan
        try {
            const res = await fetch('/api/location');
            const data = await res.json();
            if (data.lat && data.lng) {
                updateUserMarker(data.lat, data.lng, true);
                return;
            }
        } catch (e) { }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => updateUserMarker(position.coords.latitude, position.coords.longitude, true),
                () => alert('위치 정보를 가져올 수 없습니다.'),
                { enableHighAccuracy: true }
            );
        }
    };

    useEffect(() => {
        let watchId: number;

        if (navigator.geolocation) {
            // Initial Naver API attempt for better PC accuracy
            fetch('/api/location')
                .then(res => res.json())
                .then(data => {
                    if (data.lat && data.lng) updateUserMarker(data.lat, data.lng, false);
                }).catch(() => { });

            // Then watch using browser API for real-time updates
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    updateUserMarker(position.coords.latitude, position.coords.longitude, false);
                },
                (err) => console.warn('WatchPosition error:', err),
                { enableHighAccuracy: true, maximumAge: 10000 }
            );
        }

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    useEffect(() => {
        if (selectedStore && mapInstance.current && window.naver) {
            const newCenter = new window.naver.maps.LatLng(selectedStore.lat, selectedStore.lng);
            mapInstance.current.setCenter(newCenter);
            mapInstance.current.setZoom(17);
        }
    }, [selectedStore]);

    useEffect(() => {
        if (mapInstance.current) {
            fetchStores(mapInstance.current);
        }
    }, [showOnlyInStock, searchQuery]);

    useEffect(() => {
        // If script is already loaded (e.g. switching back from List view), init map immediately
        if (window.naver && window.naver.maps && window.MarkerClustering && !mapInstance.current) {
            initMap();
        }
    }, []);

    return (
        <>
            <Script
                src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID || '9me1g8fgsx'}`}
                strategy="afterInteractive"
                onLoad={() => {
                    // Only load clustering script if it's not already there
                    if (!window.MarkerClustering) {
                        const clusterScript = document.createElement('script');
                        clusterScript.src = 'https://navermaps.github.io/maps.js.ncp/docs/js/MarkerClustering.js';
                        clusterScript.onload = () => initMap();
                        document.head.appendChild(clusterScript);
                    } else {
                        initMap();
                    }
                }}
            />
            <div ref={mapRef} style={{ width: '100%', height: '100vh' }} />

        </>
    );
}
