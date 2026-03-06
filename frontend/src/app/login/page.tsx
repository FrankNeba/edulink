'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, Loader2, AlertCircle, Eye, ShieldCheck, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await login(email, password);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Invalid credentials. Please verify your system identifiers.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#020617]">
            {/* Left Side */}
            <div className="hidden lg:flex flex-col justify-between p-16 relative overflow-hidden bg-slate-950 border-r border-white/[0.05]">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-600/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

                <Link href="/" className="flex items-center gap-4 relative z-10 transition-transform active:scale-95">
                    <div className="bg-white p-2 rounded-2xl shadow-xl shadow-violet-900/40 w-12 h-12 flex items-center justify-center overflow-hidden">
                        <img src="/edulink-logo.png" alt="EduLink Logo" className="w-10 h-10 object-contain" />
                    </div>
                    <span className="text-2xl font-black text-white tracking-tight">EDULINK <span className="text-violet-500 font-light">LMS</span></span>
                </Link>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/80">Secure Login</span>
                    </div>
                    <h2 className="text-6xl font-black text-white leading-[1.1] mb-8 tracking-tighter">
                        Building the <span className="text-violet-500">Future</span> of Learning.
                    </h2>
                    <p className="text-slate-400 max-w-md text-lg leading-relaxed font-medium">
                        Next-generation academic management for modern institutions. Secure, scalable, and built for integrity.
                    </p>
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-8 py-6 border-t border-white/[0.05]">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Secure Access</span>
                            <span className="text-xs font-bold text-slate-300">Encrypted Connection</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Status</span>
                            <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Systems Online</span>
                        </div>
                    </div>
                    <div className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">
                        © 2026 EDULINK CORE SYSTEMS
                    </div>
                </div>
            </div>

            {/* Right Side: Auth Form */}
            <div className="flex items-center justify-center p-8 bg-white dark:bg-[#020617] relative">
                <div className="w-full max-w-[420px] relative z-10">
                    <div className="lg:hidden mb-16 flex items-center justify-center gap-4">
                        <div className="bg-white p-2 rounded-2xl shadow-xl shadow-violet-900/40 w-12 h-12 flex items-center justify-center overflow-hidden">
                            <img src="/edulink-logo.png" alt="EduLink Logo" className="w-10 h-10 object-contain" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter dark:text-white">EDULINK</span>
                    </div>

                    <div className="mb-12">
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Welcome Back</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Sign in to your account to continue.</p>
                    </div>

                    {error && (
                        <div className="p-5 mb-8 bg-red-500/10 border border-red-500/20 rounded-[1rem] flex items-start gap-4 transition-all shadow-xl shadow-red-500/5">
                            <AlertCircle className="w-5 h-5 text-red-500 mt-1 shrink-0" />
                            <div>
                                <p className="text-[11px] font-black uppercase text-red-500 tracking-widest mb-1">Authorization Rejected</p>
                                <p className="text-xs text-red-700 dark:text-red-400 font-bold leading-relaxed">{error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">
                                Email
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-violet-600 transition-colors z-20 pointer-events-none" />
                                <input
                                    type="email"
                                    className="input-modern !pl-14 h-14 bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 focus:ring-4 focus:ring-violet-500/10 relative z-10"
                                    placeholder="j.doe@institution.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
                                    Password
                                </label>
                                <Link href="#" className="text-[10px] font-black text-violet-600 uppercase tracking-widest hover:underline">Reset</Link>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-violet-600 transition-colors z-20 pointer-events-none" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="input-modern !pl-14 !pr-14 h-14 bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 focus:ring-4 focus:ring-violet-500/10 relative z-10"
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 transition-colors z-20"
                                >
                                    {showPassword ? (
                                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <input type="checkbox" id="remember" className="w-5 h-5 rounded-lg border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer bg-slate-50 dark:bg-slate-900" />
                                <label htmlFor="remember" className="text-xs text-slate-500 dark:text-slate-400 font-bold cursor-pointer">Remember me</label>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                                <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">TLS 1.3 Active</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary w-full h-14 text-sm font-black uppercase tracking-[0.2em] shadow-2xl shadow-violet-900/40 relative group overflow-hidden"
                            disabled={isLoading}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        Sign In <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </form>

                    <p className="mt-12 text-center text-xs text-slate-500 font-bold uppercase tracking-widest">
                        Issue? <Link href="#" className="text-violet-600 font-black hover:underline ml-1">Contact Operations</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
