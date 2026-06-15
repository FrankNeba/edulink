'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
    Users, UserCheck, Shield, Award, Mail, Phone,
    Building, Loader2, CircleAlert, CheckCircle, ArrowRight,
    UserPlus, Edit2, X, School
} from 'lucide-react';
import Link from 'next/link';

export default function TeachersDirectoryPage() {
    const { user: currentUser } = useAuth();
    const [teachers, setTeachers] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state for role assignment
    const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
    const [newRole, setNewRole] = useState<string>('');
    const [selectedDeptId, setSelectedDeptId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const fetchTeachersAndDepts = async () => {
        try {
            setIsLoading(true);
            const [teachersRes, deptsRes] = await Promise.all([
                api.get('users/teachers/'),
                api.get('departments/')
            ]);
            setTeachers(teachersRes.data);
            setDepartments(deptsRes.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load directory data.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTeachersAndDepts();
    }, []);

    const handleOpenAssignModal = (teacher: any) => {
        setSelectedTeacher(teacher);
        setNewRole(teacher.role);
        setSelectedDeptId(teacher.profile?.department?.toString() || '');
        setSubmitResult(null);
    };

    const handleCloseModal = () => {
        setSelectedTeacher(null);
        setSubmitResult(null);
    };

    const handleAssignRoleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTeacher) return;

        setIsSubmitting(true);
        setSubmitResult(null);

        try {
            const payload: any = { role: newRole };
            if (newRole === 'HOD' || newRole === 'TEACHER') {
                if (!selectedDeptId) {
                    setSubmitResult({ type: 'error', message: 'Please select a department.' });
                    setIsSubmitting(false);
                    return;
                }
                payload.department_id = parseInt(selectedDeptId);
            }

            await api.post(`users/${selectedTeacher.id}/set_role/`, payload);
            setSubmitResult({ type: 'success', message: `Role updated successfully to ${newRole.replace('_', ' ')}.` });
            
            // Refresh list
            await fetchTeachersAndDepts();
            
            // Auto close after 1.5s
            setTimeout(() => {
                handleCloseModal();
            }, 1500);
        } catch (err: any) {
            setSubmitResult({
                type: 'error',
                message: err.response?.data?.error || 'Failed to assign role.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isPrincipal = currentUser?.role === 'PRINCIPAL';
    const isVPOrPrincipal = ['PRINCIPAL', 'VICE_PRINCIPAL'].includes(currentUser?.role || '');

    if (isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center">
                <Loader2 className="w-12 h-12 animate-spin text-violet-600 mb-4" />
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Loading Teachers Directory...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-center px-6">
                <CircleAlert className="w-16 h-16 text-red-500 mb-6" />
                <h1 className="text-2xl font-black mb-2 text-slate-900 dark:text-white">Error Loading Directory</h1>
                <p className="text-slate-500 font-medium mb-6">{error}</p>
                <button onClick={fetchTeachersAndDepts} className="btn-primary px-6 py-3">Retry</button>
            </div>
        );
    }

    const labelCls = "text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] mb-2 block";

    return (
        <>
            <div className="space-y-12 max-w-6xl mx-auto animate-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-3">Teachers Directory</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">View the official roster of teaching and administrative staff.</p>
                </div>
                {isVPOrPrincipal && (
                    <Link href="/dashboard/recruitment/teachers" className="btn-primary px-6 h-14 group flex items-center justify-center gap-3">
                        <UserPlus size={18} />
                        Enroll New Teacher
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                )}
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="card-base p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-violet-600/10 text-violet-600 flex items-center justify-center">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Staff</p>
                        <p className="text-2xl font-black dark:text-white mt-0.5">{teachers.length}</p>
                    </div>
                </div>
                <div className="card-base p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                        <Shield size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Administrators</p>
                        <p className="text-2xl font-black dark:text-white mt-0.5">
                            {teachers.filter(t => ['PRINCIPAL', 'VICE_PRINCIPAL'].includes(t.role)).length}
                        </p>
                    </div>
                </div>
                <div className="card-base p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <Award size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Heads of Department</p>
                        <p className="text-2xl font-black dark:text-white mt-0.5">
                            {teachers.filter(t => t.role === 'HOD').length}
                        </p>
                    </div>
                </div>
            </div>

            {/* List Table */}
            <div className="card-base overflow-hidden border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Teacher Details</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Contact Information</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Assigned Role</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">Department / Office</th>
                                {isVPOrPrincipal && (
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 text-right">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {teachers.length > 0 ? (
                                teachers.map((teacher: any) => {
                                    // Custom colors for roles
                                    const roleStyles = {
                                        PRINCIPAL: 'bg-red-500/10 text-red-500 border border-red-500/20',
                                        VICE_PRINCIPAL: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
                                        HOD: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
                                        TEACHER: 'bg-violet-600/10 text-violet-600 border border-violet-600/20'
                                    }[teacher.role as string] || 'bg-slate-100 text-slate-600';

                                    const roleName = {
                                        PRINCIPAL: 'Principal',
                                        VICE_PRINCIPAL: 'Vice Principal',
                                        HOD: 'Head of Department',
                                        TEACHER: 'Teacher'
                                    }[teacher.role as string] || teacher.role;

                                    return (
                                        <tr key={teacher.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
                                                        {teacher.first_name?.charAt(0)}{teacher.last_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white capitalize">
                                                            {teacher.first_name} {teacher.last_name}
                                                        </div>
                                                        {teacher.profile?.teacher_id && (
                                                            <span className="text-[9px] font-black text-slate-400 font-mono mt-0.5 block">{teacher.profile.teacher_id}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                                                        <Mail size={12} className="text-slate-400 shrink-0" />
                                                        {teacher.email}
                                                    </div>
                                                    {teacher.phone && (
                                                        <div className="flex items-center gap-2 text-slate-500 font-bold text-xs tabular-nums">
                                                            <Phone size={12} className="text-slate-400 shrink-0" />
                                                            {teacher.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${roleStyles}`}>
                                                    {roleName}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2 text-slate-500 font-semibold text-xs">
                                                    <Building size={14} className="text-slate-400" />
                                                    {teacher.profile?.department_name || (teacher.role === 'PRINCIPAL' ? 'Principal\'s Office' : teacher.role === 'VICE_PRINCIPAL' ? 'Academic Office' : '—')}
                                                </div>
                                            </td>
                                            {isVPOrPrincipal && (
                                                <td className="px-8 py-5 text-right">
                                                    {currentUser?.role === 'VICE_PRINCIPAL' && teacher.role === 'PRINCIPAL' ? (
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">Restricted</span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleOpenAssignModal(teacher)}
                                                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-violet-600 hover:text-violet-600 dark:hover:border-violet-400 dark:hover:text-violet-400 transition-colors text-xs font-bold"
                                                        >
                                                            <Edit2 size={12} />
                                                            Assign Role
                                                        </button>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={isVPOrPrincipal ? 5 : 4} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                                                <Users size={32} />
                                            </div>
                                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No teachers found in the directory.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            </div>

            {/* Modal Dialog for Role Assignment */}
            {selectedTeacher && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-violet-600/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white">
                                    <School size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Assign Staff Role</h3>
                                    <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest mt-0.5">Modify permissions & department</p>
                                </div>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleAssignRoleSubmit} className="p-8 space-y-6">
                            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Selected Staff member</span>
                                <span className="text-base font-black text-slate-800 dark:text-white capitalize block mt-1">
                                    {selectedTeacher.first_name} {selectedTeacher.last_name}
                                </span>
                                <span className="text-xs font-semibold text-slate-500 block mt-0.5">{selectedTeacher.email}</span>
                            </div>

                            <div className="space-y-2">
                                <label className={labelCls}>Select New Role</label>
                                <select
                                    className="input-modern w-full"
                                    value={newRole}
                                    onChange={(e) => {
                                        setNewRole(e.target.value);
                                        // Reset department if setting role to principal or vice principal
                                        if (['PRINCIPAL', 'VICE_PRINCIPAL'].includes(e.target.value)) {
                                            setSelectedDeptId('');
                                        }
                                    }}
                                    required
                                >
                                    <option value="TEACHER">Teacher</option>
                                    <option value="HOD">Head of Department (HOD)</option>
                                    {isPrincipal && (
                                        <>
                                            <option value="VICE_PRINCIPAL">Vice Principal</option>
                                            <option value="PRINCIPAL">Principal</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            {/* Show department dropdown only for HOD and TEACHER roles */}
                            {(newRole === 'HOD' || newRole === 'TEACHER') && (
                                <div className="space-y-2 animate-in slide-in-from-top-3">
                                    <label className={labelCls}>Assign Department</label>
                                    <select
                                        className="input-modern w-full"
                                        value={selectedDeptId}
                                        onChange={(e) => setSelectedDeptId(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Department...</option>
                                        {departments.map((dept) => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name} ({dept.code})
                                            </option>
                                        ))}
                                    </select>
                                    {newRole === 'HOD' && (
                                        <p className="text-[10px] text-amber-500 font-bold leading-normal mt-1">
                                            ⚠️ Note: Assigning this user as HOD will override any existing HOD assignment for the selected department.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Submit and message */}
                            {submitResult && (
                                <div className={`p-4 rounded-xl flex items-start gap-3 border ${
                                    submitResult.type === 'success'
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                        : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                                }`}>
                                    {submitResult.type === 'success' ? (
                                        <CheckCircle size={18} className="shrink-0 mt-0.5" />
                                    ) : (
                                        <CircleAlert size={18} className="shrink-0 mt-0.5" />
                                    )}
                                    <p className="text-xs font-bold leading-relaxed">{submitResult.message}</p>
                                </div>
                            )}

                            <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="btn-primary bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 flex-1 h-14"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="btn-primary flex-1 h-14"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                    ) : (
                                        'Save Role Assignment'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
