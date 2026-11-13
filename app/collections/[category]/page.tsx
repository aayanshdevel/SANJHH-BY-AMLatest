"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../src/lib/firebase";
import ProductCard from "../../../src/components/ui/ProductCard";
import { Loader2 } from "lucide-react";

export default function CategoryPage() {
    const params = useParams();
    const categorySlug = params.category as string;

    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pageTitle, setPageTitle] = useState("");

    useEffect(() => {
        async function fetchCategoryProducts() {
            if (!categorySlug) return;

            // Map the URL slug to your exact Firebase category names
            let dbCategoryName = "";
            let displayTitle = "";

            if (categorySlug === "festive") {
                dbCategoryName = "Festive Edit";
                displayTitle = "The Festive Edit";
            } else if (categorySlug === "ready-to-ship") {
                dbCategoryName = "Ready to Ship";
                displayTitle = "Ready to Ship";
            } else {
                dbCategoryName = categorySlug;
                displayTitle = categorySlug.replace(/-/g, " ");
            }

            setPageTitle(displayTitle);

            try {
                // Query Firebase for products matching this category
                const q = query(collection(db, "products"), where("category", "==", dbCategoryName));
                const querySnapshot = await getDocs(q);

                const fetchedProducts = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setProducts(fetchedProducts);
            } catch (error) {
                console.error("Error fetching products:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchCategoryProducts();
    }, [categorySlug]);

    return (
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">

            {/* Category Header */}
            <div className="flex flex-col items-center text-center mb-16">
                <h1 className="text-3xl md:text-5xl font-serif text-zinc-900 tracking-wide capitalize mb-4">
                    {pageTitle}
                </h1>
                <div className="w-16 h-px bg-zinc-900"></div>
                <p className="text-zinc-500 mt-6 max-w-lg font-light">
                    Explore our curated collection of {pageTitle.toLowerCase()}, designed for effortless elegance and timeless style.
                </p>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="w-full flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-300" />
                </div>
            ) : products.length === 0 ? (
                /* Empty State */
                <div className="w-full flex flex-col items-center justify-center py-20">
                    <p className="text-zinc-500 font-light mb-4">No products found in this collection yet.</p>
                </div>
            ) : (
                /* Product Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
                    {products.map((product) => (
                        <div key={product.id} className="flex justify-center">
                            {/* Wrapping the card to handle Flexbox sizing properly in a grid */}
                            <div className="w-full max-w-[320px]">
                                <ProductCard {...product} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}