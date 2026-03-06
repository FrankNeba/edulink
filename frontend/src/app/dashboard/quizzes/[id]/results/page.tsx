'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import * as Icons from 'lucide-react';

export default function QuizResultsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const res = await api.get(`quizzes/${id}/results/`);
                setResult(res.data);
            } catch (err: any) {
                console.error('Failed to load results', err);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [id]);

    if (loading) return <div className="p-20 text-center font-black animate-pulse">Loading your results...</div>;

    if (!result) return (
        <div className="p-20 text-center space-y-6">
            <Icons.SearchX className="w-16 h-16 text-slate-300 mx-auto" />
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">No Results Found</h2>
            <p className="text-slate-500 font-medium">No submission found for this quiz.</p>
            <Button onClick={() => router.push('/dashboard/quizzes')} className="rounded-xl">Back to Quizzes</Button>
        </div>
    );

    const percentage = (result.score / (result.answers?.length || 1)) * 100;
    const isPassing = percentage >= 50;

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20 pt-6">
            <header className="text-center space-y-6">
                <div className="flex items-center justify-center gap-2 text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">
                    <Icons.CheckCircle className="w-3 h-3 text-emerald-500" />
                    Quiz Completed
                </div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{result.quiz_title}</h1>

                <div className="flex justify-center gap-10 pt-4">
                    <div className="text-center space-y-1">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</div>
                        <div className={`text-5xl font-black ${isPassing ? 'text-emerald-500' : 'text-red-500'}`}>{result.score}</div>
                    </div>
                    <div className="w-px h-16 bg-slate-100 dark:bg-slate-800 self-center" />
                    <div className="text-center space-y-1">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Percentage</div>
                        <div className={`text-5xl font-black ${isPassing ? 'text-emerald-500' : 'text-red-500'}`}>{Math.round(percentage)}%</div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-slate-50 dark:bg-slate-900/50 border-none rounded-3xl text-center space-y-2">
                    <Icons.Calendar className="w-5 h-5 text-slate-400 mx-auto" />
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitted</div>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {new Date(result.end_time).toLocaleDateString()}
                    </div>
                </Card>
                <Card className="p-6 bg-slate-50 dark:bg-slate-900/50 border-none rounded-3xl text-center space-y-2">
                    <Icons.Activity className="w-5 h-5 text-slate-400 mx-auto" />
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submission</div>
                    <div className={`text-sm font-bold ${result.auto_submitted ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {result.auto_submitted ? 'Auto-submitted' : 'Completed normally'}
                    </div>
                </Card>
                <Card className="p-6 bg-slate-50 dark:bg-slate-900/50 border-none rounded-3xl text-center space-y-2">
                    <Icons.User className="w-5 h-5 text-slate-400 mx-auto" />
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student ID</div>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{result.student_id}</div>
                </Card>
            </div>

            <section className="space-y-6">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                    <div className="w-2 h-6 bg-violet-600 rounded-full" />
                    Answers Review
                </h3>

                <div className="space-y-6">
                    {result.answers?.map((ans: any, idx: number) => (
                        <Card key={ans.id} className="p-8 border-slate-100 dark:border-slate-800 rounded-[32px] overflow-hidden group">
                            <div className="flex gap-6 items-start">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl font-black ${ans.is_correct ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {idx + 1}
                                </div>
                                <div className="space-y-6 flex-1">
                                    <div className="space-y-2">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question</div>
                                        <h4 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{ans.question_text}</h4>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Answer</div>
                                            <div className={`p-4 rounded-2xl border-2 flex items-center gap-3 ${ans.is_correct ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400' : 'border-red-500/20 bg-red-500/5 text-red-700 dark:text-red-400'}`}>
                                                {ans.is_correct ? <Icons.CheckCircle className="w-4 h-4" /> : <Icons.XCircle className="w-4 h-4" />}
                                                <span className="font-bold">{ans.selected_choice_text}</span>
                                            </div>
                                        </div>
                                        {!ans.is_correct && (
                                            <div className="space-y-2">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Correct Answer</div>
                                                <div className="p-4 rounded-2xl border-2 border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 flex items-center gap-3">
                                                    <Icons.CheckCircle className="w-4 h-4" />
                                                    <span className="font-bold">{ans.correct_choice_text}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            <footer className="flex justify-center pt-8">
                <Button
                    onClick={() => router.push('/dashboard/quizzes')}
                    className="h-14 px-10 rounded-2xl btn-modern-primary text-lg font-black"
                >
                    Back to Quizzes
                </Button>
            </footer>
        </div>
    );
}
