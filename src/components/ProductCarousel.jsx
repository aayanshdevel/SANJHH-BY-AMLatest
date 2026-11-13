"use client"; // Required because we are fetching data on the client side

import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import ProductCard from "./ui/ProductCard";
import { Loader2 } from "lucide-react";

export default function ProductCarousel({ title }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProducts() {
            try {
                // Look in the "products" collection where the category matches the carousel title
                const q = query(collection(db, "products"), where("category", "==", title));
                const querySnapshot = await getDocs(q);

                const fetchedProducts = querySnapshot.docs.map(doc => ({
                    id: doc.id, // The unique Firebase document ID
                    ...doc.data()
                }));

                setProducts(fetchedProducts);
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchProducts();
    }, [title]);

    return (
        <section className="py-20 px-4 md:px-8 max-w-screen-2xl mx-auto w-full">
            {/* Section Header */}
            <div className="flex justify-between items-end mb-10">
                <h2 className="text-2xl md:text-3xl font-serif text-zinc-900 tracking-wide">
                    {title}
                </h2>
                <button className="text-sm border-b border-zinc-900 pb-0.5 hover:text-zinc-600 hover:border-zinc-600 transition-colors hidden sm:block">
                    View all
                </button>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="w-full flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
                </div>
            ) : products.length === 0 ? (
                <p className="text-zinc-500 font-light py-12">No products found in this collection yet.</p>
            ) : (
                /* Horizontal Scroll Container */
                <div className="flex overflow-x-auto gap-4 md:gap-8 pb-8 snap-x snap-mandatory hide-scrollbar">
                    {products.map((product) => (
                        <ProductCard key={product.id} {...product} />
                    ))}
                </div>
            )}
        </section>
    );
}