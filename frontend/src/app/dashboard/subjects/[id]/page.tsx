'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SubjectDetailPage() {
    const params = useParams();
    const id = params.id;
    const router = useRouter();
    const { user } = useAuth();

    const [subject, setSubject] = useState<any>(null);
    const [notes, setNotes] = useState<any[]>([]);
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [syllabi, setSyllabi] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'notes' | 'syllabus' | 'quizzes' | 'assignments' | 'announcements' | 'students'>('notes');
    const [studentSearch, setStudentSearch] = useState('');

    const fetchData = async () => {
        try {
            const [subRes, noteRes, quizRes, assignRes, annRes, sylRes] = await Promise.all([
                api.get(`subjects/${id}/`),
                api.get(`notes/?subject=${id}`),
                api.get(`quizzes/?subject=${id}`),
                api.get(`assignments/?subject=${id}`),
                api.get(`announcements/?subject=${id}`),
                api.get(`syllabi/?subject=${id}`)
            ]);

            setSubject(subRes.data);
            setNotes(noteRes.data);
            setQuizzes(quizRes.data);
            setAssignments(assignRes.data);
            setAnnouncements(annRes.data);
            setSyllabi(sylRes.data);
        } catch (err) {
            console.error('Failed to fetch subject details', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    if (loading) return (
        <div className="p-12 space-y-8 animate-pulse">
            <div className="h-12 w-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-[2rem]" />)}
            </div>
        </div>
    );

    if (!subject) return <div className="p-12 text-center text-red-500 font-bold">Subject Record Not Found</div>;

    const isStaff = user?.role !== 'STUDENT';
    const now = new Date();

    const tabs = [
        { id: 'notes', label: 'Study Notes', icon: Icons.FileText, count: notes.length },
        { id: 'syllabus', label: 'Syllabus', icon: Icons.Book, count: syllabi.length },
        { id: 'quizzes', label: 'Assessments', icon: Icons.Zap, count: quizzes.length },
        { id: 'assignments', label: 'Assignments', icon: Icons.ClipboardList, count: assignments.length },
        { id: 'announcements', label: 'Board', icon: Icons.Bell, count: announcements.length },
        ...(isStaff ? [{ id: 'students', label: 'Students', icon: Icons.Users, count: subject.student_count ?? subject.students?.length ?? 0 }] : []),
    ];

    return (
        <div className="space-y-10 max-w-7xl mx-auto animate-in fade-in duration-500">

            {/* ── Subect Header ── */}
            <div className="relative overflow-hidden rounded-[40px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-8 md:p-12 shadow-2xl shadow-slate-200 dark:shadow-none">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
                        >
                            <Icons.ChevronLeft size={14} /> Back to Subjects
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-3 py-1 bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-black rounded-xl border border-violet-500/20 uppercase tracking-widest">
                                    {subject.code}
                                </span>
                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 text-[10px] font-black rounded-xl border border-emerald-500/20 uppercase tracking-widest">
                                    {subject.level}
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                {subject.name}
                            </h1>
                            <p className="text-slate-500 font-bold mt-2 flex items-center gap-2">
                                <Icons.Building size={16} /> {subject.department_name}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <div className="flex -space-x-3">
                            {subject.teachers_data?.map((t: any) => (
                                <div key={t.id} className="w-14 h-14 rounded-2xl border-4 border-white dark:border-slate-950 bg-primary/10 flex items-center justify-center text-primary font-black shadow-lg" title={t.first_name}>
                                    {t.first_name[0]}
                                </div>
                            ))}
                            {(!subject.teachers_data || subject.teachers_data.length === 0) && (
                                <div className="w-14 h-14 rounded-2xl border-4 border-white dark:border-slate-950 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 italic text-[10px] font-bold">
                                    N/A
                                </div>
                            )}
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Lead Instructor</div>
                            <div className="text-sm font-black text-slate-900 dark:text-white">
                                {subject.teachers_data?.[0] ? `${subject.teachers_data[0].first_name} ${subject.teachers_data[0].last_name}` : 'Unassigned'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Navigation Tabs ── */}
            <div className="flex flex-wrap gap-2 p-1.5 rounded-3xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-3 px-6 py-4 rounded-[22px] transition-all duration-500 ${activeTab === tab.id
                            ? 'bg-white dark:bg-slate-800 text-primary shadow-xl shadow-primary/10'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        <tab.icon size={20} className={activeTab === tab.id ? 'animate-bounce' : ''} />
                        <div className="text-left">
                            <div className="text-[10px] font-black uppercase tracking-[0.1em]">{tab.label}</div>
                            <div className={`text-xs font-bold ${activeTab === tab.id ? 'text-primary' : 'text-slate-400'}`}>
                                {tab.count} {tab.count === 1 ? 'item' : 'items'}
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* ── Tab Content ── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                <div className="lg:col-span-3 space-y-6">

                    {/* Notes & Syllabus Tab */}
                    {activeTab === 'notes' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            {syllabi.length > 0 && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Syllabus
                                    </h3>
                                    {syllabi.map(s => (
                                        <Card key={s.id} className="p-6 border-emerald-500/10 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01] hover:border-emerald-500/30 transition-all rounded-3xl flex items-center justify-between group">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                                    <Icons.Book size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-lg text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors uppercase tracking-tight">{s.title}</h4>
                                                    <p className="text-xs text-slate-500 font-medium max-w-md line-clamp-1">{s.description || 'Course syllabus document.'}</p>
                                                </div>
                                            </div>
                                            <a href={s.file} target="_blank" rel="noreferrer" className="btn-modern-primary h-11 px-8 rounded-xl flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700">
                                                <Icons.Download size={16} /> Access Foundation
                                            </a>
                                        </Card>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Notes & Resources
                                    </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {notes.map(note => (
                                        <Card key={note.id} className="p-6 hover:border-primary/40 transition-all rounded-3xl group">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                                    <Icons.FileText size={20} />
                                                </div>
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 py-1 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                                    PDF RESOURCE
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-slate-900 dark:text-white mb-2 line-clamp-2">{note.title}</h4>
                                            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase mb-6 tracking-widest">
                                                <Icons.User size={12} /> {note.teacher_name}
                                            </div>
                                            <a href={note.file} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                                                <Icons.Download size={14} /> Download Resource
                                            </a>
                                        </Card>
                                    ))}
                                    {notes.length === 0 && !syllabi.length && (
                                        <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem]">
                                            <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-900 mx-auto flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6">
                                                <Icons.FileX size={32} />
                                            </div>
                                            <h4 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">No Materials Yet</h4>
                                            <p className="text-sm text-slate-500 font-medium">No study materials have been published for this subject yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Assessments Tab */}
                    {activeTab === 'quizzes' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-violet-500" /> Assessments for {subject.name}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {quizzes.map(quiz => {
                                    const start = new Date(quiz.start_time);
                                    const end = new Date(quiz.end_time);
                                    const isUpcoming = now < start;
                                    const isActive = now >= start && now <= end;
                                    const isClosed = now > end;
                                    return (
                                        <div key={quiz.id} className="card-base p-0 overflow-hidden flex flex-col group hover:border-violet-500/40">
                                            <div className={`h-2 w-full transition-colors ${isActive ? 'bg-emerald-500' : isUpcoming ? 'bg-amber-400' : 'bg-slate-300'
                                                }`} />
                                            <div className="p-8">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-500">
                                                        <Icons.Zap size={24} />
                                                    </div>
                                                    <div className="text-right space-y-1">
                                                        <div className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${isActive
                                                            ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-400/30'
                                                            : isUpcoming
                                                                ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-400/30'
                                                                : 'text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200'
                                                            }`}>
                                                            {isActive ? '● LIVE' : isUpcoming ? '⧗ UPCOMING' : '✓ CLOSED'}
                                                        </div>
                                                        <div className="text-[10px] font-black text-violet-600">{quiz.duration} MIN</div>
                                                    </div>
                                                </div>
                                                <h4 className="text-xl font-black text-slate-900 dark:text-white mb-4 line-clamp-1">{quiz.title}</h4>
                                                <div className="space-y-2 mb-8">
                                                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                                                        <Icons.Calendar size={14} className="text-slate-400" />
                                                        Starts: {start.toLocaleString()}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                                                        <Icons.Clock size={14} className="text-slate-400" />
                                                        Ends: {end.toLocaleString()}
                                                    </div>
                                                    {quiz.question_count > 0 && (
                                                        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                                                            <Icons.List size={14} className="text-slate-400" />
                                                            {quiz.question_count} Questions
                                                        </div>
                                                    )}
                                                </div>
                                                <Button
                                                    className={`w-full h-12 rounded-xl font-black ${isActive
                                                        ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20'
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                                                        }`}
                                                    disabled={!isActive}
                                                    onClick={() => router.push(`/dashboard/quizzes/${quiz.id}/take`)}
                                                >
                                                    {isActive ? '⚡ Start Assessment' : isUpcoming ? 'Not Yet Available' : 'Assessment Closed'}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {quizzes.length === 0 && (
                                    <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem]">
                                        <Icons.ZapOff size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-6" />
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">No Assessments Yet</h4>
                                        <p className="text-sm text-slate-500 font-medium">No quizzes have been published for this subject.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Syllabus tab (separate from notes) */}
                    {activeTab === 'syllabus' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Course Syllabus
                            </h3>
                            {syllabi.map(s => (
                                <Card key={s.id} className="p-6 border-emerald-500/10 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01] hover:border-emerald-500/30 transition-all rounded-3xl flex items-center justify-between group">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                            <Icons.Book size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-lg text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors uppercase tracking-tight">{s.title}</h4>
                                            <p className="text-xs text-slate-500 font-medium max-w-md line-clamp-1">{s.description || 'Course syllabus document.'}</p>
                                        </div>
                                    </div>
                                    <a href={s.file} target="_blank" rel="noreferrer" className="btn-modern-primary h-11 px-8 rounded-xl flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black">
                                        <Icons.Download size={16} /> Download
                                    </a>
                                </Card>
                            ))}
                            {syllabi.length === 0 && (
                                <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem]">
                                    <Icons.BookX size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-6" />
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">No Syllabus Available</h4>
                                    <p className="text-sm text-slate-500 font-medium">No syllabus has been uploaded for this subject yet.</p>
                                </div>
                            )}
                        </div>
                    )}


                    {/* Assignments Tab */}
                    {activeTab === 'assignments' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Assignments
                            </h3>
                            <div className="space-y-4">
                                {assignments.map(task => (
                                    <Card key={task.id} className="p-8 hover:border-blue-500/40 transition-all rounded-[2rem] group">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-[2rem] bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                                    <Icons.ClipboardList size={28} />
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors uppercase tracking-tight">{task.title}</h4>
                                                    <p className="text-sm text-slate-500 font-medium mt-1 line-clamp-1">{task.description}</p>
                                                    <div className="flex items-center gap-4 mt-3">
                                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/20">
                                                            <Icons.AlertCircle size={10} /> Due {new Date(task.due_date).toLocaleDateString()}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                            Teacher: {task.teacher_name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {task.file && (
                                                    <a href={task.file} target="_blank" rel="noreferrer" className="h-12 px-6 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs font-black flex items-center gap-2 hover:bg-primary hover:text-white transition-all border border-slate-200 dark:border-slate-800">
                                                        <Icons.Paperclip size={16} /> Attachment
                                                    </a>
                                                )}
                                                <button className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xl shadow-blue-600/20 whitespace-nowrap">
                                                    Submit Assignment
                                                </button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                                {assignments.length === 0 && (
                                    <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem]">
                                        <Icons.CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-6" />
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">No Assignments Yet</h4>
                                        <p className="text-sm text-slate-500 font-medium">No assignments have been posted for this subject.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Announcements Board Tab */}
                    {activeTab === 'announcements' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white" /> Announcements
                            </h3>
                            <div className="space-y-4">
                                {announcements.map(ann => (
                                    <Card key={ann.id} className="p-8 border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white dark:bg-slate-950/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all group">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center font-black text-slate-400 group-hover:border-primary/50 group-hover:text-primary transition-all">
                                                    {ann.author_name[0]}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black text-slate-900 dark:text-white">{ann.author_name}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{ann.level} ANNOUNCEMENT</div>
                                                </div>
                                            </div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl">
                                                {new Date(ann.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-4">{ann.title}</h4>
                                        <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                                    </Card>
                                ))}
                                {announcements.length === 0 && (
                                    <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem]">
                                        <Icons.BellOff size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-6" />
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">No Announcements</h4>
                                        <p className="text-sm text-slate-500 font-medium">No announcements have been posted for this subject.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Students Tab (Staff only) ── */}
                    {activeTab === 'students' && isStaff && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Registered Students
                                    <span className="ml-2 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 text-[9px] font-black rounded-lg border border-emerald-500/20">
                                        {subject.student_count ?? subject.students?.length ?? 0} enrolled
                                    </span>
                                </h3>
                                {/* Search */}
                                <div className="relative">
                                    <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input
                                        placeholder="Search by name or ID…"
                                        value={studentSearch}
                                        onChange={e => setStudentSearch(e.target.value)}
                                        className="pl-9 pr-4 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold outline-none text-slate-900 dark:text-white w-56 focus:border-primary/50 transition-colors"
                                    />
                                </div>
                            </div>

                            {subject.students_data && subject.students_data.length > 0 ? (
                                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800">
                                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">#</th>
                                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Student ID</th>
                                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                                                <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Level</th>
                                                {(user?.role === 'VICE_PRINCIPAL' || user?.role === 'HOD') && (
                                                    <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                                            {subject.students_data
                                                .filter((s: any) => {
                                                    const q = studentSearch.toLowerCase();
                                                    return !q ||
                                                        `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
                                                        s.student_id?.toLowerCase().includes(q) ||
                                                        s.email?.toLowerCase().includes(q);
                                                })
                                                .map((s: any, idx: number) => (
                                                    <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors group">
                                                        <td className="px-5 py-4 text-[10px] font-black text-slate-400">{idx + 1}</td>
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-sm flex-shrink-0">
                                                                    {s.first_name?.[0]}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-sm text-slate-900 dark:text-white">{s.first_name} {s.last_name}</div>
                                                                    {s.domain_name && <div className="text-[10px] text-slate-400 font-medium">{s.domain_name}</div>}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="font-mono text-[10px] font-black text-violet-600 dark:text-violet-400 px-2.5 py-1 bg-violet-500/5 rounded-lg border border-violet-500/10">
                                                                {s.student_id || '—'}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4 text-xs text-slate-500 font-medium">{s.email}</td>
                                                        <td className="px-5 py-4">
                                                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-400/30 px-2 py-1 rounded-lg uppercase tracking-wider">
                                                                {s.level}
                                                            </span>
                                                        </td>
                                                        {(user?.role === 'VICE_PRINCIPAL' || user?.role === 'HOD') && (
                                                            <td className="px-5 py-4 text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 text-[10px] font-black text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl px-3 opacity-0 group-hover:opacity-100 transition-all"
                                                                    onClick={async () => {
                                                                        if (!confirm(`Remove ${s.first_name} ${s.last_name} from this subject?`)) return;
                                                                        await api.post(`subjects/${id}/unregister/`, { user_id: s.id }).catch(() =>
                                                                            api.delete(`subjects/${id}/students/${s.id}/`)
                                                                        );
                                                                        window.location.reload();
                                                                    }}
                                                                >
                                                                    <Icons.UserMinus size={12} className="mr-1" /> Remove
                                                                </Button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                    {subject.students_data.filter((s: any) => {
                                        const q = studentSearch.toLowerCase();
                                        return !q || `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) || s.student_id?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
                                    }).length === 0 && (
                                            <div className="py-12 text-center text-slate-400 text-sm font-bold">
                                                No students match "{studentSearch}"
                                            </div>
                                        )}
                                </div>
                            ) : (
                                <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem]">
                                    <Icons.Users size={32} className="mx-auto text-slate-200 dark:text-slate-800 mb-6" />
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">No Students Enrolled</h4>
                                    <p className="text-sm text-slate-500 font-medium mt-1">No students are currently registered for this subject.</p>
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* ── Sidebar Stats & Shortcuts ── */}
                <div className="space-y-10">
                    <section>
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-6 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Staff Info
                        </h3>
                        <Card className="p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-8">
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Class Instructors</h4>
                                <div className="space-y-4">
                                    {subject.teachers_data?.map((t: any) => (
                                        <div key={t.id} className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center font-black text-primary shadow-sm">
                                                {t.first_name[0]}
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-slate-900 dark:text-white">{t.first_name} {t.last_name}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Staff Member</div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!subject.teachers_data || subject.teachers_data.length === 0) && (
                                        <div className="text-[10px] text-slate-400 font-bold italic">No Staff assigned yet.</div>
                                    )}
                                </div>
                            </div>

                            <hr className="border-slate-200/50 dark:border-slate-800/50" />

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Quick Stats</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Students</div>
                                        <div className="text-2xl font-black text-slate-900 dark:text-white">{subject.students?.length || 0}</div>
                                    </div>
                                    {/* <div className="p-4 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                        <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Progress</div>
                                        <div className="text-2xl font-black text-emerald-500">88%</div>
                                    </div> */}
                                </div>
                            </div>

                            <Button className="w-full h-14 btn-modern-secondary rounded-[1.5rem] bg-white border-slate-200 text-slate-600 hover:bg-slate-50">
                                <Icons.Mail className="w-4 h-4 mr-2" /> Contact Staff
                            </Button>
                        </Card>
                    </section>

                    <section>
                        <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] mb-6 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Quick Links
                        </h3>
                        <div className="space-y-3">
                            <button className="w-full p-6 rounded-[2rem] bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 text-left hover:border-primary/40 hover:shadow-xl transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <Icons.HelpCircle size={20} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Help & Support</div>
                                        <div className="text-sm font-black text-slate-900 dark:text-white leading-tight">Subject Help Centre</div>
                                    </div>
                                </div>
                            </button>
                            <button className="w-full p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-left hover:border-slate-400 transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:scale-110 transition-transform">
                                        <Icons.ShieldAlert size={20} />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Issues</div>
                                        <div className="text-sm font-black text-slate-900 dark:text-white leading-tight">Report a Problem</div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </section>
                </div>
            </div>

        </div>
    );
}
