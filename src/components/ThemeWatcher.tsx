
"use client";

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

export default function ThemeWatcher() {
    const { theme } = useStore();

    useEffect(() => {
        // Always force light mode
        document.documentElement.classList.remove('dark');
    }, []);

    return null;
}
