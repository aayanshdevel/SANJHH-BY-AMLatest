"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../src/lib/firebase";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setError("");

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // If successful, push them to the protected dashboard
            router.push("/admin");
        } catch (err: any) {
            setError("Invalid email or password. Please try again.");
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white p-8 border border-zinc-200 shadow-sm">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 bg-zinc-100 flex items-center justify-center rounded-full mb-4">
                        <Lock className="w-5 h-5 text-zinc-900" />
                    </div>
                    <h1 className="text-2xl font-serif text-zinc-900">Admin Login</h1>
                    <p className="text-zinc-500 text-sm mt-2">Sign in to manage your store</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 mb-6 border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-zinc-900 mb-1">Email</label>
                        <input
                            type="email" required
                            value={email} onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-zinc-200 p-3 text-sm outline-none focus:border-zinc-900 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-900 mb-1">Password</label>
                        <input
                            type="password" required
                            value={password} onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-zinc-200 p-3 text-sm outline-none focus:border-zinc-900 transition-colors"
                        />
                    </div>

                    <button
                        type="submit" disabled={isLoggingIn}
                        className="w-full bg-zinc-900 text-white flex items-center justify-center gap-2 py-3.5 text-sm font-semibold tracking-widest uppercase hover:bg-zinc-800 transition-colors disabled:bg-zinc-400 mt-4"
                    >
                        {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}