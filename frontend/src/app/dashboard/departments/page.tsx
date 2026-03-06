'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import * as Icons from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function DepartmentsPage() {
    const { user } = useAuth();
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newCode, setNewCode] = useState('');
    const [adding, setAdding] = useState(false);

    const fetchDepts = async () => {
        try {
            const res = await api.get('departments/');
            setDepartments(res.data);
        } catch (err) {
            console.error('Failed to fetch departments', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepts();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdding(true);
        try {
            await api.post('departments/', { name: newName, code: newCode, type: 'CORE' });
            setNewName(''); setNewCode('');
            setShowForm(false);
            fetchDepts();
        } catch (err) {
            console.error('Failed to add department', err);
        } finally {
            setAdding(false);
        }
    };

    if (loading) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
            <div className="relative w-12 h-12">
                <div className="absolute inset-0 border-4 border-violet-600/10 rounded-full" />
                <div className="absolute inset-0 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] animate-pulse">Loading departments…</p>
        </div>
    );

    const isAdmin = ['PRINCIPAL', 'VICE_PRINCIPAL', 'HOD'].includes(user?.role || '');

    return (
        <div className="space-y-12 max-w-6xl mx-auto animate-in pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-3">Departments</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Manage academic departments and staff categories.</p>
                </div>
                {isAdmin && (
                    <button onClick={() => setShowForm(!showForm)} className="btn-modern-primary h-12 px-6">
                        <Icons.Plus className="w-4 h-4" /> {showForm ? 'Cancel' : 'Add Department'}
                    </button>
                )}
            </div>

            {showForm && (
                <div className="card-base p-8 animate-in slide-in-from-top-4 duration-500">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white">
                            <Icons.Layers size={16} />
                        </div>
                        Add New Department
                    </h2>
                    <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Department Name</label>
                            <input className="input-modern" placeholder="e.g. Science Department" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Short Code</label>
                            <input className="input-modern" placeholder="e.g. SCI" value={newCode} onChange={(e) => setNewCode(e.target.value)} required />
                        </div>
                        <button type="submit" className="btn-primary h-12" disabled={adding}>
                            {adding ? 'Saving...' : 'Add Department'}
                        </button>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {departments.map((dept) => (
                    <div key={dept.id} className="card-base p-0 flex flex-col group overflow-hidden hover:border-violet-400 dark:hover:border-violet-600">
                        <div className="p-8 pb-0">
                            <div className="flex justify-between items-start mb-8">
                                <div className="w-16 h-16 rounded-[1.5rem] bg-violet-600/10 flex items-center justify-center border border-violet-600/20 text-violet-600 dark:text-violet-400">
                                    <Icons.Layers className="w-8 h-8" />
                                </div>
                                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-[10px] font-black tracking-[0.2em] text-slate-400 dark:text-slate-500 uppercase">
                                    SYS-{dept.code || dept.id}
                                </div>
                            </div>

                            <h2 className="text-2xl font-black mb-4 text-slate-900 dark:text-white group-hover:text-violet-600 transition-colors leading-tight">
                                {dept.name}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-10 line-clamp-3">
                                {dept.description || "Active departmental unit overseeing curriculum delivery and staff coordination."}
                            </p>
                        </div>

                        <div className="px-8 mb-8">
                            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <div className="text-center py-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Students</p>
                                    <p className="font-black text-xl text-slate-900 dark:text-white leading-none">--</p>
                                </div>
                                <div className="text-center py-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Managed By</p>
                                    <p className="font-black text-[10px] text-violet-600 dark:text-violet-400 leading-none truncate px-2" title={dept.hod_data?.email}>
                                        {dept.hod_data?.first_name || 'STAFF'}
                                    </p>
                                </div>
                                <div className="text-center py-4 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Assets</p>
                                    <p className="font-black text-xl text-slate-900 dark:text-white leading-none">--</p>
                                </div>
                            </div>
                        </div>

                        <Link
                            href={`/dashboard/departments/${dept.id}`}
                            className="mt-auto px-8 py-5 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-50 dark:border-slate-800 hover:bg-violet-600 hover:text-white transition-all group/btn"
                        >
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] group-hover/btn:translate-x-1 transition-transform">View Department</span>
                            <Icons.ChevronRight className="w-5 h-5 opacity-50" />
                        </Link>
                    </div>
                ))}
            </div>

            {departments.length === 0 && (
                <div className="card-base p-20 text-center border-dashed border-2">
                    <Icons.Layers className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No departments found. Add one above.</p>
                </div>
            )}
        </div>
    );
}
