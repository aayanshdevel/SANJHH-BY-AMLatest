import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LenisProvider from "../src/components/providers/LenisProvider";
import { CartProvider } from "../src/components/providers/CartProvider"; // <-- Added
import AnnouncementBar from "../src/components/layout/AnnouncementBar";
import Navbar from "../src/components/layout/Navbar";
import Footer from "../src/components/layout/Footer";
import CartDrawer from "../src/components/ui/CartDrawer"; // <-- Added

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Sanjhhbyam | Premium Ethnic & Western Wear",
    description: "Jaipur's Premium Ethnic & Western Wear for Women",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-zinc-900`}
        >
        {/* Wrap everything in CartProvider first! */}
        <CartProvider>
            <LenisProvider>
                <AnnouncementBar />
                <Navbar />

                <main className="min-h-screen">
                    {children}
                </main>

                <Footer />

                {/* Put the drawer at the very bottom so it overlays everything */}
                <CartDrawer />
            </LenisProvider>
        </CartProvider>
        </body>
        </html>
    );
}