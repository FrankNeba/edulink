'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import * as Icons from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AcademicLevel {
    id: number;
    name: string;
    domain: number;
    domain_name: string;
    sub_domain: number | null;
    sub_domain_name: string | null;
}

export default function LevelsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [levels, setLevels] = useState<AcademicLevel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLevels = async () => {
            try {
                if (user?.role === 'STUDENT' && user.profile?.level) {
                    // Redirect student to their specific level
                    const levelName = user.profile.level;
                    const domainId = user.profile.domain;
                    const subDomainId = user.profile.sub_domain || '';
                    router.replace(`/dashboard/levels/${encodeURIComponent(levelName)}?domain=${domainId}&sub_domain=${subDomainId}`);
                    return;
                }

                const res = await api.get('academic-levels/');
                setLevels(res.data);
            } catch (err) {
                console.error('Failed to fetch academic levels', err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchLevels();
    }, [user, router]);

    // Grouping logic
    const generalLevels = levels.filter(l => l.domain_name === 'General');
    const vocationalLevels = levels.filter(l => l.domain_name === 'Vocational');

    const renderLevelGroup = (title: string, data: AcademicLevel[], icon: React.ReactNode) => {
        // Further group by sub_domain
        const subGroups: { [key: string]: AcademicLevel[] } = {};
        data.forEach(l => {
            const sd = l.sub_domain_name || 'Common';
            if (!subGroups[sd]) subGroups[sd] = [];
            subGroups[sd].push(l);
        });

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-violet-600/10 flex items-center justify-center border border-violet-600/20 text-violet-600">
                        {icon}
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{title}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {Object.entries(subGroups).map(([sdName, groupLevels]) => (
                        <div key={sdName} className="space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 px-2">
                                <span className="w-1 h-3 bg-violet-500 rounded-full" />
                                {sdName} Stream
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {groupLevels.map((l) => (
                                    <div
                                        key={l.id}
                                        className="card-base p-6 flex items-center justify-between cursor-pointer hover:border-violet-500 hover:bg-violet-500/[0.02] group transition-all"
                                        onClick={() => router.push(`/dashboard/levels/${encodeURIComponent(l.name)}?domain=${l.domain}&sub_domain=${l.sub_domain || ''}`)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-violet-600 group-hover:text-white transition-all">
                                                <Icons.GraduationCap className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-lg font-black text-slate-900 dark:text-white group-hover:text-violet-600 transition-colors">
                                                    {l.name}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    View subjects
                                                </div>
                                            </div>
                                        </div>
                                        <Icons.ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <Icons.Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
            <p className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">Loading class levels...</p>
        </div>
    );

    return (
        <div className="space-y-20 max-w-7xl mx-auto pb-20 px-4 pt-10">
            <header className="space-y-3">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                    Class <span className="text-violet-600">Levels</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight max-w-2xl">
                    Browse all class levels grouped by section and stream.
                </p>
            </header>

            <div className="space-y-24">
                {generalLevels.length > 0 && renderLevelGroup('General Section', generalLevels, <Icons.BookOpen className="w-6 h-6" />)}
                {vocationalLevels.length > 0 && renderLevelGroup('Vocational Section', vocationalLevels, <Icons.ShieldCheck className="w-6 h-6" />)}
            </div>
        </div>
    );
}
