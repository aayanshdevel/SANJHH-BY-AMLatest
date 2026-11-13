
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Footer() {
    const [year, setYear] = useState(2026);

    useEffect(() => {
        setYear(new Date().getFullYear());
    }, []);

    return (
        <footer className="bg-white border-t border-zinc-100 pt-16 pb-8 px-4 md:px-8 text-sm">
            <div className="max-w-screen-2xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">

                {/* Brand Column */}
                <div className="md:col-span-1">
                    <Link href="/" className="text-xl font-serif tracking-widest text-zinc-900 mb-6 block">
                        SANJHHBYAM
                    </Link>
                    <p className="text-zinc-500 font-light leading-relaxed max-w-xs">
                        Premium Ethnic & Western Wear for the modern woman. Designed with elegance, crafted with care.
                    </p>
                </div>

                {/* Shop Links */}
                <div>
                    <h4 className="font-semibold text-zinc-900 tracking-wider uppercase mb-6">Shop</h4>
                    <ul className="space-y-4 text-zinc-500 font-light">
                        <li><Link href="#" className="hover:text-zinc-900 transition-colors">New Arrivals</Link></li>
                        <li><Link href="#" className="hover:text-zinc-900 transition-colors">Festive Edit</Link></li>
                        <li><Link href="#" className="hover:text-zinc-900 transition-colors">Ready to Ship</Link></li>
                        <li><Link href="#" className="hover:text-zinc-900 transition-colors">All Categories</Link></li>
                    </ul>
                </div>

                {/* Support Links */}
                <div>
                    <h4 className="font-semibold text-zinc-900 tracking-wider uppercase mb-6">Support</h4>
                    <ul className="space-y-4 text-zinc-500 font-light">
                        <li><Link href="#" className="hover:text-zinc-900 transition-colors">Track Order</Link></li>
                        <li><Link href="#" className="hover:text-zinc-900 transition-colors">Shipping & Returns</Link></li>
                        <li><Link href="#" className="hover:text-zinc-900 transition-colors">Size Guide</Link></li>
                        <li><Link href="#" className="hover:text-zinc-900 transition-colors">Contact Us</Link></li>
                    </ul>
                </div>

                {/* Newsletter */}
                <div>
                    <h4 className="font-semibold text-zinc-900 tracking-wider uppercase mb-6">Stay Connected</h4>
                    <p className="text-zinc-500 font-light mb-4">
                        Subscribe to receive updates, access to exclusive deals, and more.
                    </p>
                    <form className="flex border-b border-zinc-300 pb-2">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="w-full bg-transparent outline-none text-zinc-900 placeholder:text-zinc-400 font-light"
                        />
                        <button
                            type="submit"
                            className="text-xs tracking-widest uppercase font-semibold text-zinc-900 hover:text-zinc-600"
                        >
                            Subscribe
                        </button>
                    </form>
                </div>

            </div>

            {/* Copyright Bar */}
            <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center text-xs text-zinc-400 font-light pt-8 border-t border-zinc-100">
                <p>© {year} Sanjhhbyam. All rights reserved.</p>

                <div className="flex space-x-6 mt-4 md:mt-0">
                    <Link href="#" className="hover:text-zinc-900 transition-colors">Privacy Policy</Link>
                    <Link href="#" className="hover:text-zinc-900 transition-colors">Terms of Service</Link>
                </div>
            </div>
        </footer>
    );
}
