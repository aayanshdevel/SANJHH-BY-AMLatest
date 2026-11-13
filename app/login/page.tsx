"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../src/lib/firebase";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function UserLogin() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            if (isLogin) {
                // Log in existing customer
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                // Create new customer account
                await createUserWithEmailAndPassword(auth, email, password);
            }
            // Send them to their account dashboard upon success
            router.push("/account");
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError("An account with this email already exists. Try logging in.");
            } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                setError("Invalid email or password.");
            } else if (err.code === 'auth/weak-password') {
                setError("Password should be at least 6 characters.");
            } else {
                setError("Something went wrong. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full">

                <div className="text-center mb-10">
                    <h1 className="text-3xl font-serif text-zinc-900 mb-3">
                        {isLogin ? "Welcome Back" : "Create Account"}
                    </h1>
                    <p className="text-zinc-500 font-light">
                        {isLogin
                            ? "Sign in to access your orders and saved details."
                            : "Register to save your details for faster checkout."}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-4 mb-6 text-center border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-zinc-900 mb-1">Email</label>
                        <input
                            type="email" required
                            value={email} onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-zinc-200 p-3.5 text-sm outline-none focus:border-zinc-900 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-900 mb-1">Password</label>
                        <input
                            type="password" required
                            value={password} onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-zinc-200 p-3.5 text-sm outline-none focus:border-zinc-900 transition-colors"
                        />
                    </div>

                    <button
                        type="submit" disabled={isLoading}
                        className="w-full bg-zinc-900 text-white flex items-center justify-center gap-2 py-4 text-sm font-semibold tracking-widest uppercase hover:bg-zinc-800 transition-colors disabled:bg-zinc-400 mt-2"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? "Sign In" : "Register")}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError("");
                        }}
                        className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors underline underline-offset-4"
                    >
                        {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
                    </button>
                </div>

            </div>
        </div>
    );
}