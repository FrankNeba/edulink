'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as Icons from 'lucide-react';

export default function QuizSubmissionsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [quiz, setQuiz] = useState<any>(null);
    const [attempts, setAttempts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchData = async () => {
        try {
            const [qRes, aRes] = await Promise.all([
                api.get(`quizzes/${id}/`),
                api.get(`quizzes/${id}/attempts/`)
            ]);
            setQuiz(qRes.data);
            setAttempts(aRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleAllowRetake = async (attemptId: number) => {
        if (!confirm('Allow this student to retake the quiz? Their previous submission will be reset.')) return;
        try {
            await api.post(`quiz-attempts/${attemptId}/allow_retake/`);
            await fetchData();
        } catch (err) {
            alert('Failed to authorize retake');
        }
    };

    const filteredAttempts = attempts.filter(a =>
        a.student_name?.toLowerCase().includes(search.toLowerCase()) ||
        a.student_id?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="p-20 text-center font-black animate-pulse">Loading submissions...</div>;

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">
                        <Icons.BarChart3 className="w-3 h-3" /> Quiz Submissions
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{quiz?.title}</h1>
                    <p className="text-sm font-medium text-slate-500">{quiz?.subject_name} • {attempts.length} Submissions Logged</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search by name or ID..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-11 h-12 w-64 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-bold"
                        />
                    </div>
                </div>
            </header>

            <Card className="overflow-hidden border-slate-100 dark:border-slate-800 rounded-[32px] shadow-2xl shadow-slate-200/50 dark:shadow-none">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50">
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-10">Student</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Score</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Submission</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-10">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {filteredAttempts.map(attempt => (
                            <tr key={attempt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group">
                                <td className="px-8 py-6 pl-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 font-black">
                                            {attempt.student_name?.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-black text-slate-900 dark:text-white uppercase">{attempt.student_name}</div>
                                            <div className="text-[10px] font-bold text-slate-400 tracking-tighter">{attempt.student_id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <span className={`text-lg font-black ${attempt.score >= (quiz?.questions?.length || 0) / 2 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {attempt.score}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold ml-1">pts</span>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    {attempt.auto_submitted ? (
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg text-[10px] font-black uppercase tracking-tight">
                                            <Icons.AlertCircle className="w-3 h-3" /> Auto-submitted
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-[10px] font-black uppercase tracking-tight">
                                            <Icons.ShieldCheck className="w-3 h-3" /> Normal
                                        </div>
                                    )}
                                </td>
                                <td className="px-8 py-6 text-center">
                                    {attempt.is_submitted ? (
                                        <span className="px-2.5 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-[10px] font-black uppercase tracking-tight">Finalized</span>
                                    ) : (
                                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-tight italic">Active</span>
                                    )}
                                </td>
                                <td className="px-8 py-6 text-right pr-10">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="rounded-xl h-9 text-xs font-black gap-2 hover:bg-violet-500/10 hover:text-violet-500"
                                            onClick={() => router.push(`/dashboard/quizzes/attempts/${attempt.id}`)}
                                        >
                                            <Icons.Eye className="w-4 h-4" /> View
                                        </Button>
                                        {attempt.is_submitted && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-xl h-9 text-xs font-black gap-2 border-amber-200 dark:border-amber-900 text-amber-600 hover:bg-amber-500 hover:text-white"
                                                onClick={() => handleAllowRetake(attempt.id)}
                                            >
                                                <Icons.RefreshCcw className="w-4 h-4" /> Reset
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredAttempts.length === 0 && (
                    <div className="p-20 text-center space-y-4">
                        <Icons.Users className="w-12 h-12 text-slate-200 mx-auto" />
                        <p className="text-slate-400 font-bold">No matching submission logs found.</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
