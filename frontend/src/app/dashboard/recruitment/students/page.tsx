'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
    UserPlus, Mail, Phone, Building,
    ShieldCheck, CircleAlert, Loader2,
    User, ArrowRight, UserCheck, FileSpreadsheet,
    Upload, CheckCircle, XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AddStudentsPage() {
    const { user: currentUser } = useAuth();
    const [domains, setDomains] = useState<any[]>([]);
    const [subDomains, setSubDomains] = useState<any[]>([]);
    const [academicLevels, setAcademicLevels] = useState<any[]>([]);

    const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual');
    const [isCreating, setIsCreating] = useState(false);
    const [result, setResult] = useState<any>(null);

    // Manual Form State
    const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        domain_id: '',
        sub_domain_id: '',
        academic_level_id: '',
        level: '',
        phone: '',
    });

    // Bulk State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [bulkLevelId, setBulkLevelId] = useState('');
    const [bulkResult, setBulkResult] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [doms, subs, lvls] = await Promise.all([
                    api.get('domains/'),
                    api.get('sub-domains/'),
                    api.get('academic-levels/')
                ]);
                setDomains(doms.data);
                setSubDomains(subs.data);
                setAcademicLevels(lvls.data);
            } catch (err) { }
        };
        fetchData();
    }, []);

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.level) {
            setResult({ type: 'error', message: 'Please select a class level before submitting.' });
            return;
        }
        setIsCreating(true);
        setResult(null);
        try {
            const res = await api.post('users/create_student/', formData);
            setResult({ type: 'success', data: res.data });
            setFormData({ email: '', first_name: '', last_name: '', phone: '', domain_id: '', sub_domain_id: '', academic_level_id: '', level: '' });
        } catch (err: any) {
            // Show field-level errors from DRF or a general message
            const errData = err.response?.data;
            let msg = 'Operation failed';
            if (errData) {
                if (typeof errData === 'string') {
                    msg = errData;
                } else if (errData.error) {
                    msg = errData.error;
                } else {
                    // DRF field errors: { field: ['message'] }
                    msg = Object.entries(errData)
                        .map(([k, v]) => `${k}: ${Array.isArray(v) ? (v as string[]).join(', ') : v}`)
                        .join(' | ');
                }
            }
            setResult({ type: 'error', message: msg });
        } finally {
            setIsCreating(false);
        }
    };

    const handleBulkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !bulkLevelId) return;

        setIsCreating(true);
        setBulkResult(null);
        const data = new FormData();
        data.append('file', selectedFile);
        data.append('academic_level_id', bulkLevelId);

        try {
            const res = await api.post('users/bulk_create_students/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setBulkResult(res.data);
        } catch (err: any) {
            alert('Bulk upload failed');
        } finally {
            setIsCreating(false);
        }
    };

    if (!['VICE_PRINCIPAL', 'HOD'].includes(currentUser?.role || '')) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center px-6">
                <h1 className="text-2xl font-black mb-2 text-slate-900 dark:text-white">Access Restricted</h1>
                <p className="text-slate-500 font-medium">Only administrators can access this page.</p>
            </div>
        );
    }

    const labelCls = "text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-2 block";

    return (
        <div className="space-y-12 max-w-6xl mx-auto animate-in pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-3">Student Recruitment</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Register new students and assign them to a class level.</p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => setActiveTab('manual')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'manual' ? 'bg-white dark:bg-slate-800 text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Manual
                    </button>
                    <button
                        onClick={() => setActiveTab('bulk')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'bulk' ? 'bg-white dark:bg-slate-800 text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Bulk Excel Upload
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-6 gap-12">
                <div className="lg:col-span-4 transition-all duration-500">
                    {activeTab === 'manual' ? (
                        <div className="card-base p-10 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none translate-y-0 hover:-translate-y-1 transition-all duration-300">
                            <form onSubmit={handleManualSubmit} className="space-y-10">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <label className={labelCls}>First Name</label>
                                        <input className="input-modern" placeholder="Student First Name" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required />
                                    </div>
                                    <div className="space-y-1">
                                        <label className={labelCls}>Last Name</label>
                                        <input className="input-modern" placeholder="Student Last Name" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className={labelCls}>Personal/Guardian Email</label>
                                    <input type="email" className="input-modern" placeholder="student@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <label className={labelCls}>Section / Domain</label>
                                        <select className="input-modern" value={formData.domain_id} onChange={(e) => setFormData({ ...formData, domain_id: e.target.value })} required>
                                            <option value="">Select Domain...</option>
                                            {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={labelCls}>Stream / Sub-Domain</label>
                                        <select className="input-modern" value={formData.sub_domain_id} onChange={(e) => setFormData({ ...formData, sub_domain_id: e.target.value })}>
                                            <option value="">Common / None...</option>
                                            {subDomains.filter(s => s.domain === parseInt(formData.domain_id)).map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className={labelCls}>Class Level</label>
                                    {!formData.domain_id && (
                                        <p className="text-[10px] text-amber-500 font-bold">↑ Select a section first to see available class levels.</p>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        {academicLevels.filter(al => {
                                            if (!formData.domain_id) return true;
                                            const dMatch = al.domain === parseInt(formData.domain_id);
                                            const sdMatch = !formData.sub_domain_id || al.sub_domain === parseInt(formData.sub_domain_id) || al.sub_domain === null;
                                            return dMatch && sdMatch;
                                        }).map(lvl => (
                                            <button
                                                key={lvl.id} type="button"
                                                onClick={() => setFormData({ ...formData, level: lvl.name, academic_level_id: lvl.id })}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter border-2 transition-all ${formData.academic_level_id === lvl.id
                                                    ? 'border-violet-600 bg-violet-600/10 text-violet-600'
                                                    : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-violet-400 hover:text-violet-600'
                                                    }`}
                                            >
                                                {lvl.name}
                                            </button>
                                        ))}
                                    </div>
                                    {formData.level && (
                                        <p className="text-[10px] text-emerald-500 font-black">✓ Selected: {formData.level}</p>
                                    )}
                                </div>

                                <button type="submit" className="btn-primary w-full h-16 text-lg tracking-tight group" disabled={isCreating}>
                                    {isCreating ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : <span className="flex items-center justify-center gap-3">Register Student <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="card-base p-10 bg-white dark:bg-slate-900 border-dashed border-2 border-slate-200 dark:border-slate-800">
                            <h2 className="text-xl font-bold mb-8 flex items-center gap-4 dark:text-white">
                                <div className="w-10 h-10 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-600 border border-emerald-600/20">
                                    <FileSpreadsheet size={20} />
                                </div>
                                Bulk Import via Excel
                            </h2>

                            <form onSubmit={handleBulkSubmit} className="space-y-10">
                                <div className="space-y-6">
                                    <label className={labelCls}>Class Level</label>
                                    <select className="input-modern" value={bulkLevelId} onChange={(e) => setBulkLevelId(e.target.value)} required>
                                        <option value="">Select class level...</option>
                                        {academicLevels.map(al => <option key={al.id} value={al.id}>{al.name} ({al.domain_name})</option>)}
                                    </select>
                                </div>

                                <div className="relative group">
                                    <input
                                        type="file" accept=".xlsx,.xls"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    />
                                    <div className="p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl group-hover:border-violet-400 group-hover:bg-violet-50/5 transition-all text-center">
                                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-400 group-hover:text-violet-500 group-hover:rotate-12 transition-all">
                                            <Upload size={32} />
                                        </div>
                                        <p className="text-sm font-black text-slate-900 dark:text-white mb-2 uppercase tracking-wide">
                                            {selectedFile ? selectedFile.name : 'Drop Excel file here or click to browse'}
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Supports .xlsx, .xls • Required: email, first_name, last_name</p>
                                    </div>
                                </div>

                                <button type="submit" className="btn-primary w-full h-16 text-lg tracking-tight bg-emerald-600 hover:bg-emerald-700" disabled={isCreating || !selectedFile}>
                                    {isCreating ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : <span className="flex items-center justify-center gap-3">Import Students <CheckCircle className="w-5 h-5" /></span>}
                                </button>
                            </form>

                            {bulkResult && (
                                <div className="mt-10 p-8 rounded-3xl bg-slate-900 text-white animate-in slide-in-from-bottom-5">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Import Result</h3>
                                        <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-lg border border-emerald-500/20">Created: {bulkResult.created}</div>
                                    </div>
                                    {bulkResult.errors?.length > 0 && (
                                        <div className="space-y-3">
                                            <p className="text-red-400 text-[10px] font-black uppercase">Errors:</p>
                                            <div className="max-h-32 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                                {bulkResult.errors.map((err: string, i: number) => (
                                                    <div key={i} className="text-[10px] font-mono p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300">{err}</div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="card-base p-8 bg-slate-900 text-white border-none shadow-xl">
                        <ShieldCheck className="w-12 h-12 mb-6 text-violet-400" />
                        <h3 className="text-xl font-black mb-4 leading-tight">Enrolment Info</h3>
                        <ul className="space-y-6">
                            {[
                                "Student IDs are auto-generated based on their section and class level.",
                                "A temporary password is assigned for first login.",
                                "Students in Form 1–3 are automatically enrolled in class subjects."
                            ].map((text, i) => (
                                <li key={i} className="flex gap-4">
                                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] text-violet-400 font-black shrink-0 border border-white/10">{i + 1}</div>
                                    <span className="text-xs font-medium text-slate-400 leading-relaxed">{text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {result && activeTab === 'manual' && (
                        <div className={`card-base p-8 animate-in zoom-in-95 ${result.type === 'success' ? 'border-emerald-500' : 'border-red-500'}`}>
                            <div className="flex items-center gap-4 mb-8">
                                {result.type === 'success' ? <UserCheck className="w-8 h-8 text-emerald-500" /> : <XCircle className="w-8 h-8 text-red-500" />}
                                <div>
                                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">{result.type === 'success' ? 'Student Created' : 'Error'}</h3>
                                    <p className="text-[10px] font-bold text-slate-400">{result.type === 'success' ? 'Share the details below.' : 'Please check and try again.'}</p>
                                </div>
                            </div>

                            {result.type === 'success' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                        <span className="text-[10px] font-black uppercase text-slate-400">Student ID</span>
                                        <span className="font-black text-violet-600 dark:text-violet-400">{result.data.student_id}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                        <span className="text-[10px] font-black uppercase text-slate-400">Temporary Password</span>
                                        <span className="font-black text-emerald-500">{result.data.default_password}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
