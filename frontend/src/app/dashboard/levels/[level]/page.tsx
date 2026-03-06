'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import * as Icons from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LevelDetailPage() {
    const params = useParams();
    const level = decodeURIComponent(params.level as string);
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const domainId = searchParams.get('domain');
    const subDomainId = searchParams.get('sub_domain');

    const [subjects, setSubjects] = useState<any[]>([]);
    const [baseSubjects, setBaseSubjects] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [currentLevelData, setCurrentLevelData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedBaseSubject, setSelectedBaseSubject] = useState('');
    const [newSubjectCode, setNewSubjectCode] = useState('');
    const [selectedTeachers, setSelectedTeachers] = useState<number[]>([]);
    const [teacherSearch, setTeacherSearch] = useState('');
    const [adding, setAdding] = useState(false);

    const [selectedStudentDetail, setSelectedStudentDetail] = useState<any>(null);

    // Categories and Streams logic
    const isJunior = ['Form 1', 'Form 2', 'Form 3'].includes(level);

    const fetchLevelData = async () => {
        try {
            const [subRes, baseRes, lvlRes, teachRes] = await Promise.all([
                api.get('subjects/'),
                api.get('base-subjects/'),
                api.get('academic-levels/'),
                api.get('users/by_role/?role=TEACHER').catch(() => ({ data: [] }))
            ]);

            setTeachers(teachRes.data);
            setBaseSubjects(baseRes.data);

            // Try strict match first: name + domain + sub_domain
            let matchedLevel = lvlRes.data.find((al: any) => {
                const nameMatch = al.name.trim().toLowerCase() === level.trim().toLowerCase();
                const domainMatch = !domainId || al.domain === parseInt(domainId);
                const subDomainMatch = subDomainId
                    ? al.sub_domain === parseInt(subDomainId) || al.sub_domain === null
                    : al.sub_domain === null || true;
                return nameMatch && domainMatch && subDomainMatch;
            });

            // Fallback: match only by name + domain if strict match fails
            if (!matchedLevel) {
                matchedLevel = lvlRes.data.find((al: any) => {
                    const nameMatch = al.name.trim().toLowerCase() === level.trim().toLowerCase();
                    const domainMatch = !domainId || al.domain === parseInt(domainId);
                    return nameMatch && domainMatch;
                });
            }

            // Last resort: match by name only
            if (!matchedLevel) {
                matchedLevel = lvlRes.data.find((al: any) =>
                    al.name.trim().toLowerCase() === level.trim().toLowerCase()
                );
            }

            setCurrentLevelData(matchedLevel);

            const allSubjects: any[] = subRes.data;

            if (matchedLevel) {
                // Show subjects linked by academic_level FK OR by level string
                const levelSubjects = allSubjects.filter((s: any) =>
                    s.academic_level === matchedLevel.id ||
                    (s.academic_level === null && s.level?.trim().toLowerCase() === level.trim().toLowerCase())
                );
                // If nothing matched by FK, fall back to all subjects the API returned (already filtered for the student)
                setSubjects(levelSubjects.length > 0 ? levelSubjects : allSubjects);
            } else {
                // No level matched — for a student, just show everything the API gave us
                setSubjects(allSubjects);
            }
        } catch (err) {
            console.error('Failed to fetch level data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (searchParams) fetchLevelData();
    }, [level, searchParams, domainId, subDomainId]);

    const handleAddSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdding(true);
        try {
            const baseSub = baseSubjects.find(b => b.id === parseInt(selectedBaseSubject));
            if (!baseSub) return;

            await api.post('subjects/', {
                name: baseSub.name,
                base_subject: baseSub.id,
                code: newSubjectCode,
                level: level,
                academic_level: currentLevelData?.id,
                domain: currentLevelData?.domain,
                sub_domain: currentLevelData?.sub_domain,
                department: baseSub.department,
                teachers: selectedTeachers
            });

            await fetchLevelData();
            setShowAddForm(false);
            setSelectedBaseSubject('');
            setNewSubjectCode('');
            setSelectedTeachers([]);
        } catch (err: any) {
            console.error('Subject Creation Error:', {
                status: err.response?.status,
                data: err.response?.data,
                payload: {
                    academic_level: currentLevelData?.id,
                    level: level,
                    code: newSubjectCode,
                    teachers: selectedTeachers
                }
            });
            const errorMsg = err.response?.data
                ? typeof err.response.data === 'string'
                    ? err.response.data
                    : JSON.stringify(err.response.data)
                : 'Server Rejection';
            alert(`Subject Deployment Failed: ${errorMsg}`);
        } finally {
            setAdding(false);
        }
    };

    const handleViewStudent = async (studentUserId: number) => {
        try {
            const res = await api.get(`users/${studentUserId}/`);
            setSelectedStudentDetail(res.data);
        } catch (err) { }
    };

    const handleDeEnroll = async (studentUserId: number) => {
        if (!confirm('Are you sure you want to remove this student from this class level?')) return;
        try {
            await api.post(`users/${studentUserId}/de_enroll/`);
            // Refresh level data
            const lvlRes = await api.get('academic-levels/');
            const matchedLevel = lvlRes.data.find((al: any) => {
                const nameMatch = al.name.trim().toLowerCase() === level.trim().toLowerCase();
                const domainMatch = !domainId || al.domain === parseInt(domainId);
                const subDomainMatch = !subDomainId || subDomainId === ""
                    ? al.sub_domain === null
                    : al.sub_domain === parseInt(subDomainId);
                return nameMatch && domainMatch && subDomainMatch;
            });
            setCurrentLevelData(matchedLevel);
        } catch (err) {
            console.error('Failed to de-enroll student', err);
        }
    };

    if (loading) return <div className="p-12 text-center text-slate-500 font-bold">Accessing Level Data...</div>;

    return (
        <div className="space-y-10 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                        <button onClick={() => router.back()} className="hover:text-primary transition-colors flex items-center gap-1">
                            <Icons.ChevronLeft className="w-4 h-4" /> Academic Levels
                        </button>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {level} {currentLevelData?.sub_domain_name ? `(${currentLevelData.sub_domain_name})` : ''}
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                        {currentLevelData?.domain_name || 'Academic'} Segment &bull; {currentLevelData?.sub_domain_name || 'Common'} Stream
                    </p>
                </div>
                {(user?.role === 'VICE_PRINCIPAL' || user?.role === 'HOD') && !showAddForm && (
                    <Button className="rounded-2xl h-12 px-6" onClick={() => setShowAddForm(true)}>
                        <Icons.Plus className="w-5 h-5" /> Add Subject to Level
                    </Button>
                )}
            </div>

            {showAddForm && (
                <Card className="p-8 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 animate-in fade-in slide-in-from-top-4 duration-500 rounded-3xl">
                    <div className="flex justify-between items-center mb-6">
                        <div className="space-y-1">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Initialize Subject Instance</h2>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">DEPLOYING TO LEVEL: {level}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)} className="rounded-xl"><Icons.X className="w-5 h-5" /></Button>
                    </div>
                    <form onSubmit={handleAddSubject} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Select from Catalog</label>
                            <select
                                className="w-full h-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-sm font-bold text-slate-900 dark:text-white"
                                value={selectedBaseSubject}
                                onChange={(e) => setSelectedBaseSubject(e.target.value)}
                                required
                            >
                                <option value="">Select a Subject...</option>
                                {baseSubjects.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Instance Code</label>
                            <Input
                                placeholder="e.g. BIO-F1-2026"
                                value={newSubjectCode}
                                onChange={(e) => setNewSubjectCode(e.target.value)}
                                className="h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-1">Assign Instructors</label>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                                <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                                    <div className="relative">
                                        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                        <input
                                            placeholder="Search by name, ID or email..."
                                            value={teacherSearch}
                                            onChange={(e) => setTeacherSearch(e.target.value)}
                                            className="w-full pl-8 h-8 bg-slate-50 dark:bg-slate-950 rounded-lg text-xs font-bold outline-none border-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5 p-2 min-h-[48px] max-h-[120px] overflow-y-auto">
                                    {teachers.filter(t => {
                                        const searchStr = teacherSearch.toLowerCase();
                                        return (t.first_name + ' ' + t.last_name).toLowerCase().includes(searchStr) ||
                                            t.email?.toLowerCase().includes(searchStr) ||
                                            t.phone?.toLowerCase().includes(searchStr);
                                    }).map(t => {
                                        const isSelected = selectedTeachers.includes(t.id);
                                        return (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedTeachers(prev =>
                                                        prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id]
                                                    );
                                                }}
                                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all border ${isSelected
                                                    ? 'bg-primary border-primary text-white shadow-sm shadow-primary/20'
                                                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-primary/40'
                                                    }`}
                                            >
                                                {t.first_name} {t.last_name[0]}.
                                            </button>
                                        );
                                    })}
                                    {teachers.length === 0 && <span className="text-[10px] text-slate-400 font-bold p-1">No teachers available</span>}
                                </div>
                            </div>
                        </div>
                        <Button type="submit" className="lg:col-span-3 h-12 btn-modern-primary rounded-xl" disabled={adding}>
                            {adding ? 'Creating subject...' : 'Add Subject to This Level'}
                        </Button>
                    </form>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <h2 className="text-xl font-bold flex items-center gap-3 mb-6">
                            <div className="w-2 h-6 bg-primary rounded-full" />
                            Active Subjects
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {subjects.map((subject) => (
                                <Card
                                    key={subject.id}
                                    className="p-6 group hover:border-primary/40 transition-all cursor-pointer"
                                    onClick={() => router.push(`/dashboard/subjects/${subject.id}`)}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            {subject.code}
                                        </div>
                                        <Icons.BookOpen className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">{subject.name}</h3>
                                    <p className="text-xs text-slate-500 font-medium mb-6">{subject.department_name}</p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex -space-x-2">
                                            {subject.teachers_data.map((t: any) => (
                                                <div key={t.id} className="w-7 h-7 rounded-lg bg-primary/10 border border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-black text-primary" title={`${t.first_name} ${t.last_name}`}>
                                                    {t.first_name.charAt(0)}
                                                </div>
                                            ))}
                                            {subject.teachers_data.length === 0 && <span className="text-[10px] text-slate-400 italic">No instructors</span>}
                                        </div>
                                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                            {(user?.role === 'VICE_PRINCIPAL' || user?.role === 'HOD') && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-xs font-black text-primary hover:bg-primary/5 rounded-lg px-2"
                                                    onClick={() => router.push(`/dashboard/subjects/${subject.id}/staff`)}
                                                >
                                                    <Icons.Users className="w-3 h-3 mr-1" />
                                                    Staff
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-xs font-bold rounded-lg px-2 text-primary"
                                                onClick={() => router.push(`/dashboard/subjects/${subject.id}`)}
                                            >
                                                View →
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {subjects.length === 0 && (
                                <div className="col-span-full p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                    <p className="text-slate-400 font-medium">No subjects found for this level.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="mt-12">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold flex items-center gap-3">
                                <div className="w-2 h-6 bg-emerald-500 rounded-full" />
                                Class Registry
                            </h2>
                            <div className="px-4 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-xl text-[10px] font-black border border-emerald-500/20 uppercase tracking-widest">
                                {currentLevelData?.student_count || 0} Learners
                            </div>
                        </div>

                        <Card className="overflow-hidden border-slate-200 dark:border-slate-800 rounded-3xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student ID</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                                                {user?.role === 'STUDENT' ? 'Status' : 'Actions'}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                        {currentLevelData?.students_data?.map((student: any) => (
                                            <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group cursor-pointer" onClick={() => handleViewStudent(student.user.id)}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                            {student.user.first_name?.[0]}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{student.user.first_name} {student.user.last_name}</div>
                                                            <div className="text-[10px] text-slate-500 font-medium">Domain: {student.domain_name}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-mono text-xs font-black text-violet-600 dark:text-violet-400 px-3 py-1 bg-violet-500/5 rounded-lg border border-violet-500/10">
                                                        {student.student_id}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                                    {student.user.email}
                                                </td>
                                                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                    {user?.role !== 'STUDENT' ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="rounded-xl text-slate-400 hover:text-red-500 transition-colors"
                                                            title="De-enroll Student"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeEnroll(student.user.id);
                                                            }}
                                                        >
                                                            <Icons.UserMinus size={18} />
                                                        </Button>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-lg uppercase tracking-tight">Active</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {(!currentLevelData?.students_data || currentLevelData.students_data.length === 0) && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center">
                                                    <Icons.Users className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                                                    <p className="text-slate-400 font-medium italic">No students enrolled in this level yet.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </section>
                </div>

                <div className="space-y-8">
                    <section>
                        <h2 className="text-xl font-bold flex items-center gap-3 mb-6">
                            <div className="w-2 h-6 bg-slate-900 dark:bg-white rounded-full" />
                            Level Stats
                        </h2>
                        <Card className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <Icons.BookOpen className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <span className="font-bold text-slate-700 dark:text-slate-200">Total Subjects</span>
                                </div>
                                <span className="text-xl font-black">{subjects.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                        <Icons.Users className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <span className="font-bold text-slate-700 dark:text-slate-200">Active Students</span>
                                </div>
                                <span className="text-xl font-black">{currentLevelData?.student_count ?? 0}</span>
                            </div>
                        </Card>
                    </section>

                    {user?.role !== 'STUDENT' && (
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-3">
                                <div className="w-2 h-6 bg-violet-500 rounded-full" />
                                Class Actions
                            </h2>

                            {/* Upload Notes for this Class */}
                            <div
                                className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-slate-950 cursor-pointer hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-500/5 transition-all group"
                                onClick={() => router.push(`/dashboard/notes?level=${encodeURIComponent(level)}`)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Icons.FileText className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 dark:text-white">Upload Notes</h3>
                                        <p className="text-[11px] text-slate-500 font-medium">Publish study materials for {level}</p>
                                    </div>
                                    <Icons.ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                                </div>
                            </div>

                            {/* Create Quiz for this Class */}
                            <div
                                className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/30 dark:to-slate-950 cursor-pointer hover:border-violet-400/40 hover:shadow-lg hover:shadow-violet-500/5 transition-all group"
                                onClick={() => router.push(`/dashboard/quizzes?level=${encodeURIComponent(level)}&create=1`)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Icons.ClipboardList className="w-6 h-6 text-violet-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 dark:text-white">Create Quiz</h3>
                                        <p className="text-[11px] text-slate-500 font-medium">Create a quiz for this class</p>
                                    </div>
                                    <Icons.ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                                </div>
                            </div>

                            {/* Enroll Students */}
                            <div
                                className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-slate-950 cursor-pointer hover:border-emerald-400/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all group"
                                onClick={() => router.push(`/dashboard/recruitment/students?level=${encodeURIComponent(level)}`)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Icons.UserPlus className="w-6 h-6 text-emerald-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 dark:text-white">Enroll Students</h3>
                                        <p className="text-[11px] text-slate-500 font-medium">Add or bulk import new students</p>
                                    </div>
                                    <Icons.ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                                </div>
                            </div>
                        </section>
                    )}

                    {user?.role === 'STUDENT' && (
                        <section className="space-y-4">
                            <h2 className="text-xl font-bold flex items-center gap-3">
                                <div className="w-2 h-6 bg-violet-500 rounded-full" />
                                My Academic Workspace
                            </h2>

                            {/* View Notes */}
                            <div
                                className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 cursor-pointer hover:border-blue-400/40 hover:shadow-lg transition-all group"
                                onClick={() => router.push(`/dashboard/notes`)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Icons.FileText className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 dark:text-white">Course Materials</h3>
                                        <p className="text-[11px] text-slate-500 font-medium">Download study notes and syllabi</p>
                                    </div>
                                    <Icons.ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                                </div>
                            </div>

                            {/* Take Quizzes */}
                            <div
                                className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 cursor-pointer hover:border-violet-400/40 hover:shadow-lg transition-all group"
                                onClick={() => router.push(`/dashboard/quizzes`)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Icons.Zap className="w-6 h-6 text-violet-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 dark:text-white">Active Quizzes</h3>
                                        <p className="text-[11px] text-slate-500 font-medium">Participate in scheduled assessments</p>
                                    </div>
                                    <Icons.ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </div>

            {/* Student Profile Modal */}
            {selectedStudentDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <Card className="w-full max-w-2xl bg-white dark:bg-slate-950 rounded-[32px] overflow-hidden shadow-2xl border-none">
                        <div className="relative h-32 bg-gradient-to-r from-primary to-violet-600 p-8">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
                                onClick={() => setSelectedStudentDetail(null)}
                            >
                                <Icons.X className="w-5 h-5" />
                            </Button>
                            <div className="absolute -bottom-10 left-8">
                                <div className="w-24 h-24 rounded-3xl bg-white dark:bg-slate-900 p-1 shadow-lg">
                                    <div className="w-full h-full rounded-[22px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl font-black text-primary">
                                        {selectedStudentDetail.first_name?.[0]}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-14 p-8">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-2xl font-black text-slate-900 dark:text-white">{selectedStudentDetail.first_name} {selectedStudentDetail.last_name}</h2>
                                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase tracking-widest border border-primary/20">STUDENT</span>
                                    </div>
                                    <p className="text-sm text-slate-500 font-medium">Registration ID: <span className="text-violet-600 font-black">{selectedStudentDetail.profile?.student_id}</span></p>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">{selectedStudentDetail.profile?.level}</div>
                                    <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black text-slate-500 inline-block">{selectedStudentDetail.profile?.domain_name}</div>
                                </div>
                            </div>

                            <div className="mt-10">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Enrolled Subjects</h4>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                    {selectedStudentDetail.profile?.registered_subjects?.map((sub: any) => (
                                        <div key={sub.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-colors flex justify-between items-center group">
                                            <div>
                                                <div className="text-xs font-black text-slate-900 dark:text-white">{sub.name}</div>
                                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{sub.code} &bull; {sub.department_name}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <div className="text-[10px] text-slate-400 font-medium">Instructor</div>
                                                    <div className="text-[10px] font-bold text-primary italic">
                                                        {sub.teachers_data?.[0] ? `${sub.teachers_data[0].first_name} ${sub.teachers_data[0].last_name}` : 'Unassigned'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!selectedStudentDetail.profile?.registered_subjects || selectedStudentDetail.profile.registered_subjects.length === 0) && (
                                        <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                            <p className="text-xs text-slate-400 font-bold italic">No subjects registered for this academic term.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
