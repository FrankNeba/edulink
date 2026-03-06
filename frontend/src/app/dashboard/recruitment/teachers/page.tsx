'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
    UserPlus, Mail, Phone, Building,
    ShieldCheck, CircleAlert, Loader2,
    User, ArrowRight, UserCheck, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AddTeachersPage() {
    const { user: currentUser } = useAuth();
    const [departments, setDepartments] = useState<any[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        department_id: '',
        phone: '',
    });
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const depts = await api.get('departments/');
                setDepartments(depts.data);
            } catch (err) { }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        setResult(null);
        try {
            const res = await api.post('users/create_teacher/', formData);
            setResult({ type: 'success', data: res.data });
            setFormData({ email: '', first_name: '', last_name: '', department_id: '', phone: '' });
        } catch (err: any) {
            setResult({ type: 'error', message: err.response?.data?.error || 'Operation failed' });
        } finally {
            setIsCreating(false);
        }
    };

    if (!['PRINCIPAL', 'VICE_PRINCIPAL', 'HOD'].includes(currentUser?.role || '')) {
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
            <div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-3">Staff Enrollment</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Add new teachers and assign them to their department.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                <div className="lg:col-span-3">
                    <div className="card-base p-10 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none translate-y-0 hover:-translate-y-1 transition-all duration-300">
                        <form onSubmit={handleSubmit} className="space-y-10">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <label className={labelCls}>First Name</label>
                                    <input
                                        className="input-modern"
                                        placeholder="John"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className={labelCls}>Last Name</label>
                                    <input
                                        className="input-modern"
                                        placeholder="Doe"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className={labelCls}>Email Address</label>
                                <input
                                    type="email"
                                    className="input-modern"
                                    placeholder="teacher@school.edu"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <label className={labelCls}>Department</label>
                                    <select
                                        className="input-modern"
                                        value={formData.department_id}
                                        onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Department...</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className={labelCls}>Phone Number (Optional)</label>
                                    <input
                                        className="input-modern"
                                        placeholder="+237 ..."
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn-primary w-full h-16 text-lg tracking-tight group" disabled={isCreating}>
                                {isCreating ? (
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                ) : (
                                    <span className="flex items-center justify-center gap-3">
                                        Verify & Enroll Teacher <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="card-base p-8 bg-violet-600 text-white border-none shadow-xl shadow-violet-200 dark:shadow-none">
                        <ShieldCheck className="w-12 h-12 mb-6 text-violet-200" />
                        <h3 className="text-xl font-black mb-4 leading-tight">Account Setup</h3>
                        <p className="text-violet-100 text-sm leading-relaxed font-medium mb-6">
                            When a teacher is added, a unique
                            <span className="font-black text-white px-1.5 underline decoration-2 underline-offset-4">Teacher ID</span>
                            and a temporary password are generated automatically.
                        </p>
                        <div className="p-4 bg-white/10 rounded-xl border border-white/10 flex items-start gap-3">
                            <Mail size={18} className="text-violet-200 shrink-0 mt-0.5" />
                            <p className="text-[11px] font-bold text-violet-50 leading-relaxed uppercase tracking-tight">
                                The teacher will receive their login details via email.
                            </p>
                        </div>
                    </div>

                    {result && (
                        <div className={`card-base p-8 animate-in zoom-in-95 ${result.type === 'success' ? 'border-emerald-500' : 'border-red-500'}`}>
                            <div className="flex items-center gap-4 mb-8">
                                {result.type === 'success' ? (
                                    <UserCheck className="w-8 h-8 text-emerald-500" />
                                ) : (
                                    <CircleAlert className="w-8 h-8 text-red-500" />
                                )}
                                <div>
                                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">
                                        {result.type === 'success' ? 'Enrolled Successfully' : 'Enrollment Error'}
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400">STATUS: {result.type === 'success' ? 'OK' : 'ERROR'}</p>
                                </div>
                            </div>

                            {result.type === 'success' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                        <span className="text-[10px] font-black uppercase text-slate-400">Teacher ID</span>
                                        <span className="font-black text-violet-600 dark:text-violet-400">{result.data.teacher_id}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                        <span className="text-[10px] font-black uppercase text-slate-400">Temporary Password</span>
                                        <span className="font-black text-emerald-500">{result.data.default_password}</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-tighter italic">
                                        The teacher has been notified via email.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
