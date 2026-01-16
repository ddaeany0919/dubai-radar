
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
    const { setSelectedStore, setBottomSheetOpen, selectedStore } = useStore();
    const mapInstance = useRef<any>(null);
    const clustererInstance = useRef<any>(null);
    const markersRef = useRef<any[]>([]);

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
        const { data: storesData } = await supabase.from('stores').select(`
      *,
      products (
        status,
        price,
        stock_count
      )
    `);

        if (storesData) {
            if (clustererInstance.current) {
                clustererInstance.current.setMap(null);
            }
            markersRef.current.forEach(m => m.setMap(null));
            markersRef.current = [];

            const markers: any[] = [];

            storesData.forEach((store: any) => {
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
                            top: -2px;
                            right: -2px;
                            background: ${badgeColor};
                            color: white;
                            font-size: 14px;
                            font-weight: 900;
                            padding: 4px 10px;
                            border-radius: 20px;
                            box-shadow: 0 4px 10px rgba(0,0,0,0.4);
                            white-space: nowrap;
                            border: 2.5px solid white;
                            min-width: 32px;
                            text-align: center;
                            z-index: 10;
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

                                        // 현재 상태 저장
                                        const currentZoom = map.getZoom();
                                        const currentCenter = map.getCenter();

                                        // 1. fitBounds로 최적의 영역과 줌 레벨 계산
                                        map.fitBounds(bounds);
                                        const targetZoom = map.getZoom();
                                        const targetCenter = map.getCenter();

                                        // 2. 계산을 위해 잠시 이동했던 지도를 다시 복구 (사용자는 못 느낌)
                                        map.setZoom(currentZoom, false);
                                        map.setCenter(currentCenter);

                                        // 3. 단계별 확대를 위해 줌 레벨 조정
                                        let finalZoom = targetZoom;
                                        if (targetZoom <= currentZoom) {
                                            finalZoom = currentZoom + 2;
                                        } else if (targetZoom > currentZoom + 3) {
                                            finalZoom = currentZoom + 3;
                                        }

                                        // 4. 부드럽게 목표 지점으로 이동 (morph)
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

    useEffect(() => {
        if (selectedStore && mapInstance.current && window.naver) {
            const newCenter = new window.naver.maps.LatLng(selectedStore.lat, selectedStore.lng);
            mapInstance.current.setCenter(newCenter);
            mapInstance.current.setZoom(19);
        }
    }, [selectedStore]);

    return (
        <>
            <Script
                src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=9me1g8fgsx"
                strategy="afterInteractive"
                onLoad={() => {
                    const clusterScript = document.createElement('script');
                    clusterScript.src = 'https://navermaps.github.io/maps.js.ncp/docs/js/MarkerClustering.js';
                    clusterScript.onload = () => initMap();
                    document.head.appendChild(clusterScript);
                }}
            />
            <div ref={mapRef} style={{ width: '100%', height: '100vh' }} />
        </>
    );
}
