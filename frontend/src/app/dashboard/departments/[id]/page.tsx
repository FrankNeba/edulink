'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import * as Icons from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DepartmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const { user } = useAuth();

    const [dept, setDept] = useState<any>(null);
    const [baseSubjects, setBaseSubjects] = useState<any[]>([]);
    const [instances, setInstances] = useState<any[]>([]);
    const [hods, setHods] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [levels, setLevels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form states
    const [showBaseForm, setShowBaseForm] = useState(false);
    const [showDeployForm, setShowDeployForm] = useState(false);
    const [newBaseName, setNewBaseName] = useState('');
    const [deployBaseId, setDeployBaseId] = useState('');
    const [deployLevelId, setDeployLevelId] = useState('');
    const [deployCode, setDeployCode] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = async () => {
        try {
            const [deptRes, baseRes, instRes, hodRes, teachRes, lvlRes] = await Promise.all([
                api.get(`departments/${id}/`),
                api.get(`base-subjects/?department=${id}`),
                api.get(`subjects/?department=${id}`),
                api.get('users/by_role/?role=HOD'),
                api.get('users/by_role/?role=TEACHER'),
                api.get('academic-levels/')
            ]);
            setDept(deptRes.data);
            setBaseSubjects(baseRes.data.filter((b: any) => b.department === parseInt(id)));
            setInstances(instRes.data.filter((s: any) => s.department === parseInt(id)));
            setHods(hodRes.data);
            setTeachers(teachRes.data);
            setLevels(lvlRes.data);
        } catch (err) {
            console.error('Failed to fetch data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [id]);

    const handleAssignHOD = async (baseSubId: number, hodId: string) => {
        setActionLoading(true);
        try {
            await api.patch(`base-subjects/${baseSubId}/`, { hod: hodId });
            fetchData();
        } catch (err) {
            alert('Assignment failed');
        } finally {
            setActionLoading(false);
        }
    };
    /* ... handleAddBase ... */
    const handleAddBase = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            await api.post('base-subjects/', {
                name: newBaseName,
                department: id
            });
            setNewBaseName('');
            setShowBaseForm(false);
            fetchData();
        } catch (err) {
            alert('Creation failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeploy = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        const base = baseSubjects.find(b => b.id === parseInt(deployBaseId));
        const academicLevel = levels.find(l => l.id === parseInt(deployLevelId));
        if (!base || !academicLevel) return;

        try {
            await api.post('subjects/', {
                name: base.name,
                base_subject: base.id,
                code: deployCode,
                level: academicLevel.name,
                academic_level: academicLevel.id,
                department: id,
                domain: academicLevel.domain,
                sub_domain: academicLevel.sub_domain,
                hod: base.hod // Carry over HOD to the instance
            });
            setShowDeployForm(false);
            setDeployBaseId(''); setDeployLevelId(''); setDeployCode('');
            fetchData();
        } catch (err) {
            alert('Deployment failed');
        } finally {
            setActionLoading(false);
        }
    };
    const handleAssignTeacher = async (subjectId: number, teacherId: string) => {
        const subject = instances.find(s => s.id === subjectId);
        if (!subject) return;

        const newTeachers = [...subject.teachers, parseInt(teacherId)];
        try {
            await api.patch(`subjects/${subjectId}/`, { teachers: newTeachers });
            fetchData();
        } catch (err) {
            alert('Update failed');
        }
    };

    const handleRemoveTeacher = async (subjectId: number, teacherId: number) => {
        const subject = instances.find(s => s.id === subjectId);
        if (!subject) return;

        const newTeachers = subject.teachers.filter((tid: number) => tid !== teacherId);
        try {
            await api.patch(`subjects/${subjectId}/`, { teachers: newTeachers });
            fetchData();
        } catch (err) {
            alert('Update failed');
        }
    };
    /* ... same Loading ... */
    if (loading) return <div className="p-20 text-center animate-pulse">Loading department...</div>;

    const isAdmin = ['PRINCIPAL', 'VICE_PRINCIPAL', 'HOD'].includes(user?.role || '');
    const isVP = ['PRINCIPAL', 'VICE_PRINCIPAL'].includes(user?.role || '');

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-20 animate-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <Link href="/dashboard/departments" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-violet-600 flex items-center gap-2">
                        <Icons.ArrowLeft size={14} /> Back to Sections
                    </Link>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        {dept?.name} <span className="text-slate-300 dark:text-slate-700 font-light">/</span> {dept?.code}
                    </h1>
                    <div className="flex flex-wrap gap-3">
                        <span className="badge-primary px-3 py-1.5 flex items-center gap-2">
                            <Icons.ShieldCheck size={12} />
                            Section Head: {dept?.dean_data?.first_name ? `${dept.dean_data.first_name} ${dept.dean_data.last_name}` : 'UNASSIGNED'}
                        </span>
                        <span className="badge-secondary px-3 py-1.5 flex items-center gap-2">
                            <Icons.Zap size={12} />
                            Subjects: {instances.length}
                        </span>
                    </div>
                </div>

                {isVP && (
                    <div className="flex gap-3">
                        <Button onClick={() => setShowBaseForm(true)} className="h-12 rounded-2xl bg-violet-600 hover:bg-violet-700">
                            <Icons.PlusSquare className="w-4 h-4 mr-2" /> Add Subject
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Catalog Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="card-base p-6">
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center justify-between">
                            Subject Catalogue
                            <Icons.BookOpen size={16} />
                        </h2>

                        {showBaseForm && (
                            <form onSubmit={handleAddBase} className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-violet-200 dark:border-violet-900 animate-in zoom-in-95">
                                <input
                                    className="input-modern mb-3"
                                    placeholder="Subject Title..."
                                    value={newBaseName}
                                    onChange={(e) => setNewBaseName(e.target.value)}
                                    required
                                />
                                <div className="flex gap-2">
                                    <Button type="submit" size="sm" className="flex-1 bg-violet-600">Save</Button>
                                    <Button type="button" size="sm" variant="ghost" onClick={() => setShowBaseForm(false)}>Cancel</Button>
                                </div>
                            </form>
                        )}

                        <div className="space-y-3">
                            {baseSubjects.map(base => (
                                <div key={base.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 group hover:border-violet-300 transition-all">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white text-sm">{base.name}</p>
                                            <p className="text-[10px] text-slate-500 font-medium">Catalogue Subject</p>
                                        </div>
                                        <button
                                            onClick={() => { setDeployBaseId(base.id.toString()); setShowDeployForm(true); }}
                                            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:text-violet-600"
                                        >
                                            <Icons.PlaneTakeoff size={16} />
                                        </button>
                                    </div>

                                    <div className="pt-3 border-t border-slate-50 dark:border-slate-800/50">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Subject HOD</p>
                                        <select
                                            className="w-full h-8 px-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-[10px] font-bold text-violet-600 outline-none"
                                            onChange={(e) => handleAssignHOD(base.id, e.target.value)}
                                            value={base.hod || ''}
                                        >
                                            <option value="">Select HOD...</option>
                                            {hods.map(h => <option key={h.id} value={h.id}>{h.first_name} {h.last_name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Subject Instances */}
                <div className="lg:col-span-8 space-y-8">
                    {showDeployForm && (
                        <div className="card-base p-8 border-violet-500/20 bg-violet-50/10 animate-in slide-in-from-right-4">
                            <h2 className="text-xl font-bold mb-6">Assign Subject to a Class</h2>
                            <form onSubmit={handleDeploy} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Base Subject</label>
                                    <select className="input-modern" value={deployBaseId} onChange={(e) => setDeployBaseId(e.target.value)} required>
                                        <option value="">Select subject...</option>
                                        {baseSubjects.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Target Level</label>
                                    <select className="input-modern" value={deployLevelId} onChange={(e) => setDeployLevelId(e.target.value)} required>
                                        <option value="">Select Level...</option>
                                        {levels.map(l => <option key={l.id} value={l.id}>{l.name} ({l.domain_name})</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Subject Code</label>
                                    <input className="input-modern" placeholder="e.g. MATH-F1-01" value={deployCode} onChange={(e) => setDeployCode(e.target.value)} required />
                                </div>
                                <div className="flex gap-3 pt-6">
                                    <Button type="submit" className="flex-1 bg-violet-600" disabled={actionLoading}>Create Subject</Button>
                                    <Button type="button" variant="ghost" onClick={() => setShowDeployForm(false)}>Cancel</Button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {instances.map(inst => (
                            <div key={inst.id} className="card-base p-6 flex flex-col hover:border-violet-500 transition-all border-l-4 border-l-violet-600">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-600">LVL: {inst.level}</p>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">{inst.name}</h3>
                                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">{inst.code}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                                        <Icons.GraduationCap size={20} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Teaching Staff</p>
                                        <div className="flex flex-wrap gap-2">
                                            {inst.teachers_data?.map((t: any) => (
                                                <div key={t.id} className="group relative">
                                                    <div className="px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 text-[10px] font-bold border border-violet-100 dark:border-violet-900/30 flex items-center gap-2">
                                                        {t.first_name}
                                                        <Icons.X
                                                            size={12}
                                                            className="cursor-pointer hover:text-red-500"
                                                            onClick={() => handleRemoveTeacher(inst.id, t.id)}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="relative">
                                                <select
                                                    className="appearance-none bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-bold border-none cursor-pointer outline-none"
                                                    onChange={(e) => handleAssignTeacher(inst.id, e.target.value)}
                                                    value=""
                                                >
                                                    <option value="" disabled>+</option>
                                                    {teachers.filter(t => !inst.teachers.includes(t.id)).map(t => (
                                                        <option key={t.id} value={t.id}>{t.first_name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
