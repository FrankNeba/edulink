'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as Icons from 'lucide-react';
import MathText from '@/components/ui/MathText';

export default function TakeQuizPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [quiz, setQuiz] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<{ [key: string]: number }>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [started, setStarted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [starting, setStarting] = useState(false);

    const quizContainerRef = useRef<HTMLDivElement>(null);

    // Security: Tab Switching & Visibility
    const handleVisibilityChange = useCallback(() => {
        if (started && document.visibilityState === 'hidden') {
            console.warn('Tab switched! Auto-submitting...');
            handleSubmit(true);
        }
    }, [started]);

    const handleFullScreenChange = useCallback(() => {
        if (started && !document.fullscreenElement) {
            console.warn('Exited FullScreen! Auto-submitting...');
            handleSubmit(true);
        }
    }, [started]);

    useEffect(() => {
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
        };
    }, [handleVisibilityChange, handleFullScreenChange]);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const res = await api.get(`quizzes/${id}/take/`);
                setQuiz(res.data);
                setTimeLeft(res.data.duration * 60);
            } catch (err: any) {
                alert(err.response?.data?.error || 'Failed to load quiz');
                router.back();
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [id, router]);

    useEffect(() => {
        if (started && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleSubmit(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [started, timeLeft]);

    const startQuiz = async () => {
        setStarting(true);
        // Try fullscreen — but don't block the quiz if it fails
        if (quizContainerRef.current) {
            try {
                await quizContainerRef.current.requestFullscreen();
                setIsFullScreen(true);
            } catch (err) {
                console.warn('FullScreen request denied — continuing without it.', err);
            }
        }
        setStarted(true);
        setStarting(false);
    };

    const handleSubmit = async (isAuto = false) => {
        if (submitting) return;
        setSubmitting(true);

        const formattedAnswers = Object.entries(answers).map(([qId, cId]) => ({
            question_id: parseInt(qId),
            choice_id: cId
        }));

        try {
            await api.post(`quizzes/${id}/submit/`, {
                answers: formattedAnswers,
                auto_submitted: isAuto
            });
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            }
            router.replace(`/dashboard/quizzes/${id}/results`);
        } catch (err) {
            console.error('Submission failed', err);
            setSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (loading) return <div className="p-20 text-center font-black animate-pulse">Loading quiz...</div>;

    if (!started) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-4">
                <Card className="max-w-md w-full p-8 space-y-8 text-center border-none shadow-2xl bg-white dark:bg-slate-950 rounded-[32px]">
                    <div className="w-20 h-20 rounded-3xl bg-violet-600/10 flex items-center justify-center text-violet-600 mx-auto mb-6">
                        <Icons.ShieldAlert className="w-10 h-10" />
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{quiz?.title}</h1>
                        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-black text-slate-500 uppercase tracking-widest">
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 rounded-xl">
                                <Icons.Clock className="w-3.5 h-3.5" /> {quiz?.duration} Minutes
                            </span>
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 rounded-xl">
                                <Icons.ListChecks className="w-3.5 h-3.5" /> {quiz?.questions?.length} Questions
                            </span>
                        </div>
                    </div>

                    <Card className="p-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 text-left rounded-2xl">
                        <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-3 flex items-center gap-2">
                            <Icons.AlertTriangle className="w-3 h-3" /> Before You Start
                        </h4>
                        <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-2 font-bold leading-relaxed">
                            <li>&bull; The quiz will open in full-screen mode.</li>
                            <li>&bull; Switching tabs or apps will automatically submit your answers.</li>
                            <li>&bull; Exiting full-screen will automatically submit your answers.</li>
                            <li>&bull; You cannot retake the quiz without teacher approval.</li>
                        </ul>
                    </Card>

                    <Button className="w-full h-14 btn-modern-primary rounded-2xl text-lg font-black" onClick={startQuiz} disabled={starting}>
                        {starting ? 'Starting...' : 'Start Quiz'}
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div
            ref={quizContainerRef}
            className="fixed inset-0 z-[9999] bg-white dark:bg-slate-950 flex flex-col items-center overflow-y-auto"
        >
            <div className="w-full max-w-4xl px-6 py-10 space-y-12">
                <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 z-10 px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-6 bg-violet-600 rounded-full" />
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight truncate max-w-[200px] md:max-w-md">
                            {quiz?.title}
                        </h2>
                    </div>

                    <div className={`px-5 py-2 rounded-2xl border font-black text-xl flex items-center gap-3 ${timeLeft < 60 ? 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                        <Icons.Timer className="w-6 h-6" />
                        {formatTime(timeLeft)}
                    </div>
                </header>

                <div className="pt-24 pb-32 space-y-16">
                    {quiz?.questions?.map((q: any, idx: number) => (
                        <div key={q.id} className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
                            <div className="flex gap-6 items-start">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center flex-shrink-0 text-xl font-black text-slate-400">
                                    {idx + 1}
                                </div>
                                <div className="space-y-4 flex-1">
                                    <MathText text={q.text} as="div" className="text-2xl font-bold text-slate-900 dark:text-white leading-tight" />
                                    {q.image && (
                                        <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 max-w-2xl">
                                            <img src={q.image} alt="Question Graphic" className="w-full h-auto object-contain max-h-[400px]" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-18">
                                {q.choices?.map((c: any) => (
                                    <button
                                        key={c.id}
                                        onClick={() => setAnswers(prev => ({ ...prev, [q.id]: c.id }))}
                                        className={`p-6 rounded-[24px] border-2 text-left transition-all relative overflow-hidden group ${answers[q.id] === c.id
                                            ? 'border-violet-600 bg-violet-600/[0.03] shadow-lg shadow-violet-600/5'
                                            : 'border-slate-100 dark:border-slate-800 hover:border-violet-400 dark:hover:border-violet-800 bg-white dark:bg-slate-900'
                                            }`}
                                    >
                                        <div className="flex gap-4 items-center">
                                            <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${answers[q.id] === c.id ? 'border-violet-600 bg-violet-600' : 'border-slate-300 dark:border-slate-700'
                                                }`}>
                                                {answers[q.id] === c.id && <Icons.Check className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <MathText text={c.text} className={`font-bold transition-colors ${answers[q.id] === c.id ? 'text-violet-600' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <footer className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 p-6 flex justify-center z-10">
                    <Button
                        className="w-full max-w-md h-14 btn-modern-primary rounded-2xl text-lg font-black"
                        onClick={() => {
                            if (confirm('Are you sure you want to submit your answers? This cannot be undone.')) {
                                handleSubmit(false);
                            }
                        }}
                        disabled={submitting}
                    >
                        {submitting ? 'Submitting...' : 'Submit Answers'}
                    </Button>
                </footer>
            </div>
        </div>
    );
}
