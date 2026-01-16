
"use client";

import { NavermapsProvider } from 'react-naver-maps';
import { ReactNode } from 'react';

export default function MapProvider({ children }: { children: ReactNode }) {
    return (
        <NavermapsProvider
            ncpClientId={process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID!}
        >
            {children}
        </NavermapsProvider>
    );
}
