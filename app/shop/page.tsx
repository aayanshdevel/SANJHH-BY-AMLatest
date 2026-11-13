"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../src/lib/firebase";
import Link from "next/link";
import { Loader2 } from "lucide-react";

type Product = {
    id: string;
    title: string;
    price: number;
    salePrice?: number;
    category: string;
    images: string[];
    inStock: boolean;
};

export default function ShopPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("All");

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const snap = await getDocs(collection(db, "products"));
                const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
                setProducts(items);
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const categories = ["All", "Festive Edit", "Ready to Ship", "New Arrivals"];

    const filteredProducts = selectedCategory === "All"
        ? products
        : products.filter(p => p.category === selectedCategory);

    const formatPrice = (amount: number) => new Intl.NumberFormat('en-IN').format(amount);

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
            </div>
        );
    }

    return (
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">

            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-12">
                <h1 className="text-3xl md:text-4xl font-serif text-zinc-900 mb-3">All Collections</h1>
                <p className="text-sm text-zinc-500 font-light">Explore our complete catalog of handcrafted traditional and festive wear.</p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-12 border-b border-zinc-200 pb-6">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-6 py-2.5 text-xs font-semibold tracking-widest uppercase transition-colors ${
                            selectedCategory === cat
                                ? "bg-zinc-900 text-white"
                                : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
                <div className="text-center py-20 border border-zinc-100 bg-zinc-50">
                    <p className="text-zinc-500 text-sm mb-4">No products found in this category.</p>
                    <button
                        onClick={() => setSelectedCategory("All")}
                        className="bg-zinc-900 text-white px-6 py-3 text-xs font-semibold tracking-widest uppercase"
                    >
                        View All Products
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {filteredProducts.map((product) => (
                        <Link key={product.id} href={`/product/${product.id}`} className="group">
                            <div className="aspect-[3/4] bg-zinc-100 mb-4 overflow-hidden relative">
                                <img
                                    src={product.images[0]}
                                    alt={product.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                {!product.inStock && (
                                    <span className="absolute top-3 left-3 bg-white/90 px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold text-zinc-900">
                    Out of Stock
                  </span>
                                )}
                            </div>
                            <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">{product.category}</p>
                            <h3 className="text-sm font-medium text-zinc-900 line-clamp-1">{product.title}</h3>
                            <div className="flex gap-3 mt-1.5">
                                <p className="text-sm font-semibold text-zinc-900">₹ {formatPrice(product.salePrice || product.price)}</p>
                                {product.salePrice && (
                                    <p className="text-sm text-zinc-400 line-through">₹ {formatPrice(product.price)}</p>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

        </div>
    );
}