'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import * as Icons from 'lucide-react';

export default function SubjectsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [subjects, setSubjects] = useState<any[]>([]);
    const [baseSubjects, setBaseSubjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'instances' | 'catalog'>('instances');

    const [showCatalogForm, setShowCatalogForm] = useState(false);
    const [newBaseName, setNewBaseName] = useState('');
    const [newBaseDept, setNewBaseDept] = useState('');
    const [departments, setDepartments] = useState<any[]>([]);
    const [addingBase, setAddingBase] = useState(false);

    const [search, setSearch] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filterLevel, setFilterLevel] = useState('');
    const [filterDomain, setFilterDomain] = useState('');
    const [filterSubDomain, setFilterSubDomain] = useState('');

    // Management State
    const [managingSubject, setManagingSubject] = useState<any | null>(null);
    const [deleting, setDeleting] = useState<number | null>(null);

    // HOD student view state
    const [selectedSubForStudents, setSelectedSubForStudents] = useState<any | null>(null);
    const [registeredStudents, setRegisteredStudents] = useState<any[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    const fetchData = async () => {
        try {
            const [subRes, baseRes, deptRes] = await Promise.all([
                api.get('subjects/'),
                api.get('base-subjects/'),
                api.get('departments/')
            ]);
            setSubjects(subRes.data);
            setBaseSubjects(baseRes.data);
            setDepartments(deptRes.data);
        } catch (err) {
            console.error('Failed to fetch subjects', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAddBaseSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddingBase(true);
        try {
            await api.post('base-subjects/', { name: newBaseName, department: newBaseDept });
            setNewBaseName(''); setNewBaseDept('');
            setShowCatalogForm(false);
            fetchData();
        } catch (err) {
            console.error('Failed to add base subject', err);
        } finally {
            setAddingBase(false);
        }
    };

    const handleRegister = async (id: number) => {
        setRegistering(id);
        try {
            await api.post(`subjects/${id}/register/`);
            await fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Registration failed');
        } finally {
            setRegistering(null);
        }
    };

    const handleUnregister = async (id: number) => {
        if (!confirm('Are you sure you want to drop this subject?')) return;
        setRegistering(id);
        try {
            await api.post(`subjects/${id}/unregister/`);
            await fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Unregistration failed');
        } finally {
            setRegistering(null);
        }
    };

    const fetchStudents = async (subject: any) => {
        setSelectedSubForStudents(subject);
        setLoadingStudents(true);
        try {
            const res = await api.get(`subjects/${subject.id}/student_list/`);
            setRegisteredStudents(res.data);
        } catch (err) {
            console.error('Failed to fetch students', err);
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleDeleteInstance = async (id: number) => {
        if (!confirm('Are you sure you want to delete this subject? All associated notes and quiz data will be detached.')) return;
        setDeleting(id);
        try {
            await api.delete(`subjects/${id}/`);
            await fetchData();
            setManagingSubject(null);
        } catch (err) {
            console.error('Failed to delete subject', err);
            alert('Could not delete this subject. Make sure you have the right permissions.');
        } finally {
            setDeleting(null);
        }
    };

    const filteredSubjects = subjects.filter(s => {
        const matchesSearch = !search ||
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.code.toLowerCase().includes(search.toLowerCase());
        const matchesLevel = !filterLevel || s.level === filterLevel;
        const matchesDomain = !filterDomain || s.domain === filterDomain;
        const matchesSubDomain = !filterSubDomain || s.sub_domain === filterSubDomain;
        return matchesSearch && matchesLevel && matchesDomain && matchesSubDomain;
    });

    const cardCls = "card-base p-6";
    const labelCls = "text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest";

    const isStudent = user?.role === 'STUDENT';
    const isPrincipalOrVP = user?.role === 'PRINCIPAL' || user?.role === 'VICE_PRINCIPAL';
    const isAdmin = isPrincipalOrVP || user?.role === 'HOD';
    const hasFilters = !!(filterLevel || filterDomain || filterSubDomain || search);

    const SubjectCard = ({ subject }: { subject: any }) => {
        const isRegistered = subject.students?.includes(user?.id);
        const isAutoLvl = ['Form 1', 'Form 2', 'Form 3'].includes(subject.level);
        const matchesLvl = user?.role === 'STUDENT' && user.profile?.level === subject.level;
        const showAsEnrolled = isRegistered || (isAutoLvl && matchesLvl);

        return (
            <div key={subject.id} className="card-base p-0 overflow-hidden flex flex-col group">
                <div className={`h-1.5 w-full ${showAsEnrolled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`} />

                <div
                    onClick={() => user?.role === 'STUDENT' ? router.push(`/dashboard/subjects/${subject.id}`) : setManagingSubject(subject)}
                    className="p-6 flex-1 flex flex-col cursor-pointer"
                >
                    <div className="flex justify-between items-center mb-6">
                        <span className="font-black text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
                            {subject.code}
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                            <Icons.GraduationCap size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{subject.level}</span>
                        </div>
                    </div>

                    <h3 className="font-black text-xl mb-1 text-slate-900 dark:text-white leading-tight group-hover:text-primary transition-colors">
                        {subject.name}
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                        <Icons.Building size={12} />
                        {subject.department_name}
                    </p>

                    {(subject.domain_data || subject.sub_domain_data) && (
                        <div className="flex gap-2 mb-8 flex-wrap">
                            {subject.domain_data && (
                                <span className="badge-primary px-2.5 py-1">
                                    {subject.domain_data.name}
                                </span>
                            )}
                            {subject.sub_domain_data && (
                                <span className="inline-flex items-center px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                                    {subject.sub_domain_data.name}
                                </span>
                            )}
                        </div>
                    )}

                    <div className="mt-auto pt-6 border-t border-slate-50 dark:border-slate-800/50">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">Lead Teacher</span>
                            <Icons.ShieldCheck size={12} className="text-slate-300 dark:text-slate-700" />
                        </div>
                        <div className="flex -space-x-2">
                            {subject.teachers_data?.map((t: any) => (
                                <div key={t.id} className="w-9 h-9 rounded-xl border-2 border-white dark:border-[#161b27] bg-violet-600 flex items-center justify-center text-white text-[11px] font-black shadow-sm" title={t.first_name}>
                                    {t.first_name.charAt(0)}
                                </div>
                            ))}
                            {(!subject.teachers_data || subject.teachers_data.length === 0) && (
                                <span className="text-[10px] text-slate-400 font-bold italic">Unassigned</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/10 border-t border-slate-50 dark:border-slate-800 flex gap-2">
                    {user?.role === 'STUDENT' ? (
                        showAsEnrolled ? (
                            <div className="flex-1 flex flex-col gap-2">
                                <div className="flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 bg-emerald-500/10 border border-emerald-500/20">
                                    <Icons.CircleCheck size={14} /> Enrolled
                                </div>
                                {!isAutoLvl && (
                                    <button
                                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors py-1"
                                        onClick={() => handleUnregister(subject.id)}
                                        disabled={registering === subject.id}
                                    >
                                        {registering === subject.id ? 'Processing...' : 'Drop Subject'}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <button className="btn-primary flex-1 h-11"
                                onClick={() => handleRegister(subject.id)}
                                disabled={registering === subject.id}>
                                {registering === subject.id ? <Icons.Loader2 className="animate-spin" /> : 'Enroll'}
                            </button>
                        )
                    ) : isAdmin ? (
                        <>
                            <button
                                onClick={() => setManagingSubject(subject)}
                                className="btn-modern-primary flex-1 h-11 text-[10px] group-hover:shadow-lg transition-all"
                            >
                                <Icons.Settings2 size={14} className="group-hover:rotate-90 transition-transform duration-500" /> Manage
                            </button>
                            <button
                                onClick={() => fetchStudents(subject)}
                                className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-primary/10 hover:text-primary transition-all border border-slate-200 dark:border-slate-700"
                                title="Audit Participants"
                            >
                                <Icons.Users size={14} />
                            </button>
                        </>
                    ) : (
                        <button className="btn-modern-secondary flex-1 h-11 text-[10px]">Curriculum Panel</button>
                    )}
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="space-y-5 animate-pulse">
            <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-[2rem]" />)}
            </div>
        </div>
    );

    const renderContent = () => {
        if (activeTab === 'catalog') {
            return (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    {showCatalogForm && (
                        <div className={`${cardCls} border-violet-200 dark:border-violet-900 shadow-xl shadow-violet-500/5`}>
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-600 text-white shadow-lg shadow-violet-600/20">
                                        <Icons.Plus className="w-5 h-5" />
                                    </div>
                                    Register Base Subject
                                </h2>
                                <button onClick={() => setShowCatalogForm(false)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all">
                                    <Icons.X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleAddBaseSubject} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                                <div className="space-y-2">
                                    <label className={labelCls}>Subject Identity</label>
                                    <input className="input-modern" placeholder="e.g. Applied Mathematics"
                                        value={newBaseName} onChange={(e) => setNewBaseName(e.target.value)} required />
                                </div>
                                <div className="space-y-2">
                                    <label className={labelCls}>Owner Department</label>
                                    <select className="input-modern" value={newBaseDept} onChange={(e) => setNewBaseDept(e.target.value)} required>
                                        <option value="">Select Department...</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" className="btn-primary flex-1 h-11" disabled={addingBase}>
                                        {addingBase ? 'Encrypting...' : 'Add to Catalog'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {baseSubjects.map(base => (
                            <div key={base.id} className="card-base p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400">
                                        <Icons.Package className="w-6 h-6" />
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                        CATALOG
                                    </span>
                                </div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{base.name}</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest mb-6 text-slate-500 dark:text-slate-500 flex items-center gap-2">
                                    <Icons.Building size={12} />
                                    {departments.find(d => d.id === base.department)?.name || 'General Records'}
                                </p>
                                <button className="btn-modern-secondary w-full py-2.5 text-[10px]">
                                    Analyze Deployment
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                {/* Search + Filters Sticky Bar */}
                <div className="sticky top-0 z-20 pb-4 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md">
                    <div className="card-base p-2 flex flex-col sm:flex-row gap-2 shadow-lg border-slate-200/60 dark:border-slate-800/60">
                        <div className="relative flex-1">
                            <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                className="w-full h-11 bg-transparent pl-14 pr-4 text-sm font-bold
                                    text-slate-900 dark:text-slate-100
                                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                                    outline-none"
                                placeholder="Search system subjects by name or code..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setShowFilters(!showFilters)}
                                className={`h-11 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${showFilters ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'}`}>
                                <Icons.SlidersHorizontal className="w-4 h-4" />
                                {showFilters ? 'Hide Parameters' : 'Refine Search'}
                            </button>
                            {hasFilters && (
                                <button onClick={() => { setFilterLevel(''); setFilterDomain(''); setFilterSubDomain(''); setSearch(''); }}
                                    className="h-11 px-4 rounded-xl text-[10px] font-black uppercase bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter panel */}
                    {showFilters && (
                        <div className="mt-2 card-base p-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300 shadow-xl border-primary/10">
                            <div className="space-y-2">
                                <label className={labelCls}>Academic Level</label>
                                <select className="input-modern" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
                                    <option value="">All Class Levels</option>
                                    {['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Lower Sixth', 'Upper Sixth'].map(l =>
                                        <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className={labelCls}>Subject Domain</label>
                                <select className="input-modern" value={filterDomain}
                                    onChange={(e) => { setFilterDomain(e.target.value); setFilterSubDomain(''); }}>
                                    <option value="">All Domains</option>
                                    <option value="GENERAL">General</option>
                                    <option value="VOCATIONAL">Vocational</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className={labelCls}>Specific Sub-domain</label>
                                <select className="input-modern" value={filterSubDomain}
                                    onChange={(e) => setFilterSubDomain(e.target.value)} disabled={!filterDomain}>
                                    <option value="">All Specializations</option>
                                    {filterDomain === 'GENERAL' && <><option value="ARTS">Arts</option><option value="SCIENCE">Science</option></>}
                                    {filterDomain === 'VOCATIONAL' && <><option value="COMMERCIAL">Commercial</option><option value="TECHNICAL">Technical</option></>}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Subject cards */}
                <div className="space-y-12 pb-12">
                    {isStudent ? (
                        <>
                            {/* Registered Subjects Section */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-4 px-2">
                                    <div className="w-1.5 h-8 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.4)]" />
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Active Curriculum</h2>
                                    <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                                        {filteredSubjects.filter(s => s.students?.includes(user?.id) || (['Form 1', 'Form 2', 'Form 3'].includes(s.level) && user?.profile?.level === s.level)).length} SUBJECTS
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredSubjects.filter(s => s.students?.includes(user?.id) || (['Form 1', 'Form 2', 'Form 3'].includes(s.level) && user?.profile?.level === s.level)).map((subject) => (
                                        <SubjectCard key={subject.id} subject={subject} />
                                    ))}
                                    {filteredSubjects.filter(s => s.students?.includes(user?.id) || (['Form 1', 'Form 2', 'Form 3'].includes(s.level) && user?.profile?.level === s.level)).length === 0 && (
                                        <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-slate-50/30 dark:bg-white/5">
                                            <Icons.BookX size={32} className="mx-auto mb-4 text-slate-300" />
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">No active subjects registered</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Unregistered Subjects Section */}
                            <section className="space-y-6 pt-12 border-t border-slate-100 dark:border-slate-800/80">
                                <div className="flex items-center gap-4 px-2">
                                    <div className="w-1.5 h-8 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                    <h2 className="text-2xl font-black text-slate-400 dark:text-slate-500 tracking-tight">Electives & Available</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredSubjects.filter(s => !s.students?.includes(user?.id) && !(['Form 1', 'Form 2', 'Form 3'].includes(s.level) && user?.profile?.level === s.level)).map((subject) => (
                                        <SubjectCard key={subject.id} subject={subject} />
                                    ))}
                                    {filteredSubjects.filter(s => !s.students?.includes(user?.id) && !(['Form 1', 'Form 2', 'Form 3'].includes(s.level) && user?.profile?.level === s.level)).length === 0 && (
                                        <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-slate-50/10 dark:bg-white/2">
                                            <Icons.CheckCircle2 size={32} className="mx-auto mb-4 text-emerald-500/20" />
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400/50">All level-appropriate subjects registered</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredSubjects.map((subject) => (
                                <SubjectCard key={subject.id} subject={subject} />
                            ))}
                        </div>
                    )}

                    {filteredSubjects.length === 0 && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[32px] bg-white/50 dark:bg-slate-900/10">
                            <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 mb-6">
                                <Icons.BookOpen size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Registry Empty</h3>
                            <p className="text-sm font-medium text-slate-500 mt-2 max-w-xs text-center leading-relaxed">
                                No subjects have been commissioned for <strong>{user?.profile?.level || 'your level'}</strong> yet.
                                Contact the Vice Principal or HOD to add subjects for your class.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Separated modasl and other overlays here to avoid layout/animation interference
    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Academic Subjects</h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Manage subjects and class assignments.</p>
                </div>
                {isAdmin && (
                    <div className="flex gap-2">
                        <button onClick={() => { setActiveTab('catalog'); setShowCatalogForm(true); }} className="btn-modern-secondary text-[11px]">
                            <Icons.Package className="w-4 h-4" /> Global Catalog
                        </button>
                        <button onClick={() => setActiveTab('instances')} className="btn-modern-primary text-[11px]">
                            <Icons.Layers className="w-4 h-4" /> Active Subjects
                        </button>
                    </div>
                )}
            </div>

            {/* Rest of the content wrapped in animation */}
            <div className="space-y-8 animate-in fade-in duration-700">
                {renderContent()}
            </div>

            {/* ── Governance / Management Panel Modal ── */}
            {managingSubject && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="card-base w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Icons.Settings2 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Subject Governance</h3>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">{managingSubject.name} &bull; {managingSubject.code}</p>
                                </div>
                            </div>
                            <button onClick={() => setManagingSubject(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
                                <Icons.X size={20} />
                            </button>
                        </div>

                        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Staffing Link */}
                            <button
                                onClick={() => router.push(`/dashboard/subjects/${managingSubject.id}/staff`)}
                                className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all text-left flex flex-col gap-3 group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Icons.Users size={20} />
                                </div>
                                <div>
                                    <div className="font-black text-sm text-slate-900 dark:text-white">Staff Management</div>
                                    <div className="text-[10px] text-slate-500 font-bold mt-1">Add or remove teachers assigned to this subject.</div>
                                </div>
                            </button>

                            {/* Syllabus Link */}
                            <button
                                onClick={() => router.push(`/dashboard/teacher/subjects/${managingSubject.id}/syllabus`)}
                                className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-500/5 transition-all text-left flex flex-col gap-3 group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-violet-500/5 flex items-center justify-center text-violet-500 group-hover:scale-110 transition-transform">
                                    <Icons.ScrollText size={20} />
                                </div>
                                <div>
                                    <div className="font-black text-sm text-slate-900 dark:text-white">Official Syllabus</div>
                                    <div className="text-[10px] text-slate-500 font-bold mt-1">Upload the curriculum document for this subject.</div>
                                </div>
                            </button>

                            {/* Notes Link */}
                            <button
                                onClick={() => router.push(`/dashboard/teacher/subjects/${managingSubject.id}/notes`)}
                                className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all text-left flex flex-col gap-3 group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-blue-500/5 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                    <Icons.FileText size={20} />
                                </div>
                                <div>
                                    <div className="font-black text-sm text-slate-900 dark:text-white">Study Resources</div>
                                    <div className="text-[10px] text-slate-500 font-bold mt-1">Distribute learning materials and lecture notes.</div>
                                </div>
                            </button>

                            {/* Quizzes Link */}
                            <button
                                onClick={() => router.push(`/dashboard/teacher/subjects/${managingSubject.id}/assessments`)}
                                className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/5 transition-all text-left flex flex-col gap-3 group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-amber-500/5 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                                    <Icons.ClipboardList size={20} />
                                </div>
                                <div>
                                    <div className="font-black text-sm text-slate-900 dark:text-white">Assessment Hub</div>
                                    <div className="text-[10px] text-slate-500 font-bold mt-1">Create and manage quizzes for this subject.</div>
                                </div>
                            </button>

                            {/* Decommission */}
                            <button
                                onClick={() => handleDeleteInstance(managingSubject.id)}
                                disabled={deleting === managingSubject.id}
                                className="p-6 rounded-3xl border border-red-200/50 dark:border-red-900/30 bg-red-50/10 dark:bg-red-950/5 hover:border-red-500 hover:shadow-xl hover:shadow-red-500/5 transition-all text-left flex flex-col gap-3 group sm:col-span-2"
                            >
                                <div className="w-10 h-10 rounded-xl bg-red-500/5 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                                    {deleting === managingSubject.id ? <Icons.Loader2 size={20} className="animate-spin" /> : <Icons.Trash2 size={20} />}
                                </div>
                                <div>
                                    <div className="font-black text-sm text-red-600 dark:text-red-500">Decommission Subject Instance</div>
                                    <div className="text-[10px] text-slate-500 font-bold mt-1">Permanently remove this subject from the system.</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
