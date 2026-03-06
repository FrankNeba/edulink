'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SubjectStaffPage() {
    const { id: subjectId } = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [subject, setSubject] = useState<any>(null);
    const [allTeachers, setAllTeachers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [updating, setUpdating] = useState(false);

    const fetchInitialData = async () => {
        try {
            const [subRes, teachersRes] = await Promise.all([
                api.get(`subjects/${subjectId}/`),
                api.get('users/by_role/?role=TEACHER')
            ]);
            setSubject(subRes.data);
            setAllTeachers(teachersRes.data);
        } catch (err) {
            console.error('Failed to load staffing data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (subjectId) fetchInitialData();
    }, [subjectId]);

    // Handle adding/removing teachers locally before saving
    const [localSelectedIds, setLocalSelectedIds] = useState<number[]>([]);

    useEffect(() => {
        if (subject) {
            setLocalSelectedIds(subject.teachers || []);
        }
    }, [subject]);

    const filteredTeachers = useMemo(() => {
        return allTeachers.filter(t => {
            const searchStr = searchQuery.toLowerCase();
            const fullName = `${t.first_name} ${t.last_name}`.toLowerCase();
            const email = (t.email || '').toLowerCase();
            const phone = (t.phone || '').toLowerCase();
            const teacherId = (t.profile?.teacher_id || '').toLowerCase();

            return fullName.includes(searchStr) ||
                email.includes(searchStr) ||
                phone.includes(searchStr) ||
                teacherId.includes(searchStr);
        });
    }, [allTeachers, searchQuery]);

    const selectedTeachers = localSelectedIds.map(id => allTeachers.find(t => t.id === id)).filter(Boolean);
    const availableTeachers = filteredTeachers.filter(t => !localSelectedIds.includes(t.id));

    const toggleTeacher = (id: number) => {
        setLocalSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSave = async () => {
        setUpdating(true);
        try {
            await api.patch(`subjects/${subjectId}/`, {
                teachers: localSelectedIds
            });
            router.back();
        } catch (err) {
            console.error('Failed to update teachers', err);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return (
        <div className="p-24 text-center">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-bold">Loading staff...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-sm font-bold mb-2"
                    >
                        <Icons.ArrowLeft className="w-4 h-4" />
                        Back to Level
                    </button>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Staff Management
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                        Subject: {subject?.name} ({subject?.code}) &bull; Class: {subject?.level}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold" onClick={() => router.back()}>
                        Discard Changes
                    </Button>
                    <Button
                        disabled={updating}
                        className="rounded-2xl h-12 px-8 font-black bg-primary shadow-lg shadow-primary/20"
                        onClick={handleSave}
                    >
                        {updating ? (
                            <>
                                <Icons.Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Icons.Save className="w-5 h-5 mr-2" />
                                Save Assignments
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-280px)] min-h-[500px]">

                {/* Available Teachers Column */}
                <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <Icons.Search className="w-4 h-4 text-primary" />
                            Available Teachers
                        </h2>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg font-black text-slate-500">
                            {availableTeachers.length} Available
                        </span>
                    </div>

                    <Card className="flex-1 flex flex-col overflow-hidden border-slate-200 dark:border-slate-800 rounded-[32px] bg-slate-50/30 dark:bg-white/5">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <div className="relative">
                                <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search by name, email, phone or staff ID..."
                                    className="pl-11 h-12 rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 font-bold"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {availableTeachers.map(teacher => (
                                <div
                                    key={teacher.id}
                                    onClick={() => toggleTeacher(teacher.id)}
                                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                            {teacher.first_name?.[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-slate-900 dark:text-white truncate">
                                                {teacher.first_name} {teacher.last_name}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-tighter truncate">
                                                    <Icons.Mail className="w-3 h-3" />
                                                    {teacher.email}
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                                                    <Icons.Phone className="w-3 h-3" />
                                                    {teacher.phone || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-300 group-hover:border-primary/50 group-hover:text-primary transition-all">
                                            <Icons.Plus className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {availableTeachers.length === 0 && (
                                <div className="py-12 text-center">
                                    <Icons.UserX className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                                    <p className="text-slate-400 font-medium italic">No matching instructors found.</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Selected Staff Column */}
                <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <Icons.CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            Assigned Teaching Team
                        </h2>
                        <span className="text-[10px] bg-emerald-500/10 px-2 py-1 rounded-lg font-black text-emerald-600 border border-emerald-500/20">
                            {selectedTeachers.length} Active
                        </span>
                    </div>

                    <Card className="flex-1 overflow-y-auto p-4 space-y-3 border-emerald-200/50 dark:border-emerald-950/30 rounded-[32px] bg-emerald-500/[0.02] dark:bg-emerald-500/[0.02] border-2 border-dashed">
                        {selectedTeachers.map(teacher => (
                            <div
                                key={teacher?.id}
                                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/50 shadow-sm relative group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center font-black text-emerald-600">
                                        {teacher?.first_name?.[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-slate-900 dark:text-white">
                                            {teacher?.first_name} {teacher?.last_name}
                                        </div>
                                        <div className="text-[10px] text-emerald-600/70 font-black uppercase tracking-widest mt-0.5">
                                            Assigned Instructor
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50"
                                        onClick={() => toggleTeacher(teacher!.id)}
                                    >
                                        <Icons.Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {selectedTeachers.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center py-12 px-6 text-center border-2 border-dashed border-emerald-200/30 rounded-[24px]">
                                <Icons.Users className="w-12 h-12 text-emerald-100 dark:text-emerald-900/40 mb-4" />
                                <h4 className="text-slate-400 font-black text-sm uppercase tracking-widest">No Instructors Assigned</h4>
                                <p className="text-[11px] text-slate-400 font-medium mt-2 max-w-[200px]">Select teachers from the repository to build your teaching team.</p>
                            </div>
                        )}
                    </Card>
                </div>

            </div>
        </div>
    );
}
