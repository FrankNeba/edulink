'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
    UserPlus, Mail, Hash, Phone, Building, LayoutGrid,
    ShieldCheck, CircleAlert, Loader2, CircleCheck, ArrowRight,
    User, ChevronRight, UserCheck
} from 'lucide-react';

export default function UsersManagementPage() {
    const { user } = useAuth();
    const [departments, setDepartments] = useState<any[]>([]);
    const [domains, setDomains] = useState<any[]>([]);
    const [subDomains, setSubDomains] = useState<any[]>([]);
    const [academicLevels, setAcademicLevels] = useState<any[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        department_id: '',
        domain_id: '',
        sub_domain_id: '',
        academic_level_id: '',
        level: 'Form 1',
        phone: '',
        role: 'STUDENT'
    });
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [depts, doms, subs, lvls] = await Promise.all([
                    api.get('departments/'),
                    api.get('domains/'),
                    api.get('sub-domains/'),
                    api.get('academic-levels/')
                ]);
                setDepartments(depts.data);
                setDomains(doms.data);
                setSubDomains(subs.data);
                setAcademicLevels(lvls.data);
            } catch (err) { }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        setResult(null);
        try {
            const endpoint = formData.role === 'STUDENT' ? 'users/create_student/' : 'users/create_teacher/';
            // Clean up IDs for sub_role logic in backend
            const payload = { ...formData };
            if (payload.role === 'TEACHER') {
                delete (payload as any).domain_id;
                delete (payload as any).sub_domain_id;
            }
            const res = await api.post(endpoint, payload);
            setResult({ type: 'success', data: res.data });
            setFormData({ ...formData, email: '', first_name: '', last_name: '', phone: '' });
        } catch (err: any) {
            setResult({ type: 'error', message: err.response?.data?.error || 'Operation failed' });
        } finally {
            setIsCreating(false);
        }
    };

    if (!['PRINCIPAL', 'VICE_PRINCIPAL', 'HOD'].includes(user?.role || '')) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center px-6">
                <CircleAlert className="w-16 h-16 text-red-500 mb-6 animate-pulse" />
                <h1 className="text-3xl font-black mb-2 tracking-tight dark:text-white">Access Restricted</h1>
                <p className="text-slate-500 font-medium">This section is reserved for academic administrators.</p>
            </div>
        );
    }

    const levels = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Lower Sixth', 'Upper Sixth'];
    const cardCls = "card-base p-8 md:p-10";
    const labelCls = "text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-2 block";

    return (
        <div className="space-y-12 max-w-6xl mx-auto animate-in pb-20">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Staff & Student Enrollment</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Add new students or teachers to the system.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                <div className="lg:col-span-3">
                    <div className={cardCls}>
                        <h2 className="text-xl font-bold mb-10 flex items-center gap-4 dark:text-white">
                            <div className="w-10 h-10 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-600 dark:text-violet-400 border border-violet-600/20">
                                <UserPlus size={20} />
                            </div>
                            Create User Account
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className={labelCls}>First Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-20 pointer-events-none" />
                                        <input
                                            className="input-modern !pl-10 relative z-10"
                                            placeholder="Enter first name"
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className={labelCls}>Last Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-20 pointer-events-none" />
                                        <input
                                            className="input-modern !pl-10 relative z-10"
                                            placeholder="Enter last name"
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className={labelCls}>Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-20 pointer-events-none" />
                                    <input
                                        type="email"
                                        className="input-modern !pl-10 relative z-10"
                                        placeholder="e.g. student@school.edu"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className={labelCls}>{formData.role === 'STUDENT' ? 'Section / Domain' : 'Department'}</label>
                                    <div className="relative">
                                        <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-20 pointer-events-none" />
                                        {formData.role === 'STUDENT' ? (
                                            <select
                                                className="input-modern !pl-10 appearance-none relative z-10"
                                                value={formData.domain_id}
                                                onChange={(e) => setFormData({ ...formData, domain_id: e.target.value })}
                                                required
                                            >
                                                <option value="">Select Section...</option>
                                                {domains.map(d => (
                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <select
                                                className="input-modern !pl-10 appearance-none relative z-10"
                                                value={formData.department_id}
                                                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                                                required
                                            >
                                                <option value="">Select Department...</option>
                                                {departments.map(d => (
                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className={labelCls}>Role</label>
                                    <div className="relative">
                                        <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-20 pointer-events-none" />
                                        <select
                                            className="input-modern !pl-10 appearance-none relative z-10"
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        >
                                            <option value="STUDENT">Student</option>
                                            <option value="TEACHER">Teacher</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {formData.role === 'STUDENT' && formData.domain_id && (
                                <div className="space-y-1">
                                    <label className={labelCls}>Stream / Sub-Domain</label>
                                    <div className="relative">
                                        <LayoutGrid className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-20 pointer-events-none" />
                                        <select
                                            className="input-modern !pl-10 appearance-none relative z-10"
                                            value={formData.sub_domain_id}
                                            onChange={(e) => setFormData({ ...formData, sub_domain_id: e.target.value })}
                                        >
                                            <option value="">Select Stream (Optional)...</option>
                                            {subDomains.filter(s => s.domain === parseInt(formData.domain_id)).map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {formData.role === 'STUDENT' && (
                                <div className="space-y-4">
                                    <label className={labelCls}>Class Level</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                                        {academicLevels
                                            .filter(al => {
                                                const dMatch = formData.domain_id ? al.domain === parseInt(formData.domain_id) : true;
                                                const sdMatch = formData.sub_domain_id ? al.sub_domain === parseInt(formData.sub_domain_id) : (al.sub_domain === null);
                                                return dMatch && sdMatch;
                                            })
                                            .map(lvl => (
                                                <button
                                                    key={lvl.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, level: lvl.name, academic_level_id: lvl.id })}
                                                    className={`py-3 rounded-xl font-bold text-[10px] uppercase tracking-tighter border-2 transition-all ${formData.academic_level_id === lvl.id
                                                        ? 'border-violet-600 bg-violet-600/5 text-violet-600 shadow-lg shadow-violet-600/10'
                                                        : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-200 dark:hover:border-slate-700'
                                                        }`}
                                                >
                                                    {lvl.name}
                                                </button>
                                            ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className={labelCls}>Phone Number (Optional)</label>
                                <div className="relative">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-20 pointer-events-none" />
                                    <input
                                        className="input-modern !pl-10"
                                        placeholder="+237 ..."
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn-primary w-full h-14 group" disabled={isCreating}>
                                {isCreating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    <>
                                        Create Account <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="card-base p-8 bg-slate-900 border-none relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <ShieldCheck className="w-40 h-40 text-white" />
                        </div>
                        <h3 className="font-black text-xs uppercase tracking-[0.2em] mb-6 flex items-center gap-3 text-white">
                            <div className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_#8b5cf6]" />
                            How it works
                        </h3>
                        <ul className="space-y-6">
                            {[
                                "A temporary password is generated and shown after account creation.",
                                "Student IDs are automatically assigned based on the school's format.",
                                "Users are prompted to change their password on first login."
                            ].map((text, i) => (
                                <li key={i} className="flex gap-4">
                                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[10px] text-violet-400 font-black shrink-0 border border-white/10">
                                        {i + 1}
                                    </div>
                                    <span className="text-xs font-medium text-slate-400 leading-relaxed">{text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {result && (
                        <div className={`card-base p-8 animate-in zoom-in-95 duration-300 ${result.type === 'success' ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
                            <div className="flex items-center gap-4 mb-8">
                                {result.type === 'success' ? (
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                        <UserCheck className="w-6 h-6 text-white" />
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 rounded-2xl bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/20">
                                        <CircleAlert className="w-6 h-6 text-white" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-black text-sm uppercase tracking-widest dark:text-white">
                                        {result.type === 'success' ? 'Account Created' : 'Could Not Create Account'}
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{result.type === 'success' ? 'Share the temporary password below.' : 'Please check the details and try again.'}</p>
                                </div>
                            </div>

                            {result.type === 'success' ? (
                                <div className="space-y-6">
                                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4 shadow-inner">
                                        {result.data.student_id && (
                                            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student ID</span>
                                                <span className="text-violet-600 dark:text-violet-400 font-black font-mono">{result.data.student_id}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center pt-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Temporary Password</span>
                                            <span className="text-emerald-500 font-black font-mono text-lg tracking-tight select-all">{result.data.default_password}</span>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-amber-500/5 rounded-2xl flex gap-3 border border-amber-500/10">
                                        <CircleAlert size={18} className="text-amber-500 shrink-0" />
                                        <p className="text-[10px] font-bold text-amber-600/80 leading-relaxed uppercase tracking-tight">
                                            Important: Share the temporary password with the user. They will be asked to change it on first login.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-red-500 font-bold leading-relaxed bg-red-500/5 p-4 rounded-xl border border-red-500/10">{result.message}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
