'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QuizRepositoryProps {
    subjectId?: string | number;
}

export default function QuizRepository({ subjectId }: QuizRepositoryProps) {
    const { user } = useAuth();
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);

    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    // Form
    const [title, setTitle] = useState('');
    const [selectedSubject, setSelectedSubject] = useState(subjectId?.toString() || '');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [deadline, setDeadline] = useState('');
    const [duration, setDuration] = useState('60');
    const [file, setFile] = useState<File | null>(null);

    const isTeacher = user?.role === 'TEACHER' || user?.role === 'HOD' || user?.role === 'VICE_PRINCIPAL';

    const fetchData = async () => {
        try {
            const query = subjectId ? `?subject=${subjectId}` : '';
            const [qRes, sRes] = await Promise.all([
                api.get(`quizzes/${query}`),
                api.get('subjects/')
            ]);
            setQuizzes(qRes.data);
            setSubjects(sRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [subjectId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setError('');

        const formData = new FormData();
        formData.append('title', title);
        formData.append('subject', selectedSubject || (subjectId as string));
        formData.append('start_time', new Date(startTime).toISOString());
        formData.append('end_time', new Date(endTime).toISOString());
        if (deadline) formData.append('deadline', new Date(deadline).toISOString());
        formData.append('duration', duration);
        if (file) formData.append('raw_file', file);

        try {
            const res = await api.post('quizzes/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const quizId = res.data.id;

            if (file) {
                // Inform user we are now extracting
                setCreating(true); // Ensure state reflects processing
                try {
                    await api.post(`quizzes/${quizId}/extract/`);
                } catch (extErr: any) {
                    const msg = extErr?.response?.data?.error || 'Quiz saved, but AI extraction failed. You can retry from the list.';
                    setError(msg);
                    // We don't return here because the quiz IS saved
                }
            }

            await fetchData();
            if (!error) {
                setShowCreate(false);
                resetForm();
            }
        } catch (err: any) {
            setError((err?.response?.data?.error || JSON.stringify(err?.response?.data)) ?? 'Failed to create quiz');
        } finally {
            setCreating(false);
        }
    };

    const handleExtract = async (quizId: number) => {
        try {
            await api.post(`quizzes/${quizId}/extract/`);
            await fetchData();
        } catch (err: any) {
            alert(err?.response?.data?.error ?? 'Extraction failed');
        }
    };

    const resetForm = () => {
        setTitle('');
        if (!subjectId) setSelectedSubject('');
        setStartTime('');
        setEndTime('');
        setDeadline('');
        setDuration('60');
        setFile(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const statusBadge = (quiz: any) => {
        const now = new Date();
        const start = new Date(quiz.start_time);
        const end = new Date(quiz.end_time);
        if (now < start) return { label: 'Upcoming', color: 'text-blue-600 bg-blue-500/10 border-blue-500/20' };
        if (now > end) return { label: 'Closed', color: 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent' };
        return { label: 'Live', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' };
    };

    const labelCls = 'text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1 block mb-2';

    if (loading) return <div className="py-12 text-center text-slate-500 font-bold animate-pulse">Loading Assessments...</div>;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                        Assessment Hub
                    </h2>
                    <p className="text-slate-500 font-medium text-xs mt-1">
                        {isTeacher ? 'Create and manage quizzes for your class.' : 'Your upcoming and past quizzes.'}
                    </p>
                </div>
                {isTeacher && (
                    <Button onClick={() => setShowCreate(!showCreate)} className="rounded-2xl h-10 px-6 gap-2 text-xs" variant='outline'>
                        <Icons.Plus className="w-4 h-4" />
                        New Quiz
                    </Button>
                )}
            </div>

            {/* Create Panel */}
            {showCreate && isTeacher && (
                <Card className="p-8 rounded-3xl border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white">New Assessment</h2>
                            <p className="text-[10px] text-slate-500 font-medium mt-1">Upload PDF/DOCX </p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => { setShowCreate(false); resetForm(); }} className="rounded-xl">
                            <Icons.X className="w-5 h-5" />
                        </Button>
                    </div>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <label className={labelCls}>Quiz Title</label>
                            <Input
                                placeholder="e.g. Biology Term 1"
                                value={title} onChange={e => setTitle(e.target.value)}
                                required className="h-11 rounded-xl font-bold"
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Subject</label>
                            <select
                                className="w-full h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-xs font-bold text-slate-900 dark:text-white disabled:opacity-50"
                                value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} required
                                disabled={!!subjectId}
                            >
                                <option value="">Choose subject…</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.academic_level_name})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Start</label>
                            <Input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)}
                                required className="h-11 rounded-xl font-bold text-xs" />
                        </div>
                        <div>
                            <label className={labelCls}>End</label>
                            <Input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)}
                                required className="h-11 rounded-xl font-bold text-xs" />
                        </div>
                        <div>
                            <label className={labelCls}>Duration (min)</label>
                            <Input type="number" min="5" placeholder="60"
                                value={duration} onChange={e => setDuration(e.target.value)}
                                required className="h-11 rounded-xl font-bold text-xs" />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelCls}>File (PDF/DOCX)</label>
                            <div
                                className="h-11 flex items-center gap-3 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-primary/40 transition-colors"
                                onClick={() => fileRef.current?.click()}
                            >
                                <Icons.FileUp className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="text-[10px] text-slate-500 truncate font-medium">
                                    {file ? file.name : 'Click to select…'}
                                </span>
                                <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden"
                                    onChange={e => setFile(e.target.files?.[0] ?? null)} />
                            </div>
                        </div>
                        {error && <p className="lg:col-span-3 text-red-500 text-[10px] font-bold">{error}</p>}
                        <Button type="submit" disabled={creating} className="lg:col-span-3 h-11 rounded-xl" variant='outline'>
                            {creating ? (file ? '⚡ Extracting Questions with AI…' : 'Saving…') : 'Save Assessment'}
                        </Button>
                    </form>
                </Card>
            )}

            {/* List */}
            {quizzes.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                    <Icons.ClipboardList className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                    <h3 className="text-slate-400 font-bold text-sm">No assessments found.</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {quizzes.map(quiz => {
                        const badge = statusBadge(quiz);
                        return (
                            <Card key={quiz.id} className="p-6 rounded-3xl hover:border-primary/30 transition-all border-slate-100 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${badge.color}`}>
                                        {badge.label}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                        <Icons.Clock className="w-3 h-3" />
                                        {quiz.duration}m
                                    </div>
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug mb-4">{quiz.title}</h3>

                                <div className="space-y-3 p-3 rounded-2xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05]">
                                    <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        <span>Status</span>
                                        <span className={quiz.is_extracted ? 'text-emerald-500' : 'text-amber-500'}>
                                            {quiz.is_extracted ? `${quiz.question_count} Extracted` : 'Pending'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        <span>Opens</span>
                                        <span className="text-slate-600 dark:text-slate-300">{new Date(quiz.start_time).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-6">
                                    <div className="flex gap-2 flex-wrap">
                                        {isTeacher && (
                                            <Button size="sm" variant="outline" className="h-8 text-[10px] font-black rounded-lg px-3 gap-1" onClick={() => router.push(`/dashboard/quizzes/${quiz.id}/edit`)}>
                                                <Icons.Pencil size={10} /> Edit
                                            </Button>
                                        )}
                                        {!quiz.is_extracted && quiz.raw_file && (
                                            <Button size="sm" variant="outline" className="h-8 text-[10px] font-black rounded-lg px-3 gap-1" onClick={() => handleExtract(quiz.id)}>
                                                <Icons.Zap size={10} /> AI Extract
                                            </Button>
                                        )}
                                        <Button size="sm" variant="ghost" className="h-8 text-[10px] font-black rounded-lg px-3 gap-1" onClick={() => router.push(`/dashboard/quizzes/${quiz.id}/submissions`)}>
                                            <Icons.BarChart2 size={10} /> Analytics
                                        </Button>
                                    </div>
                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                                        ID: #{quiz.id}
                                    </span>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
