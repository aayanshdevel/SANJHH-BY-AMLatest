"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, query, where, getDocs, Timestamp, doc, getDoc, setDoc, addDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../src/lib/firebase";
import { Loader2, LogOut, Package, User as UserIcon, MapPin, Heart, ChevronRight, Check, Trash2, Plus, XCircle } from "lucide-react";
import Link from "next/link";

type CartItem = { id: string; size: string; title: string; quantity: number; price: number; salePrice?: number; images: string[]; };
type Order = { id: string; userId: string; userEmail: string; items: CartItem[]; totalAmount: number; status: string; createdAt: Timestamp; };
type Address = { id: string; name: string; street: string; city: string; state: string; pinCode: string; };
type WishlistItem = { id: string; productId: string; title: string; price: number; image: string; };

export default function AccountPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("orders");

    const [orders, setOrders] = useState<Order[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState("");

    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [newAddress, setNewAddress] = useState({ name: "", street: "", city: "", state: "", pinCode: "" });
    const [isSavingAddress, setIsSavingAddress] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                try {
                    const qOrders = query(collection(db, "orders"), where("userId", "==", currentUser.uid));
                    const snapOrders = await getDocs(qOrders);
                    const fetchedOrders = snapOrders.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
                    fetchedOrders.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
                    setOrders(fetchedOrders);

                    const userDocSnap = await getDoc(doc(db, "users", currentUser.uid));
                    if (userDocSnap.exists()) {
                        const data = userDocSnap.data();
                        setFirstName(data.firstName || "");
                        setLastName(data.lastName || "");
                        setPhone(data.phone || "");
                    }

                    const snapAddresses = await getDocs(collection(db, "users", currentUser.uid, "addresses"));
                    setAddresses(snapAddresses.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Address[]);

                    const snapWishlist = await getDocs(collection(db, "users", currentUser.uid, "wishlist"));
                    setWishlist(snapWishlist.docs.map(doc => ({ id: doc.id, ...doc.data() })) as WishlistItem[]);

                } catch (error) {
                    console.error("Error fetching data:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                router.push("/login");
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleSignOut = async () => {
        await signOut(auth);
        router.push("/login");
    };

    const handleCancelOrder = async (orderId: string) => {
        if (!confirm("Are you sure you want to cancel this order?")) return;
        try {
            await updateDoc(doc(db, "orders", orderId), { status: "Cancelled" });
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: "Cancelled" } : o));
        } catch (error) {
            alert("Failed to cancel order.");
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSavingProfile(true);
        try {
            await setDoc(doc(db, "users", user.uid), { firstName, lastName, phone, email: user.email, updatedAt: new Date() }, { merge: true });
            setProfileMessage("Profile updated successfully!");
            setTimeout(() => setProfileMessage(""), 3000);
        } catch (error) {
            setProfileMessage("Error updating profile.");
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleSaveAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSavingAddress(true);
        try {
            const docRef = await addDoc(collection(db, "users", user.uid, "addresses"), newAddress);
            setAddresses([...addresses, { id: docRef.id, ...newAddress }]);
            setNewAddress({ name: "", street: "", city: "", state: "", pinCode: "" });
            setIsAddingAddress(false);
        } catch (error) {
            console.error("Error saving address:", error);
        } finally {
            setIsSavingAddress(false);
        }
    };

    const handleDeleteAddress = async (id: string) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, "users", user.uid, "addresses", id));
            setAddresses(addresses.filter(addr => addr.id !== id));
        } catch (error) {
            console.error("Error deleting address:", error);
        }
    };

    const handleRemoveFromWishlist = async (id: string) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, "users", user.uid, "wishlist", id));
            setWishlist(wishlist.filter(item => item.id !== id));
        } catch (error) {
            console.error("Error removing wishlist item:", error);
        }
    };

    const formatPrice = (amount: number) => new Intl.NumberFormat('en-IN').format(amount);
    const formatDate = (timestamp: Timestamp) => timestamp ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(timestamp.toDate()) : "";

    if (loading) return <div className="min-h-[70vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-zinc-900" /></div>;

    return (
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
            <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-12 border-b border-zinc-200 pb-6 gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-serif text-zinc-900 mb-2">My Account</h1>
                    <p className="text-zinc-500 font-light">Welcome back, {firstName || user?.email}</p>
                </div>
                <button onClick={handleSignOut} className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-2">
                    <LogOut className="w-4 h-4" /> <span>Sign Out</span>
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-12">
                <aside className="w-full lg:w-64 flex-none">
                    <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
                        {[
                            { id: "orders", icon: Package, label: "My Orders" },
                            { id: "profile", icon: UserIcon, label: "Profile Details" },
                            { id: "addresses", icon: MapPin, label: "Saved Addresses" },
                            { id: "wishlist", icon: Heart, label: "Wishlist" }
                        ].map(tab => (
                            <button
                                key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center justify-between p-4 text-left transition-colors whitespace-nowrap ${activeTab === tab.id ? "bg-zinc-50 border-l-2 border-zinc-900 text-zinc-900 font-medium" : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"}`}
                            >
                                <div className="flex items-center gap-3"><tab.icon className="w-5 h-5" /> {tab.label}</div>
                                <ChevronRight className="w-4 h-4 hidden lg:block opacity-50" />
                            </button>
                        ))}
                    </nav>
                </aside>

                <main className="flex-1">
                    {activeTab === "orders" && (
                        <div className="animate-in fade-in duration-500">
                            <h2 className="text-xl font-serif text-zinc-900 mb-6">Order History</h2>
                            {orders.length === 0 ? (
                                <div className="border border-zinc-200 p-12 text-center flex flex-col items-center justify-center">
                                    <Package className="w-8 h-8 text-zinc-300 mb-4" />
                                    <p className="text-zinc-500 mb-6 font-light">You haven&apos;t placed any orders yet.</p>
                                    <Link href="/" className="bg-zinc-900 text-white px-8 py-3.5 text-sm font-semibold tracking-widest uppercase hover:bg-zinc-800 transition-colors">Start Shopping</Link>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {orders.map((order) => (
                                        <div key={order.id} className="border border-zinc-200 p-6">
                                            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 pb-4 border-b border-zinc-100 gap-4">
                                                <div>
                                                    <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Order Placed</p>
                                                    <p className="text-sm font-medium text-zinc-900">{formatDate(order.createdAt)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Total</p>
                                                    <p className="text-sm font-medium text-zinc-900">₹ {formatPrice(order.totalAmount)}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div>
                                                        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Status</p>
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium ${order.status === 'Cancelled' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{order.status}</span>
                                                    </div>
                                                    {order.status === "Confirmed" && (
                                                        <button onClick={() => handleCancelOrder(order.id)} className="text-xs text-red-600 underline hover:text-red-800">Cancel Order</button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                {order.items.map((item: CartItem, index: number) => (
                                                    <div key={index} className="flex gap-4">
                                                        <div className="w-16 aspect-[3/4] bg-zinc-100 flex-none"><img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" /></div>
                                                        <div className="flex flex-col justify-center">
                                                            <h4 className="text-sm font-medium text-zinc-900">{item.title}</h4>
                                                            <p className="text-xs text-zinc-500 mt-1">Size: {item.size} | Qty: {item.quantity}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "profile" && (
                        <div className="animate-in fade-in duration-500 max-w-xl">
                            <h2 className="text-xl font-serif text-zinc-900 mb-6">Profile Details</h2>
                            {profileMessage && (
                                <div className={`p-4 mb-6 text-sm font-medium flex items-center gap-2 ${profileMessage.includes("Error") ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-700 border border-green-100"}`}>
                                    {!profileMessage.includes("Error") && <Check className="w-4 h-4" />} {profileMessage}
                                </div>
                            )}
                            <form onSubmit={handleSaveProfile} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Email Address</label>
                                    <input type="email" disabled value={user?.email || ""} className="w-full border border-zinc-200 p-3.5 text-sm bg-zinc-50 text-zinc-500 cursor-not-allowed" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">First Name</label>
                                        <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full border border-zinc-200 p-3.5 text-sm outline-none focus:border-zinc-900 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Last Name</label>
                                        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full border border-zinc-200 p-3.5 text-sm outline-none focus:border-zinc-900 transition-colors" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Phone Number</label>
                                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-zinc-200 p-3.5 text-sm outline-none focus:border-zinc-900 transition-colors" />
                                </div>
                                <button type="submit" disabled={isSavingProfile} className="bg-zinc-900 text-white px-8 py-3.5 text-sm font-semibold tracking-widest uppercase hover:bg-zinc-800 transition-colors mt-4 flex justify-center disabled:bg-zinc-400 min-w-[160px]">
                                    {isSavingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === "addresses" && (
                        <div className="animate-in fade-in duration-500">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-serif text-zinc-900">Saved Addresses</h2>
                                {!isAddingAddress && (
                                    <button onClick={() => setIsAddingAddress(true)} className="text-sm font-medium text-zinc-900 underline underline-offset-4 flex items-center gap-1">
                                        <Plus className="w-4 h-4" /> Add New
                                    </button>
                                )}
                            </div>
                            {isAddingAddress ? (
                                <form onSubmit={handleSaveAddress} className="border border-zinc-200 p-6 space-y-6 max-w-xl bg-zinc-50">
                                    <input type="text" required placeholder="Full Name" value={newAddress.name} onChange={e => setNewAddress({...newAddress, name: e.target.value})} className="w-full border p-3.5 text-sm" />
                                    <input type="text" required placeholder="Street Address" value={newAddress.street} onChange={e => setNewAddress({...newAddress, street: e.target.value})} className="w-full border p-3.5 text-sm" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="text" required placeholder="City" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} className="w-full border p-3.5 text-sm" />
                                        <input type="text" required placeholder="State" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} className="w-full border p-3.5 text-sm" />
                                    </div>
                                    <input type="text" required placeholder="PIN Code" value={newAddress.pinCode} onChange={e => setNewAddress({...newAddress, pinCode: e.target.value})} className="w-full border p-3.5 text-sm" />
                                    <div className="flex gap-4">
                                        <button type="submit" disabled={isSavingAddress} className="bg-zinc-900 text-white px-8 py-3.5 text-sm font-semibold tracking-widest uppercase flex-1">{isSavingAddress ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Save"}</button>
                                        <button type="button" onClick={() => setIsAddingAddress(false)} className="border border-zinc-200 px-8 py-3.5 text-sm">Cancel</button>
                                    </div>
                                </form>
                            ) : addresses.length === 0 ? (
                                <div className="border border-zinc-200 p-12 text-center">
                                    <MapPin className="w-8 h-8 text-zinc-300 mx-auto mb-4" />
                                    <p className="text-zinc-500 mb-6">No saved addresses.</p>
                                    <button onClick={() => setIsAddingAddress(true)} className="border border-zinc-900 px-8 py-3.5 text-sm uppercase tracking-widest">Add Address</button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {addresses.map(address => (
                                        <div key={address.id} className="border border-zinc-200 p-6 flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-medium text-zinc-900 mb-2">{address.name}</h4>
                                                <p className="text-sm text-zinc-500">{address.street}, {address.city}, {address.state} {address.pinCode}</p>
                                            </div>
                                            <button onClick={() => handleDeleteAddress(address.id)} className="mt-6 text-sm text-red-600 flex items-center gap-1.5 self-start"><Trash2 className="w-4 h-4" /> Remove</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "wishlist" && (
                        <div className="animate-in fade-in duration-500">
                            <h2 className="text-xl font-serif text-zinc-900 mb-6">My Wishlist</h2>
                            {wishlist.length === 0 ? (
                                <div className="border border-zinc-200 p-12 text-center">
                                    <Heart className="w-8 h-8 text-zinc-300 mx-auto mb-4" />
                                    <p className="text-zinc-500 mb-6">Your wishlist is empty.</p>
                                    <Link href="/" className="bg-zinc-900 text-white px-8 py-3.5 text-sm uppercase tracking-widest">Explore Products</Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    {wishlist.map(item => (
                                        <div key={item.id} className="group cursor-pointer">
                                            <div className="aspect-[3/4] bg-zinc-100 overflow-hidden relative mb-4">
                                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                <button onClick={() => handleRemoveFromWishlist(item.id)} className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4 text-red-600" /></button>
                                            </div>
                                            <h3 className="text-sm font-medium text-zinc-900">{item.title}</h3>
                                            <p className="text-sm text-zinc-500 mt-1">₹ {formatPrice(item.price)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}