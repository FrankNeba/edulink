'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MathText from '@/components/ui/MathText';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Choice { id: number; text: string; is_correct: boolean; }
interface Question { id: number; quiz: number; text: string; points: number; order: number; choices: Choice[]; }
interface Quiz {
    id: number; title: string; subject: number; subject_name: string;
    start_time: string; end_time: string; deadline: string | null;
    duration: number; is_extracted: boolean; question_count: number; raw_file: string | null;
}

function toDatetimeLocal(iso: string) { return iso ? iso.slice(0, 16) : ''; }

// ─── ChoiceRow ────────────────────────────────────────────────────────────────
function ChoiceRow({ choice, onSave, onDelete, onMarkCorrect }: {
    choice: Choice;
    onSave: (id: number, text: string) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
    onMarkCorrect: (id: number) => Promise<void>;
}) {
    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(choice.text);
    const [saving, setSaving] = useState(false);

    const save = async () => {
        if (text === choice.text) { setEditing(false); return; }
        setSaving(true);
        await onSave(choice.id, text);
        setSaving(false);
        setEditing(false);
    };

    return (
        <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all group ${choice.is_correct
                ? 'border-emerald-400/50 bg-emerald-50/60 dark:bg-emerald-950/20'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
            }`}>
            {/* Correct toggle */}
            <button
                onClick={() => onMarkCorrect(choice.id)}
                title={choice.is_correct ? 'Correct answer' : 'Mark as correct'}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${choice.is_correct ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400'
                    }`}
            >
                {choice.is_correct && <Icons.Check size={12} />}
            </button>

            {/* Text: edit or render */}
            <div className="flex-1 min-w-0">
                {editing ? (
                    <div className="flex items-center gap-2">
                        <textarea
                            autoFocus
                            rows={2}
                            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-primary/30 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-900 dark:text-white outline-none resize-none"
                            value={text}
                            onChange={e => setText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) save(); if (e.key === 'Escape') { setText(choice.text); setEditing(false); } }}
                        />
                        <div className="flex flex-col gap-1">
                            <button onClick={save} disabled={saving}
                                className="text-[9px] font-black text-white bg-primary px-2 py-1 rounded-lg hover:bg-primary/90 transition-colors">
                                {saving ? '…' : 'SAVE'}
                            </button>
                            <button onClick={() => { setText(choice.text); setEditing(false); }}
                                className="text-[9px] font-black text-slate-500 hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                CANCEL
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="cursor-text" onClick={() => setEditing(true)} title="Click to edit">
                        <MathText text={choice.text} className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed" />
                    </div>
                )}
            </div>

            {/* Edit & delete */}
            {!editing && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => setEditing(true)}
                        className="w-6 h-6 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-all">
                        <Icons.Pencil size={11} />
                    </button>
                    <button onClick={() => onDelete(choice.id)}
                        className="w-6 h-6 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center transition-all">
                        <Icons.X size={11} />
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── QuestionCard ─────────────────────────────────────────────────────────────
function QuestionCard({ question, index, onUpdateQuestion, onDeleteQuestion, onUpdateChoice, onDeleteChoice, onMarkCorrect, onAddChoice }: {
    question: Question; index: number;
    onUpdateQuestion: (id: number, data: Partial<Question>) => Promise<void>;
    onDeleteQuestion: (id: number) => Promise<void>;
    onUpdateChoice: (id: number, text: string) => Promise<void>;
    onDeleteChoice: (id: number) => Promise<void>;
    onMarkCorrect: (questionId: number, choiceId: number) => Promise<void>;
    onAddChoice: (questionId: number) => Promise<void>;
}) {
    const [editingText, setEditingText] = useState(false);
    const [text, setText] = useState(question.text);
    const [points, setPoints] = useState(String(question.points));
    const [saving, setSaving] = useState(false);
    const [expanded, setExpanded] = useState(true);

    const saveQuestion = async () => {
        setSaving(true);
        await onUpdateQuestion(question.id, { text, points: parseInt(points) || 1 });
        setSaving(false);
        setEditingText(false);
    };

    return (
        <Card className="rounded-3xl border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="flex items-start gap-4 p-5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs flex-shrink-0 mt-0.5">
                    {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Question text: view or edit */}
                    {editingText ? (
                        <div className="space-y-2">
                            <textarea
                                autoFocus
                                rows={4}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-primary/30 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none resize-none leading-relaxed"
                                value={text}
                                onChange={e => setText(e.target.value)}
                                placeholder="Question text (supports LaTeX: $formula$)…"
                            />
                            <div className="flex items-center gap-3">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Points:</label>
                                <input type="number" min="1" value={points} onChange={e => setPoints(e.target.value)}
                                    className="w-14 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-center" />
                                <button onClick={saveQuestion} disabled={saving}
                                    className="text-[9px] font-black text-white bg-primary px-3 py-1.5 rounded-xl hover:bg-primary/90 transition-colors">
                                    {saving ? 'Saving…' : '✓ SAVE'}
                                </button>
                                <button onClick={() => { setText(question.text); setPoints(String(question.points)); setEditingText(false); }}
                                    className="text-[9px] font-black text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    CANCEL
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="group cursor-text" onClick={() => setEditingText(true)} title="Click to edit">
                            <MathText
                                text={question.text}
                                className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed"
                                as="div"
                            />
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                                    Points: {question.points}
                                </span>
                                <span className="text-[9px] text-primary opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                    ✎ Click to edit
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    {!editingText && (
                        <button onClick={() => setEditingText(true)}
                            className="w-7 h-7 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-all"
                            title="Edit question text">
                            <Icons.Pencil size={14} />
                        </button>
                    )}
                    <button onClick={() => setExpanded(!expanded)}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-all">
                        {expanded ? <Icons.ChevronUp size={14} /> : <Icons.ChevronDown size={14} />}
                    </button>
                    <button onClick={() => onDeleteQuestion(question.id)}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center transition-all"
                        title="Delete question">
                        <Icons.Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Choices */}
            {expanded && (
                <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800/60 pt-4 space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Icons.Circle size={8} /> Answer Choices
                        <span className="text-[8px] text-slate-300 dark:text-slate-700 normal-case font-medium">
                            — click ○ to mark correct, click text to edit
                        </span>
                    </p>
                    {question.choices.map(choice => (
                        <ChoiceRow
                            key={choice.id}
                            choice={choice}
                            onSave={async (id, text) => onUpdateChoice(id, text)}
                            onDelete={onDeleteChoice}
                            onMarkCorrect={async (id) => onMarkCorrect(question.id, id)}
                        />
                    ))}
                    <button
                        onClick={() => onAddChoice(question.id)}
                        className="flex items-center gap-2 text-[10px] font-black text-primary/70 hover:text-primary transition-colors mt-2 px-3 py-2 rounded-xl hover:bg-primary/5 border border-dashed border-primary/20 hover:border-primary/40 w-full justify-center"
                    >
                        <Icons.Plus size={12} /> Add Choice
                    </button>
                </div>
            )}
        </Card>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function QuizEditPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');

    const [title, setTitle] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [deadline, setDeadline] = useState('');
    const [duration, setDuration] = useState('60');

    const fetchAll = useCallback(async () => {
        try {
            const [qRes, questRes] = await Promise.all([
                api.get(`quizzes/${id}/`),
                api.get(`questions/?quiz=${id}`)
            ]);
            const q: Quiz = qRes.data;
            setQuiz(q);
            setTitle(q.title);
            setStartTime(toDatetimeLocal(q.start_time));
            setEndTime(toDatetimeLocal(q.end_time));
            setDeadline(q.deadline ? toDatetimeLocal(q.deadline) : '');
            setDuration(String(q.duration));
            setQuestions(questRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [id]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleSaveMeta = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true); setSaveMsg('');
        try {
            await api.patch(`quizzes/${id}/`, {
                title,
                start_time: new Date(startTime).toISOString(),
                end_time: new Date(endTime).toISOString(),
                deadline: deadline ? new Date(deadline).toISOString() : null,
                duration: parseInt(duration) || 60,
            });
            setSaveMsg('✓ Saved successfully!');
            setTimeout(() => setSaveMsg(''), 3000);
        } catch (err: any) {
            setSaveMsg('Error: ' + (err?.response?.data?.detail || 'Save failed'));
        } finally { setSaving(false); }
    };

    const handleUpdateQuestion = async (qId: number, data: Partial<Question>) => {
        await api.patch(`questions/${qId}/`, data);
        setQuestions(prev => prev.map(q => q.id === qId ? { ...q, ...data } : q));
    };

    const handleDeleteQuestion = async (qId: number) => {
        if (!confirm('Delete this question and all its choices?')) return;
        await api.delete(`questions/${qId}/`);
        setQuestions(prev => prev.filter(q => q.id !== qId));
    };

    const handleAddQuestion = async () => {
        const res = await api.post('questions/', {
            quiz: id, text: 'New Question', points: 1, order: questions.length + 1,
        });
        const newQ: Question = { ...res.data, choices: [] };
        const choiceResults = await Promise.all(
            ['Option A', 'Option B', 'Option C', 'Option D'].map((text, i) =>
                api.post('choices/', { question: newQ.id, text, is_correct: i === 0 })
            )
        );
        newQ.choices = choiceResults.map(r => r.data);
        setQuestions(prev => [...prev, newQ]);
    };

    const handleUpdateChoice = async (cId: number, text: string) => {
        await api.patch(`choices/${cId}/`, { text });
        setQuestions(prev => prev.map(q => ({
            ...q, choices: q.choices.map(c => c.id === cId ? { ...c, text } : c)
        })));
    };

    const handleDeleteChoice = async (cId: number) => {
        await api.delete(`choices/${cId}/`);
        setQuestions(prev => prev.map(q => ({
            ...q, choices: q.choices.filter(c => c.id !== cId)
        })));
    };

    const handleMarkCorrect = async (questionId: number, choiceId: number) => {
        const question = questions.find(q => q.id === questionId);
        if (!question) return;
        await Promise.all(question.choices.map(c =>
            api.patch(`choices/${c.id}/`, { is_correct: c.id === choiceId })
        ));
        setQuestions(prev => prev.map(q => q.id === questionId ? {
            ...q, choices: q.choices.map(c => ({ ...c, is_correct: c.id === choiceId }))
        } : q));
    };

    const handleAddChoice = async (questionId: number) => {
        const res = await api.post('choices/', { question: questionId, text: 'New Option', is_correct: false });
        setQuestions(prev => prev.map(q => q.id === questionId ? {
            ...q, choices: [...q.choices, res.data]
        } : q));
    };

    const isTeacher = user?.role === 'TEACHER' || user?.role === 'HOD' || user?.role === 'VICE_PRINCIPAL';

    if (loading) return (
        <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 font-bold text-sm animate-pulse">Loading Quiz Editor…</p>
            </div>
        </div>
    );

    if (!quiz || !isTeacher) return (
        <div className="py-24 text-center">
            <Icons.Lock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-red-500 font-black text-lg">Access Denied or Quiz Not Found</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">

            {/* Top bar */}
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()}
                    className="w-10 h-10 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary/40 transition-all">
                    <Icons.ArrowLeft size={18} />
                </button>
                <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Quiz Editor · {quiz.subject_name}</p>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">{quiz.title}</h1>
                </div>
                <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border flex-shrink-0 ${quiz.is_extracted
                        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-400/30'
                        : 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-400/30'
                    }`}>
                    {quiz.is_extracted ? `${questions.length} Questions` : 'Pending Extraction'}
                </span>
            </div>

            {/* ── Quiz meta form ─────────────────────────────────────────── */}
            <Card className="p-8 rounded-3xl border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50/80 to-white dark:from-slate-950 dark:to-slate-900">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icons.Settings size={16} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-slate-900 dark:text-white">Quiz Details</h2>
                        <p className="text-[10px] text-slate-400 font-medium">Title, timing and duration</p>
                    </div>
                </div>
                <form onSubmit={handleSaveMeta} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Quiz Title</label>
                        <Input value={title} onChange={e => setTitle(e.target.value)} className="h-11 rounded-xl font-bold" required />
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Start Time</label>
                        <Input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-11 rounded-xl font-bold text-xs" required />
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">End Time</label>
                        <Input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-11 rounded-xl font-bold text-xs" required />
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Deadline (optional)</label>
                        <Input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className="h-11 rounded-xl font-bold text-xs" />
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Duration (minutes)</label>
                        <Input type="number" min="5" value={duration} onChange={e => setDuration(e.target.value)} className="h-11 rounded-xl font-bold text-xs" required />
                    </div>
                    <div className="lg:col-span-2 flex items-end gap-4">
                        <Button type="submit" disabled={saving} className="h-11 rounded-xl font-black px-8 gap-2">
                            <Icons.Save size={16} /> {saving ? 'Saving…' : 'Save Quiz Details'}
                        </Button>
                        {saveMsg && (
                            <p className={`text-xs font-bold animate-in fade-in duration-300 ${saveMsg.startsWith('Error') ? 'text-red-500' : 'text-emerald-500'}`}>
                                {saveMsg}
                            </p>
                        )}
                    </div>
                </form>
            </Card>

            {/* ── Questions ──────────────────────────────────────────────── */}
            <div>
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-base font-black text-slate-900 dark:text-white">
                            Questions <span className="text-primary ml-1">({questions.length})</span>
                        </h2>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                            Math formulas rendered automatically. Click text to edit raw LaTeX.
                        </p>
                    </div>
                    <Button variant="outline" onClick={handleAddQuestion} className="rounded-2xl h-10 px-5 gap-2 text-xs font-black">
                        <Icons.Plus size={14} /> Add Question
                    </Button>
                </div>

                {questions.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                        <Icons.HelpCircle className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                        <p className="text-slate-500 font-black text-sm">No questions yet.</p>
                        <p className="text-slate-400 text-xs mt-1">Click "Add Question" or go back and run AI Extraction.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {questions.map((q, i) => (
                            <QuestionCard
                                key={q.id}
                                question={q}
                                index={i}
                                onUpdateQuestion={handleUpdateQuestion}
                                onDeleteQuestion={handleDeleteQuestion}
                                onUpdateChoice={handleUpdateChoice}
                                onDeleteChoice={handleDeleteChoice}
                                onMarkCorrect={handleMarkCorrect}
                                onAddChoice={handleAddChoice}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
