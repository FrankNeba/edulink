'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function QuizzesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);

    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    // Detect ?create=1 and ?level= from URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('create') === '1') setShowCreate(true);
    }, []);

    // Form
    const [title, setTitle] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [deadline, setDeadline] = useState('');
    const [duration, setDuration] = useState('60');
    const [file, setFile] = useState<File | null>(null);

    const isTeacher = user?.role === 'TEACHER' || user?.role === 'HOD' || user?.role === 'VICE_PRINCIPAL';

    const fetchData = async () => {
        try {
            const [qRes, sRes] = await Promise.all([
                api.get('quizzes/'),
                api.get('subjects/')
            ]);
            setQuizzes(qRes.data);
            setSubjects(sRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setError('');

        const formData = new FormData();
        formData.append('title', title);
        formData.append('subject', selectedSubject);
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

            // If file uploaded, auto-trigger extraction
            if (file) {
                try {
                    await api.post(`quizzes/${quizId}/extract/`);
                } catch { /* extraction errors shown on result */ }
            }

            await fetchData();
            setShowCreate(false);
            resetForm();
        } catch (err: any) {
            setError(JSON.stringify(err?.response?.data) ?? 'Failed to create quiz');
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
        setTitle(''); setSelectedSubject(''); setStartTime('');
        setEndTime(''); setDeadline(''); setDuration('60');
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

    if (loading) return <div className="p-16 text-center text-slate-500 font-medium animate-pulse">Loading quizzes...</div>;

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Quizzes & Assessments
                    </h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">
                        {isTeacher ? 'Create and manage quizzes for your classes. Upload PDF/DOCX and AI extracts questions.' : 'Your assigned quizzes and assessments.'}
                    </p>
                </div>
                {isTeacher && (
                    <Button onClick={() => setShowCreate(!showCreate)} className="rounded-2xl h-12 px-6 gap-2">
                        <Icons.Plus className="w-5 h-5" />
                        New Quiz
                    </Button>
                )}
            </div>

            {/* Create Panel */}
            {showCreate && isTeacher && (
                <Card className="p-8 rounded-3xl border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Create New Quiz</h2>
                            <p className="text-xs text-slate-500 font-medium mt-1">Upload a PDF or DOCX — AI will extract questions automatically</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => { setShowCreate(false); resetForm(); }} className="rounded-xl">
                            <Icons.X className="w-5 h-5" />
                        </Button>
                    </div>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <label className={labelCls}>Quiz Title</label>
                            <Input
                                placeholder="e.g. Biology Term 1 Assessment"
                                value={title} onChange={e => setTitle(e.target.value)}
                                required className="h-12 rounded-xl font-bold"
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Subject</label>
                            <select
                                className="w-full h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm font-bold text-slate-900 dark:text-white"
                                value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} required
                            >
                                <option value="">Choose subject…</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.level})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Start Date & Time</label>
                            <Input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)}
                                required className="h-12 rounded-xl font-bold" />
                        </div>
                        <div>
                            <label className={labelCls}>End Date & Time</label>
                            <Input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)}
                                required className="h-12 rounded-xl font-bold" />
                        </div>
                        <div>
                            <label className={labelCls}>Submission Deadline</label>
                            <Input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)}
                                className="h-12 rounded-xl font-bold" />
                        </div>
                        <div>
                            <label className={labelCls}>Duration (minutes)</label>
                            <Input type="number" min="5" placeholder="60"
                                value={duration} onChange={e => setDuration(e.target.value)}
                                required className="h-12 rounded-xl font-bold" />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelCls}>Quiz File (PDF or DOCX)</label>
                            <div
                                className="h-12 flex items-center gap-3 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-primary/40 transition-colors"
                                onClick={() => fileRef.current?.click()}
                            >
                                <Icons.FileUp className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="text-sm text-slate-500 truncate font-medium">
                                    {file ? file.name : 'Click to select PDF or DOCX…'}
                                </span>
                                <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden"
                                    onChange={e => setFile(e.target.files?.[0] ?? null)} />
                            </div>
                            <p className="text-[10px] text-slate-400 pl-1 mt-1">Gemini AI will extract multiple-choice questions automatically on upload.</p>
                        </div>
                        {error && <p className="lg:col-span-3 text-red-500 text-xs font-bold">{error}</p>}
                        <Button type="submit" disabled={creating} className="lg:col-span-3 h-12 rounded-xl">
                            {creating ? 'Creating Quiz & Extracting Questions…' : 'Create Quiz'}
                        </Button>
                    </form>
                </Card>
            )}

            {/* Quiz cards */}
            {quizzes.length === 0 ? (
                <div className="py-24 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                    <Icons.ClipboardList className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                    <h3 className="text-slate-500 font-black text-lg">No Quizzes Yet</h3>
                    <p className="text-slate-400 text-sm mt-2">
                        {isTeacher ? 'Create your first quiz using the button above.' : 'No quizzes have been assigned to your subjects yet.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {quizzes.map(quiz => {
                        const badge = statusBadge(quiz);
                        return (
                            <Card key={quiz.id} className="p-6 rounded-3xl hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${badge.color}`}>
                                        {badge.label}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                        <Icons.Clock className="w-3 h-3" />
                                        {quiz.duration} mins
                                    </div>
                                </div>
                                <h3 className="font-black text-slate-900 dark:text-white text-lg leading-snug mb-1">{quiz.title}</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4">{quiz.subject_name}</p>

                                {isTeacher && (
                                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 mb-4 space-y-1">
                                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                                            <span>Questions</span>
                                            <span className={quiz.is_extracted ? 'text-emerald-600' : 'text-amber-500'}>
                                                {quiz.is_extracted ? `${quiz.question_count} extracted` : 'Not extracted'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                                            <span>Opens</span>
                                            <span>{new Date(quiz.start_time).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                                            <span>Closes</span>
                                            <span>{new Date(quiz.end_time).toLocaleString()}</span>
                                        </div>
                                        {quiz.deadline && (
                                            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                                                <span>Deadline</span>
                                                <span className="text-red-500">{new Date(quiz.deadline).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    {isTeacher ? (
                                        <div className="flex gap-2 flex-wrap">
                                            {!quiz.is_extracted && quiz.raw_file && (
                                                <Button size="sm" variant="outline" className="rounded-xl h-8 text-xs font-black gap-1"
                                                    onClick={() => handleExtract(quiz.id)}>
                                                    <Icons.Zap size={12} /> Extract with AI
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="rounded-xl h-8 text-xs font-black gap-1"
                                                onClick={() => router.push(`/dashboard/quizzes/${quiz.id}/submissions`)}
                                            >
                                                <Icons.BarChart2 size={12} /> Results
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            {quiz.my_attempt?.is_submitted ? (
                                                <Button
                                                    onClick={() => router.push(`/dashboard/quizzes/${quiz.id}/results`)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-black hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-500/10"
                                                >
                                                    <Icons.CheckCircle size={14} /> View Result
                                                </Button>
                                            ) : (
                                                badge.label === 'Live' ? (
                                                    <Button
                                                        onClick={() => router.push(`/dashboard/quizzes/${quiz.id}/take`)}
                                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary/90 transition-colors"
                                                    >
                                                        <Icons.Play size={14} /> Start Quiz
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-slate-400 font-bold italic">
                                                        {badge.label === 'Upcoming' ? `Opens ${new Date(quiz.start_time).toLocaleDateString()}` : 'Assessment Closed'}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    )}
                                    <span className="text-[10px] text-slate-400 font-medium">
                                        Due: {new Date(quiz.end_time).toLocaleDateString()}
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
