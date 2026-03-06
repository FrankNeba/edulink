'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as Icons from 'lucide-react';

export default function NotificationsPage() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('notifications/');
            setNotifications(res.data);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAllRead = async () => {
        try {
            await api.post('notifications/mark_all_as_read/');
            fetchNotifications();
        } catch (err) { /* silent */ }
    };

    const markRead = async (id: number) => {
        try {
            await api.post(`notifications/${id}/mark_as_read/`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (err) { /* silent */ }
    };

    const getIcon = (category: string) => {
        switch (category) {
            case 'quiz': return <Icons.ClipboardList className="w-5 h-5 text-violet-500" />;
            case 'notes': return <Icons.FileText className="w-5 h-5 text-blue-500" />;
            case 'announcement': return <Icons.Megaphone className="w-5 h-5 text-amber-500" />;
            case 'success': return <Icons.CheckCircle className="w-5 h-5 text-emerald-500" />;
            case 'warning': return <Icons.AlertTriangle className="w-5 h-5 text-amber-500" />;
            default: return <Icons.Bell className="w-5 h-5 text-slate-400" />;
        }
    };

    if (loading) return <div className="p-20 text-center font-medium text-slate-400 animate-pulse">Loading notifications...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Notifications</h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Stay updated with the latest school activities and alerts.</p>
                </div>
                {notifications.some(n => !n.read) && (
                    <Button
                        onClick={markAllRead}
                        className="rounded-2xl h-11 px-6 btn-modern-primary text-xs font-black uppercase tracking-widest gap-2"
                    >
                        <Icons.CheckCheck className="w-4 h-4" /> Mark All Read
                    </Button>
                )}
            </header>

            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <div className="py-32 text-center space-y-4 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[40px]">
                        <Icons.BellOff className="w-16 h-16 text-slate-200 mx-auto" />
                        <h3 className="text-slate-400 font-black uppercase tracking-widest">All caught up!</h3>
                        <p className="text-slate-300 text-xs font-bold">No new notifications at this time.</p>
                    </div>
                ) : (
                    notifications.map((notif, idx) => (
                        <Card
                            key={notif.id}
                            onClick={() => !notif.read && markRead(notif.id)}
                            className={`p-6 rounded-[32px] border transition-all cursor-pointer group animate-in slide-in-from-bottom-4 duration-500 ${notif.read
                                ? 'bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-900 opacity-60'
                                : 'bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/20 dark:to-slate-950 border-violet-200 dark:border-violet-800 shadow-xl shadow-violet-500/5'
                                }`}
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                            <div className="flex gap-6 items-start">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${notif.read ? 'bg-slate-100 dark:bg-slate-900' : 'bg-white dark:bg-slate-900 shadow-sm'
                                    }`}>
                                    {getIcon(notif.category)}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className={`text-lg font-black tracking-tight ${notif.read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                                            {notif.title}
                                        </h4>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {new Date(notif.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className={`text-sm leading-relaxed ${notif.read ? 'text-slate-500 font-medium' : 'text-slate-600 dark:text-slate-300 font-bold'}`}>
                                        {notif.message}
                                    </p>
                                    {notif.link && (
                                        <Button
                                            variant="ghost"
                                            className="h-auto p-0 text-xs font-black text-violet-600 hover:text-violet-500 hover:bg-transparent gap-1.5 uppercase tracking-widest pt-2"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (notif.link) window.location.href = notif.link;
                                            }}
                                        >
                                            <span className="text-violet-600 font-semibold hover:underline">View &rarr;</span>
                                        </Button>
                                    )}
                                </div>
                                {!notif.read && (
                                    <div className="w-3 h-3 rounded-full bg-violet-600 shadow-[0_0_12px_rgba(124,58,237,0.5)] shrink-0 mt-2 animate-pulse" />
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
