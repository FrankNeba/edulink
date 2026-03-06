'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Header } from '@/components/layout/Header';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-white dark:bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-12 h-12">
                        <div className="absolute inset-0 border-4 border-violet-600/20 rounded-full" />
                        <div className="absolute inset-0 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-sm font-medium text-slate-500 animate-pulse">Loading…</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background selection:bg-primary/10 transition-colors duration-300">
            {/* Backdrop for mobile sidebar */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div className="lg:pl-64 flex flex-col min-h-screen">
                <Header onToggleSidebar={() => setSidebarOpen(true)} />

                {/* First-login warning banner */}
                {user.first_login && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700 px-6 py-3 flex items-center gap-3">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                            Welcome! For your security, please{' '}
                            <Link
                                href="/dashboard/settings"
                                className="font-bold underline hover:text-amber-900 dark:hover:text-amber-200"
                            >
                                change your temporary password
                            </Link>{' '}
                            as soon as possible.
                        </p>
                    </div>
                )}

                <main className="flex-1 overflow-x-hidden p-6 md:p-10">
                    {children}
                </main>
            </div>
        </div>
    );
}
