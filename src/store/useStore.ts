
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
    selectedStore: Store | null;
    setSelectedStore: (store: Store | null) => void;
    isBottomSheetOpen: boolean;
    setBottomSheetOpen: (isOpen: boolean) => void;
    favorites: number[]; // Store IDs
    toggleFavorite: (storeId: number) => void;
    viewMode: 'map' | 'list';
    setViewMode: (mode: 'map' | 'list') => void;
}

export const useStore = create<StoreState>()(
    persist(
        (set) => ({
            selectedStore: null,
            setSelectedStore: (store) => set({ selectedStore: store, isBottomSheetOpen: !!store }),
            isBottomSheetOpen: false,
            setBottomSheetOpen: (isOpen) => set({ isBottomSheetOpen: isOpen }),
            favorites: [],
            toggleFavorite: (storeId) => set((state) => {
                const isFav = state.favorites.includes(storeId);
                return {
                    favorites: isFav
                        ? state.favorites.filter(id => id !== storeId)
                        : [...state.favorites, storeId]
                };
            }),
            viewMode: 'map',
            setViewMode: (mode) => set({ viewMode: mode }),
        }),
        {
            name: 'dubai-radar-storage',
            partialize: (state) => ({ favorites: state.favorites }), // Only persist favorites
        }
    )
);
