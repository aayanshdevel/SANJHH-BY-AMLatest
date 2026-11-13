"use client";

import { useState, useEffect } from "react";
import { useCart } from "../../src/components/providers/CartProvider";
import { auth, db } from "../../src/lib/firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, ArrowLeft, Ticket, CreditCard, Banknote } from "lucide-react";

type CartItem = { id: string; size: string; title: string; quantity: number; price: number; salePrice?: number; images: string[]; };
type Address = { id?: string; name: string; street: string; city: string; state: string; pinCode: string; };

export default function CheckoutPage() {
    const { cartItems, cartTotal, clearCart } = useCart();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderComplete, setOrderComplete] = useState(false);
    const [orderId, setOrderId] = useState("");
    const router = useRouter();

    const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [isManualAddress, setIsManualAddress] = useState(false);
    const [manualAddress, setManualAddress] = useState<Address>({ name: "", street: "", city: "", state: "", pinCode: "" });

    const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("online");
    const [promoCode, setPromoCode] = useState("");
    const [discountPercent, setDiscountPercent] = useState(0);
    const [promoMessage, setPromoMessage] = useState({ text: "", type: "" });
    const [isCheckingPromo, setIsCheckingPromo] = useState(false);

    useEffect(() => {
        const fetchAddresses = async () => {
            if (!auth.currentUser) { router.push("/login"); return; }
            try {
                const snap = await getDocs(collection(db, "users", auth.currentUser.uid, "addresses"));
                const addresses = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Address[];
                setSavedAddresses(addresses);
                if (addresses.length > 0) setSelectedAddress(addresses[0]);
                else setIsManualAddress(true);
            } catch (error) { console.error("Error fetching addresses", error); }
        };
        fetchAddresses();
    }, [router]);

    const handleApplyPromo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!promoCode.trim()) return;
        setIsCheckingPromo(true);
        try {
            const q = query(collection(db, "promos"), where("code", "==", promoCode.toUpperCase()), where("isActive", "==", true));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const promoData = snap.docs[0].data();
                setDiscountPercent(promoData.discountPercent);
                setPromoMessage({ text: `Code applied! ${promoData.discountPercent}% OFF`, type: "success" });
            } else {
                setDiscountPercent(0);
                setPromoMessage({ text: "Invalid or expired code.", type: "error" });
            }
        } catch (error) { setPromoMessage({ text: "Error verifying code.", type: "error" }); }
        finally { setIsCheckingPromo(false); }
    };

    const discountAmount = cartTotal * (discountPercent / 100);
    const finalTotal = cartTotal - discountAmount;
    const formatPrice = (amount: number) => new Intl.NumberFormat('en-IN').format(amount);

    const saveOrderToFirestore = async (method: string) => {
        const finalShippingAddress = isManualAddress ? manualAddress : selectedAddress;
        const orderData = {
            userId: auth.currentUser?.uid,
            userEmail: auth.currentUser?.email,
            items: cartItems,
            subTotal: cartTotal,
            discountAmount,
            totalAmount: finalTotal,
            promoApplied: discountPercent > 0 ? promoCode.toUpperCase() : null,
            shippingAddress: finalShippingAddress,
            paymentMethod: method,
            status: "Confirmed",
            createdAt: new Date()
        };
        const docRef = await addDoc(collection(db, "orders"), orderData);
        setOrderId(docRef.id);
        clearCart();
        setOrderComplete(true);
    };

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.currentUser) return;
        const finalShippingAddress = isManualAddress ? manualAddress : selectedAddress;
        if (!finalShippingAddress) return alert("Please provide a shipping address.");

        setIsSubmitting(true);

        if (paymentMethod === "cod") {
            try {
                await saveOrderToFirestore("Cash on Delivery");
            } catch (err) { alert("Error placing order"); }
            finally { setIsSubmitting(false); }
        } else {
            // Razorpay Payment Simulation / Gateway Integration
            setTimeout(async () => {
                try {
                    // In production, instantiate Razorpay SDK here using order amount.
                    // Simulating successful digital transaction verification:
                    await saveOrderToFirestore("Razorpay Online Payment");
                } catch (err) { alert("Payment failed"); }
                finally { setIsSubmitting(false); }
            }, 1500);
        }
    };

    if (orderComplete) return (
        <div className="max-w-3xl mx-auto px-4 py-24 text-center min-h-[70vh] flex flex-col justify-center items-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-6" />
            <h1 className="text-3xl font-serif text-zinc-900 mb-2">Order Confirmed</h1>
            <p className="text-sm text-zinc-500 uppercase tracking-widest mb-6">Order ID: {orderId}</p>
            <Link href="/account" className="bg-zinc-900 text-white px-8 py-4 text-sm font-semibold tracking-widest uppercase hover:bg-zinc-800">View My Orders</Link>
        </div>
    );

    if (cartItems.length === 0) return (
        <div className="max-w-3xl mx-auto px-4 py-24 text-center min-h-[60vh] flex flex-col justify-center items-center">
            <h1 className="text-3xl font-serif text-zinc-900 mb-4">Your Cart is Empty</h1>
            <Link href="/" className="flex items-center gap-2 text-sm border-b border-zinc-900 text-zinc-900 pb-0.5 uppercase tracking-widest"><ArrowLeft className="w-4 h-4" /> Go Back</Link>
        </div>
    );

    return (
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
                <div className="w-full lg:w-3/5">
                    <h2 className="text-2xl font-serif text-zinc-900 mb-8">Checkout</h2>
                    <form onSubmit={handlePlaceOrder} className="space-y-8">
                        <section>
                            <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-900 mb-4">Shipping Address</h3>
                            {savedAddresses.length > 0 && (
                                <div className="space-y-3 mb-6">
                                    {savedAddresses.map(addr => (
                                        <label key={addr.id} className={`flex items-start gap-3 p-4 border cursor-pointer ${selectedAddress?.id === addr.id && !isManualAddress ? "border-zinc-900 bg-zinc-50" : "border-zinc-200"}`}>
                                            <input type="radio" name="addressSelect" checked={selectedAddress?.id === addr.id && !isManualAddress} onChange={() => { setSelectedAddress(addr); setIsManualAddress(false); }} className="mt-1" />
                                            <div>
                                                <p className="text-sm font-medium text-zinc-900">{addr.name}</p>
                                                <p className="text-sm text-zinc-500">{addr.street}, {addr.city}, {addr.state} {addr.pinCode}</p>
                                            </div>
                                        </label>
                                    ))}
                                    <label className={`flex items-center gap-3 p-4 border cursor-pointer ${isManualAddress ? "border-zinc-900 bg-zinc-50" : "border-zinc-200"}`}>
                                        <input type="radio" name="addressSelect" checked={isManualAddress} onChange={() => setIsManualAddress(true)} />
                                        <span className="text-sm font-medium text-zinc-900">Enter a different address</span>
                                    </label>
                                </div>
                            )}
                            {isManualAddress && (
                                <div className="space-y-4">
                                    <input type="text" required placeholder="Full Name" value={manualAddress.name} onChange={e => setManualAddress({...manualAddress, name: e.target.value})} className="w-full border p-3.5 text-sm outline-none" />
                                    <input type="text" required placeholder="Street Address" value={manualAddress.street} onChange={e => setManualAddress({...manualAddress, street: e.target.value})} className="w-full border p-3.5 text-sm outline-none" />
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <input type="text" required placeholder="City" value={manualAddress.city} onChange={e => setManualAddress({...manualAddress, city: e.target.value})} className="w-full border p-3.5 text-sm outline-none" />
                                        <input type="text" required placeholder="State" value={manualAddress.state} onChange={e => setManualAddress({...manualAddress, state: e.target.value})} className="w-full border p-3.5 text-sm outline-none" />
                                        <input type="text" required placeholder="PIN Code" value={manualAddress.pinCode} onChange={e => setManualAddress({...manualAddress, pinCode: e.target.value})} className="w-full border p-3.5 text-sm outline-none" />
                                    </div>
                                </div>
                            )}
                        </section>

                        <section className="pt-4">
                            <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-900 mb-4">Payment Method</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button type="button" onClick={() => setPaymentMethod("online")} className={`p-4 border text-left flex flex-col gap-2 ${paymentMethod === 'online' ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200'}`}>
                                    <CreditCard className="w-5 h-5 text-zinc-900" />
                                    <span className="text-sm font-medium text-zinc-900">Online Payment</span>
                                    <span className="text-xs text-zinc-500">UPI, Cards, NetBanking</span>
                                </button>
                                <button type="button" onClick={() => setPaymentMethod("cod")} className={`p-4 border text-left flex flex-col gap-2 ${paymentMethod === 'cod' ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200'}`}>
                                    <Banknote className="w-5 h-5 text-zinc-900" />
                                    <span className="text-sm font-medium text-zinc-900">Cash on Delivery</span>
                                    <span className="text-xs text-zinc-500">Pay when you receive</span>
                                </button>
                            </div>
                        </section>

                        <button type="submit" disabled={isSubmitting} className="w-full bg-zinc-900 text-white flex items-center justify-center gap-3 py-4 mt-8 text-sm font-semibold tracking-widest uppercase hover:bg-zinc-800 disabled:bg-zinc-400">
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay ₹ ${formatPrice(finalTotal)}`}
                        </button>
                    </form>
                </div>

                <div className="w-full lg:w-2/5">
                    <div className="bg-zinc-50 p-6 md:p-8 border border-zinc-100 sticky top-24">
                        <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-900 mb-6">Order Summary</h3>
                        <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2">
                            {cartItems.map((item: CartItem) => (
                                <div key={`${item.id}-${item.size}`} className="flex gap-4">
                                    <div className="w-16 aspect-[3/4] bg-white flex-none border"><img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" /></div>
                                    <div className="flex flex-col flex-1 justify-center">
                                        <h4 className="text-sm font-medium text-zinc-900 line-clamp-1">{item.title}</h4>
                                        <p className="text-xs text-zinc-500 mt-1">Size: {item.size} | Qty: {item.quantity}</p>
                                    </div>
                                    <div className="flex items-center"><p className="text-sm font-medium text-zinc-900">₹ {formatPrice(item.salePrice || item.price)}</p></div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-zinc-200 py-6">
                            <form onSubmit={handleApplyPromo} className="flex gap-2">
                                <div className="relative flex-1">
                                    <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                    <input type="text" placeholder="Promo Code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} className="w-full border border-zinc-200 py-2.5 pl-10 pr-3 text-sm outline-none uppercase" />
                                </div>
                                <button type="submit" disabled={isCheckingPromo || !promoCode} className="bg-zinc-900 text-white px-4 text-xs font-semibold tracking-widest uppercase disabled:bg-zinc-400">Apply</button>
                            </form>
                            {promoMessage.text && <p className={`mt-2 text-xs font-medium ${promoMessage.type === "success" ? "text-green-600" : "text-red-600"}`}>{promoMessage.text}</p>}
                        </div>

                        <div className="border-t border-zinc-200 pt-4 space-y-3">
                            <div className="flex justify-between text-sm text-zinc-600"><span>Subtotal</span><span>₹ {formatPrice(cartTotal)}</span></div>
                            {discountPercent > 0 && <div className="flex justify-between text-sm text-green-600 font-medium"><span>Discount</span><span>- ₹ {formatPrice(discountAmount)}</span></div>}
                            <div className="flex justify-between text-sm text-zinc-600"><span>Shipping</span><span>Free</span></div>
                            <div className="flex justify-between text-base font-medium text-zinc-900 pt-3 border-t border-zinc-200"><span>Total</span><span>₹ {formatPrice(finalTotal)}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}