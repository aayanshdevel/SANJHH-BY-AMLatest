"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../src/lib/firebase";
import Link from "next/link";
import { Loader2, Search as SearchIcon } from "lucide-react";

type Product = { id: string; title: string; price: number; salePrice?: number; category: string; images: string[]; };

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q")?.toLowerCase() || "";

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllProducts = async () => {
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
        fetchAllProducts();
    }, []);

    const filteredProducts = products.filter(p =>
        p.title.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)
    );

    const formatPrice = (amount: number) => new Intl.NumberFormat('en-IN').format(amount);

    if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-zinc-900" /></div>;

    return (
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-8 border-b border-zinc-200 pb-6">
                <h1 className="text-3xl font-serif text-zinc-900 mb-2">Search Results</h1>
                <p className="text-sm text-zinc-500">Found {filteredProducts.length} results for &ldquo;{query}&rdquo;</p>
            </div>

            {filteredProducts.length === 0 ? (
                <div className="text-center py-20 border border-zinc-100 bg-zinc-50">
                    <SearchIcon className="w-8 h-8 text-zinc-300 mx-auto mb-4" />
                    <p className="text-zinc-600 mb-4">No products found matching your search.</p>
                    <Link href="/" className="bg-zinc-900 text-white px-6 py-3 text-xs font-semibold tracking-widest uppercase">Explore All Products</Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {filteredProducts.map(product => (
                        <Link key={product.id} href={`/product/${product.id}`} className="group">
                            <div className="aspect-[3/4] bg-zinc-100 mb-4 overflow-hidden relative">
                                <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                            <h3 className="text-sm font-medium text-zinc-900 line-clamp-1">{product.title}</h3>
                            <p className="text-sm text-zinc-500 mt-1">₹ {formatPrice(product.salePrice || product.price)}</p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-zinc-900" /></div>}>
            <SearchContent />
        </Suspense>
    );
}