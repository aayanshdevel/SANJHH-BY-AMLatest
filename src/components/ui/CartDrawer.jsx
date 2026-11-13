"use client";

import { useCart } from "../providers/CartProvider";
import { X, Trash2 } from "lucide-react";
import Link from "next/link";

export default function CartDrawer() {
    const { isCartOpen, setIsCartOpen, cartItems, removeFromCart, cartTotal } = useCart();

    // Format numbers nicely for Indian Rupees
    const formatPrice = (amount) => new Intl.NumberFormat('en-IN').format(amount);

    if (!isCartOpen) return null;

    return (
        <>
            {/* Dark Overlay (Clicking it closes the cart) */}
            <div
                className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm transition-opacity"
                onClick={() => setIsCartOpen(false)}
            />

            {/* Slide-out Drawer */}
            <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col animate-slide-in-right">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                    <h2 className="text-lg font-serif text-zinc-900 tracking-wide">Your Cart ({cartItems.length})</h2>
                    <button onClick={() => setIsCartOpen(false)} className="text-zinc-400 hover:text-zinc-900 transition-colors">
                        <X className="w-6 h-6" strokeWidth={1.5} />
                    </button>
                </div>

                {/* Cart Items Scrollable Area */}
                <div className="flex-1 overflow-y-auto p-6">
                    {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
                            <p className="font-light">Your cart is currently empty.</p>
                            <button onClick={() => setIsCartOpen(false)} className="text-sm border-b border-zinc-900 text-zinc-900 pb-0.5 uppercase tracking-widest font-medium">
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {cartItems.map((item) => (
                                <div key={`${item.id}-${item.size}`} className="flex gap-4">
                                    <div className="w-24 aspect-[3/4] bg-zinc-100 flex-none">
                                        <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col flex-1 py-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-sm font-medium text-zinc-900 leading-tight pr-4">{item.title}</h3>
                                            <button onClick={() => removeFromCart(item.id, item.size)} className="text-zinc-400 hover:text-red-500 transition-colors mt-0.5">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="text-xs text-zinc-500 mt-1 uppercase tracking-wider">Size: {item.size}</p>
                                        <div className="mt-auto flex justify-between items-end">
                                            <p className="text-xs text-zinc-500">Qty: {item.quantity}</p>
                                            <p className="text-sm text-zinc-900 font-medium">₹ {formatPrice(item.salePrice || item.price)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer / Checkout Button */}
                {cartItems.length > 0 && (
                    <div className="p-6 border-t border-zinc-100 bg-zinc-50">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-sm text-zinc-500 uppercase tracking-wider font-medium">Subtotal</span>
                            <span className="text-lg text-zinc-900 font-serif">₹ {formatPrice(cartTotal)}</span>
                        </div>
                        <p className="text-xs text-zinc-500 font-light mb-6 text-center">Shipping and taxes calculated at checkout.</p>
                        <Link
                            href="/checkout"
                            onClick={() => setIsCartOpen(false)}
                            className="w-full block text-center bg-zinc-900 text-white py-4 text-sm font-semibold tracking-widest uppercase hover:bg-zinc-800 transition-colors"
                        >
                            Checkout
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
}