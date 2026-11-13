"use client";

import { useState, useEffect } from "react";
import {
    collection, addDoc, getDocs, getDoc, setDoc,
    doc, updateDoc, deleteDoc, Timestamp
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { db, auth } from "../../src/lib/firebase";
import Link from "next/link";
import {
    Loader2, LogOut, ClipboardList,
    Home, Package, Users, Trash2, CheckCircle2,
    HelpCircle, RotateCcw, Search, Sparkles,
    Tag, ExternalLink, Plus, Image as ImageIcon,
    CreditCard, Truck, ArrowUpRight, Layers,
    TrendingUp, BarChart3, FileText, Globe, Settings,
    ChevronDown, ChevronRight, ShieldCheck, Calendar, Bell,
    MapPin, Lock, Languages, Database, Award, AlertTriangle, X
} from "lucide-react";

type CartItem = { id: string; size: string; title: string; quantity: number; price: number; salePrice?: number; images: string[]; };
type ShippingAddr = { name?: string; firstName?: string; lastName?: string; street?: string; address?: string; city: string; state: string; pinCode: string; };
type Order = {
    id: string; userId: string; userEmail: string; items: CartItem[];
    subTotal?: number; discountAmount?: number; taxAmount?: number; shippingFee?: number;
    totalAmount: number; status: string; courierName?: string; trackingId?: string;
    returnReason?: string; returnStatus?: string; paymentMethod?: string;
    createdAt: Timestamp; shippingAddress?: ShippingAddr;
};
type Product = {
    id: string; title: string; price: number; salePrice?: number;
    category: string; status?: string; inStock: boolean; stockQuantity?: number;
    sku?: string; images: string[]; description?: string; sizes?: string[];
};
type UserProfile = { id: string; email: string; firstName?: string; lastName?: string; phone?: string; };
type PromoCode = { id: string; code: string; discountPercent: number; isActive: boolean; };
type SupportTicket = { id: string; userId: string; userEmail: string; orderId: string; subject: string; message: string; status: string; adminReply?: string; createdAt: Timestamp; };
type CollectionGroup = { id: string; title: string; type: "Manual" | "Automated"; rule: string; productCount: number; };
type PurchaseOrder = { id: string; poNumber: string; supplier: string; fabricItem: string; units: number; totalCost: number; status: string; expectedDate: string; };
type StockTransfer = { id: string; ref: string; origin: string; destination: string; units: number; status: string; };
type GiftCardItem = { id: string; code: string; initialValue: number; balance: number; recipientEmail: string; isActive: boolean; };
type ToastItem = { id: number; text: string; type: "success" | "error" | "info"; };
type ConfirmModalState = { isOpen: boolean; title: string; description: string; confirmLabel: string; onConfirm: () => void; };

type SettingsSectionId =
    | "general" | "plan" | "billing" | "users" | "payments" | "checkout"
    | "customer-accounts" | "shipping" | "taxes" | "locations" | "markets"
    | "apps" | "sales-channels" | "domains" | "customer-events"
    | "notifications" | "metafields" | "languages" | "privacy";

export default function AdminPage() {
    const router = useRouter();
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const [globalSearch, setGlobalSearch] = useState("");
    const [productCategoryFilter, setProductCategoryFilter] = useState("All");

    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
        isOpen: false,
        title: "",
        description: "",
        confirmLabel: "Delete",
        onConfirm: () => {}
    });

    const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, text, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3500);
    };

    const switchTab = (tabId: string) => {
        setActiveTab(tabId);
        if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

    const [openMenus, setOpenMenus] = useState<{ products: boolean; growth: boolean; analytics: boolean }>({
        products: true,
        growth: false,
        analytics: false
    });

    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<UserProfile[]>([]);
    const [promos, setPromos] = useState<PromoCode[]>([]);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const [collectionsList, setCollectionsList] = useState<CollectionGroup[]>([
        { id: "col-1", title: "Festive Edit", type: "Automated", rule: "Category equals Festive Edit", productCount: 1 },
        { id: "col-2", title: "Ready to Ship", type: "Automated", rule: "Inventory > 0", productCount: 1 },
        { id: "col-3", title: "New Arrivals", type: "Manual", rule: "Handpicked seasonal ensembles", productCount: 0 }
    ]);
    const [newCollection, setNewCollection] = useState({ title: "", type: "Automated" as "Manual" | "Automated", rule: "" });

    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([
        { id: "po-1", poNumber: "PO-2026-01", supplier: "Varanasi Handloom Weavers Co-op", fabricItem: "Pure Katan Zari Tissue Silk", units: 45, totalCost: 135000, status: "Received", expectedDate: "2026-11-05" },
        { id: "po-2", poNumber: "PO-2026-02", supplier: "Lucknow Chikankari Artisans", fabricItem: "Hand-Embroidered Organza Sets", units: 30, totalCost: 84000, status: "In Transit", expectedDate: "2026-11-18" }
    ]);
    const [poForm, setPoForm] = useState({ supplier: "", fabricItem: "", units: "", totalCost: "", expectedDate: "" });

    const [transfers, setTransfers] = useState<StockTransfer[]>([
        { id: "tr-1", ref: "TR-901", origin: "Varanasi Weaving Workshop", destination: "SANJHHBYAM Primary Atelier", units: 25, status: "Completed" },
        { id: "tr-2", ref: "TR-902", origin: "SANJHHBYAM Primary Atelier", destination: "Lucknow Experience Studio", units: 12, status: "In Transit" }
    ]);
    const [transferForm, setTransferForm] = useState({ origin: "SANJHHBYAM Primary Atelier", destination: "Lucknow Experience Studio", units: "" });

    const [giftCards, setGiftCards] = useState<GiftCardItem[]>([
        { id: "gc-1", code: "SJ-GIFT-8842-ROYAL", initialValue: 5000, balance: 5000, recipientEmail: "patron@sanjhhbyam.com", isActive: true }
    ]);
    const [giftForm, setGiftForm] = useState({ value: "5000", email: "" });

    const [autopilotRules, setAutopilotRules] = useState({
        abandonedCartWhatsapp: true,
        festiveRetargeting: true,
        vipTierUpgrade: false,
        winback60Days: true
    });
    const [campaignForm, setCampaignForm] = useState({ name: "", channel: "WhatsApp Broadcast", budget: "", promoCode: "SANJHH80" });
    const [campaigns, setCampaigns] = useState([
        { id: "cmp-1", name: "Festive Edit 2026 Launch", channel: "Instagram & Meta Ads", budget: 25000, sales: 142000, status: "Active" },
        { id: "cmp-2", name: "VIP Patron Early Access", channel: "WhatsApp Broadcast", budget: 5000, sales: 68500, status: "Completed" }
    ]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [productForm, setProductForm] = useState({
        title: "",
        description: "",
        category: "Festive Edit",
        status: "Active",
        productType: "Luxury Ethnic Wear",
        vendor: "SANJHHBYAM Atelier",
        collections: "Festive Edit 2026",
        tags: "handcrafted, festive, silk",
        themeTemplate: "Default product",
        price: "",
        salePrice: "",
        costPerItem: "",
        chargeTax: true,
        trackInventory: true,
        stockQuantity: "15",
        sku: "",
        barcode: "",
        continueSelling: false,
        isPhysical: true,
        packageType: "SANJHHBYAM Signature Box - 30 x 25 x 5 cm",
        length: "30.0",
        width: "25.0",
        height: "5.0",
        weight: "0.8",
        countryOfOrigin: "India",
        hsCode: "6204",
        sizes: ["XS", "S", "M", "L", "XL"],
        colorOption: "Royal Ivory",
        fabricDisclosure: "100% Pure Handwoven Silk | Dry Clean Only",
        seoTitle: "",
        seoDescription: ""
    });
    const [imageInputs, setImageInputs] = useState<string[]>([""]);
    const [addingPhotoToId, setAddingPhotoToId] = useState<string | null>(null);
    const [newPhotoUrl, setNewPhotoUrl] = useState("");

    const [showComparePrice, setShowComparePrice] = useState(true);
    const [showSkuFields, setShowSkuFields] = useState(false);
    const [showCustomsFields, setShowCustomsFields] = useState(false);
    const [showVariantEditor, setShowVariantEditor] = useState(true);
    const [showSeoEditor, setShowSeoEditor] = useState(false);

    const [promoForm, setPromoForm] = useState({ code: "", discountPercent: "" });
    const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
    const [trackingInputs, setTrackingInputs] = useState<{ [key: string]: { courier: string; code: string } }>({});

    const [settingsSubTab, setSettingsSubTab] = useState<SettingsSectionId>("general");
    const [settingsSearch, setSettingsSearch] = useState("");
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [settingsForm, setSettingsForm] = useState({
        storeName: "SANJHHBYAM",
        legalBusinessName: "SANJHHBYAM Couture Private Limited",
        businessCountry: "India",
        storeEmail: "sanjhhbyam@gmail.com",
        storeWhatsapp: "+91 98765 43210",
        storeAddress: "Primary Atelier, Civil Lines, Pratapgarh / Lucknow, Uttar Pradesh, India",
        currencyDisplay: "Indian Rupee (INR ₹)",
        backupRegion: "India",
        unitSystem: "Metric system",
        defaultWeightUnit: "Kilograms (kg)",
        timeZone: "(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi",
        orderPrefix: "#SJ-",
        orderSuffix: "",

        currentPlan: "Atelier Enterprise OS",
        billingCycle: "Annual (₹ 20 / Trial Active)",
        staffMembers: "sanjhhbyam@gmail.com (Owner), artisan.lead@sanjhhbyam.com (Catalog Manager)",

        razorpayEnabled: true,
        razorpayMode: "Test (Sandbox)",
        razorpayKeyId: "rzp_test_SJ98234791",
        razorpayKeySecret: "hidden_secret_key",
        upiIntentEnabled: true,
        upiVpa: "sanjhhbyam@icici",
        codEnabled: true,
        codMaxCeiling: "50000",
        codFee: "0",

        checkoutContactMethod: "Phone number or email",
        requireFullName: "Require first and last name",
        giftPackagingEnabled: true,
        giftPackagingFee: "250",
        customerSelfReturnEnabled: true,
        otpPasswordlessLogin: true,

        courierPartner: "Shiprocket Aggregator",
        courierApiToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        autoGenerateAwb: true,
        warehouseName: "SANJHHBYAM Primary Atelier",
        warehouseCity: "Lucknow, Uttar Pradesh",
        warehousePin: "226001",
        secondaryLocation: "Varanasi Handloom Weaving Hub (221001)",
        freeShippingThreshold: "2999",
        standardRate: "0",
        standardDays: "4-6 business days",
        expressRate: "250",
        expressDays: "1-2 business days",

        gstin: "09AABCS1429B1Z1",
        apparelGstSlab: "12",
        pricesIncludeTax: true,
        defaultHsn: "6204",

        primaryDomain: "sanjhhbyam.com",
        whatsappProvider: "Interakt Official API",
        metaPixelId: "1049283749201",
        ga4Id: "G-SANJHH2026",
        returnWindowDays: "7",
        returnPolicyText: "Eligible unworn items with original tags intact qualify for a 7-day return or size exchange.",
        shippingPolicyText: "All ready-to-ship ensembles are dispatched within 24-48 hours via insured air couriers.",
        pinnedMetafields: "Zari Purity, Weave Origin, Blouse Piece Included, Wash Care",
        primaryLanguage: "English (India)",
        hindiEnabled: true,
        cookieBannerEnabled: true
    });

    const [sidekickInput, setSidekickInput] = useState("");
    const [sidekickReply, setSidekickReply] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setIsCheckingAuth(false);
                await fetchAllData();
            } else {
                router.push("/admin/login");
            }
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                const input = document.getElementById("studio-command-search");
                if (input) input.focus();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const fetchAllData = async () => {
        setIsLoadingData(true);
        try {
            const ordersSnap = await getDocs(collection(db, "orders"));
            const fetchedOrders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[];
            fetchedOrders.sort((a, b) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0));
            setOrders(fetchedOrders);

            const productsSnap = await getDocs(collection(db, "products"));
            setProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[]);

            const usersSnap = await getDocs(collection(db, "users"));
            setCustomers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as UserProfile[]);

            const promosSnap = await getDocs(collection(db, "promos"));
            setPromos(promosSnap.docs.map(d => ({ id: d.id, ...d.data() })) as PromoCode[]);

            const ticketsSnap = await getDocs(collection(db, "tickets"));
            setTickets(ticketsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as SupportTicket[]);

            const settingsSnap = await getDoc(doc(db, "settings", "store_config"));
            if (settingsSnap.exists()) {
                setSettingsForm(prev => ({ ...prev, ...(settingsSnap.data() as typeof prev) }));
            }
        } catch (error) {
            console.error("Error fetching admin data:", error);
        } finally {
            setIsLoadingData(false);
        }
    };

    const handleSignOut = async () => {
        await signOut(auth);
        router.push("/admin/login");
    };

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        await updateDoc(doc(db, "orders", orderId), { status: newStatus });
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        showToast(`Order #${orderId.slice(0, 6)} marked as ${newStatus}`);
    };

    const handleTrackingUpdate = async (orderId: string) => {
        const currentOrder = orders.find(o => o.id === orderId);
        const courierName = trackingInputs[orderId]?.courier ?? currentOrder?.courierName ?? "BlueDart";
        const trackingId = trackingInputs[orderId]?.code ?? currentOrder?.trackingId ?? "";
        await updateDoc(doc(db, "orders", orderId), { courierName, trackingId });
        setOrders(orders.map(o => o.id === orderId ? { ...o, courierName, trackingId } : o));
        showToast(`Tracking saved: ${courierName} (${trackingId})`);
    };

    const handleReturnDecision = async (orderId: string, decision: string) => {
        await updateDoc(doc(db, "orders", orderId), { returnStatus: decision });
        setOrders(orders.map(o => o.id === orderId ? { ...o, returnStatus: decision } : o));
        showToast(`Return status updated to: ${decision}`);
    };

    const handleReplyTicket = async (ticketId: string) => {
        const reply = replyText[ticketId];
        if (!reply) return;
        await updateDoc(doc(db, "tickets", ticketId), { adminReply: reply, status: "Resolved" });
        setTickets(tickets.map(t => t.id === ticketId ? { ...t, adminReply: reply, status: "Resolved" } : t));
        showToast("Support reply sent to patron!");
    };

    const handleImageSlotChange = (index: number, value: string) => {
        const updated = [...imageInputs];
        updated[index] = value;
        setImageInputs(updated);
    };
    const addImageSlot = () => setImageInputs([...imageInputs, ""]);
    const removeImageSlot = (index: number) => {
        if (imageInputs.length === 1) return;
        setImageInputs(imageInputs.filter((_, idx) => idx !== index));
    };

    const toggleSizeSelection = (size: string) => {
        setProductForm(prev => ({
            ...prev,
            sizes: prev.sizes.includes(size) ? prev.sizes.filter(s => s !== size) : [...prev.sizes, size]
        }));
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage("");
        try {
            const validImages = imageInputs.map(u => u.trim()).filter(Boolean);
            const regularPrice = Number(productForm.price.replace(/,/g, "")) || 0;
            const discountedPrice = productForm.salePrice ? Number(productForm.salePrice.replace(/,/g, "")) : null;

            const newProduct = {
                title: productForm.title,
                description: productForm.description,
                category: productForm.category,
                status: productForm.status,
                inStock: productForm.status === "Active" && (Number(productForm.stockQuantity) > 0 || productForm.continueSelling),
                price: regularPrice,
                salePrice: discountedPrice,
                costPerItem: productForm.costPerItem ? Number(productForm.costPerItem) : null,
                chargeTax: productForm.chargeTax,
                trackInventory: productForm.trackInventory,
                stockQuantity: Number(productForm.stockQuantity) || 0,
                sku: productForm.sku || `SJ-${Math.floor(10000 + Math.random() * 89999)}`,
                barcode: productForm.barcode,
                shipping: {
                    isPhysical: productForm.isPhysical,
                    packageType: productForm.packageType,
                    dimensionsCm: { l: productForm.length, w: productForm.width, h: productForm.height },
                    weightKg: productForm.weight,
                    countryOfOrigin: productForm.countryOfOrigin,
                    hsCode: productForm.hsCode
                },
                organization: {
                    productType: productForm.productType,
                    vendor: productForm.vendor,
                    collections: productForm.collections,
                    tags: productForm.tags.split(",").map(t => t.trim()).filter(Boolean),
                    themeTemplate: productForm.themeTemplate
                },
                images: validImages.length > 0 ? validImages : ["https://images.unsplash.com/photo-1490481651871-ab68de25d43d"],
                sizes: productForm.sizes.length > 0 ? productForm.sizes : ["XS", "S", "M", "L", "XL"],
                colorOption: productForm.colorOption,
                fabricDisclosure: productForm.fabricDisclosure,
                seo: {
                    title: productForm.seoTitle || productForm.title,
                    description: productForm.seoDescription || productForm.description.slice(0, 155)
                },
                createdAt: new Date()
            };

            const docRef = await addDoc(collection(db, "products"), newProduct);
            setProducts([{ id: docRef.id, ...newProduct } as unknown as Product, ...products]);
            setMessage("Creation saved and published to SANJHHBYAM storefront!");
            showToast(`Published "${productForm.title}" to storefront!`);
            setImageInputs([""]);
        } catch {
            setMessage("Error saving product.");
            showToast("Failed to save product", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAppendPhoto = async (product: Product) => {
        if (!newPhotoUrl.trim()) return;
        const updatedImages = [...(product.images || []), newPhotoUrl.trim()];
        await updateDoc(doc(db, "products", product.id), { images: updatedImages });
        setProducts(products.map(p => p.id === product.id ? { ...p, images: updatedImages } : p));
        setNewPhotoUrl("");
        setAddingPhotoToId(null);
        showToast(`Added new angle to "${product.title}"`);
    };

    const requestDeleteProduct = (product: Product) => {
        setConfirmModal({
            isOpen: true,
            title: `Delete "${product.title}"?`,
            description: "This creation and its gallery angles will be permanently removed from your storefront catalog. This action cannot be undone.",
            confirmLabel: "Delete product",
            onConfirm: async () => {
                await deleteDoc(doc(db, "products", product.id));
                setProducts(prev => prev.filter(p => p.id !== product.id));
                setSelectedProductIds(prev => prev.filter(id => id !== product.id));
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                showToast(`Deleted "${product.title}" from catalog`, "info");
            }
        });
    };

    const handleBulkStatusUpdate = async (inStockState: boolean) => {
        for (const id of selectedProductIds) {
            await updateDoc(doc(db, "products", id), { inStock: inStockState });
        }
        setProducts(prev => prev.map(p => selectedProductIds.includes(p.id) ? { ...p, inStock: inStockState } : p));
        showToast(`Updated ${selectedProductIds.length} product(s) to ${inStockState ? "Active" : "Draft"}`);
        setSelectedProductIds([]);
    };

    const handleBulkDelete = () => {
        setConfirmModal({
            isOpen: true,
            title: `Delete ${selectedProductIds.length} selected product(s)?`,
            description: "All selected creations will be permanently removed from your Firebase catalog.",
            confirmLabel: `Delete ${selectedProductIds.length} products`,
            onConfirm: async () => {
                for (const id of selectedProductIds) {
                    await deleteDoc(doc(db, "products", id));
                }
                setProducts(prev => prev.filter(p => !selectedProductIds.includes(p.id)));
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                showToast(`Deleted ${selectedProductIds.length} product(s)`, "info");
                setSelectedProductIds([]);
            }
        });
    };

    const handleToggleStock = async (id: string, currentStatus: boolean) => {
        await updateDoc(doc(db, "products", id), { inStock: !currentStatus });
        setProducts(products.map(p => p.id === id ? { ...p, inStock: !currentStatus } : p));
        showToast(`Stock status switched to ${!currentStatus ? "In Stock" : "Out of Stock"}`);
    };

    const handleUpdateStockQty = async (id: string, qty: number) => {
        await updateDoc(doc(db, "products", id), { stockQuantity: qty, inStock: qty > 0 });
        setProducts(products.map(p => p.id === id ? { ...p, stockQuantity: qty, inStock: qty > 0 } : p));
        showToast(`Inventory updated to ${qty} units`);
    };

    const handleAddPromo = async (e: React.FormEvent) => {
        e.preventDefault();
        const newPromo = { code: promoForm.code.toUpperCase(), discountPercent: Number(promoForm.discountPercent), isActive: true };
        const docRef = await addDoc(collection(db, "promos"), newPromo);
        setPromos([...promos, { id: docRef.id, ...newPromo }]);
        setPromoForm({ code: "", discountPercent: "" });
        showToast(`Activated coupon ${newPromo.code} (${newPromo.discountPercent}% OFF)`);
    };

    const handleTogglePromo = async (id: string, currentStatus: boolean) => {
        await updateDoc(doc(db, "promos", id), { isActive: !currentStatus });
        setPromos(promos.map(p => p.id === id ? { ...p, isActive: !currentStatus } : p));
        showToast("Coupon status updated");
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingSettings(true);
        try {
            await setDoc(doc(db, "settings", "store_config"), { ...settingsForm, updatedAt: new Date() }, { merge: true });
            showToast("Studio settings synced to Firebase!");
        } catch {
            showToast("Failed to save settings", "error");
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleSidekickAction = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sidekickInput.trim()) return;
        const q = sidekickInput.toLowerCase();
        if (q.includes("product") || q.includes("add") || q.includes("upload")) {
            switchTab("add-product");
            setSidekickReply("Opened the 2-Column Product Creator for you.");
        } else if (q.includes("order") || q.includes("ship") || q.includes("track")) {
            switchTab("orders");
            setSidekickReply(`Switched to Orders. You have ${pendingOrdersCount} order(s) awaiting dispatch.`);
        } else if (q.includes("analytic") || q.includes("sale") || q.includes("revenue")) {
            switchTab("analytics");
            setSidekickReply(`Opened Analytics. Net revenue is ₹ ${formatPrice(totalRevenue)}.`);
        } else if (q.includes("setting") || q.includes("payment") || q.includes("razorpay") || q.includes("courier") || q.includes("general")) {
            switchTab("settings");
            setSidekickReply("Opened the 19-Module Studio Settings.");
        } else {
            setSidekickReply(`Studio Summary: ${products.length} products live, ${orders.length} orders, ₹${formatPrice(totalRevenue)} net sales.`);
        }
        setSidekickInput("");
    };

    const formatPrice = (amount: number) => new Intl.NumberFormat("en-IN").format(Math.round(amount));
    const formatDate = (timestamp: Timestamp) =>
        timestamp?.toDate ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(timestamp.toDate()) : "Recent";

    const validOrders = orders.filter(o => o.status !== "Cancelled");
    const grossSales = validOrders.reduce((s, o) => s + (o.subTotal || o.totalAmount), 0);
    const totalDiscounts = validOrders.reduce((s, o) => s + (o.discountAmount || 0), 0);
    const totalReturnsVal = orders.filter(o => o.returnStatus === "Refund Processed").reduce((s, o) => s + o.totalAmount, 0);
    const totalShippingCharges = validOrders.reduce((s, o) => s + (o.shippingFee || 0), 0);
    const totalTaxes = validOrders.reduce((s, o) => {
        const fallbackTax = Math.round(o.totalAmount / (100 / 12));
        return s + (o.taxAmount ?? fallbackTax);
    }, 0);
    const totalRevenue = validOrders.reduce((s, o) => s + o.totalAmount, 0);
    const combinedDeductions = totalDiscounts + totalReturnsVal;
    const netSales = Math.max(0, grossSales - combinedDeductions);
    const aov = validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;

    const fulfilledOrdersCount = orders.filter(o => o.status === "Delivered").length;
    const pendingOrdersCount = orders.filter(o => o.status === "Confirmed" || o.status === "Packed").length;
    const pendingReturnsCount = orders.filter(o => o.status === "Return Requested").length;
    const openTicketsCount = tickets.filter(t => t.status === "Open").length;

    const filteredProducts = products
        .filter(p => productCategoryFilter === "All" || (productCategoryFilter === "Out of Stock" ? !p.inStock : p.category === productCategoryFilter))
        .filter(p => p.title.toLowerCase().includes(globalSearch.toLowerCase()) || p.category.toLowerCase().includes(globalSearch.toLowerCase()));

    const settingsMenuList: { id: SettingsSectionId; label: string; icon: typeof Settings }[] = [
        { id: "general", label: "General", icon: Home },
        { id: "plan", label: "Plan", icon: Award },
        { id: "billing", label: "Billing", icon: CreditCard },
        { id: "users", label: "Users", icon: Users },
        { id: "payments", label: "Payments", icon: CreditCard },
        { id: "checkout", label: "Checkout", icon: ClipboardList },
        { id: "customer-accounts", label: "Customer accounts", icon: Users },
        { id: "shipping", label: "Shipping and delivery", icon: Truck },
        { id: "taxes", label: "Taxes and duties", icon: ShieldCheck },
        { id: "locations", label: "Locations", icon: MapPin },
        { id: "markets", label: "Markets", icon: Globe },
        { id: "apps", label: "Apps", icon: Layers },
        { id: "sales-channels", label: "Sales channels", icon: ArrowUpRight },
        { id: "domains", label: "Domains", icon: Globe },
        { id: "customer-events", label: "Customer events", icon: Sparkles },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "metafields", label: "Metafields and metaobjects", icon: Database },
        { id: "languages", label: "Languages", icon: Languages },
        { id: "privacy", label: "Customer privacy", icon: Lock }
    ];

    const filteredSettingsMenu = settingsMenuList.filter(item =>
        item.label.toLowerCase().includes(settingsSearch.toLowerCase())
    );

    if (isCheckingAuth) {
        return (
            <div className="min-h-screen w-full bg-[#121212] flex items-center justify-center text-white">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            </div>
        );
    }

    return (
        <div id="sanjhhbyam-studio-root" className="min-h-screen w-full bg-[#121212] text-zinc-900 font-sans">
            <style>{`
        body > header, body > nav, body > footer,
        body > div > header, body > div > nav, body > div > footer {
          display: none !important;
        }
        html, body {
          overflow-y: auto !important;
          overflow-x: hidden !important;
          height: auto !important;
          background-color: #121212 !important;
        }
      `}</style>

            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
                    <div className="bg-white border border-zinc-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 flex-none">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-bold text-zinc-900">{confirmModal.title}</h3>
                            </div>
                            <button
                                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                                className="text-zinc-400 hover:text-zinc-700 p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-xs text-zinc-600 leading-relaxed">{confirmModal.description}</p>
                        <div className="flex justify-end gap-2.5 pt-2 border-t border-zinc-100">
                            <button
                                type="button"
                                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                                className="px-4 py-2 rounded-lg border border-zinc-300 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmModal.onConfirm}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 shadow-xs"
                            >
                                {confirmModal.confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium border animate-in slide-in-from-bottom-2 ${
                            t.type === "error"
                                ? "bg-red-950 text-red-100 border-red-800"
                                : "bg-[#18181b] text-white border-zinc-700"
                        }`}
                    >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-none" />
                        <span>{t.text}</span>
                    </div>
                ))}
            </div>

            <aside className="fixed top-0 left-0 bottom-0 z-40 w-64 bg-[#121212] text-zinc-400 hidden md:flex flex-col justify-between px-3 py-4 select-none border-r border-zinc-800/80">
                {activeTab === "settings" ? (
                    <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 space-y-4 pr-1">
                        <button
                            onClick={() => switchTab("overview")}
                            className="flex items-center gap-2 text-xs font-semibold text-zinc-200 hover:text-white px-2 py-1"
                        >
                            <span>&lsaquo;</span> <span>Settings</span>
                        </button>

                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                                type="text"
                                value={settingsSearch}
                                onChange={e => setSettingsSearch(e.target.value)}
                                placeholder="Search settings"
                                className="w-full bg-[#1e1e1e] text-zinc-200 placeholder-zinc-500 text-xs rounded-lg pl-8 pr-3 py-1.5 border border-zinc-800 focus:border-zinc-600 outline-none"
                            />
                        </div>

                        <div className="px-2 py-1.5 flex items-center justify-between border-b border-zinc-800/80 pb-3">
                            <div>
                                <p className="text-xs font-semibold text-white">{settingsForm.storeName}</p>
                                <p className="text-[11px] text-zinc-500">{settingsForm.primaryDomain}</p>
                            </div>
                            <span className="w-6 h-6 rounded bg-emerald-500 text-black font-bold text-[10px] flex items-center justify-center">MS</span>
                        </div>

                        <nav className="space-y-0.5 text-xs pb-4">
                            {filteredSettingsMenu.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setSettingsSubTab(item.id);
                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
                                        settingsSubTab === item.id ? "bg-[#262626] text-white font-semibold" : "hover:bg-[#1b1b1b] text-zinc-400 hover:text-zinc-200"
                                    }`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    <span className="truncate">{item.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 space-y-4 pr-1">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 font-serif font-bold text-sm">
                                    S
                                </div>
                                <div>
                                    <p className="text-white text-xs font-semibold tracking-wider">SANJHHBYAM</p>
                                    <p className="text-[10px] text-zinc-500">Atelier Studio OS</p>
                                </div>
                            </div>
                            <Link href="/" target="_blank" title="View Live Store" className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                                <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                                id="studio-command-search"
                                type="text"
                                value={globalSearch}
                                onChange={(e) => setGlobalSearch(e.target.value)}
                                placeholder="Search"
                                className="w-full bg-[#1e1e1e] text-zinc-200 placeholder-zinc-500 text-xs rounded-lg pl-8 pr-12 py-1.5 border border-zinc-800 focus:border-zinc-600 outline-none transition-colors"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
                Ctrl K
              </span>
                        </div>

                        <nav className="space-y-0.5 text-xs">
                            <button
                                onClick={() => switchTab("overview")}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${activeTab === "overview" ? "bg-[#262626] text-white font-medium" : "hover:bg-[#1b1b1b] hover:text-zinc-200"}`}
                            >
                                <Home className="w-4 h-4" /> <span>Home</span>
                            </button>

                            <button
                                onClick={() => switchTab("orders")}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${activeTab === "orders" ? "bg-[#262626] text-white font-medium" : "hover:bg-[#1b1b1b] hover:text-zinc-200"}`}
                            >
                                <div className="flex items-center gap-2.5"><ClipboardList className="w-4 h-4" /> <span>Orders</span></div>
                                {pendingOrdersCount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold">{pendingOrdersCount}</span>}
                            </button>

                            <div>
                                <button
                                    onClick={() => {
                                        setOpenMenus(prev => ({ ...prev, products: !prev.products }));
                                        switchTab("inventory");
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                                        ["inventory", "add-product", "collections", "stock-control", "purchase-orders", "transfers", "gift-cards"].includes(activeTab)
                                            ? "bg-[#262626] text-white font-medium"
                                            : "hover:bg-[#1b1b1b] hover:text-zinc-200"
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5"><Package className="w-4 h-4" /> <span>Products</span></div>
                                    {openMenus.products ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
                                </button>

                                {openMenus.products && (
                                    <div className="pl-7 pr-2 py-1 space-y-0.5 border-l border-zinc-800 ml-4 mt-0.5">
                                        {[
                                            { id: "inventory", label: "All products" },
                                            { id: "add-product", label: "Add product" },
                                            { id: "collections", label: "Collections" },
                                            { id: "stock-control", label: "Inventory" },
                                            { id: "purchase-orders", label: "Purchase orders" },
                                            { id: "transfers", label: "Transfers" },
                                            { id: "gift-cards", label: "Gift cards" }
                                        ].map(sub => (
                                            <button
                                                key={sub.id}
                                                onClick={() => switchTab(sub.id)}
                                                className={`w-full text-left px-2.5 py-1.5 rounded-md text-[11px] transition-colors ${
                                                    activeTab === sub.id ? "text-white font-semibold bg-zinc-800/70" : "text-zinc-400 hover:text-zinc-200"
                                                }`}
                                            >
                                                {sub.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => switchTab("customers")}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${activeTab === "customers" ? "bg-[#262626] text-white font-medium" : "hover:bg-[#1b1b1b] hover:text-zinc-200"}`}
                            >
                                <Users className="w-4 h-4" /> <span>Customers</span>
                            </button>

                            <div>
                                <button
                                    onClick={() => {
                                        setOpenMenus(prev => ({ ...prev, growth: !prev.growth }));
                                        switchTab("growth");
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                                        ["growth", "attribution", "autopilot", "campaigns"].includes(activeTab)
                                            ? "bg-[#262626] text-white font-medium"
                                            : "hover:bg-[#1b1b1b] hover:text-zinc-200"
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5"><TrendingUp className="w-4 h-4" /> <span>Growth</span></div>
                                    {openMenus.growth ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
                                </button>

                                {openMenus.growth && (
                                    <div className="pl-7 pr-2 py-1 space-y-0.5 border-l border-zinc-800 ml-4 mt-0.5">
                                        {[
                                            { id: "attribution", label: "Attribution" },
                                            { id: "autopilot", label: "Autopilot" },
                                            { id: "campaigns", label: "Campaigns" }
                                        ].map(sub => (
                                            <button
                                                key={sub.id}
                                                onClick={() => switchTab(sub.id)}
                                                className={`w-full text-left px-2.5 py-1.5 rounded-md text-[11px] transition-colors ${
                                                    activeTab === sub.id ? "text-white font-semibold bg-zinc-800/70" : "text-zinc-400 hover:text-zinc-200"
                                                }`}
                                            >
                                                {sub.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => switchTab("promos")}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${activeTab === "promos" ? "bg-[#262626] text-white font-medium" : "hover:bg-[#1b1b1b] hover:text-zinc-200"}`}
                            >
                                <Tag className="w-4 h-4" /> <span>Discounts</span>
                            </button>

                            <button
                                onClick={() => switchTab("content")}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${activeTab === "content" ? "bg-[#262626] text-white font-medium" : "hover:bg-[#1b1b1b] hover:text-zinc-200"}`}
                            >
                                <FileText className="w-4 h-4" /> <span>Content</span>
                            </button>

                            <button
                                onClick={() => switchTab("markets")}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${activeTab === "markets" ? "bg-[#262626] text-white font-medium" : "hover:bg-[#1b1b1b] hover:text-zinc-200"}`}
                            >
                                <Globe className="w-4 h-4" /> <span>Markets</span>
                            </button>

                            <div>
                                <button
                                    onClick={() => {
                                        setOpenMenus(prev => ({ ...prev, analytics: !prev.analytics }));
                                        switchTab("analytics");
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                                        ["analytics", "reports", "live-view"].includes(activeTab)
                                            ? "bg-[#262626] text-white font-medium"
                                            : "hover:bg-[#1b1b1b] hover:text-zinc-200"
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5"><BarChart3 className="w-4 h-4" /> <span>Analytics</span></div>
                                    {openMenus.analytics ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
                                </button>

                                {openMenus.analytics && (
                                    <div className="pl-7 pr-2 py-1 space-y-0.5 border-l border-zinc-800 ml-4 mt-0.5">
                                        {[
                                            { id: "reports", label: "Reports" },
                                            { id: "live-view", label: "Live View" }
                                        ].map(sub => (
                                            <button
                                                key={sub.id}
                                                onClick={() => switchTab(sub.id)}
                                                className={`w-full text-left px-2.5 py-1.5 rounded-md text-[11px] transition-colors ${
                                                    activeTab === sub.id ? "text-white font-semibold bg-zinc-800/70" : "text-zinc-400 hover:text-zinc-200"
                                                }`}
                                            >
                                                {sub.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => switchTab("returns")}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${activeTab === "returns" ? "bg-[#262626] text-white font-medium" : "hover:bg-[#1b1b1b] hover:text-zinc-200"}`}
                            >
                                <div className="flex items-center gap-2.5"><RotateCcw className="w-4 h-4" /> <span>Returns</span></div>
                                {pendingReturnsCount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">{pendingReturnsCount}</span>}
                            </button>

                            <button
                                onClick={() => switchTab("tickets")}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${activeTab === "tickets" ? "bg-[#262626] text-white font-medium" : "hover:bg-[#1b1b1b] hover:text-zinc-200"}`}
                            >
                                <div className="flex items-center gap-2.5"><HelpCircle className="w-4 h-4" /> <span>Support Desk</span></div>
                                {openTicketsCount > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">{openTicketsCount}</span>}
                            </button>
                        </nav>

                        <div className="pt-3 border-t border-zinc-800/80 space-y-1 pb-4">
                            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Sales channels &rsaquo;</p>
                            <Link href="/" target="_blank" className="w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg hover:bg-[#1b1b1b] text-zinc-300">
                                <span className="flex items-center gap-2.5"><Layers className="w-3.5 h-3.5 text-emerald-400" /> Online Store</span>
                                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
                            </Link>
                            <button onClick={() => switchTab("autopilot")} className="w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg hover:bg-[#1b1b1b] text-zinc-300">
                                <span className="flex items-center gap-2.5"><Sparkles className="w-3.5 h-3.5 text-amber-400" /> Agentic AI</span>
                            </button>
                        </div>
                    </div>
                )}

                <div className="pt-3 border-t border-zinc-800 space-y-1.5 flex-none">
                    <button
                        onClick={() => switchTab("settings")}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
                            activeTab === "settings" ? "bg-[#262626] text-white font-semibold" : "text-zinc-300 hover:bg-[#1b1b1b]"
                        }`}
                    >
                        <Settings className="w-4 h-4 text-zinc-400" />
                        <span>Settings</span>
                    </button>

                    <div className="px-3 py-2 rounded-lg bg-[#1a1a1a] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-emerald-500 text-black font-bold text-[10px] flex items-center justify-center">SA</span>
                            <div className="leading-tight">
                                <p className="text-[11px] text-zinc-200 font-medium">sanjhhbyam Admin</p>
                                <p className="text-[9px] text-zinc-500 truncate w-28">{settingsForm.storeEmail}</p>
                            </div>
                        </div>
                        <button onClick={handleSignOut} title="Sign Out" className="text-xs text-red-400 hover:text-red-300">
                            <LogOut className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </aside>

            <div className="md:pl-64 min-h-screen w-full bg-[#121212]">
                <div className="min-h-[calc(100vh-16px)] bg-[#FAF9F6] md:my-2 md:mr-2 md:rounded-2xl border border-zinc-200/80 relative">

                    <div className="md:hidden bg-[#121212] text-white px-4 py-3 flex justify-between items-center sticky top-0 z-20">
                        <span className="font-serif text-sm tracking-wider">SANJHHBYAM Studio</span>
                        <div className="flex gap-1.5 overflow-x-auto">
                            <button onClick={() => switchTab("overview")} className="text-xs px-2 py-1 bg-zinc-800 rounded">Home</button>
                            <button onClick={() => switchTab("inventory")} className="text-xs px-2 py-1 bg-zinc-800 rounded">Products</button>
                            <button onClick={() => switchTab("analytics")} className="text-xs px-2 py-1 bg-zinc-800 rounded">Analytics</button>
                            <button onClick={() => switchTab("settings")} className="text-xs px-2 py-1 bg-zinc-800 rounded">Settings</button>
                        </div>
                    </div>

                    <main className="max-w-5xl w-full mx-auto px-6 py-8 md:py-10 pb-32">
                        {isLoadingData ? (
                            <div className="py-32 flex justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-zinc-700" />
                            </div>
                        ) : (
                            <>
                                {activeTab === "overview" && (
                                    <div className="space-y-10 animate-in fade-in duration-300">
                                        <div className="flex items-center justify-between">
                                            <div className="inline-flex items-center gap-2 bg-white border border-zinc-200 px-3 py-1 rounded-full text-xs text-zinc-600 shadow-2xs">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <span>Festive Edit 2026 is Live | {products.length} Active Creations</span>
                                            </div>
                                            <Link href="/" target="_blank" className="text-xs font-medium text-zinc-700 hover:text-black flex items-center gap-1 underline underline-offset-4">
                                                Open Storefront <ArrowUpRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>

                                        <div className="text-center max-w-2xl mx-auto space-y-6 pt-2">
                                            <div>
                                                <h1 className="text-3xl md:text-4xl font-serif text-zinc-900">Welcome to SANJHHBYAM Studio</h1>
                                                <p className="text-sm text-zinc-500 mt-1.5">Craft your luxury catalog, manage multi-angle lookbooks, and fulfill patron orders.</p>
                                            </div>

                                            <div className="bg-white border border-zinc-200/90 rounded-2xl p-4 shadow-sm text-left">
                                                <div className="flex items-center gap-3 border-b border-zinc-100 pb-3">
                                                    <Sparkles className="w-4 h-4 text-amber-600 flex-none" />
                                                    <input
                                                        type="text"
                                                        value={globalSearch}
                                                        onChange={(e) => setGlobalSearch(e.target.value)}
                                                        placeholder="Help me find products, orders, or configure studio settings..."
                                                        className="w-full text-sm text-zinc-800 placeholder-zinc-400 outline-none bg-transparent"
                                                    />
                                                    {globalSearch && (
                                                        <button onClick={() => switchTab("inventory")} className="text-xs bg-zinc-900 text-white px-3 py-1 rounded-lg">Search</button>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 text-xs text-zinc-500">
                                                    <div className="flex flex-wrap gap-2">
                                                        <button onClick={() => switchTab("add-product")} className="px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium">+ Add product</button>
                                                        <button onClick={() => switchTab("analytics")} className="px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium">View Analytics</button>
                                                        <button onClick={() => switchTab("settings")} className="px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium">Studio Settings</button>
                                                    </div>
                                                    <span className="text-[11px] text-zinc-400 font-mono">Recents +</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                                                <div>
                                                    <div className="h-36 rounded-xl bg-gradient-to-br from-amber-50 via-stone-100 to-zinc-100 border border-zinc-200/60 mb-5 flex items-center justify-center">
                                                        <div className="flex items-center gap-2">
                                                            {products[0]?.images?.[0] && (
                                                                <img src={products[0].images[0]} alt="" className="w-20 h-24 object-cover rounded-lg shadow-md border-2 border-white -rotate-6" />
                                                            )}
                                                            <div className="w-20 h-24 rounded-lg bg-white border border-dashed border-zinc-300 flex flex-col items-center justify-center text-zinc-400 shadow-sm rotate-3">
                                                                <Plus className="w-5 h-5 text-zinc-700" />
                                                                <span className="text-[10px] mt-1 font-medium">Multi-View</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <h3 className="text-base font-semibold text-zinc-900">Add your first product</h3>
                                                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Start with a title, price, and multi-angle photos. Manage variants and inventory easily.</p>
                                                </div>
                                                <div className="pt-5 flex gap-2">
                                                    <button onClick={() => switchTab("add-product")} className="bg-zinc-900 text-white text-xs font-medium px-4 py-2 rounded-lg">Add product</button>
                                                    <button onClick={() => switchTab("inventory")} className="border border-zinc-200 text-zinc-700 text-xs font-medium px-4 py-2 rounded-lg">Catalog ({products.length})</button>
                                                </div>
                                            </div>

                                            <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                                                <div>
                                                    <div className="h-36 rounded-xl bg-gradient-to-br from-zinc-100 via-stone-50 to-emerald-50/60 border border-zinc-200/60 mb-5 p-4 flex flex-col justify-center">
                                                        <div className="bg-white rounded-lg p-3 shadow-xs border border-zinc-100 flex items-center justify-between">
                                                            <div className="flex items-center gap-2.5">
                                                                <Truck className="w-5 h-5 text-emerald-600" />
                                                                <div>
                                                                    <p className="text-xs font-semibold text-zinc-900">{orders.length} Total Orders</p>
                                                                    <p className="text-[10px] text-zinc-500">{pendingOrdersCount} awaiting dispatch</p>
                                                                </div>
                                                            </div>
                                                            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">Live</span>
                                                        </div>
                                                    </div>
                                                    <h3 className="text-base font-semibold text-zinc-900">Fulfill &amp; Track Shipments</h3>
                                                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Assign Shiprocket/BlueDart AWB numbers and update live 6-stage tracking timelines.</p>
                                                </div>
                                                <div className="pt-5">
                                                    <button onClick={() => switchTab("orders")} className="border border-zinc-300 text-zinc-900 text-xs font-medium px-4 py-2 rounded-lg">Manage Orders</button>
                                                </div>
                                            </div>

                                            <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                                                <div>
                                                    <div className="h-36 rounded-xl bg-gradient-to-br from-indigo-50/50 via-white to-amber-50/50 border border-zinc-200/60 mb-5 p-4 flex items-center justify-center gap-3">
                                                        <div className="bg-white border border-zinc-200 rounded-lg px-3 py-2 shadow-2xs text-center">
                                                            <p className="text-[10px] font-bold tracking-wider text-emerald-700">UPI &amp; VISA</p>
                                                            <p className="text-[10px] text-zinc-400">{settingsForm.razorpayEnabled ? "Active" : "Paused"}</p>
                                                        </div>
                                                        <div className="bg-zinc-900 text-white rounded-lg px-3 py-2 shadow-sm text-center">
                                                            <p className="text-[10px] font-mono font-bold text-amber-300">{settingsForm.courierPartner.split(" ")[0]}</p>
                                                            <p className="text-[10px] text-zinc-300">Logistics</p>
                                                        </div>
                                                    </div>
                                                    <h3 className="text-base font-semibold text-zinc-900">Set up payments &amp; delivery</h3>
                                                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">Configure Razorpay UPI/Cards, Cash on Delivery limits, and courier partners.</p>
                                                </div>
                                                <div className="pt-5">
                                                    <button onClick={() => { switchTab("settings"); setSettingsSubTab("payments"); }} className="border border-zinc-300 text-zinc-900 text-xs font-medium px-4 py-2 rounded-lg">Activate payments</button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                                            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs">
                                                <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Net Revenue</p>
                                                <p className="text-2xl font-serif text-zinc-900 mt-1">₹ {formatPrice(totalRevenue)}</p>
                                            </div>
                                            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs">
                                                <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Total Orders</p>
                                                <p className="text-2xl font-serif text-zinc-900 mt-1">{orders.length}</p>
                                            </div>
                                            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs">
                                                <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Registered Patrons</p>
                                                <p className="text-2xl font-serif text-zinc-900 mt-1">{customers.length}</p>
                                            </div>
                                            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs">
                                                <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-medium">Open Support</p>
                                                <p className="text-2xl font-serif text-zinc-900 mt-1">{openTicketsCount}</p>
                                            </div>
                                        </div>

                                        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-sm font-semibold text-zinc-900">Recent Patron Orders</h3>
                                                <button onClick={() => switchTab("orders")} className="text-xs text-zinc-600 underline">
                                                    View All ({orders.length})
                                                </button>
                                            </div>
                                            {orders.length === 0 ? (
                                                <p className="text-xs text-zinc-500">No orders placed yet.</p>
                                            ) : (
                                                <div className="divide-y divide-zinc-100 text-xs">
                                                    {orders.slice(0, 5).map(o => (
                                                        <div key={o.id} className="py-3 flex justify-between items-center">
                                                            <div>
                                                                <p className="font-mono font-semibold text-zinc-900">#{o.id.slice(0, 8)}</p>
                                                                <p className="text-zinc-500">{o.userEmail} | {formatDate(o.createdAt)}</p>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-semibold">₹ {formatPrice(o.totalAmount)}</span>
                                                                <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-800 font-medium">{o.status}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === "inventory" && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div className="flex flex-wrap justify-between items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <Package className="w-5 h-5 text-zinc-700" />
                                                <h1 className="text-xl font-bold text-zinc-900">Products</h1>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => showToast(`Exported ${products.length} product(s) to CSV`)}
                                                    className="px-3.5 py-1.5 rounded-lg border border-zinc-300 bg-white text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                                                >
                                                    Export
                                                </button>
                                                <button
                                                    onClick={() => switchTab("add-product")}
                                                    className="bg-zinc-900 text-white px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                                                >
                                                    <Plus className="w-3.5 h-3.5" /> Add product
                                                </button>
                                            </div>
                                        </div>

                                        {selectedProductIds.length > 0 && (
                                            <div className="bg-zinc-900 text-white px-4 py-2.5 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
                                                <span className="font-medium">{selectedProductIds.length} product(s) selected</span>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleBulkStatusUpdate(true)} className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700">Set Active</button>
                                                    <button onClick={() => handleBulkStatusUpdate(false)} className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700">Set Draft</button>
                                                    <button onClick={handleBulkDelete} className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 font-semibold">Delete Selected</button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xs">
                                            <div className="p-3 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3">
                                                <div className="flex items-center gap-1">
                                                    {["All", "Festive Edit", "Ready to Ship", "New Arrivals", "Out of Stock"].map(tab => (
                                                        <button
                                                            key={tab}
                                                            onClick={() => setProductCategoryFilter(tab)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                                                productCategoryFilter === tab ? "bg-zinc-100 text-zinc-900 font-semibold" : "text-zinc-500 hover:bg-zinc-50"
                                                            }`}
                                                        >
                                                            {tab}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="relative w-60">
                                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                                    <input
                                                        type="text"
                                                        value={globalSearch}
                                                        onChange={e => setGlobalSearch(e.target.value)}
                                                        placeholder="Filter products..."
                                                        className="w-full border border-zinc-200 rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none focus:border-zinc-900"
                                                    />
                                                </div>
                                            </div>

                                            {filteredProducts.length === 0 ? (
                                                <div className="p-12 text-center space-y-4">
                                                    <h3 className="text-lg font-semibold text-zinc-900">Add your products</h3>
                                                    <p className="text-xs text-zinc-500 max-w-sm mx-auto">Start by stocking your store with handcrafted ethnic wear your patrons will love.</p>
                                                    <button onClick={() => switchTab("add-product")} className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-xs font-semibold">
                                                        + Add product
                                                    </button>
                                                </div>
                                            ) : (
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                    <tr className="border-b border-zinc-200 bg-zinc-50/70 text-[11px] uppercase tracking-wider text-zinc-500">
                                                        <th className="p-4 w-8">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                                                                onChange={e => setSelectedProductIds(e.target.checked ? filteredProducts.map(p => p.id) : [])}
                                                                className="accent-zinc-900"
                                                            />
                                                        </th>
                                                        <th className="p-4">Product &amp; Gallery Angles</th>
                                                        <th className="p-4">Status</th>
                                                        <th className="p-4">Inventory</th>
                                                        <th className="p-4">Category</th>
                                                        <th className="p-4">Price</th>
                                                        <th className="p-4 text-right">Actions</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-zinc-100 text-xs">
                                                    {filteredProducts.map(product => (
                                                        <tr key={product.id} className="hover:bg-zinc-50/60">
                                                            <td className="p-4">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedProductIds.includes(product.id)}
                                                                    onChange={e => setSelectedProductIds(prev => e.target.checked ? [...prev, product.id] : prev.filter(id => id !== product.id))}
                                                                    className="accent-zinc-900"
                                                                />
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex -space-x-2">
                                                                        {(product.images || []).slice(0, 4).map((img, i) => (
                                                                            <img key={i} src={img} alt="" className="w-10 h-12 object-cover rounded border-2 border-white bg-zinc-100 shadow-2xs" />
                                                                        ))}
                                                                    </div>
                                                                    <div>
                                                                        <Link href={`/product/${product.id}`} target="_blank" className="font-semibold text-zinc-900 hover:underline flex items-center gap-1">
                                                                            {product.title} <ExternalLink className="w-3 h-3 text-zinc-400" />
                                                                        </Link>
                                                                        <span className="text-[11px] text-zinc-500">{(product.images || []).length} angle(s)</span>
                                                                    </div>
                                                                </div>

                                                                {addingPhotoToId === product.id && (
                                                                    <div className="mt-3 flex gap-2 items-center bg-zinc-100 p-2 rounded-lg">
                                                                        <input
                                                                            type="url"
                                                                            placeholder="Paste new image URL (https://...)"
                                                                            value={newPhotoUrl}
                                                                            onChange={(e) => setNewPhotoUrl(e.target.value)}
                                                                            className="flex-1 bg-white border border-zinc-300 rounded px-2.5 py-1.5 text-xs outline-none"
                                                                        />
                                                                        <button onClick={() => handleAppendPhoto(product)} className="bg-zinc-900 text-white px-3 py-1.5 rounded text-xs font-medium">Save</button>
                                                                        <button onClick={() => setAddingPhotoToId(null)} className="text-xs text-zinc-500 px-2">Cancel</button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="p-4">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${product.inStock ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}>
                                    {product.inStock ? "Active" : "Draft / Sold Out"}
                                  </span>
                                                            </td>
                                                            <td className="p-4 text-zinc-600">
                                                                {product.inStock ? `${product.stockQuantity ?? 15} in stock` : "0 in stock"}
                                                            </td>
                                                            <td className="p-4 text-zinc-600">{product.category}</td>
                                                            <td className="p-4 font-semibold">₹ {formatPrice(product.salePrice || product.price)}</td>
                                                            <td className="p-4 text-right space-x-2 whitespace-nowrap">
                                                                <button
                                                                    onClick={() => setAddingPhotoToId(addingPhotoToId === product.id ? null : product.id)}
                                                                    className="text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded"
                                                                >
                                                                    + Add Photo
                                                                </button>
                                                                <button onClick={() => handleToggleStock(product.id, product.inStock)} className="text-xs text-zinc-600 underline">
                                                                    Toggle Stock
                                                                </button>
                                                                <button onClick={() => requestDeleteProduct(product)} className="text-red-500 hover:text-red-700 p-1">
                                                                    <Trash2 className="w-4 h-4 inline" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === "add-product" && (
                                    <form onSubmit={handleAddProduct} className="space-y-6 animate-in fade-in duration-300">
                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                            <div className="flex items-center gap-2.5">
                                                <button type="button" onClick={() => switchTab("inventory")} className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 text-xs font-medium">&larr;</button>
                                                <span className="text-xs text-zinc-500 font-medium flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Products /</span>
                                                <h1 className="text-xl font-bold text-zinc-900">Add product</h1>
                                            </div>
                                            <div className="flex items-center gap-2.5">
                                                <button type="button" onClick={() => switchTab("inventory")} className="px-4 py-2 rounded-lg border border-zinc-300 bg-white text-xs font-medium text-zinc-700">Discard</button>
                                                <button type="submit" disabled={isSubmitting} className="px-5 py-2 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 disabled:bg-zinc-400">
                                                    {isSubmitting ? "Saving..." : "Save product"}
                                                </button>
                                            </div>
                                        </div>

                                        {message && (
                                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
                                                <span>{message}</span>
                                                <button type="button" onClick={() => switchTab("inventory")} className="underline font-semibold">View in Products &rarr;</button>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                                            <div className="lg:col-span-2 space-y-6">
                                                <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-2xs space-y-5">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">Title</label>
                                                        <input
                                                            type="text" required placeholder="Short sleeve silk kurta or Banarasi Anarkali"
                                                            value={productForm.title}
                                                            onChange={e => setProductForm({ ...productForm, title: e.target.value })}
                                                            className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-zinc-900"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">Description</label>
                                                        <div className="border border-zinc-300 rounded-xl overflow-hidden focus-within:border-zinc-900">
                                                            <div className="bg-zinc-50 border-b border-zinc-200 px-3 py-2 flex flex-wrap items-center gap-1 text-xs text-zinc-600 select-none">
                                                                <span className="px-2 py-1 rounded font-medium">Paragraph &darr;</span>
                                                                <span className="h-4 w-px bg-zinc-200 mx-1" />
                                                                <button type="button" onClick={() => setProductForm({ ...productForm, description: productForm.description + " [Bold] " })} className="px-2 py-1 rounded hover:bg-zinc-200/70 font-bold">B</button>
                                                                <button type="button" onClick={() => setProductForm({ ...productForm, description: productForm.description + " [Italic] " })} className="px-2 py-1 rounded hover:bg-zinc-200/70 italic font-serif">I</button>
                                                                <button type="button" onClick={() => setProductForm({ ...productForm, description: productForm.description + "\n- " })} className="px-2 py-1 rounded hover:bg-zinc-200/70">List</button>
                                                            </div>
                                                            <textarea
                                                                required rows={5}
                                                                placeholder="Describe the weave, zari work, fabric composition, and care instructions..."
                                                                value={productForm.description}
                                                                onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                                                                className="w-full p-3.5 text-sm outline-none bg-white"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <div className="flex justify-between items-center mb-1.5">
                                                            <label className="text-xs font-semibold text-zinc-800">Media</label>
                                                            <button type="button" onClick={addImageSlot} className="text-xs font-semibold text-zinc-900 hover:underline flex items-center gap-1">
                                                                <Plus className="w-3.5 h-3.5" /> Add angle slot
                                                            </button>
                                                        </div>
                                                        <div className="border-2 border-dashed border-zinc-300 rounded-2xl p-6 bg-zinc-50/50 text-center space-y-4">
                                                            <div className="flex items-center justify-center gap-3">
                                                                <button type="button" onClick={addImageSlot} className="bg-white border border-zinc-300 shadow-2xs px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-800">Upload new</button>
                                                                <span className="text-xs font-medium text-zinc-600">Select existing</span>
                                                            </div>
                                                            <p className="text-[11px] text-zinc-400">Accepts images, videos, or 3D models</p>
                                                            <div className="space-y-2.5 text-left pt-2">
                                                                {imageInputs.map((url, index) => (
                                                                    <div key={index} className="flex items-center gap-2.5 bg-white p-2 rounded-xl border border-zinc-200">
                                                                        {url ? (
                                                                            <img src={url} alt="" className="w-10 h-12 object-cover rounded-lg border border-zinc-200 flex-none" />
                                                                        ) : (
                                                                            <div className="w-10 h-12 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 flex-none"><ImageIcon className="w-4 h-4" /></div>
                                                                        )}
                                                                        <input
                                                                            type="url" required={index === 0}
                                                                            placeholder={index === 0 ? "Primary Front Look URL (https://...)" : `Gallery Angle #${index + 1} URL (https://...)`}
                                                                            value={url}
                                                                            onChange={e => handleImageSlotChange(index, e.target.value)}
                                                                            className="flex-1 text-xs outline-none px-2 py-1.5"
                                                                        />
                                                                        {imageInputs.length > 1 && (
                                                                            <button type="button" onClick={() => removeImageSlot(index)} className="text-zinc-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-semibold text-zinc-800 mb-1.5">Category</label>
                                                        <select
                                                            value={productForm.category}
                                                            onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                                                            className="w-full border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm bg-white outline-none"
                                                        >
                                                            <option value="Festive Edit">Festive Edit</option>
                                                            <option value="Ready to Ship">Ready to Ship</option>
                                                            <option value="New Arrivals">New Arrivals</option>
                                                        </select>
                                                        <p className="text-[11px] text-zinc-400 mt-1.5">Determines tax rates and adds metafields to improve search, filters, and cross-channel sales</p>
                                                    </div>
                                                </div>

                                                <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
                                                    <h3 className="text-sm font-semibold text-zinc-900">Price</h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-[11px] text-zinc-500 mb-1">Regular Price</label>
                                                            <div className="relative">
                                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-500">₹</span>
                                                                <input type="number" required placeholder="0.00" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} className="w-full border border-zinc-300 rounded-xl pl-8 pr-3.5 py-2.5 text-sm outline-none" />
                                                            </div>
                                                        </div>
                                                        {showComparePrice && (
                                                            <div>
                                                                <label className="block text-[11px] text-zinc-500 mb-1">Sale / Offer Price (Optional)</label>
                                                                <div className="relative">
                                                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-500">₹</span>
                                                                    <input type="number" placeholder="0.00" value={productForm.salePrice} onChange={e => setProductForm({ ...productForm, salePrice: e.target.value })} className="w-full border border-zinc-300 rounded-xl pl-8 pr-3.5 py-2.5 text-sm outline-none" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100">
                                                        <button type="button" onClick={() => setShowComparePrice(!showComparePrice)} className={`px-3 py-1 rounded-lg text-xs font-medium ${showComparePrice ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700"}`}>Compare-at</button>
                                                        <button type="button" onClick={() => setProductForm({ ...productForm, chargeTax: !productForm.chargeTax })} className="px-3 py-1 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-700">
                                                            Charge tax <strong className="ml-1">{productForm.chargeTax ? "Yes" : "No"}</strong>
                                                        </button>
                                                        <span className="px-3 py-1 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-700">Cost per item</span>
                                                    </div>
                                                </div>

                                                <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-sm font-semibold text-zinc-900">Inventory</h3>
                                                        <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer">
                                                            <span>Inventory tracked</span>
                                                            <input type="checkbox" checked={productForm.trackInventory} onChange={e => setProductForm({ ...productForm, trackInventory: e.target.checked })} className="accent-zinc-900 w-4 h-4" />
                                                        </label>
                                                    </div>
                                                    {productForm.trackInventory && (
                                                        <div className="border border-zinc-200 rounded-xl overflow-hidden">
                                                            <div className="bg-zinc-50 px-4 py-2 border-b border-zinc-200 flex justify-between text-xs font-semibold text-zinc-500">
                                                                <span>Location</span><span>Quantity</span>
                                                            </div>
                                                            <div className="px-4 py-3 flex items-center justify-between">
                                                                <span className="text-xs font-medium text-zinc-800">{settingsForm.warehouseName}</span>
                                                                <input type="number" min="0" value={productForm.stockQuantity} onChange={e => setProductForm({ ...productForm, stockQuantity: e.target.value })} className="w-28 border border-zinc-300 rounded-lg px-3 py-1.5 text-xs text-right font-medium outline-none" />
                                                            </div>
                                                        </div>
                                                    )}
                                                    {showSkuFields && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <input type="text" placeholder="SKU (e.g. SJ-001)" value={productForm.sku} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} className="border border-zinc-300 rounded-lg px-3 py-2 text-xs" />
                                                            <input type="text" placeholder="Barcode (ISBN, UPC)" value={productForm.barcode} onChange={e => setProductForm({ ...productForm, barcode: e.target.value })} className="border border-zinc-300 rounded-lg px-3 py-2 text-xs" />
                                                        </div>
                                                    )}
                                                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100">
                                                        <button type="button" onClick={() => setShowSkuFields(!showSkuFields)} className="px-3 py-1 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-700">SKU</button>
                                                        <button type="button" onClick={() => setShowSkuFields(!showSkuFields)} className="px-3 py-1 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-700">Barcodes</button>
                                                        <button type="button" onClick={() => setProductForm({ ...productForm, continueSelling: !productForm.continueSelling })} className="px-3 py-1 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-700">
                                                            Sell when out of stock <strong className="ml-1">{productForm.continueSelling ? "On" : "Off"}</strong>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-sm font-semibold text-zinc-900">Shipping</h3>
                                                        <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer">
                                                            <span>Physical product</span>
                                                            <input type="checkbox" checked={productForm.isPhysical} onChange={e => setProductForm({ ...productForm, isPhysical: e.target.checked })} className="accent-zinc-900 w-4 h-4" />
                                                        </label>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                                                        <label className="text-xs text-zinc-600">Package when shipped alone</label>
                                                        <select value={productForm.packageType} onChange={e => setProductForm({ ...productForm, packageType: e.target.value })} className="sm:col-span-2 border border-zinc-300 rounded-xl px-3 py-2 text-xs bg-white">
                                                            <option>Store default - Sample box - 22 x 13.7 x 4.2 cm, 0 kg</option>
                                                            <option>SANJHHBYAM Signature Box - 30 x 25 x 5 cm</option>
                                                        </select>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                                                        <label className="text-xs text-zinc-600">Packed product size</label>
                                                        <div className="sm:col-span-2 grid grid-cols-4 gap-2">
                                                            <input type="text" placeholder="L 0.0" value={productForm.length} onChange={e => setProductForm({ ...productForm, length: e.target.value })} className="border border-zinc-300 rounded-lg px-2.5 py-2 text-xs" />
                                                            <input type="text" placeholder="W 0.0" value={productForm.width} onChange={e => setProductForm({ ...productForm, width: e.target.value })} className="border border-zinc-300 rounded-lg px-2.5 py-2 text-xs" />
                                                            <input type="text" placeholder="H 0.0" value={productForm.height} onChange={e => setProductForm({ ...productForm, height: e.target.value })} className="border border-zinc-300 rounded-lg px-2.5 py-2 text-xs" />
                                                            <span className="border border-zinc-200 bg-zinc-50 rounded-lg flex items-center justify-center text-xs">cm</span>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                                                        <label className="text-xs text-zinc-600">Weight</label>
                                                        <div className="sm:col-span-2 flex gap-2">
                                                            <input type="text" value={productForm.weight} onChange={e => setProductForm({ ...productForm, weight: e.target.value })} className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-xs" />
                                                            <span className="border border-zinc-200 bg-zinc-50 px-3 py-2 rounded-lg text-xs">kg</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100">
                                                        <button type="button" onClick={() => setShowCustomsFields(!showCustomsFields)} className="px-3 py-1 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-700">Country of origin</button>
                                                        <button type="button" onClick={() => setShowCustomsFields(!showCustomsFields)} className="px-3 py-1 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-700">HS Code</button>
                                                    </div>
                                                </div>

                                                <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
                                                    <h3 className="text-sm font-semibold text-zinc-900">Variants</h3>
                                                    <button type="button" onClick={() => setShowVariantEditor(!showVariantEditor)} className="text-xs font-medium text-zinc-700 flex items-center gap-1.5">
                                                        <Plus className="w-3.5 h-3.5" /> Add options like size or color
                                                    </button>
                                                    {showVariantEditor && (
                                                        <div className="flex flex-wrap gap-2 pt-2">
                                                            {["XS", "S", "M", "L", "XL"].map(sz => (
                                                                <button
                                                                    key={sz} type="button" onClick={() => toggleSizeSelection(sz)}
                                                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border ${productForm.sizes.includes(sz) ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200"}`}
                                                                >
                                                                    {sz}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="bg-white border border-zinc-200/90 rounded-2xl p-6 shadow-2xs space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <h3 className="text-sm font-semibold text-zinc-900">Search engine listing</h3>
                                                        <button type="button" onClick={() => setShowSeoEditor(!showSeoEditor)} className="text-xs text-zinc-500 underline">Edit</button>
                                                    </div>
                                                    <p className="text-xs text-zinc-500">
                                                        {productForm.title ? `${productForm.title} - ${productForm.description.slice(0, 120)}` : "Add a title and description to see how this product might appear in a search engine listing"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
                                                    <h3 className="text-xs font-semibold text-zinc-800">Status</h3>
                                                    <select value={productForm.status} onChange={e => setProductForm({ ...productForm, status: e.target.value })} className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-xs font-medium bg-white">
                                                        <option value="Active">Active</option>
                                                        <option value="Draft">Draft</option>
                                                    </select>
                                                </div>

                                                <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
                                                    <h3 className="text-xs font-semibold text-zinc-800">Publishing</h3>
                                                    <span className="inline-flex items-center gap-1.5 text-xs bg-zinc-100 px-3 py-1.5 rounded-lg font-medium">
                            <Layers className="w-3.5 h-3.5" /> All channels
                          </span>
                                                </div>

                                                <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                                                    <h3 className="text-xs font-semibold text-zinc-800">Product organization</h3>
                                                    <div><label className="block text-[11px] text-zinc-500 mb-1">Type</label><input type="text" value={productForm.productType} onChange={e => setProductForm({ ...productForm, productType: e.target.value })} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-xs" /></div>
                                                    <div><label className="block text-[11px] text-zinc-500 mb-1">Vendor</label><input type="text" value={productForm.vendor} onChange={e => setProductForm({ ...productForm, vendor: e.target.value })} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-xs" /></div>
                                                    <div><label className="block text-[11px] text-zinc-500 mb-1">Collections</label><input type="text" placeholder="Add collections" value={productForm.collections} onChange={e => setProductForm({ ...productForm, collections: e.target.value })} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-xs" /></div>
                                                    <div><label className="block text-[11px] text-zinc-500 mb-1">Tags</label><input type="text" placeholder="Add tags" value={productForm.tags} onChange={e => setProductForm({ ...productForm, tags: e.target.value })} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-xs" /></div>
                                                </div>

                                                <div className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-2xs space-y-3">
                                                    <h3 className="text-xs font-semibold text-zinc-800">Theme template</h3>
                                                    <select value={productForm.themeTemplate} onChange={e => setProductForm({ ...productForm, themeTemplate: e.target.value })} className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-xs bg-white">
                                                        <option>Default product</option>
                                                        <option>Lookbook Editorial</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                )}

                                {activeTab === "collections" && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <h1 className="text-xl font-bold text-zinc-900">Collections</h1>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <form
                                                onSubmit={e => {
                                                    e.preventDefault();
                                                    setCollectionsList([...collectionsList, { id: `col-${Date.now()}`, ...newCollection, productCount: 0 }]);
                                                    setNewCollection({ title: "", type: "Automated", rule: "" });
                                                    showToast("Collection created!");
                                                }}
                                                className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4 h-fit"
                                            >
                                                <h3 className="text-sm font-semibold">Create Collection</h3>
                                                <input type="text" required placeholder="Title (e.g. Bridal Couture)" value={newCollection.title} onChange={e => setNewCollection({ ...newCollection, title: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs" />
                                                <select value={newCollection.type} onChange={e => setNewCollection({ ...newCollection, type: e.target.value as "Manual" | "Automated" })} className="w-full border rounded-lg p-2.5 text-xs bg-white">
                                                    <option value="Automated">Automated (Smart Rule)</option>
                                                    <option value="Manual">Manual Curation</option>
                                                </select>
                                                <input type="text" placeholder="Condition (e.g. Tag equals silk)" value={newCollection.rule} onChange={e => setNewCollection({ ...newCollection, rule: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs" />
                                                <button type="submit" className="w-full bg-zinc-900 text-white py-2.5 rounded-lg text-xs font-semibold">Save Collection</button>
                                            </form>
                                            <div className="md:col-span-2 bg-white border border-zinc-200 rounded-2xl overflow-hidden">
                                                <table className="w-full text-left text-xs">
                                                    <thead><tr className="border-b bg-zinc-50 text-[11px] uppercase text-zinc-500"><th className="p-4">Title</th><th className="p-4">Type</th><th className="p-4">Conditions</th></tr></thead>
                                                    <tbody className="divide-y divide-zinc-100">
                                                    {collectionsList.map(c => (
                                                        <tr key={c.id}><td className="p-4 font-semibold">{c.title}</td><td className="p-4">{c.type}</td><td className="p-4 text-zinc-500">{c.rule}</td></tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "stock-control" && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div>
                                            <h1 className="text-xl font-bold text-zinc-900">Inventory</h1>
                                            <p className="text-xs text-zinc-500">Location: {settingsForm.warehouseName}</p>
                                        </div>
                                        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
                                            <table className="w-full text-left text-xs">
                                                <thead>
                                                <tr className="border-b bg-zinc-50 text-[11px] uppercase text-zinc-500">
                                                    <th className="p-4">Product</th><th className="p-4">SKU</th><th className="p-4">Committed</th><th className="p-4">Available</th><th className="p-4 text-right">Adjust Stock</th>
                                                </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-100">
                                                {products.map(p => (
                                                    <tr key={p.id}>
                                                        <td className="p-4 font-medium flex items-center gap-3">
                                                            <img src={p.images?.[0]} alt="" className="w-8 h-10 object-cover rounded" /> {p.title}
                                                        </td>
                                                        <td className="p-4 font-mono text-zinc-500">{p.sku || `SJ-${p.id.slice(0, 5).toUpperCase()}`}</td>
                                                        <td className="p-4">0</td>
                                                        <td className="p-4 font-semibold">{p.inStock ? (p.stockQuantity ?? 15) : 0}</td>
                                                        <td className="p-4 text-right">
                                                            <input
                                                                type="number"
                                                                defaultValue={p.inStock ? (p.stockQuantity ?? 15) : 0}
                                                                onBlur={e => handleUpdateStockQty(p.id, Number(e.target.value))}
                                                                className="w-20 border rounded-lg px-2 py-1 text-right text-xs"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "purchase-orders" && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <h1 className="text-xl font-bold text-zinc-900">Purchase orders</h1>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <form
                                                onSubmit={e => {
                                                    e.preventDefault();
                                                    setPurchaseOrders([{
                                                        id: `po-${Date.now()}`,
                                                        poNumber: `PO-2026-0${purchaseOrders.length + 1}`,
                                                        supplier: poForm.supplier,
                                                        fabricItem: poForm.fabricItem,
                                                        units: Number(poForm.units),
                                                        totalCost: Number(poForm.totalCost),
                                                        status: "Ordered",
                                                        expectedDate: poForm.expectedDate
                                                    }, ...purchaseOrders]);
                                                    setPoForm({ supplier: "", fabricItem: "", units: "", totalCost: "", expectedDate: "" });
                                                    showToast("Purchase Order issued!");
                                                }}
                                                className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-3 h-fit"
                                            >
                                                <h3 className="text-sm font-semibold">Create Purchase Order</h3>
                                                <input type="text" required placeholder="Supplier / Weaver Name" value={poForm.supplier} onChange={e => setPoForm({ ...poForm, supplier: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs" />
                                                <input type="text" required placeholder="Fabric / Ensemble Batch" value={poForm.fabricItem} onChange={e => setPoForm({ ...poForm, fabricItem: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs" />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input type="number" required placeholder="Units" value={poForm.units} onChange={e => setPoForm({ ...poForm, units: e.target.value })} className="border rounded-lg p-2.5 text-xs" />
                                                    <input type="number" required placeholder="Total Cost (₹)" value={poForm.totalCost} onChange={e => setPoForm({ ...poForm, totalCost: e.target.value })} className="border rounded-lg p-2.5 text-xs" />
                                                </div>
                                                <input type="date" required value={poForm.expectedDate} onChange={e => setPoForm({ ...poForm, expectedDate: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs" />
                                                <button type="submit" className="w-full bg-zinc-900 text-white py-2.5 rounded-lg text-xs font-semibold">Issue PO</button>
                                            </form>
                                            <div className="md:col-span-2 bg-white border border-zinc-200 rounded-2xl overflow-hidden">
                                                <table className="w-full text-left text-xs">
                                                    <thead><tr className="border-b bg-zinc-50 text-[11px] uppercase text-zinc-500"><th className="p-4">PO #</th><th className="p-4">Supplier &amp; Item</th><th className="p-4">Units</th><th className="p-4">Cost</th><th className="p-4">Status</th></tr></thead>
                                                    <tbody className="divide-y divide-zinc-100">
                                                    {purchaseOrders.map(po => (
                                                        <tr key={po.id}>
                                                            <td className="p-4 font-mono font-semibold">{po.poNumber}</td>
                                                            <td className="p-4"><p className="font-medium">{po.supplier}</p><p className="text-zinc-500">{po.fabricItem}</p></td>
                                                            <td className="p-4">{po.units}</td>
                                                            <td className="p-4 font-semibold">₹ {formatPrice(po.totalCost)}</td>
                                                            <td className="p-4"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">{po.status}</span></td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "transfers" && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <h1 className="text-xl font-bold text-zinc-900">Inventory Transfers</h1>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <form
                                                onSubmit={e => {
                                                    e.preventDefault();
                                                    setTransfers([{ id: `tr-${Date.now()}`, ref: `TR-90${transfers.length + 1}`, origin: transferForm.origin, destination: transferForm.destination, units: Number(transferForm.units), status: "In Transit" }, ...transfers]);
                                                    setTransferForm({ ...transferForm, units: "" });
                                                    showToast("Stock transfer logged!");
                                                }}
                                                className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-3 h-fit"
                                            >
                                                <h3 className="text-sm font-semibold">Log Stock Transfer</h3>
                                                <input type="text" required value={transferForm.origin} onChange={e => setTransferForm({ ...transferForm, origin: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs" />
                                                <input type="text" required value={transferForm.destination} onChange={e => setTransferForm({ ...transferForm, destination: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs" />
                                                <input type="number" required placeholder="Quantity of units" value={transferForm.units} onChange={e => setTransferForm({ ...transferForm, units: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs" />
                                                <button type="submit" className="w-full bg-zinc-900 text-white py-2.5 rounded-lg text-xs font-semibold">Create Transfer</button>
                                            </form>
                                            <div className="md:col-span-2 bg-white border border-zinc-200 rounded-2xl overflow-hidden">
                                                <table className="w-full text-left text-xs">
                                                    <thead><tr className="border-b bg-zinc-50 text-[11px] uppercase text-zinc-500"><th className="p-4">Reference</th><th className="p-4">Origin &rarr; Destination</th><th className="p-4">Units</th><th className="p-4">Status</th></tr></thead>
                                                    <tbody className="divide-y divide-zinc-100">
                                                    {transfers.map(t => (
                                                        <tr key={t.id}><td className="p-4 font-mono font-semibold">{t.ref}</td><td className="p-4">{t.origin} &rarr; {t.destination}</td><td className="p-4">{t.units}</td><td className="p-4">{t.status}</td></tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "gift-cards" && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <h1 className="text-xl font-bold text-zinc-900">Gift cards</h1>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <form
                                                onSubmit={e => {
                                                    e.preventDefault();
                                                    const val = Number(giftForm.value);
                                                    setGiftCards([{ id: `gc-${Date.now()}`, code: `SJ-GIFT-${Math.floor(1000 + Math.random() * 8999)}`, initialValue: val, balance: val, recipientEmail: giftForm.email, isActive: true }, ...giftCards]);
                                                    setGiftForm({ value: "5000", email: "" });
                                                    showToast("Digital gift voucher issued!");
                                                }}
                                                className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-3 h-fit"
                                            >
                                                <h3 className="text-sm font-semibold">Issue Digital Gift Card</h3>
                                                <select value={giftForm.value} onChange={e => setGiftForm({ ...giftForm, value: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs bg-white">
                                                    <option value="2500">₹ 2,500</option>
                                                    <option value="5000">₹ 5,000</option>
                                                    <option value="10000">₹ 10,000</option>
                                                    <option value="25000">₹ 25,000</option>
                                                </select>
                                                <input type="email" required placeholder="Recipient Patron Email" value={giftForm.email} onChange={e => setGiftForm({ ...giftForm, email: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs" />
                                                <button type="submit" className="w-full bg-zinc-900 text-white py-2.5 rounded-lg text-xs font-semibold">Generate Voucher</button>
                                            </form>
                                            <div className="md:col-span-2 space-y-3">
                                                {giftCards.map(gc => (
                                                    <div key={gc.id} className="bg-white border border-zinc-200 rounded-xl p-4 flex justify-between items-center">
                                                        <div>
                                                            <p className="font-mono font-bold text-sm">{gc.code}</p>
                                                            <p className="text-xs text-zinc-500">Recipient: {gc.recipientEmail}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-semibold">₹ {formatPrice(gc.balance)}</p>
                                                            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Active</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {["growth", "attribution", "autopilot", "campaigns"].includes(activeTab) && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="w-5 h-5 text-zinc-800" />
                                                <h1 className="text-xl font-bold text-zinc-900">Growth</h1>
                                            </div>
                                            <div className="flex gap-1.5 bg-white border border-zinc-200 p-1 rounded-xl text-xs">
                                                {[
                                                    { id: "growth", label: "Overview" },
                                                    { id: "attribution", label: "Attribution" },
                                                    { id: "autopilot", label: "Autopilot" },
                                                    { id: "campaigns", label: "Campaigns" }
                                                ].map(t => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => switchTab(t.id)}
                                                        className={`px-3 py-1 rounded-lg font-medium ${activeTab === t.id ? "bg-zinc-900 text-white" : "text-zinc-600"}`}
                                                    >
                                                        {t.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xs">
                                            <div className="space-y-3 max-w-xl">
                                                <h2 className="text-2xl font-bold text-zinc-900">Run your marketing on autopilot</h2>
                                                <p className="text-xs text-zinc-600 leading-relaxed">
                                                    Campaign Autopilot promotes your handcrafted ethnic collections across top channels (Instagram, WhatsApp &amp; Google), and keeps refining the strategy while you stay in control.
                                                </p>
                                                <div className="flex gap-2 pt-1">
                                                    <button onClick={() => switchTab("autopilot")} className="bg-zinc-900 text-white px-4 py-2 rounded-lg text-xs font-semibold">Get started</button>
                                                    <button onClick={() => switchTab("campaigns")} className="bg-zinc-100 text-zinc-700 px-4 py-2 rounded-lg text-xs font-medium">Manage campaigns</button>
                                                </div>
                                            </div>
                                            <div className="w-48 h-28 rounded-xl bg-zinc-900 text-white p-4 flex flex-col justify-between">
                                                <span className="text-[10px] text-emerald-400 font-mono">ROAS +4.2x</span>
                                                <p className="text-xs font-serif">SANJHHBYAM Festive Autopilot</p>
                                                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded w-fit">Active on Meta &amp; WhatsApp</span>
                                            </div>
                                        </div>

                                        <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4 shadow-2xs">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-xs font-semibold text-zinc-700">Sales attributed to marketing</p>
                                                    <p className="text-2xl font-bold text-zinc-900 mt-1">₹ {formatPrice(totalRevenue)}</p>
                                                </div>
                                                <span className="border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-600 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> Last 30 days
                        </span>
                                            </div>
                                            <div className="h-44 flex items-end gap-2 pt-8 border-b border-zinc-100 pb-2">
                                                {[15, 28, 22, 40, 35, 60, 52, 75, 68, 90, 84, 100].map((val, i) => (
                                                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                                        <div className="w-full bg-sky-500/80 hover:bg-sky-600 rounded-t transition-all" style={{ height: `${val}%` }} />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-between text-[11px] text-zinc-400">
                                                <span>Oct 15</span><span>Oct 22</span><span>Oct 29</span><span>Nov 5</span><span>Today</span>
                                            </div>
                                        </div>

                                        {activeTab === "autopilot" && (
                                            <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4">
                                                <h3 className="text-sm font-semibold text-zinc-900">Active Autopilot Flows</h3>
                                                {[
                                                    { key: "abandonedCartWhatsapp", title: "WhatsApp Abandoned Bag Recovery", desc: "Sends an automated WhatsApp reminder with a 10% coupon 30 mins after checkout drop-off." },
                                                    { key: "festiveRetargeting", title: "Instagram & Meta Lookbook Retargeting", desc: "Dynamically shows viewed Anarkali & Silk creations to high-intent shoppers." },
                                                    { key: "winback60Days", title: "60-Day Patron Win-Back", desc: "Invites past patrons to preview new arrivals before public release." }
                                                ].map(rule => (
                                                    <label key={rule.key} className="flex items-center justify-between p-4 border border-zinc-100 rounded-xl cursor-pointer hover:bg-zinc-50">
                                                        <div>
                                                            <p className="text-xs font-semibold text-zinc-900">{rule.title}</p>
                                                            <p className="text-[11px] text-zinc-500">{rule.desc}</p>
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            checked={autopilotRules[rule.key as keyof typeof autopilotRules]}
                                                            onChange={e => {
                                                                setAutopilotRules({ ...autopilotRules, [rule.key]: e.target.checked });
                                                                showToast("Autopilot rule updated");
                                                            }}
                                                            className="accent-zinc-900 w-4 h-4"
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {activeTab === "campaigns" && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <form
                                                    onSubmit={e => {
                                                        e.preventDefault();
                                                        setCampaigns([{ id: `cmp-${Date.now()}`, name: campaignForm.name, channel: campaignForm.channel, budget: Number(campaignForm.budget), sales: 0, status: "Active" }, ...campaigns]);
                                                        setCampaignForm({ name: "", channel: "WhatsApp Broadcast", budget: "", promoCode: "SANJHH80" });
                                                        showToast("Marketing campaign launched!");
                                                    }}
                                                    className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-3"
                                                >
                                                    <h3 className="text-sm font-semibold">Launch Campaign</h3>
                                                    <input type="text" required placeholder="Campaign Name" value={campaignForm.name} onChange={e => setCampaignForm({ ...campaignForm, name: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs" />
                                                    <select value={campaignForm.channel} onChange={e => setCampaignForm({ ...campaignForm, channel: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs bg-white">
                                                        <option>WhatsApp Broadcast</option>
                                                        <option>Instagram &amp; Meta Ads</option>
                                                        <option>Google Search Shopping</option>
                                                    </select>
                                                    <input type="number" required placeholder="Budget (₹)" value={campaignForm.budget} onChange={e => setCampaignForm({ ...campaignForm, budget: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs" />
                                                    <button type="submit" className="w-full bg-zinc-900 text-white py-2.5 rounded-lg text-xs font-semibold">Launch</button>
                                                </form>
                                                <div className="md:col-span-2 bg-white border border-zinc-200 rounded-2xl overflow-hidden">
                                                    <table className="w-full text-left text-xs">
                                                        <thead><tr className="border-b bg-zinc-50 text-[11px] uppercase text-zinc-500"><th className="p-4">Campaign</th><th className="p-4">Channel</th><th className="p-4">Spend</th><th className="p-4">Attributed Sales</th></tr></thead>
                                                        <tbody className="divide-y divide-zinc-100">
                                                        {campaigns.map(c => (
                                                            <tr key={c.id}><td className="p-4 font-semibold">{c.name}</td><td className="p-4">{c.channel}</td><td className="p-4">₹ {formatPrice(c.budget)}</td><td className="p-4 font-semibold text-emerald-700">₹ {formatPrice(c.sales)}</td></tr>
                                                        ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {["analytics", "reports", "live-view"].includes(activeTab) && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                            <div className="flex items-center gap-2">
                                                <BarChart3 className="w-5 h-5 text-zinc-800" />
                                                <h1 className="text-xl font-bold text-zinc-900">Analytics</h1>
                                                <span className="text-xs text-zinc-400">Live Firebase Sync</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => switchTab("analytics")} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${activeTab === "analytics" ? "bg-zinc-900 text-white" : "bg-white border"}`}>Dashboard</button>
                                                <button onClick={() => switchTab("reports")} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${activeTab === "reports" ? "bg-zinc-900 text-white" : "bg-white border"}`}>Reports</button>
                                                <button onClick={() => switchTab("live-view")} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${activeTab === "live-view" ? "bg-zinc-900 text-white" : "bg-white border"}`}>Live View</button>
                                                <span className="bg-white border border-zinc-200 px-3 py-1.5 rounded-lg text-xs font-semibold">INR ₹</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs">
                                                <p className="text-xs text-zinc-500 font-medium">Gross sales</p>
                                                <p className="text-xl font-bold text-zinc-900 mt-1">₹ {formatPrice(grossSales)}</p>
                                            </div>
                                            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs">
                                                <p className="text-xs text-zinc-500 font-medium">Returning customer rate</p>
                                                <p className="text-xl font-bold text-zinc-900 mt-1">{customers.length > 0 ? "18%" : "0%"}</p>
                                            </div>
                                            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs">
                                                <p className="text-xs text-zinc-500 font-medium">Orders fulfilled</p>
                                                <p className="text-xl font-bold text-zinc-900 mt-1">{fulfilledOrdersCount}</p>
                                            </div>
                                            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs">
                                                <p className="text-xs text-zinc-500 font-medium">Orders</p>
                                                <p className="text-xl font-bold text-zinc-900 mt-1">{orders.length}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xs flex flex-col justify-between">
                                                <div>
                                                    <p className="text-xs font-semibold text-zinc-700">Total sales over time</p>
                                                    <p className="text-2xl font-bold text-zinc-900 mt-1">₹ {formatPrice(totalRevenue)}</p>
                                                </div>
                                                <div className="h-52 flex items-end gap-3 pt-10 pb-4 border-b border-zinc-100">
                                                    {[20, 35, 30, 55, 45, 70, 65, 85, 75, 95].map((h, idx) => (
                                                        <div key={idx} className="flex-1 bg-sky-500/80 rounded-t" style={{ height: `${h}%` }} />
                                                    ))}
                                                </div>
                                                <div className="flex justify-between text-[11px] text-zinc-400 pt-3">
                                                    <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>10 PM</span>
                                                </div>
                                            </div>

                                            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xs space-y-3">
                                                <h3 className="text-xs font-semibold text-zinc-800">Total sales breakdown</h3>
                                                <div className="divide-y divide-zinc-100 text-xs">
                                                    <div className="py-2 flex justify-between"><span className="text-sky-700">Gross sales</span><span>₹{formatPrice(grossSales)}</span></div>
                                                    <div className="py-2 flex justify-between"><span className="text-sky-700">Discounts</span><span>-₹{formatPrice(totalDiscounts)}</span></div>
                                                    <div className="py-2 flex justify-between"><span className="text-sky-700">Sales reversals</span><span>-₹{formatPrice(totalReturnsVal)}</span></div>
                                                    <div className="py-2 flex justify-between font-medium"><span className="text-sky-700">Net sales</span><span>₹{formatPrice(netSales)}</span></div>
                                                    <div className="py-2 flex justify-between"><span className="text-sky-700">Shipping charges</span><span>₹{formatPrice(totalShippingCharges)}</span></div>
                                                    <div className="py-2 flex justify-between"><span className="text-sky-700">Return fees</span><span>₹0.00</span></div>
                                                    <div className="py-2 flex justify-between"><span className="text-sky-700">Taxes (GST)</span><span>₹{formatPrice(totalTaxes)}</span></div>
                                                    <div className="pt-3 flex justify-between font-bold text-sm text-zinc-900"><span>Total sales</span><span>₹{formatPrice(totalRevenue)}</span></div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs">
                                                <p className="text-xs font-semibold text-zinc-700 mb-2">Total sales by sales channel</p>
                                                <p className="text-sm font-medium text-zinc-900">Online Storefront: ₹ {formatPrice(totalRevenue)}</p>
                                            </div>
                                            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs">
                                                <p className="text-xs font-semibold text-zinc-700 mb-2">Average order value over time</p>
                                                <p className="text-xl font-bold text-zinc-900">₹ {formatPrice(aov)}</p>
                                            </div>
                                            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-2xs">
                                                <p className="text-xs font-semibold text-zinc-700 mb-2">Total sales by product</p>
                                                <p className="text-xs text-zinc-600">{products[0]?.title || "Top Ensemble"} | {orders.length} order(s)</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "content" && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <h1 className="text-xl font-bold text-zinc-900">Content &amp; Lookbook Media</h1>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                            {products.flatMap(p => p.images || []).map((img, idx) => (
                                                <div key={idx} className="bg-white border border-zinc-200 rounded-xl p-2 space-y-2">
                                                    <img src={img} alt="" className="w-full aspect-[3/4] object-cover rounded-lg bg-zinc-100" />
                                                    <button
                                                        onClick={() => { navigator.clipboard.writeText(img); showToast("Copied CDN image URL!"); }}
                                                        className="w-full text-[10px] font-medium bg-zinc-100 hover:bg-zinc-200 py-1 rounded"
                                                    >
                                                        Copy CDN URL
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === "markets" && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <h1 className="text-xl font-bold text-zinc-900">Markets</h1>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-2">
                                                <div className="flex justify-between"><h3 className="font-semibold text-sm">India (Primary Market)</h3><span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-medium">Active</span></div>
                                                <p className="text-xs text-zinc-500">Currency: Indian Rupee (INR ₹) | GST 12% | UPI, Cards &amp; COD Enabled</p>
                                            </div>
                                            <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-2">
                                                <div className="flex justify-between"><h3 className="font-semibold text-sm">International Diaspora (US, UK, UAE)</h3><span className="text-xs bg-zinc-100 text-zinc-600 px-2.5 py-0.5 rounded-full font-medium">Ready</span></div>
                                                <p className="text-xs text-zinc-500">Multi-Currency (USD $, GBP £, AED) | DHL Express Insured Air Shipping</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "orders" && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <h2 className="text-2xl font-serif text-zinc-900">Orders &amp; Shipment Dispatch</h2>
                                        {orders.length === 0 ? (
                                            <div className="bg-white border rounded-2xl p-12 text-center text-sm text-zinc-500">No orders placed yet.</div>
                                        ) : orders.map(order => (
                                            <div key={order.id} className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-2xs space-y-4">
                                                <div className="flex flex-wrap justify-between items-center gap-4 border-b border-zinc-100 pb-4">
                                                    <div><p className="text-[10px] text-zinc-400 font-semibold uppercase">Order ID</p><p className="text-xs font-mono font-semibold">{order.id}</p></div>
                                                    <div><p className="text-[10px] text-zinc-400 font-semibold uppercase">Patron</p><p className="text-xs font-medium">{order.userEmail}</p></div>
                                                    <div><p className="text-[10px] text-zinc-400 font-semibold uppercase">Date</p><p className="text-xs">{formatDate(order.createdAt)}</p></div>
                                                    <div>
                                                        <p className="text-[10px] text-zinc-400 font-semibold uppercase mb-1">Stage</p>
                                                        <select value={order.status} onChange={e => handleStatusChange(order.id, e.target.value)} className="border border-zinc-300 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white">
                                                            <option value="Confirmed">Confirmed</option>
                                                            <option value="Packed">Packed</option>
                                                            <option value="Shipped">Shipped</option>
                                                            <option value="Out for Delivery">Out for Delivery</option>
                                                            <option value="Delivered">Delivered</option>
                                                            <option value="Cancelled">Cancelled</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                                                    <input type="text" placeholder="Courier Partner (e.g. BlueDart)" defaultValue={order.courierName || ""} onChange={e => setTrackingInputs({ ...trackingInputs, [order.id]: { courier: e.target.value, code: trackingInputs[order.id]?.code ?? order.trackingId ?? "" } })} className="border bg-white rounded-lg p-2 text-xs" />
                                                    <input type="text" placeholder="AWB Tracking Number" defaultValue={order.trackingId || ""} onChange={e => setTrackingInputs({ ...trackingInputs, [order.id]: { courier: trackingInputs[order.id]?.courier ?? order.courierName ?? "BlueDart", code: e.target.value } })} className="border bg-white rounded-lg p-2 text-xs" />
                                                    <button onClick={() => handleTrackingUpdate(order.id)} className="bg-zinc-900 text-white rounded-lg px-4 py-2 text-xs font-medium">Update Tracking</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === "customers" && (
                                    <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xs">
                                        <h2 className="text-xl font-serif text-zinc-900 p-6 border-b">Registered Patrons</h2>
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead><tr className="border-b bg-zinc-50 text-[11px] uppercase text-zinc-500"><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Phone</th></tr></thead>
                                            <tbody className="divide-y divide-zinc-100">
                                            {customers.map(c => (
                                                <tr key={c.id}><td className="p-4 font-medium">{c.firstName ? `${c.firstName} ${c.lastName}` : "Verified Shopper"}</td><td className="p-4 text-zinc-600">{c.email}</td><td className="p-4 text-zinc-600">{c.phone || "-"}</td></tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === "promos" && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        <form onSubmit={handleAddPromo} className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-4 h-fit">
                                            <h3 className="text-sm font-semibold">Create Discount Code</h3>
                                            <input type="text" required placeholder="Code (e.g. SANJHH80)" value={promoForm.code} onChange={e => setPromoForm({ ...promoForm, code: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs uppercase" />
                                            <input type="number" required min="1" max="90" placeholder="Discount %" value={promoForm.discountPercent} onChange={e => setPromoForm({ ...promoForm, discountPercent: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs" />
                                            <button type="submit" className="w-full bg-zinc-900 text-white py-2.5 rounded-lg text-xs font-semibold">Activate Coupon</button>
                                        </form>
                                        <div className="md:col-span-2 space-y-3">
                                            {promos.map(p => (
                                                <div key={p.id} className="bg-white border border-zinc-200 rounded-xl p-4 flex justify-between items-center">
                                                    <div><p className="font-mono font-bold text-base">{p.code}</p><p className="text-xs text-zinc-500">{p.discountPercent}% OFF storewide</p></div>
                                                    <button onClick={() => handleTogglePromo(p.id, p.isActive)} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${p.isActive ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>{p.isActive ? "Active" : "Disabled"}</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === "returns" && (
                                    <div className="space-y-4">
                                        <h2 className="text-2xl font-serif text-zinc-900">Returns &amp; Exchanges</h2>
                                        {orders.filter(o => o.status === "Return Requested" || o.returnReason).length === 0 ? (
                                            <div className="bg-white border rounded-2xl p-12 text-center text-sm text-zinc-500">No active return requests.</div>
                                        ) : orders.filter(o => o.status === "Return Requested" || o.returnReason).map(order => (
                                            <div key={order.id} className="bg-white border rounded-2xl p-6 flex justify-between items-center">
                                                <div>
                                                    <p className="text-xs font-mono text-zinc-500">Order #{order.id}</p>
                                                    <p className="text-sm font-medium mt-1">Reason: {order.returnReason}</p>
                                                    <p className="text-xs text-zinc-500 mt-0.5">Amount: ₹ {formatPrice(order.totalAmount)} | Status: {order.returnStatus}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleReturnDecision(order.id, "Approved & Pickup Scheduled")} className="bg-zinc-900 text-white rounded-lg px-4 py-2 text-xs font-medium">Approve Pickup</button>
                                                    <button onClick={() => handleReturnDecision(order.id, "Refund Processed")} className="bg-emerald-600 text-white rounded-lg px-4 py-2 text-xs font-medium">Mark Refunded</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === "tickets" && (
                                    <div className="space-y-4">
                                        <h2 className="text-2xl font-serif text-zinc-900">Patron Support Desk</h2>
                                        {tickets.length === 0 ? (
                                            <div className="bg-white border rounded-2xl p-12 text-center text-sm text-zinc-500">No open support tickets.</div>
                                        ) : tickets.map(t => (
                                            <div key={t.id} className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-zinc-500">{t.userEmail} | Order: {t.orderId}</span>
                                                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100">{t.status}</span>
                                                </div>
                                                <h4 className="font-semibold text-sm">{t.subject}</h4>
                                                <p className="text-xs text-zinc-600">{t.message}</p>
                                                <div className="flex gap-2 pt-2">
                                                    <input type="text" placeholder="Reply to patron..." value={replyText[t.id] || t.adminReply || ""} onChange={e => setReplyText({ ...replyText, [t.id]: e.target.value })} className="flex-1 border rounded-lg p-2 text-xs" />
                                                    <button onClick={() => handleReplyTicket(t.id)} className="bg-zinc-900 text-white rounded-lg px-4 py-2 text-xs font-medium">Send Reply</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === "settings" && (
                                    <form onSubmit={handleSaveSettings} className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
                                        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
                                            <h1 className="text-2xl font-bold text-zinc-900 capitalize">
                                                {settingsMenuList.find(m => m.id === settingsSubTab)?.label || "Settings"}
                                            </h1>
                                            <button
                                                type="submit"
                                                disabled={isSavingSettings}
                                                className="bg-zinc-900 text-white px-5 py-2 rounded-xl text-xs font-semibold hover:bg-zinc-800 shadow-xs"
                                            >
                                                {isSavingSettings ? "Saving..." : "Save"}
                                            </button>
                                        </div>

                                        {settingsSubTab === "general" && (
                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <h3 className="text-xs font-semibold text-zinc-800">Business details</h3>
                                                    <p className="text-[11px] text-zinc-500">Business entity used for financial products, markets, apps, and taxes in this shop</p>
                                                    <div className="bg-white border border-zinc-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-6 rounded border border-zinc-200 overflow-hidden flex flex-col">
                                                                <div className="bg-[#FF9933] h-1/3 w-full" />
                                                                <div className="bg-white h-1/3 w-full flex items-center justify-center"><span className="w-1.5 h-1.5 rounded-full bg-blue-800" /></div>
                                                                <div className="bg-[#138808] h-1/3 w-full" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-semibold text-zinc-900">{settingsForm.legalBusinessName}</p>
                                                                <p className="text-[11px] text-zinc-500">{settingsForm.businessCountry}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-zinc-400 font-bold">...</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <h3 className="text-xs font-semibold text-zinc-800">Store contact details</h3>
                                                    <div className="bg-white border border-zinc-200 rounded-2xl divide-y divide-zinc-100 shadow-2xs">
                                                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-[11px] text-zinc-500 mb-1">Store Name</label>
                                                                <input type="text" value={settingsForm.storeName} onChange={e => setSettingsForm({ ...settingsForm, storeName: e.target.value })} className="w-full border border-zinc-300 rounded-lg px-3 py-1.5 text-xs" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[11px] text-zinc-500 mb-1">Store Email &amp; Phone</label>
                                                                <input type="text" value={settingsForm.storeEmail} onChange={e => setSettingsForm({ ...settingsForm, storeEmail: e.target.value })} className="w-full border border-zinc-300 rounded-lg px-3 py-1.5 text-xs" />
                                                            </div>
                                                        </div>
                                                        <div className="p-4">
                                                            <label className="block text-[11px] text-zinc-500 mb-1">Store address</label>
                                                            <input type="text" value={settingsForm.storeAddress} onChange={e => setSettingsForm({ ...settingsForm, storeAddress: e.target.value })} className="w-full border border-zinc-300 rounded-lg px-3 py-1.5 text-xs" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <h3 className="text-xs font-semibold text-zinc-800">Store defaults</h3>
                                                    <div className="bg-white border border-zinc-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
                                                        <div>
                                                            <p className="text-xs font-semibold text-zinc-900">Currency display</p>
                                                            <p className="text-[11px] text-zinc-500">To manage the currencies customers see, go to <button type="button" onClick={() => setSettingsSubTab("markets")} className="underline">Markets</button></p>
                                                        </div>
                                                        <span className="bg-zinc-100 text-zinc-800 text-xs font-medium px-3 py-1 rounded-lg">{settingsForm.currencyDisplay}</span>
                                                    </div>

                                                    <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                                                        <div>
                                                            <label className="block text-xs font-semibold text-zinc-800 mb-1">Backup Region</label>
                                                            <select value={settingsForm.backupRegion} onChange={e => setSettingsForm({ ...settingsForm, backupRegion: e.target.value })} className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-xs bg-white">
                                                                <option>India</option>
                                                                <option>United States</option>
                                                                <option>United Kingdom</option>
                                                                <option>United Arab Emirates</option>
                                                            </select>
                                                            <p className="text-[11px] text-zinc-400 mt-1">Determines settings for customers outside of your markets</p>
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-xs font-semibold text-zinc-800 mb-1">Unit system</label>
                                                                <select value={settingsForm.unitSystem} onChange={e => setSettingsForm({ ...settingsForm, unitSystem: e.target.value })} className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-xs bg-white">
                                                                    <option>Metric system</option>
                                                                    <option>Imperial system</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-semibold text-zinc-800 mb-1">Default weight unit</label>
                                                                <select value={settingsForm.defaultWeightUnit} onChange={e => setSettingsForm({ ...settingsForm, defaultWeightUnit: e.target.value })} className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-xs bg-white">
                                                                    <option>Kilograms (kg)</option>
                                                                    <option>Grams (g)</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs font-semibold text-zinc-800 mb-1">Time zone</label>
                                                            <select value={settingsForm.timeZone} onChange={e => setSettingsForm({ ...settingsForm, timeZone: e.target.value })} className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-xs bg-white">
                                                                <option>(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-3 shadow-2xs">
                                                        <h4 className="text-xs font-semibold text-zinc-900">Order ID format</h4>
                                                        <p className="text-[11px] text-zinc-500">Order numbers start at #1001 by default. Add a custom prefix or suffix:</p>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div><label className="block text-[11px] text-zinc-500 mb-1">Prefix</label><input type="text" value={settingsForm.orderPrefix} onChange={e => setSettingsForm({ ...settingsForm, orderPrefix: e.target.value })} className="w-full border rounded-lg px-3 py-1.5 text-xs" /></div>
                                                            <div><label className="block text-[11px] text-zinc-500 mb-1">Suffix</label><input type="text" value={settingsForm.orderSuffix} onChange={e => setSettingsForm({ ...settingsForm, orderSuffix: e.target.value })} className="w-full border rounded-lg px-3 py-1.5 text-xs" /></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {settingsSubTab === "payments" && (
                                            <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-5 shadow-2xs">
                                                <div className="flex justify-between items-center border-b pb-3">
                                                    <div>
                                                        <h3 className="text-sm font-semibold">Razorpay Payment Gateway (UPI, Cards, NetBanking)</h3>
                                                        <p className="text-xs text-zinc-500">Accept instant domestic and international payments.</p>
                                                    </div>
                                                    <input type="checkbox" checked={settingsForm.razorpayEnabled} onChange={e => setSettingsForm({ ...settingsForm, razorpayEnabled: e.target.checked })} className="accent-zinc-900 w-4 h-4" />
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div><label className="block text-xs text-zinc-500 mb-1">Environment Mode</label><select value={settingsForm.razorpayMode} onChange={e => setSettingsForm({ ...settingsForm, razorpayMode: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs bg-white"><option>Test (Sandbox)</option><option>Live (Production)</option></select></div>
                                                    <div><label className="block text-xs text-zinc-500 mb-1">Merchant UPI VPA</label><input type="text" value={settingsForm.upiVpa} onChange={e => setSettingsForm({ ...settingsForm, upiVpa: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs" /></div>
                                                    <div><label className="block text-xs text-zinc-500 mb-1">Razorpay Key ID</label><input type="text" value={settingsForm.razorpayKeyId} onChange={e => setSettingsForm({ ...settingsForm, razorpayKeyId: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs font-mono" /></div>
                                                    <div><label className="block text-xs text-zinc-500 mb-1">Razorpay Key Secret</label><input type="password" value={settingsForm.razorpayKeySecret} onChange={e => setSettingsForm({ ...settingsForm, razorpayKeySecret: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs font-mono" /></div>
                                                </div>
                                                <div className="pt-4 border-t space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <div><h3 className="text-sm font-semibold">Cash on Delivery (COD)</h3><p className="text-xs text-zinc-500">Allow patrons to pay via cash or UPI at doorstep.</p></div>
                                                        <input type="checkbox" checked={settingsForm.codEnabled} onChange={e => setSettingsForm({ ...settingsForm, codEnabled: e.target.checked })} className="accent-zinc-900 w-4 h-4" />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div><label className="block text-xs text-zinc-500 mb-1">Max COD Order Limit (₹)</label><input type="number" value={settingsForm.codMaxCeiling} onChange={e => setSettingsForm({ ...settingsForm, codMaxCeiling: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs" /></div>
                                                        <div><label className="block text-xs text-zinc-500 mb-1">COD Convenience Fee (₹)</label><input type="number" value={settingsForm.codFee} onChange={e => setSettingsForm({ ...settingsForm, codFee: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs" /></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {settingsSubTab === "shipping" && (
                                            <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-5 shadow-2xs">
                                                <h3 className="text-sm font-semibold border-b pb-3">Logistics Partner &amp; Dispatch Rates</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs text-zinc-500 mb-1">Primary Courier Aggregator</label>
                                                        <select value={settingsForm.courierPartner} onChange={e => setSettingsForm({ ...settingsForm, courierPartner: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs bg-white">
                                                            <option>Shiprocket Aggregator</option>
                                                            <option>BlueDart Express Direct</option>
                                                            <option>Delhivery Surface &amp; Air</option>
                                                        </select>
                                                    </div>
                                                    <div><label className="block text-xs text-zinc-500 mb-1">API Token / Secret</label><input type="password" value={settingsForm.courierApiToken} onChange={e => setSettingsForm({ ...settingsForm, courierApiToken: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs font-mono" /></div>
                                                    <div><label className="block text-xs text-zinc-500 mb-1">Free Shipping Threshold (₹)</label><input type="number" value={settingsForm.freeShippingThreshold} onChange={e => setSettingsForm({ ...settingsForm, freeShippingThreshold: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs" /></div>
                                                    <div><label className="block text-xs text-zinc-500 mb-1">Express Air Surcharge (₹)</label><input type="number" value={settingsForm.expressRate} onChange={e => setSettingsForm({ ...settingsForm, expressRate: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs" /></div>
                                                </div>
                                            </div>
                                        )}

                                        {settingsSubTab === "taxes" && (
                                            <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-5 shadow-2xs">
                                                <h3 className="text-sm font-semibold border-b pb-3">India GST &amp; HSN Compliance</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div><label className="block text-xs text-zinc-500 mb-1">Registered GSTIN</label><input type="text" value={settingsForm.gstin} onChange={e => setSettingsForm({ ...settingsForm, gstin: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs uppercase font-mono" /></div>
                                                    <div><label className="block text-xs text-zinc-500 mb-1">Luxury Apparel GST Slab (%)</label><select value={settingsForm.apparelGstSlab} onChange={e => setSettingsForm({ ...settingsForm, apparelGstSlab: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs bg-white"><option value="12">12% (Apparel over ₹1,000)</option><option value="5">5% (Apparel under ₹1,000)</option></select></div>
                                                    <div><label className="block text-xs text-zinc-500 mb-1">Default Apparel HSN Code</label><input type="text" value={settingsForm.defaultHsn} onChange={e => setSettingsForm({ ...settingsForm, defaultHsn: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs" /></div>
                                                </div>
                                            </div>
                                        )}

                                        {!["general", "payments", "shipping", "taxes"].includes(settingsSubTab) && (
                                            <div className="bg-white border border-zinc-200 rounded-2xl p-6 space-y-5 shadow-2xs">
                                                {settingsSubTab === "plan" && (
                                                    <div className="space-y-3">
                                                        <h3 className="text-sm font-semibold">Current Studio Plan</h3>
                                                        <p className="text-xs text-zinc-600">Active Plan: <strong>{settingsForm.currentPlan}</strong> ({settingsForm.billingCycle})</p>
                                                        <p className="text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg w-fit">All enterprise features, unlimited products, and 0% transaction fees active.</p>
                                                    </div>
                                                )}

                                                {settingsSubTab === "billing" && (
                                                    <div className="space-y-3">
                                                        <h3 className="text-sm font-semibold">Billing &amp; Settlement Account</h3>
                                                        <p className="text-xs text-zinc-600">Primary UPI &amp; NEFT Settlement VPA: <span className="font-mono font-semibold">{settingsForm.upiVpa}</span></p>
                                                        <p className="text-xs text-zinc-500">Tax invoices for courier &amp; platform charges are billed in INR (₹).</p>
                                                    </div>
                                                )}

                                                {settingsSubTab === "users" && (
                                                    <div className="space-y-3">
                                                        <h3 className="text-sm font-semibold">Users &amp; Staff Permissions</h3>
                                                        <input type="text" value={settingsForm.staffMembers} onChange={e => setSettingsForm({ ...settingsForm, staffMembers: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs" />
                                                    </div>
                                                )}

                                                {settingsSubTab === "checkout" && (
                                                    <div className="space-y-4">
                                                        <h3 className="text-sm font-semibold">Checkout &amp; Luxury Packaging</h3>
                                                        <div>
                                                            <label className="block text-xs text-zinc-500 mb-1">Customer contact method at checkout</label>
                                                            <select value={settingsForm.checkoutContactMethod} onChange={e => setSettingsForm({ ...settingsForm, checkoutContactMethod: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs bg-white">
                                                                <option>Phone number or email</option>
                                                                <option>Email only</option>
                                                            </select>
                                                        </div>
                                                        <label className="flex items-center justify-between text-xs pt-2">
                                                            <span>Offer Signature Gift Box &amp; Calligraphy Note (+₹{settingsForm.giftPackagingFee})</span>
                                                            <input type="checkbox" checked={settingsForm.giftPackagingEnabled} onChange={e => setSettingsForm({ ...settingsForm, giftPackagingEnabled: e.target.checked })} className="accent-zinc-900 w-4 h-4" />
                                                        </label>
                                                    </div>
                                                )}

                                                {settingsSubTab === "customer-accounts" && (
                                                    <div className="space-y-3">
                                                        <h3 className="text-sm font-semibold">Customer Accounts &amp; Self-Serve Returns</h3>
                                                        <label className="flex items-center justify-between text-xs">
                                                            <span>Allow patrons to request 7-day returns &amp; exchanges directly from `/account`</span>
                                                            <input type="checkbox" checked={settingsForm.customerSelfReturnEnabled} onChange={e => setSettingsForm({ ...settingsForm, customerSelfReturnEnabled: e.target.checked })} className="accent-zinc-900 w-4 h-4" />
                                                        </label>
                                                    </div>
                                                )}

                                                {settingsSubTab === "locations" && (
                                                    <div className="space-y-3">
                                                        <h3 className="text-sm font-semibold">Atelier &amp; Warehouse Locations</h3>
                                                        <div><label className="block text-xs text-zinc-500 mb-1">Primary Dispatch Hub</label><input type="text" value={`${settingsForm.warehouseName} - ${settingsForm.warehouseCity} (${settingsForm.warehousePin})`} onChange={e => setSettingsForm({ ...settingsForm, warehouseCity: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs" /></div>
                                                        <div><label className="block text-xs text-zinc-500 mb-1">Secondary Weaving Hub</label><input type="text" value={settingsForm.secondaryLocation} onChange={e => setSettingsForm({ ...settingsForm, secondaryLocation: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs" /></div>
                                                    </div>
                                                )}

                                                {settingsSubTab === "markets" && (
                                                    <div className="space-y-3">
                                                        <h3 className="text-sm font-semibold">Active Regional Markets</h3>
                                                        <p className="text-xs text-zinc-600">
                                                            Primary: <strong>India (INR ₹)</strong> | International Diaspora: <strong>US, UK, UAE, Canada</strong>
                                                        </p>
                                                    </div>
                                                )}

                                                {settingsSubTab === "apps" && (
                                                    <div className="space-y-2 text-xs">
                                                        <h3 className="text-sm font-semibold mb-2">Installed Studio Integrations</h3>
                                                        <div className="p-3 border rounded-xl flex justify-between"><span>Razorpay Checkout SDK</span><span className="text-emerald-700 font-semibold">Connected</span></div>
                                                        <div className="p-3 border rounded-xl flex justify-between"><span>Shiprocket Logistics Aggregator</span><span className="text-emerald-700 font-semibold">Connected</span></div>
                                                        <div className="p-3 border rounded-xl flex justify-between"><span>Interakt WhatsApp Business API</span><span className="text-emerald-700 font-semibold">Connected</span></div>
                                                    </div>
                                                )}

                                                {settingsSubTab === "sales-channels" && (
                                                    <div className="space-y-2 text-xs">
                                                        <h3 className="text-sm font-semibold mb-2">Active Sales Channels</h3>
                                                        <div className="p-3 border rounded-xl flex justify-between"><span>SANJHHBYAM Online Storefront</span><span className="text-emerald-700 font-semibold">Live</span></div>
                                                        <div className="p-3 border rounded-xl flex justify-between"><span>Instagram &amp; Meta Catalog Sync</span><span className="text-emerald-700 font-semibold">Live</span></div>
                                                    </div>
                                                )}

                                                {settingsSubTab === "domains" && (
                                                    <div className="space-y-3">
                                                        <h3 className="text-sm font-semibold">Custom Domain &amp; Hostinger DNS</h3>
                                                        <input type="text" value={settingsForm.primaryDomain} onChange={e => setSettingsForm({ ...settingsForm, primaryDomain: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs font-mono" />
                                                        <p className="text-[11px] text-emerald-700">SSL Certificate Active | Primary Storefront Domain</p>
                                                    </div>
                                                )}

                                                {settingsSubTab === "customer-events" && (
                                                    <div className="space-y-3">
                                                        <h3 className="text-sm font-semibold">Tracking Pixels &amp; Customer Events</h3>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div><label className="block text-xs text-zinc-500 mb-1">Meta Pixel ID</label><input type="text" value={settingsForm.metaPixelId} onChange={e => setSettingsForm({ ...settingsForm, metaPixelId: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs font-mono" /></div>
                                                            <div><label className="block text-xs text-zinc-500 mb-1">Google Analytics 4 ID</label><input type="text" value={settingsForm.ga4Id} onChange={e => setSettingsForm({ ...settingsForm, ga4Id: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs font-mono" /></div>
                                                        </div>
                                                    </div>
                                                )}

                                                {settingsSubTab === "notifications" && (
                                                    <div className="space-y-3">
                                                        <h3 className="text-sm font-semibold">Automated Patron Notifications &amp; Policies</h3>
                                                        <div><label className="block text-xs text-zinc-500 mb-1">WhatsApp API Provider</label><input type="text" value={settingsForm.whatsappProvider} onChange={e => setSettingsForm({ ...settingsForm, whatsappProvider: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs" /></div>
                                                        <div><label className="block text-xs text-zinc-500 mb-1">7-Day Return &amp; Exchange Policy</label><textarea rows={2} value={settingsForm.returnPolicyText} onChange={e => setSettingsForm({ ...settingsForm, returnPolicyText: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs" /></div>
                                                    </div>
                                                )}

                                                {settingsSubTab === "metafields" && (
                                                    <div className="space-y-3">
                                                        <h3 className="text-sm font-semibold">Ethnic Wear Metafield Definitions</h3>
                                                        <input type="text" value={settingsForm.pinnedMetafields} onChange={e => setSettingsForm({ ...settingsForm, pinnedMetafields: e.target.value })} className="w-full border rounded-lg p-2.5 text-xs" />
                                                    </div>
                                                )}

                                                {settingsSubTab === "languages" && (
                                                    <div className="space-y-3">
                                                        <h3 className="text-sm font-semibold">Storefront Languages</h3>
                                                        <p className="text-xs text-zinc-600">Default: <strong>{settingsForm.primaryLanguage}</strong></p>
                                                        <label className="flex items-center gap-2 text-xs">
                                                            <input type="checkbox" checked={settingsForm.hindiEnabled} onChange={e => setSettingsForm({ ...settingsForm, hindiEnabled: e.target.checked })} className="accent-zinc-900" />
                                                            <span>Enable Hindi (हिन्दी) regional support</span>
                                                        </label>
                                                    </div>
                                                )}

                                                {settingsSubTab === "privacy" && (
                                                    <div className="space-y-3">
                                                        <h3 className="text-sm font-semibold">Customer Privacy &amp; DPDP Compliance</h3>
                                                        <label className="flex items-center gap-2 text-xs">
                                                            <input type="checkbox" checked={settingsForm.cookieBannerEnabled} onChange={e => setSettingsForm({ ...settingsForm, cookieBannerEnabled: e.target.checked })} className="accent-zinc-900" />
                                                            <span>Show cookie consent banner &amp; allow patron JSON data export</span>
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </form>
                                )}
                            </>
                        )}
                    </main>

                    <div className="fixed bottom-4 left-0 md:left-64 right-0 z-30 flex flex-col items-center pointer-events-none px-4">
                        {sidekickReply && (
                            <div className="pointer-events-auto mb-2 bg-zinc-900 text-white text-xs px-4 py-2 rounded-xl shadow-lg flex items-center gap-3">
                                <span>{sidekickReply}</span>
                                <button onClick={() => setSidekickReply("")} className="text-zinc-400 hover:text-white">&times;</button>
                            </div>
                        )}
                        <form
                            onSubmit={handleSidekickAction}
                            className="pointer-events-auto bg-white border border-zinc-300 shadow-lg rounded-full px-4 py-2 flex items-center gap-3 w-full max-w-md"
                        >
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                <Sparkles className="w-3 h-3" />
              </span>
                            <input
                                type="text"
                                value={sidekickInput}
                                onChange={e => setSidekickInput(e.target.value)}
                                placeholder="Work with Sidekick (e.g. 'add product', 'analytics', 'settings')"
                                className="flex-1 text-xs outline-none bg-transparent text-zinc-800 placeholder-zinc-400"
                            />
                            <button type="submit" className="text-zinc-500 hover:text-zinc-900 text-xs font-semibold">+</button>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
}