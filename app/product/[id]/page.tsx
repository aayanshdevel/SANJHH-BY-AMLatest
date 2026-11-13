"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../../../src/lib/firebase";
import { useCart } from "../../../src/components/providers/CartProvider";
import { Loader2, Heart, ShieldCheck, Truck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

// 1. Defined a strict TypeScript interface for the product
type Product = {
    id: string;
    title: string;
    price: number;
    salePrice?: number;
    category: string;
    images: string[];
    sizes: string[];
    inStock: boolean;
    description: string;
};

export default function ProductPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params?.id as string;

    const { addToCart } = useCart();

    // 2. Replaced 'any' with the 'Product' type
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    // Interactions State
    const [selectedSize, setSelectedSize] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [isInWishlist, setIsInWishlist] = useState(false);

    useEffect(() => {
        if (!productId) return;

        const fetchProductAndWishlist = async () => {
            try {
                const docRef = doc(db, "products", productId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    // 3. Explicitly tell TypeScript this data is a 'Product'
                    const productData = { id: docSnap.id, ...docSnap.data() } as Product;
                    setProduct(productData);

                    if (productData.sizes && productData.sizes.length > 0) {
                        setSelectedSize(productData.sizes[0]);
                    }

                    if (auth.currentUser) {
                        const wishlistRef = doc(db, "users", auth.currentUser.uid, "wishlist", productId);
                        const wishlistSnap = await getDoc(wishlistRef);
                        setIsInWishlist(wishlistSnap.exists());
                    }
                }
            } catch (error) {
                console.error("Error fetching product", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProductAndWishlist();
    }, [productId]);

    const handleAddToCart = () => {
        if (!selectedSize || !product) return alert("Please select a size");
        setIsAdding(true);
        addToCart(product, selectedSize);
        setTimeout(() => setIsAdding(false), 500);
    };

    const handleToggleWishlist = async () => {
        if (!auth.currentUser) {
            router.push("/login");
            return;
        }
        if (!product) return;

        try {
            const wishlistRef = doc(db, "users", auth.currentUser.uid, "wishlist", productId);
            if (isInWishlist) {
                await deleteDoc(wishlistRef);
                setIsInWishlist(false);
            } else {
                await setDoc(wishlistRef, {
                    productId: productId,
                    title: product.title,
                    price: product.salePrice || product.price,
                    image: product.images[0]
                });
                setIsInWishlist(true);
            }
        } catch (error) {
            console.error("Error updating wishlist", error);
        }
    };

    const formatPrice = (amount: number) => new Intl.NumberFormat('en-IN').format(amount);

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-zinc-900" /></div>;
    if (!product) return <div className="min-h-screen flex flex-col items-center justify-center"><p className="text-xl font-serif mb-4">Product not found</p><Link href="/" className="text-sm uppercase tracking-widest border-b border-zinc-900 pb-1">Return Home</Link></div>;

    return (
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">

            {/* Breadcrumb */}
            <Link href="/" className="inline-flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-widest hover:text-zinc-900 mb-8 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Collection
            </Link>

            <div className="flex flex-col md:flex-row gap-12 lg:gap-24">

                {/* Images */}
                <div className="w-full md:w-1/2">
                    <div className="aspect-[3/4] bg-zinc-100">
                        <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                    </div>
                </div>

                {/* Details */}
                <div className="w-full md:w-1/2 flex flex-col">
                    <div className="mb-8">
                        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">{product.category}</p>
                        <h1 className="text-3xl md:text-4xl font-serif text-zinc-900 mb-4">{product.title}</h1>
                        <div className="flex items-center gap-4">
                            <p className="text-2xl font-medium text-zinc-900">₹ {formatPrice(product.salePrice || product.price)}</p>
                            {product.salePrice && <p className="text-lg text-zinc-400 line-through">₹ {formatPrice(product.price)}</p>}
                        </div>
                    </div>

                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-medium uppercase tracking-wider text-zinc-900">Select Size</span>
                            <button className="text-xs text-zinc-500 underline underline-offset-4">Size Guide</button>
                        </div>
                        <div className="grid grid-cols-5 gap-3">
                            {product.sizes.map((size: string) => (
                                <button
                                    key={size}
                                    onClick={() => setSelectedSize(size)}
                                    className={`py-3 text-sm font-medium border transition-colors ${selectedSize === size ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-900 hover:border-zinc-900"}`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4 mb-10">
                        <button
                            onClick={handleAddToCart}
                            disabled={!product.inStock || isAdding}
                            className="flex-1 bg-zinc-900 text-white py-4 text-sm font-semibold tracking-widest uppercase hover:bg-zinc-800 transition-colors disabled:bg-zinc-400 flex items-center justify-center"
                        >
                            {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : (!product.inStock ? "Out of Stock" : "Add to Cart")}
                        </button>
                        <button
                            onClick={handleToggleWishlist}
                            className={`px-6 border transition-colors flex items-center justify-center ${isInWishlist ? 'border-red-200 bg-red-50 text-red-500' : 'border-zinc-200 text-zinc-900 hover:border-zinc-900'}`}
                        >
                            <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
                        </button>
                    </div>

                    <div className="prose prose-zinc prose-sm mb-10">
                        <p className="text-zinc-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-8 border-t border-zinc-100">
                        <div className="flex items-center gap-3 text-zinc-600">
                            <ShieldCheck className="w-5 h-5" />
                            <span className="text-sm">Secure Payment</span>
                        </div>
                        <div className="flex items-center gap-3 text-zinc-600">
                            <Truck className="w-5 h-5" />
                            <span className="text-sm">Free Shipping</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}