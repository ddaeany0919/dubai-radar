import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Store {
    id: number;
    name: string;
    lat: number;
    lng: number;
    address?: string;
    products?: { status: string; price: number }[];
}

interface StoreState {
    selectedStore: any | null;
    selectedStores: any[] | null;
    isBottomSheetOpen: boolean;
    favorites: number[];
    notifications: number[]; // Store IDs for notifications
    viewMode: 'map' | 'list';
    userLocation: { lat: number; lng: number } | null;
    showOnlyInStock: boolean;
    searchQuery: string;
    theme: 'light' | 'dark';
    setSelectedStore: (store: any | null) => void;
    setSelectedStores: (stores: any[] | null) => void;
    setBottomSheetOpen: (isOpen: boolean) => void;
    toggleFavorite: (storeId: number) => void;
    toggleNotification: (storeId: number) => void;
    setViewMode: (mode: 'map' | 'list') => void;
    setUserLocation: (location: { lat: number; lng: number } | null) => void;
    setShowOnlyInStock: (show: boolean) => void;
    setSearchQuery: (query: string) => void;
    setTheme: () => void;
}

export const useStore = create<StoreState>()(
    persist(
        (set) => ({
            selectedStore: null,
            selectedStores: null,
            isBottomSheetOpen: false,
            favorites: [],
            notifications: [],
            viewMode: 'map',
            userLocation: null,
            showOnlyInStock: false,
            searchQuery: '',
            theme: 'light',
            setSelectedStore: (store) => set({ selectedStore: store, selectedStores: null }),
            setSelectedStores: (stores) => set({ selectedStores: stores, selectedStore: null }),
            setBottomSheetOpen: (isOpen) => set({ isBottomSheetOpen: isOpen }),
            toggleFavorite: (storeId) => set((state) => ({
                favorites: state.favorites.includes(storeId)
                    ? state.favorites.filter((id) => id !== storeId)
                    : [...state.favorites, storeId]
            })),
            toggleNotification: (storeId) => set((state) => ({
                notifications: state.notifications.includes(storeId)
                    ? state.notifications.filter((id) => id !== storeId)
                    : [...state.notifications, storeId]
            })),
            setViewMode: (mode) => set({ viewMode: mode }),
            setUserLocation: (location) => set({ userLocation: location }),
            setShowOnlyInStock: (show) => set({ showOnlyInStock: show }),
            setSearchQuery: (query) => set({ searchQuery: query }),
            setTheme: () => set({ theme: 'light' }),
        }),
        {
            name: 'store-storage',
            partialize: (state) => ({
                favorites: state.favorites,
                notifications: state.notifications,
                showOnlyInStock: state.showOnlyInStock
            }),
        }
    )
);
