
"use client";

import React, { useState, useEffect } from 'react';
import { Search, X, Filter, MapPin } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';

export default function SearchBar() {
    const {
        searchQuery,
        setSearchQuery,
        showOnlyInStock,
        setShowOnlyInStock,
        selectedStore,
        setSelectedStore,
        theme,
        setTheme
    } = useStore();

    const [inputValue, setInputValue] = useState(searchQuery);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (inputValue.length < 2) {
                setSuggestions([]);
                return;
            }

            const { data } = await supabase
                .from('stores')
                .select('*, products(stock_count)')
                .or(`name.ilike.%${inputValue}%,address.ilike.%${inputValue}%`)
                .limit(5);

            setSuggestions(data || []);
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [inputValue]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (suggestions.length > 0) {
            handleSelectStore(suggestions[0]);
        } else {
            setSearchQuery(inputValue);
            setIsFocused(false);
        }
    };

    const handleSelectStore = (store: any) => {
        setInputValue(store.name);
        setSearchQuery(store.name);
        setSelectedStore(store);
        setSuggestions([]);
        setIsFocused(false);
    };

    return (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-30 w-[94%] max-w-[480px]">
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    {/* Search Input Area */}
                    <div className="relative flex-1 h-[60px]">
                        <form
                            onSubmit={handleSearch}
                            className={`
                                h-full flex items-center bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border transition-all duration-300
                                ${isFocused ? 'border-[#22C55E] ring-4 ring-[#22C55E]/10' : 'border-black/5 dark:border-white/10'}
                            `}
                        >
                            <div className="pl-4 text-gray-400 flex-shrink-0">
                                <Search className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onFocus={() => setIsFocused(true)}
                                placeholder="가게 또는 주소 검색"
                                className="w-full bg-transparent border-none focus:ring-0 py-4 px-3 text-gray-800 dark:text-gray-100 font-bold placeholder:text-gray-400 placeholder:font-medium"
                            />
                            {inputValue && (
                                <button
                                    type="button"
                                    onClick={() => { setInputValue(''); setSuggestions([]); setSearchQuery(''); }}
                                    className="p-2 mr-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </form>

                        {/* Suggestions Dropdown */}
                        {isFocused && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                                {suggestions.map((store) => (
                                    <button
                                        key={store.id}
                                        onClick={() => handleSelectStore(store)}
                                        className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b last:border-none border-gray-100 dark:border-gray-700"
                                    >
                                        <div className="w-10 h-10 bg-[#22C55E]/10 rounded-xl flex-shrink-0 flex items-center justify-center text-[#22C55E]">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col items-start overflow-hidden text-left flex-1">
                                            <span className="font-bold text-gray-900 dark:text-gray-100 truncate w-full">{store.name}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate w-full">{store.address}</span>
                                        </div>
                                        <div className="flex-shrink-0 ml-2">
                                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${(store.products?.[0]?.stock_count || 0) > 0
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {(store.products?.[0]?.stock_count || 0)}개
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Theme Toggle Button Removed */}
                </div>

                {/* Filter Chips */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide z-10">
                    <button
                        onClick={() => setShowOnlyInStock(!showOnlyInStock)}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-full border whitespace-nowrap transition-all duration-300 font-bold text-sm shadow-md
                            ${showOnlyInStock
                                ? 'bg-[#22C55E] border-[#22C55E] text-white'
                                : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-white/20 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'}
                        `}
                    >
                        <Filter className={`w-4 h-4 ${showOnlyInStock ? 'animate-pulse' : ''}`} />
                        재고 있는 곳만
                    </button>

                    <button
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-white/20 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 font-bold text-sm shadow-md whitespace-nowrap"
                    >
                        ☕ 카페
                    </button>
                </div>
            </div>
        </div>
    );
}
