
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Dubai Radar",
    description: "Find Dubai Chocolate near you",
};

import NotificationManager from "@/components/NotificationManager";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <NotificationManager />
                {children}
            </body>
        </html>
    );
}
