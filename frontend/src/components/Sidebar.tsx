'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
    Home, BookOpen, GraduationCap, Users, FileText,
    LogOut, Bell, ClipboardList, Layers, Settings, Megaphone, ChevronRight, UserCheck
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }: { isOpen?: boolean, setIsOpen?: (val: boolean) => void }) => {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = React.useState(0);

    React.useEffect(() => {
        const fetchUnread = async () => {
            try {
                const res = await api.get('notifications/unread_count/');
                setUnreadCount(res.data.unread_count);
            } catch (err) { /* silent */ }
        };
        if (user) {
            fetchUnread();
            const interval = setInterval(fetchUnread, 30000); // 30s refresh
            return () => clearInterval(interval);
        }
    }, [user]);

    const role = user?.role || '';
    const roleLabel = role.replace('_', ' ');
    const initials = `${user?.first_name?.charAt(0) ?? ''}${user?.last_name?.charAt(0) ?? ''}`.toUpperCase();

    const menuGroups = [
        {
            label: 'Overview',
            items: [
                { name: 'Dashboard', icon: Home, href: '/dashboard', roles: ['PRINCIPAL', 'VICE_PRINCIPAL', 'HOD', 'TEACHER', 'STUDENT'] },
            ]
        },
        {
            label: 'Academic',
            items: [
                { name: 'Departments', icon: Layers, href: '/dashboard/departments', roles: ['PRINCIPAL', 'VICE_PRINCIPAL'] },
                { name: 'Class Levels', icon: GraduationCap, href: '/dashboard/levels', roles: ['PRINCIPAL', 'VICE_PRINCIPAL', 'HOD', 'TEACHER', 'STUDENT'] },
                { name: 'Subjects', icon: BookOpen, href: '/dashboard/subjects', roles: ['PRINCIPAL', 'VICE_PRINCIPAL', 'HOD', 'TEACHER', 'STUDENT'] },
            ]
        },
        {
            label: 'Management',
            items: [
                { name: 'Students', icon: Users, href: '/dashboard/recruitment/students', roles: ['PRINCIPAL', 'VICE_PRINCIPAL', 'HOD'] },
                { name: 'Teachers', icon: UserCheck, href: '/dashboard/recruitment/teachers', roles: ['PRINCIPAL', 'VICE_PRINCIPAL', 'HOD'] },
            ]
        },
        {
            label: 'Resources',
            items: [
                { name: 'Notes', icon: FileText, href: '/dashboard/notes', roles: ['PRINCIPAL', 'VICE_PRINCIPAL', 'HOD', 'TEACHER', 'STUDENT'] },
                { name: 'Quizzes', icon: ClipboardList, href: '/dashboard/quizzes', roles: ['PRINCIPAL', 'VICE_PRINCIPAL', 'HOD', 'TEACHER', 'STUDENT'] },
                { name: 'Announcements', icon: Megaphone, href: '/dashboard/announcements', roles: ['PRINCIPAL', 'VICE_PRINCIPAL', 'HOD', 'TEACHER', 'STUDENT'] },
                { name: 'Notifications', icon: Bell, href: '/dashboard/notifications', roles: ['PRINCIPAL', 'VICE_PRINCIPAL', 'HOD', 'TEACHER', 'STUDENT'] },
            ]
        },
        {
            label: 'Account',
            items: [
                { name: 'Settings', icon: Settings, href: '/dashboard/settings', roles: ['PRINCIPAL', 'VICE_PRINCIPAL', 'HOD', 'TEACHER', 'STUDENT'] },
            ]
        }
    ];

    const bg = 'var(--sidebar-bg, #0f172a)';

    return (
        <aside
            className={`fixed left-0 top-0 w-64 h-screen flex flex-col z-50 border-r border-white/[0.05] transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            style={{ background: bg }}
        >
            {/* Logo */}
            <div className="px-6 py-7 border-b border-white/[0.06] flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-violet-900/40 overflow-hidden border border-white/[0.06]">
                        <img src="/edulink-logo.png" alt="EduLink Logo" className="w-8 h-8 object-contain" />
                    </div>
                    <div>
                        <span className="text-white font-black text-lg tracking-tight">EduLink</span>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-none">Academic Portal</p>
                    </div>
                </Link>
                {/* Close button for mobile */}
                <button
                    className="lg:hidden p-2 text-slate-500 hover:text-white"
                    onClick={() => setIsOpen?.(false)}
                >
                    <ChevronRight className="rotate-180 w-5 h-5" />
                </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar space-y-8">
                {menuGroups.map((group) => {
                    const filtered = group.items.filter(i => i.roles.includes(role));
                    if (!filtered.length) return null;
                    return (
                        <div key={group.label}>
                            <p className="px-3 text-[10px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-[0.2em] mb-3">
                                {group.label}
                            </p>
                            <nav className="space-y-1">
                                {filtered.map((item) => {
                                    const isActive = pathname === item.href;
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsOpen?.(false)}
                                            className={`flex items-center justify-between px-3 py-3 rounded-xl text-sm font-bold transition-all duration-200 group ${isActive
                                                ? 'bg-violet-600 text-white shadow-xl shadow-violet-900/40 translate-x-1'
                                                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                                                }`}
                                        >
                                            <span className="flex items-center gap-3">
                                                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                                {item.name}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {item.name === 'Notifications' && unreadCount > 0 && (
                                                    <span className="flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-lg shadow-lg shadow-red-900/40">
                                                        {unreadCount > 9 ? '9+' : unreadCount}
                                                    </span>
                                                )}
                                                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    );
                })}
            </div>

            {/* User Footer */}
            <div className="px-4 py-4 border-t border-white/[0.06] bg-black/10">
                {/* Settings */}
                <Link
                    href="/dashboard/settings"
                    onClick={() => setIsOpen?.(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all mb-3 ${pathname === '/dashboard/settings'
                        ? 'bg-white/10 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                >
                    <Settings className="w-4 h-4 text-slate-500" />
                    Settings
                </Link>

                {/* User panel */}
                <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                    <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-sm shadow-violet-900/30">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-bold truncate">{user?.first_name} {user?.last_name}</p>
                        <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest truncate">{roleLabel}</p>
                    </div>
                    <button
                        onClick={logout}
                        title="Logout"
                        className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all shrink-0"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
