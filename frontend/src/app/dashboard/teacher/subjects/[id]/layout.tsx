'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function SubjectHubLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const id = params.id;
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuth();

    const [subject, setSubject] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubject = async () => {
            try {
                const res = await api.get(`subjects/${id}/`);
                setSubject(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchSubject();
    }, [id]);

    if (loading) return <div className="p-12 animate-pulse text-slate-500 font-bold">Loading subject...</div>;
    if (!subject) return <div className="p-12 text-center text-red-500 font-bold">Subject not found.</div>;

    const tabs = [
        { id: 'notes', label: 'Study Resources', icon: Icons.FileText, path: `/dashboard/teacher/subjects/${id}/notes` },
        { id: 'syllabus', label: 'Official Syllabus', icon: Icons.ScrollText, path: `/dashboard/teacher/subjects/${id}/syllabus` },
        { id: 'assessments', label: 'Assessment Hub', icon: Icons.Zap, path: `/dashboard/teacher/subjects/${id}/assessments` },
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Subject Header */}
            <div className="relative overflow-hidden rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-8 shadow-xl shadow-slate-200/50 dark:shadow-none">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div>
                        <button
                            onClick={() => router.push('/dashboard/subjects')}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary mb-4 transition-colors"
                        >
                            <Icons.ArrowLeft size={12} /> Back to Subjects
                        </button>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-2.5 py-1 bg-violet-600/10 text-violet-600 dark:text-violet-400 text-[9px] font-black rounded-lg border border-violet-600/20 uppercase tracking-widest">
                                {subject.code}
                            </span>
                            <span className="px-2.5 py-1 bg-primary/10 text-primary text-[9px] font-black rounded-lg border border-primary/20 uppercase tracking-widest">
                                {subject.level}
                            </span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            {subject.name}
                        </h1>
                        <p className="text-slate-500 text-xs font-bold mt-1 flex items-center gap-2 uppercase tracking-wide">
                            <Icons.Building size={14} /> {subject.department_name}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-white/[0.05]">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-sm">
                            {(user?.first_name?.[0] || 'T').toUpperCase()}
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Assigned Teacher</div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">{user?.first_name} {user?.last_name}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/[0.05] w-fit">
                {tabs.map((tab) => {
                    const isActive = pathname.includes(tab.id);
                    return (
                        <Link key={tab.id} href={tab.path}>
                            <div className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300 cursor-pointer ${isActive
                                    ? 'bg-white dark:bg-slate-800 text-primary shadow-lg shadow-primary/10 border border-slate-200/50 dark:border-white/[0.05]'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}>
                                <tab.icon size={18} className={isActive ? 'scale-110' : ''} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="animate-in slide-in-from-bottom-4 duration-700">
                {children}
            </div>
        </div>
    );
}
