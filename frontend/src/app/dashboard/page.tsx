'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import * as Icons from 'lucide-react';
import Link from 'next/link';
import { StatCard } from '@/components/dashboard/StatCard';

const LEVEL_META: Record<string, { color: string }> = {
    SCHOOL:    { color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700/40' },
    DOMAIN:    { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/40' },
    SUBDOMAIN: { color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/40' },
    CLASS:     { color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/40' },
    SUBJECT:   { color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/40' },
};

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statRes, annRes, subRes] = await Promise.all([
                    api.get('users/analytics/'),
                    api.get('announcements/'),
                    api.get('subjects/'),
                ]);
                setStats(statRes.data);
                setAnnouncements(annRes.data.slice(0, 5));
                setSubjects(subRes.data.slice(0, 4));
            } catch (err) {
                console.error('Dashboard data fetch failed', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getRoleGreeting = () => {
        switch (user?.role) {
            case 'PRINCIPAL':       return 'Principal Dashboard';
            case 'VICE_PRINCIPAL':  return 'Administration Overview';
            case 'HOD':             return 'Department Overview';
            case 'TEACHER':         return 'Teacher Dashboard';
            case 'STUDENT':         return 'My Learning Dashboard';
            default:                return 'Dashboard';
        }
    };

    const cards: any[] = [];
    if (user?.role === 'STUDENT') {
        cards.push({ title: 'My Subjects',     value: stats?.subjects ?? 0,            icon: Icons.BookOpen,      href: '/dashboard/subjects', color: '#6d28d9' });
        cards.push({ title: 'Enrolled',         value: stats?.registered_subjects ?? 0, icon: Icons.CircleCheck,   href: '/dashboard/subjects', color: '#10b981' });
        cards.push({ title: 'Notes Available',  value: stats?.notes ?? 0,              icon: Icons.FileText,      href: '/dashboard/notes',    color: '#8b5cf6' });
        cards.push({ title: 'Active Quizzes',   value: stats?.quizzes ?? 0,            icon: Icons.ClipboardList, href: '/dashboard/quizzes',  color: '#f59e0b' });
    } else if (user?.role === 'TEACHER') {
        cards.push({ title: 'My Subjects',  value: stats?.subjects ?? 0, icon: Icons.BookOpen,      href: '/dashboard/subjects', color: '#6d28d9' });
        cards.push({ title: 'My Students',  value: stats?.students ?? 0, icon: Icons.Users,         href: '/dashboard/subjects', color: '#7c3aed' });
        cards.push({ title: 'My Notes',     value: stats?.notes ?? 0,   icon: Icons.FileText,      href: '/dashboard/notes',    color: '#d946ef' });
        cards.push({ title: 'My Quizzes',   value: stats?.quizzes ?? 0, icon: Icons.ClipboardList, href: '/dashboard/quizzes',  color: '#10b981' });
    } else if (user?.role === 'HOD') {
        cards.push({ title: 'Subjects',  value: stats?.subjects ?? 0, icon: Icons.BookOpen,   href: '/dashboard/subjects',             color: '#6d28d9' });
        cards.push({ title: 'Students',  value: stats?.students ?? 0, icon: Icons.Users,      href: '/dashboard/recruitment/students', color: '#7c3aed' });
        cards.push({ title: 'Teachers',  value: stats?.teachers ?? 0, icon: Icons.UserCheck,  href: '/dashboard/recruitment/teachers', color: '#6366f1' });
        cards.push({ title: 'Quizzes',   value: stats?.quizzes ?? 0,  icon: Icons.ClipboardList, href: '/dashboard/quizzes',           color: '#10b981' });
    } else if (user?.role === 'VICE_PRINCIPAL' || user?.role === 'PRINCIPAL') {
        cards.push({ title: 'Total Subjects',   value: stats?.subjects ?? 0,     icon: Icons.BookOpen,   href: '/dashboard/subjects',             color: '#6d28d9' });
        cards.push({ title: 'Total Students',   value: stats?.students ?? 0,     icon: Icons.Users,      href: '/dashboard/recruitment/students', color: '#7c3aed' });
        cards.push({ title: 'Total Teachers',   value: stats?.teachers ?? 0,     icon: Icons.UserCheck,  href: '/dashboard/recruitment/teachers', color: '#6366f1' });
        cards.push({ title: 'Departments',      value: stats?.departments ?? 0,  icon: Icons.Layers,     href: '/dashboard/departments',          color: '#10b981' });
    }

    if (loading) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="relative w-10 h-10">
                <div className="absolute inset-0 border-4 border-violet-600/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-sm font-medium text-slate-400 animate-pulse">Loading your dashboard…</p>
        </div>
    );

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-16">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-violet-600 dark:text-violet-400 mb-1">
                        {user?.role?.replace('_', ' ')}
                    </p>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.first_name}!
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{getRoleGreeting()}</p>
                </div>
                <p className="text-sm text-slate-400 font-medium hidden md:block">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card, i) => <StatCard key={i} {...card} />)}
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                {/* Announcements */}
                <div className="xl:col-span-7 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black text-slate-900 dark:text-white">Recent Announcements</h2>
                        <Link href="/dashboard/announcements" className="text-sm font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1">
                            View all <Icons.ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {announcements.map((ann) => {
                            const meta = LEVEL_META[ann.level] ?? LEVEL_META.SUBJECT;
                            const target = ann.subject_name || ann.target_class || ann.domain_name || ann.sub_domain_name;
                            return (
                                <div key={ann.id} className="card-base p-5 hover:border-violet-200 dark:hover:border-violet-700 transition-all">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <h3 className="font-bold text-slate-900 dark:text-white leading-snug">{ann.title}</h3>
                                        <span className={`shrink-0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${meta.color}`}>
                                            {ann.level === 'SCHOOL' ? 'School-wide' : ann.level}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-3">{ann.content}</p>
                                    <div className="flex items-center justify-between text-xs text-slate-400">
                                        <span className="font-medium">By {ann.author_name}{target ? ` · ${target}` : ''}</span>
                                        <span>{new Date(ann.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            );
                        })}

                        {announcements.length === 0 && (
                            <div className="card-base p-12 text-center border-dashed">
                                <Icons.Inbox className="w-10 h-10 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
                                <p className="text-slate-400 font-medium text-sm">No announcements yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="xl:col-span-5 space-y-6">
                    {/* My Subjects */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white">
                                {user?.role === 'STUDENT' ? 'My Subjects' : 'Active Subjects'}
                            </h2>
                            <Link href="/dashboard/subjects" className="text-sm font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1">
                                View all <Icons.ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="card-base overflow-hidden divide-y divide-slate-50 dark:divide-slate-800 p-0">
                            {subjects.length > 0 ? subjects.map((s) => (
                                <Link key={s.id} href={`/dashboard/subjects/${s.id}`} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                                    <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center font-black text-sm">
                                        {s.code?.slice(0, 2)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{s.name}</p>
                                        <p className="text-xs text-slate-400">{s.level}</p>
                                    </div>
                                    <Icons.ChevronRight size={16} className="text-slate-300 group-hover:text-violet-500 transition-colors shrink-0" />
                                </Link>
                            )) : (
                                <div className="p-8 text-center">
                                    <p className="text-sm text-slate-400">No subjects found.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Notes',          icon: Icons.FileText,      href: '/dashboard/notes',          color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' },
                                { label: 'Quizzes',        icon: Icons.ClipboardList, href: '/dashboard/quizzes',        color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' },
                                { label: 'Notifications',  icon: Icons.Bell,          href: '/dashboard/notifications',  color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' },
                                { label: 'Settings',       icon: Icons.Settings,      href: '/dashboard/settings',       color: 'text-slate-500 bg-slate-50 dark:bg-slate-800' },
                            ].map((item) => (
                                <Link key={item.href} href={item.href}
                                    className="card-base p-4 flex items-center gap-3 hover:border-violet-200 dark:hover:border-violet-700 transition-all group">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                                        <item.icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
