"use client";

import Link from "next/link";
import { Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "../providers/CartProvider";

export default function Navbar() {
    // 1. Grab the cart count and the function to open the drawer from our global state
    const { cartCount, setIsCartOpen } = useCart();

    return (
        <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-zinc-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Left: Mobile Menu (Hidden on desktop) */}
                    <div className="flex-1 md:hidden flex items-center">
                        <button className="text-zinc-900 hover:text-zinc-600 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>

                    {/* Center/Left: Brand Logo */}
                    <div className="flex-1 md:flex-none flex justify-center md:justify-start">
                        <Link href="/" className="text-2xl font-serif tracking-widest text-zinc-900">
                            SANJHHBYAM
                        </Link>
                    </div>

                    {/* Center: Desktop Navigation Links */}
                    <nav className="hidden md:flex flex-1 justify-center space-x-10">
                        <Link href="/shop" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                            All Categories
                        </Link>
                        <Link href="/collections/festive" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                            Festive Edit
                        </Link>
                        <Link href="/collections/ready-to-ship" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
                            Ready to Ship
                        </Link>
                    </nav>

                    {/* Right: UI Icons */}
                    <div className="flex-1 flex justify-end items-center space-x-6">
                        <button className="text-zinc-900 hover:text-zinc-600 transition-colors">
                            <Search className="w-5 h-5" strokeWidth={1.5} />
                        </button>
                        <Link href="/account" className="text-zinc-900 hover:text-zinc-600 transition-colors hidden sm:block">
                            <User className="w-5 h-5" strokeWidth={1.5} />
                        </Link>

                        {/* 2. Added onClick to open drawer */}
                        <button onClick={() => setIsCartOpen(true)} className="text-zinc-900 hover:text-zinc-600 transition-colors relative">
                            <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />

                            {/* 3. Dynamic Notification Dot - Only renders if items are in the cart */}
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-zinc-900 text-[9px] text-white">
                                    {cartCount}
                                </span>
                            )}
                        </button>
                    </div>

                </div>
            </div>
        </header>
    );
}