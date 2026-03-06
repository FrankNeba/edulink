'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import * as Icons from 'lucide-react';

/* ── Types ── */
interface Announcement {
    id: number;
    title: string;
    content: string;
    level: string;
    author_name: string;
    created_at: string;
    subject?: number;
    subject_name?: string;
    department?: number;
    department_name?: string;
    domain?: number;
    domain_name?: string;
    sub_domain?: number;
    sub_domain_name?: string;
    target_class?: string;
}

const LEVEL_META: Record<string, { label: string; color: string }> = {
    SCHOOL: { label: 'School-wide', color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700/40' },
    DOMAIN: { label: 'Domain', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/40' },
    SUBDOMAIN: { label: 'Sub-domain', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/40' },
    CLASS: { label: 'Class / Level', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/40' },
    SUBJECT: { label: 'Subject', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/40' },
};

const CLASS_LEVELS = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Lower Sixth', 'Upper Sixth'];

/* ── Empty form state ── */
const emptyForm = { title: '', content: '', level: 'SUBJECT', subject: '', department: '', domain: '', sub_domain: '', target_class: '' };

export default function AnnouncementsPage() {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [domains, setDomains] = useState<any[]>([]);
    const [subDomains, setSubDomains] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [deleting, setDeleting] = useState<number | null>(null);
    const [filterLevel, setFilterLevel] = useState('');
    const [search, setSearch] = useState('');
    const [editId, setEditId] = useState<number | null>(null);

    const isAdmin = user?.role === 'VICE_PRINCIPAL' || user?.role === 'HOD';
    const canCreate = ['VICE_PRINCIPAL', 'HOD', 'TEACHER'].includes(user?.role ?? '');

    const fetchAll = useCallback(async () => {
        try {
            const [annRes, subRes, deptRes, domRes, sdRes] = await Promise.all([
                api.get('announcements/'),
                api.get('subjects/'),
                api.get('departments/'),
                api.get('domains/'),
                api.get('sub-domains/'),
            ]);
            setAnnouncements(annRes.data);
            setSubjects(subRes.data);
            setDepartments(deptRes.data);
            setDomains(domRes.data);
            setSubDomains(sdRes.data);
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleChange = (field: string, value: string) => {
        setForm(prev => {
            const next = { ...prev, [field]: value };
            // Reset target fields when level changes
            if (field === 'level') {
                next.subject = '';
                next.department = '';
                next.domain = '';
                next.sub_domain = '';
                next.target_class = '';
            }
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload: any = { title: form.title, content: form.content, level: form.level };
            if (form.level === 'SUBJECT' && form.subject) payload.subject = form.subject;
            if (form.level === 'CLASS') payload.target_class = form.target_class;
            if (form.level === 'DOMAIN' && form.domain) payload.domain = form.domain;
            if (form.level === 'SUBDOMAIN' && form.sub_domain) payload.sub_domain = form.sub_domain;

            if (editId) {
                await api.patch(`announcements/${editId}/`, payload);
            } else {
                await api.post('announcements/', payload);
            }
            setForm(emptyForm);
            setShowForm(false);
            setEditId(null);
            await fetchAll();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Failed to save announcement');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (ann: Announcement) => {
        setForm({
            title: ann.title,
            content: ann.content,
            level: ann.level,
            subject: ann.subject?.toString() ?? '',
            department: ann.department?.toString() ?? '',
            domain: ann.domain?.toString() ?? '',
            sub_domain: ann.sub_domain?.toString() ?? '',
            target_class: ann.target_class ?? '',
        });
        setEditId(ann.id);
        setShowForm(true);
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this announcement?')) return;
        setDeleting(id);
        try {
            await api.delete(`announcements/${id}/`);
            setAnnouncements(prev => prev.filter(a => a.id !== id));
        } catch {
            alert('Failed to delete announcement');
        } finally {
            setDeleting(null);
        }
    };

    const filtered = announcements.filter(a => {
        const matchLevel = !filterLevel || a.level === filterLevel;
        const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase());
        return matchLevel && matchSearch;
    });

    const getTarget = (ann: Announcement) => {
        if (ann.level === 'SUBJECT') return ann.subject_name;
        if (ann.level === 'CLASS') return ann.target_class;
        if (ann.level === 'DOMAIN') return ann.domain_name;
        if (ann.level === 'SUBDOMAIN') return ann.sub_domain_name;
        return null;
    };

    /* ── Shared class strings ── */
    const cardBase = "card-base p-6";
    const labelCls = "block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest mb-1.5";

    if (loading) return (
        <div className="h-[50vh] flex items-center justify-center">
            <div className="relative w-10 h-10">
                <div className="absolute inset-0 border-[3px] border-violet-200 dark:border-violet-800 rounded-full" />
                <div className="absolute inset-0 border-[3px] border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
        </div>
    );

    return (
        <div className="space-y-8 max-w-5xl mx-auto animate-in">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Announcements</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Broadcast messages to any scope — from a single subject to the whole school.
                    </p>
                </div>
                {canCreate && !showForm && (
                    <button onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }}
                        className="btn-modern-primary self-start">
                        <Icons.Plus className="w-4 h-4" /> New Announcement
                    </button>
                )}
            </div>

            {/* ── Compose / Edit form ── */}
            {showForm && (
                <div className={`${cardBase} p-6 shadow-md scale-in`}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400">
                                {editId ? <Icons.Pencil className="w-4 h-4" /> : <Icons.Megaphone className="w-4 h-4" />}
                            </span>
                            {editId ? 'Edit Announcement' : 'New Announcement'}
                        </h2>
                        <button onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
                            <Icons.X className="w-4 h-4" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Target scope */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Audience Scope</label>
                                <select className="input-modern" value={form.level}
                                    onChange={(e) => handleChange('level', e.target.value)}>
                                    <option value="SUBJECT">Subject</option>
                                    <option value="CLASS">Class / Level</option>
                                    <option value="DOMAIN">Domain</option>
                                    <option value="SUBDOMAIN">Sub-domain</option>
                                    {isAdmin && <option value="SCHOOL">Whole School</option>}
                                </select>
                            </div>

                            {/* Dynamic target selector */}
                            {form.level === 'SUBJECT' && (
                                <div>
                                    <label className={labelCls}>Subject</label>
                                    <select className="input-modern" value={form.subject}
                                        onChange={(e) => handleChange('subject', e.target.value)} required>
                                        <option value="">Select subject...</option>
                                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name} — {s.level}</option>)}
                                    </select>
                                </div>
                            )}
                            {form.level === 'CLASS' && (
                                <div>
                                    <label className={labelCls}>Class / Level</label>
                                    <select className="input-modern" value={form.target_class}
                                        onChange={(e) => handleChange('target_class', e.target.value)} required>
                                        <option value="">Select class...</option>
                                        {CLASS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                            )}
                            {form.level === 'DOMAIN' && (
                                <div>
                                    <label className={labelCls}>Domain</label>
                                    <select className="input-modern" value={form.domain}
                                        onChange={(e) => handleChange('domain', e.target.value)} required>
                                        <option value="">Select domain...</option>
                                        {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                            )}
                            {form.level === 'SUBDOMAIN' && (
                                <div>
                                    <label className={labelCls}>Sub-domain</label>
                                    <select className="input-modern" value={form.sub_domain}
                                        onChange={(e) => handleChange('sub_domain', e.target.value)} required>
                                        <option value="">Select sub-domain...</option>
                                        {subDomains.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            )}
                            {form.level === 'SCHOOL' && (
                                <div className="flex items-end">
                                    <div className="w-full h-11 flex items-center gap-2 px-4 rounded-xl
                                        bg-violet-50 dark:bg-violet-900/20
                                        border border-violet-200 dark:border-violet-700/40
                                        text-violet-700 dark:text-violet-400 text-xs font-bold">
                                        <Icons.Globe className="w-4 h-4 shrink-0" />
                                        Broadcast to entire school
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Title */}
                        <div>
                            <label className={labelCls}>Heading</label>
                            <input className="input-modern" placeholder="e.g. Exam schedule update for Form 4"
                                value={form.title} onChange={(e) => handleChange('title', e.target.value)} required />
                        </div>

                        {/* Body */}
                        <div>
                            <label className={labelCls}>Message Body</label>
                            <textarea className="input-modern min-h-[120px] py-3 resize-none" rows={5}
                                placeholder="Write your announcement here..."
                                value={form.content} onChange={(e) => handleChange('content', e.target.value)} required />
                        </div>

                        {/* Scope summary */}
                        <div className="flex items-center gap-2 py-3 px-4 rounded-xl
                            bg-slate-50 dark:bg-slate-800/50
                            border border-slate-200 dark:border-slate-700">
                            <Icons.Info className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                This announcement will be visible to all members of the selected{' '}
                                <span className="font-bold text-slate-700 dark:text-slate-300">
                                    {LEVEL_META[form.level]?.label ?? form.level}
                                </span> scope.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-1">
                            <button type="button" onClick={() => { setShowForm(false); setEditId(null); setForm(emptyForm); }}
                                className="btn-modern-secondary h-10 px-5">
                                Discard
                            </button>
                            <button type="submit" className="btn-modern-primary h-10 px-6" disabled={submitting}>
                                {submitting
                                    ? <><Icons.Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                                    : editId
                                        ? <><Icons.Save className="w-3.5 h-3.5" /> Update</>
                                        : <><Icons.Send className="w-3.5 h-3.5" /> Publish</>
                                }
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Filter bar ── */}
            <div className={`${cardBase} p-2.5 flex flex-col sm:flex-row gap-2 shadow-sm`}>
                <div className="relative flex-1">
                    <Icons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        className="w-full h-10 bg-transparent pl-10 pr-4 text-sm font-medium outline-none
                            text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        placeholder="Search announcements..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['', 'SCHOOL', 'DOMAIN', 'SUBDOMAIN', 'CLASS', 'SUBJECT'].map((lv) => (
                        <button key={lv} onClick={() => setFilterLevel(lv)}
                            className={`px-3 h-10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border ${filterLevel === lv
                                ? 'bg-violet-600 text-white border-violet-600'
                                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-violet-300 dark:hover:border-violet-600'
                                }`}>
                            {lv === '' ? 'All' : LEVEL_META[lv]?.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Stats row ── */}
            <div className="flex items-center gap-4 px-1">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    <span className="font-bold text-slate-900 dark:text-white">{filtered.length}</span> of{' '}
                    <span className="font-bold text-slate-900 dark:text-white">{announcements.length}</span> announcements
                </p>
                {(search || filterLevel) && (
                    <button onClick={() => { setSearch(''); setFilterLevel(''); }}
                        className="text-[10px] font-black uppercase tracking-widest text-red-500 dark:text-red-400 hover:underline">
                        Clear filters
                    </button>
                )}
            </div>

            {/* ── Announcement list ── */}
            <div className="space-y-4">
                {filtered.map((ann) => {
                    const meta = LEVEL_META[ann.level] ?? LEVEL_META.SUBJECT;
                    const target = getTarget(ann);
                    return (
                        <div key={ann.id}
                            className={`${cardBase} p-6 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all`}>
                            <div className="flex justify-between items-start gap-4">
                                {/* Left */}
                                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                    <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-black text-sm
                                        bg-slate-100 dark:bg-slate-800
                                        text-violet-600 dark:text-violet-400">
                                        {ann.author_name?.charAt(0).toUpperCase() ?? 'A'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                            <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded border ${meta.color}`}>
                                                {meta.label}
                                            </span>
                                            {target && (
                                                <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded
                                                    bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                                    {target}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">{ann.title}</h3>
                                        <p className="text-[10px] font-semibold uppercase tracking-wide mt-0.5
                                            text-slate-400 dark:text-slate-500">
                                            {ann.author_name} · {new Date(ann.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p className="text-sm leading-relaxed mt-3 text-slate-600 dark:text-slate-300">
                                            {ann.content}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions (admin/author only) */}
                                {(isAdmin || ann.author_name === `${user?.first_name} ${user?.last_name}`) && (
                                    <div className="flex gap-1.5 shrink-0">
                                        <button onClick={() => handleEdit(ann)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all
                                                text-slate-400 dark:text-slate-500
                                                hover:bg-violet-50 dark:hover:bg-violet-900/30
                                                hover:text-violet-700 dark:hover:text-violet-400">
                                            <Icons.Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => handleDelete(ann.id)} disabled={deleting === ann.id}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all
                                                text-slate-400 dark:text-slate-500
                                                hover:bg-red-50 dark:hover:bg-red-900/20
                                                hover:text-red-600 dark:hover:text-red-400">
                                            {deleting === ann.id
                                                ? <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                : <Icons.Trash2 className="w-3.5 h-3.5" />
                                            }
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {filtered.length === 0 && (
                    <div className="p-16 text-center rounded-[0.875rem] border-2 border-dashed
                        bg-white dark:bg-[#161b27]
                        border-slate-200 dark:border-slate-800">
                        <Icons.Megaphone className="w-12 h-12 mx-auto mb-4 text-slate-200 dark:text-slate-700" />
                        <p className="font-bold text-slate-900 dark:text-white mb-1">No announcements yet</p>
                        <p className="text-sm text-slate-400 dark:text-slate-500">
                            {search || filterLevel
                                ? 'No announcements match your filters.'
                                : canCreate ? 'Create your first announcement using the button above.' : 'Check back later.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
