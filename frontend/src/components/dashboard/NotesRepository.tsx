'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const BACKEND = process.env.NEXT_PUBLIC_API_URL?.replace('/api/', '') ?? 'http://127.0.0.1:8000';
const getFileUrl = (path: string) => (path?.startsWith('http') ? path : `${BACKEND}${path}`);

type Tab = 'notes' | 'syllabus';

export interface NotesRepositoryProps {
    subjectId?: number | string;
    showNoteUploadDefault?: boolean;
    showSyllabusUploadDefault?: boolean;
    initialTab?: Tab;
}

export default function NotesRepository({
    subjectId,
    showNoteUploadDefault = false,
    showSyllabusUploadDefault = false,
    initialTab = 'notes'
}: NotesRepositoryProps) {
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState<Tab>(initialTab);

    // ── Data ──────────────────────────────────────────────────────────────
    const [notes, setNotes] = useState<any[]>([]);
    const [syllabi, setSyllabi] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // ── Panel toggles ─────────────────────────────────────────────────────
    const [showNoteUpload, setShowNoteUpload] = useState(showNoteUploadDefault);
    const [showSyllabusUpload, setShowSyllabusUpload] = useState(showSyllabusUploadDefault);

    // ── PDF viewer ────────────────────────────────────────────────────────
    const [viewDoc, setViewDoc] = useState<{ title: string; subject: string; file: string } | null>(null);

    // ── Note form ─────────────────────────────────────────────────────────
    const noteFileRef = useRef<HTMLInputElement>(null);
    const [noteTitle, setNoteTitle] = useState('');
    const [noteSubject, setNoteSubject] = useState(subjectId?.toString() || '');
    const [noteFile, setNoteFile] = useState<File | null>(null);
    const [noteUploading, setNoteUploading] = useState(false);
    const [noteError, setNoteError] = useState('');

    // ── Syllabus form ─────────────────────────────────────────────────────
    const sylFileRef = useRef<HTMLInputElement>(null);
    const [sylTitle, setSylTitle] = useState('');
    const [sylSubject, setSylSubject] = useState(subjectId?.toString() || '');
    const [sylDesc, setSylDesc] = useState('');
    const [sylFile, setSylFile] = useState<File | null>(null);
    const [sylUploading, setSylUploading] = useState(false);
    const [sylError, setSylError] = useState('');

    // ── Roles ─────────────────────────────────────────────────────────────
    const isVP = user?.role === 'VICE_PRINCIPAL';
    const isHOD = user?.role === 'HOD';
    const isTeacher = user?.role === 'TEACHER';
    const canUploadNotes = isVP || isHOD || isTeacher;
    const canUploadSyllabus = isVP || isHOD;

    // ── Auto-open panel from query ───────────────────────────────────
    useEffect(() => {
        if (!subjectId) {
            const params = new URLSearchParams(window.location.search);
            if (params.get('level') && canUploadNotes) setShowNoteUpload(true);
        }
    }, [canUploadNotes, subjectId]);

    // ── Fetch ─────────────────────────────────────────────────────────────
    const fetchAll = async () => {
        try {
            const query = subjectId ? `?subject=${subjectId}` : '';
            const [notesRes, sylRes, subRes] = await Promise.all([
                api.get(`notes/${query}`),
                api.get(`syllabi/${query}`),
                api.get('subjects/'),
            ]);
            setNotes(notesRes.data);
            setSyllabi(sylRes.data);
            setSubjects(subRes.data);
        } catch (err) {
            console.error('Failed to load data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, [subjectId]);

    // ── Handlers ──────────────────────────────────────────────────────────
    const handleNoteUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!noteFile || !noteSubject || !noteTitle) return;
        setNoteUploading(true);
        setNoteError('');
        const fd = new FormData();
        fd.append('title', noteTitle);
        fd.append('subject', noteSubject);
        fd.append('file', noteFile);
        try {
            await api.post('notes/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            await fetchAll();
            setShowNoteUpload(false);
            setNoteTitle(''); setNoteSubject(''); setNoteFile(null);
            if (noteFileRef.current) noteFileRef.current.value = '';
        } catch (err: any) {
            const data = err?.response?.data;
            setNoteError(data?.detail ?? JSON.stringify(data) ?? 'Upload failed.');
        } finally {
            setNoteUploading(false);
        }
    };

    const handleSylUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sylFile || !sylSubject || !sylTitle) return;
        setSylUploading(true);
        setSylError('');
        const fd = new FormData();
        fd.append('title', sylTitle);
        fd.append('subject', sylSubject);
        fd.append('file', sylFile);
        fd.append('description', sylDesc);
        try {
            await api.post('syllabi/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            await fetchAll();
            setShowSyllabusUpload(false);
            setSylTitle(''); setSylSubject(''); setSylDesc(''); setSylFile(null);
            if (sylFileRef.current) sylFileRef.current.value = '';
        } catch (err: any) {
            const data = err?.response?.data;
            setSylError(data?.detail ?? JSON.stringify(data) ?? 'Upload failed.');
        } finally {
            setSylUploading(false);
        }
    };

    const deleteNote = async (id: number) => {
        if (!confirm('Delete this note?')) return;
        await api.delete(`notes/${id}/`);
        setNotes(notes.filter(n => n.id !== id));
    };

    const deleteSyllabus = async (id: number) => {
        if (!confirm('Delete this syllabus?')) return;
        await api.delete(`syllabi/${id}/`);
        setSyllabi(syllabi.filter(s => s.id !== id));
    };

    // ── Shared UI helpers ─────────────────────────────────────────────────
    const labelCls = 'text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1 block mb-2';

    const FilePicker = ({ accept, file, setFile, fileRef, label }: {
        accept: string; file: File | null; setFile: (f: File | null) => void;
        fileRef: React.RefObject<HTMLInputElement | null>; label: string;
    }) => (
        <div
            className="h-12 flex items-center gap-3 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
        >
            <Icons.FileText className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-sm text-slate-500 truncate font-medium">
                {file ? file.name : label}
            </span>
            <input ref={fileRef} type="file" accept={accept} className="hidden"
                onChange={e => setFile(e.target.files?.[0] ?? null)} />
        </div>
    );

    const SubjectSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
        <select
            className="w-full h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm font-bold text-slate-900 dark:text-white disabled:opacity-50"
            value={value} onChange={e => onChange(e.target.value)} required
            disabled={!!subjectId}
        >
            <option value="">Choose a subject…</option>
            {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} — {s.level}</option>
            ))}
        </select>
    );

    // ── Loading ───────────────────────────────────────────────────────────
    if (loading) return (
        <div className="py-24 flex flex-col items-center gap-4 text-slate-400">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="font-bold text-sm">Loading Academic Repository…</p>
        </div>
    );

    // ── Tab data ──────────────────────────────────────────────────────────
    const tabs = [
        { id: 'notes' as Tab, label: 'Study Notes', icon: Icons.FileText, count: notes.length },
        { id: 'syllabus' as Tab, label: 'Syllabi & Curriculum', icon: Icons.ScrollText, count: syllabi.length },
    ];

    return (
        <div className="space-y-8 max-w-6xl mx-auto">

            {/* ── Page Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Academic Repository
                    </h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">
                        {canUploadNotes
                            ? 'Manage and distribute learning materials and official syllabi.'
                            : 'Access your course materials, notes, and official syllabi.'}
                    </p>
                </div>

                <div className="flex gap-3">
                    {canUploadSyllabus && (
                        <Button
                            variant="outline"
                            onClick={() => { setShowSyllabusUpload(!showSyllabusUpload); setActiveTab('syllabus'); }}
                            className="rounded-2xl h-11 px-5 gap-2 font-black text-sm"
                        >
                            <Icons.ScrollText className="w-4 h-4" />
                            Upload Syllabus
                        </Button>
                    )}
                    {canUploadNotes && (
                        <Button
                            variant='outline'
                            onClick={() => { setShowNoteUpload(!showNoteUpload); setActiveTab('notes'); }}
                            className="rounded-2xl h-11 px-5 gap-2 font-black text-sm"
                        >
                            <Icons.Upload className="w-4 h-4" />
                            Upload Notes
                        </Button>
                    )}
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all duration-200 ${active
                                ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-lg font-black ${active ? 'bg-primary/10 text-primary' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                }`}>
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* ══════════════════════════════════════════════════════
                NOTES TAB
            ═══════════════════════════════════════════════════════ */}
            {activeTab === 'notes' && (
                <div className="space-y-8">

                    {/* Upload note panel */}
                    {showNoteUpload && canUploadNotes && (
                        <Card className="p-8 rounded-3xl border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 animate-in slide-in-from-top-4 duration-500">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Upload Study Notes</h2>
                                    <p className="text-xs text-slate-500 font-medium mt-1">
                                        {isVP && 'As Vice Principal you can upload notes for any subject.'}
                                        {isHOD && 'As HOD you can upload notes for subjects under your department.'}
                                        {isTeacher && 'Upload PDF notes for subjects you are assigned to.'}
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setShowNoteUpload(false)} className="rounded-xl">
                                    <Icons.X className="w-5 h-5" />
                                </Button>
                            </div>
                            <form onSubmit={handleNoteUpload} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                                <div>
                                    <label className={labelCls}>Note Title</label>
                                    <Input
                                        placeholder="e.g. Chapter 3 – Cell Division"
                                        value={noteTitle} onChange={e => setNoteTitle(e.target.value)}
                                        required className="h-12 rounded-xl font-bold"
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Subject</label>
                                    <SubjectSelect value={noteSubject} onChange={setNoteSubject} />
                                </div>
                                <div>
                                    <label className={labelCls}>PDF File</label>
                                    <FilePicker accept=".pdf" file={noteFile} setFile={setNoteFile}
                                        fileRef={noteFileRef} label="Click to select PDF…" />
                                </div>
                                {noteError && <p className="md:col-span-3 text-red-500 text-xs font-bold">{noteError}</p>}
                                <Button type="submit" disabled={noteUploading} className="md:col-span-3 h-12 rounded-xl font-black">
                                    {noteUploading ? 'Publishing…' : 'Publish Study Material'}
                                </Button>
                            </form>
                        </Card>
                    )}

                    {/* Notes grid */}
                    {notes.length === 0 ? (
                        <div className="py-24 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                            <Icons.BookOpen className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                            <h3 className="text-slate-500 font-black text-lg">No Notes Published Yet</h3>
                            <p className="text-slate-400 text-sm mt-2">
                                {canUploadNotes ? 'Upload your first study material above.' : 'No notes have been published for your subjects yet.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {notes.map(note => (
                                <Card key={note.id} className="p-6 rounded-3xl hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
                                    {/* Icon + actions */}
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Icons.FileText className="w-7 h-7 text-red-500" />
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="rounded-xl w-8 h-8 text-slate-400 hover:text-primary"
                                                title="View in browser"
                                                onClick={() => setViewDoc({ title: note.title, subject: note.subject_name, file: note.file })}>
                                                <Icons.Eye size={16} />
                                            </Button>
                                            <a href={getFileUrl(note.file)} download target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center rounded-xl w-8 h-8 text-slate-400 hover:text-emerald-600 transition-colors"
                                                title="Download PDF">
                                                <Icons.Download size={16} />
                                            </a>
                                            {(isVP || (canUploadNotes && note.teacher === user?.id)) && (
                                                <Button variant="ghost" size="icon" className="rounded-xl w-8 h-8 text-slate-400 hover:text-red-500"
                                                    title="Delete note" onClick={() => deleteNote(note.id)}>
                                                    <Icons.Trash2 size={16} />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <h3 className="font-black text-slate-900 dark:text-white text-base leading-snug mb-1">{note.title}</h3>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-[10px] text-primary font-black uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-lg">
                                            {note.subject_name}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-bold">{note.subject_level}</span>
                                    </div>
                                    <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                                            {note.teacher_name?.[0]}
                                        </div>
                                        <span className="text-[11px] text-slate-500 font-bold">{note.teacher_name}</span>
                                        <span className="ml-auto text-[10px] text-slate-400">
                                            {new Date(note.uploaded_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════
                SYLLABUS TAB
            ═══════════════════════════════════════════════════════ */}
            {activeTab === 'syllabus' && (
                <div className="space-y-8">

                    {/* Upload syllabus panel */}
                    {showSyllabusUpload && canUploadSyllabus && (
                        <Card className="p-8 rounded-3xl border-slate-200 dark:border-slate-800 bg-gradient-to-br from-violet-50/50 to-white dark:from-violet-950/20 dark:to-slate-950 animate-in slide-in-from-top-4 duration-500">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Upload Syllabus / Curriculum</h2>
                                    <p className="text-xs text-slate-500 font-medium mt-1">
                                        {isVP
                                            ? 'As Vice Principal you can upload syllabi for any subject.'
                                            : 'As HOD you can upload syllabi for subjects you manage.'}
                                        {' '}Multiple versions are kept — the latest is highlighted.
                                    </p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setShowSyllabusUpload(false)} className="rounded-xl">
                                    <Icons.X className="w-5 h-5" />
                                </Button>
                            </div>
                            <form onSubmit={handleSylUpload} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                                <div className="lg:col-span-2">
                                    <label className={labelCls}>Syllabus Title</label>
                                    <Input
                                        placeholder="e.g. Biology GCE Syllabus 2025/26"
                                        value={sylTitle} onChange={e => setSylTitle(e.target.value)}
                                        required className="h-12 rounded-xl font-bold"
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Subject</label>
                                    <SubjectSelect value={sylSubject} onChange={setSylSubject} />
                                </div>
                                <div>
                                    <label className={labelCls}>PDF File</label>
                                    <FilePicker accept=".pdf" file={sylFile} setFile={setSylFile}
                                        fileRef={sylFileRef} label="Click to select PDF…" />
                                </div>
                                <div className="lg:col-span-4">
                                    <label className={labelCls}>Description (optional)</label>
                                    <Input
                                        placeholder="Brief description of this syllabus version…"
                                        value={sylDesc} onChange={e => setSylDesc(e.target.value)}
                                        className="h-12 rounded-xl"
                                    />
                                </div>
                                {sylError && <p className="lg:col-span-4 text-red-500 text-xs font-bold">{sylError}</p>}
                                <Button type="submit" disabled={sylUploading} className="lg:col-span-4 h-12 rounded-xl font-black">
                                    {sylUploading ? 'Publishing Syllabus…' : 'Publish Official Syllabus'}
                                </Button>
                            </form>
                        </Card>
                    )}

                    {/* Syllabi list */}
                    {syllabi.length === 0 ? (
                        <div className="py-24 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                            <Icons.ScrollText className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                            <h3 className="text-slate-500 font-black text-lg">No Syllabi Published Yet</h3>
                            <p className="text-slate-400 text-sm mt-2">
                                {canUploadSyllabus ? 'Upload the first syllabus for a subject.' : 'No official syllabi have been published yet.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Group by subject */}
                            {Array.from(new Set(syllabi.map(s => s.subject_name))).map(subjectName => {
                                const subSyllabi = syllabi.filter(s => s.subject_name === subjectName);
                                return (
                                    <div key={subjectName}>
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                                            {subjectName}
                                            <span className="text-slate-300 dark:text-slate-700">— {subSyllabi[0]?.subject_level}</span>
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {subSyllabi.map(syl => (
                                                <Card key={syl.id} className={`p-5 rounded-2xl transition-all duration-300 group ${syl.is_latest
                                                    ? 'border-violet-400/40 bg-violet-50/50 dark:bg-violet-950/20 shadow-md shadow-violet-500/10'
                                                    : 'hover:border-slate-300 dark:hover:border-slate-700'}`}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        {/* Left: icon + info */}
                                                        <div className="flex items-start gap-4 flex-1 min-w-0">
                                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${syl.is_latest ? 'bg-violet-500/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                                                <Icons.ScrollText className={`w-6 h-6 ${syl.is_latest ? 'text-violet-600' : 'text-slate-400'}`} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                    <h4 className="font-black text-slate-900 dark:text-white text-sm truncate">{syl.title}</h4>
                                                                    {syl.is_latest && (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-violet-500 text-white text-[10px] font-black shrink-0">
                                                                            <Icons.Star size={10} />
                                                                            LATEST
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {syl.description && (
                                                                    <p className="text-[11px] text-slate-500 font-medium truncate mb-2">{syl.description}</p>
                                                                )}
                                                                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 flex-wrap">
                                                                    <span className="flex items-center gap-1">
                                                                        <Icons.User size={10} />
                                                                        {syl.uploaded_by_name}
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <Icons.Calendar size={10} />
                                                                        {new Date(syl.uploaded_at).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Right: actions */}
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <Button variant="ghost" size="icon" className="rounded-xl w-8 h-8 text-slate-400 hover:text-violet-600"
                                                                title="View in browser"
                                                                onClick={() => setViewDoc({ title: syl.title, subject: syl.subject_name, file: syl.file })}>
                                                                <Icons.Eye size={16} />
                                                            </Button>
                                                            <a href={getFileUrl(syl.file)} download target="_blank" rel="noopener noreferrer"
                                                                className="inline-flex items-center justify-center rounded-xl w-8 h-8 text-slate-400 hover:text-emerald-600 transition-colors"
                                                                title="Download PDF">
                                                                <Icons.Download size={16} />
                                                            </a>
                                                            {canUploadSyllabus && (
                                                                <Button variant="ghost" size="icon" className="rounded-xl w-8 h-8 text-slate-400 hover:text-red-500"
                                                                    title="Delete syllabus" onClick={() => deleteSyllabus(syl.id)}>
                                                                    <Icons.Trash2 size={16} />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════
                PDF VIEWER MODAL (shared for notes & syllabi)
            ═══════════════════════════════════════════════════════ */}
            {viewDoc && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md animate-in fade-in duration-200"
                    onClick={() => setViewDoc(null)}
                >
                    <div
                        className="bg-white dark:bg-slate-950 rounded-[32px] w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                            <div>
                                <h2 className="font-black text-slate-900 dark:text-white text-lg">{viewDoc.title}</h2>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{viewDoc.subject}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={getFileUrl(viewDoc.file)} download target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-black hover:bg-primary/20 transition-colors"
                                >
                                    <Icons.Download size={14} /> Download PDF
                                </a>
                                <Button variant="ghost" size="icon" onClick={() => setViewDoc(null)} className="rounded-xl">
                                    <Icons.X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                        {/* PDF embed */}
                        <iframe
                            src={`${getFileUrl(viewDoc.file)}#toolbar=1&view=FitH`}
                            className="flex-1 w-full min-h-0"
                            title={viewDoc.title}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
