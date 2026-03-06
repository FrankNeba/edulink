'use client';

import React from 'react';
import Link from 'next/link';
import {
  GraduationCap, BookOpen, Users, FileText,
  ClipboardList, Bell, Shield, ChevronRight,
  CheckCircle2, Award, Megaphone, School, Library
} from 'lucide-react';

const features = [
  {
    title: 'Lesson Notes & Resources',
    desc: 'Teachers upload PDF notes and syllabi. Students instantly access all materials for their enrolled subjects.',
    icon: FileText,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  },
  {
    title: 'Online Quizzes & Tests',
    desc: 'Create timed assessments with multiple-choice questions. Students take quizzes and get instant results.',
    icon: ClipboardList,
    color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',
  },
  {
    title: 'Class Announcements',
    desc: 'Broadcast important notices to the whole school, a specific class, or a single subject group.',
    icon: Megaphone,
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  },
  {
    title: 'Student Enrollment',
    desc: 'Admins register students and teachers with auto-generated IDs. Credentials are emailed on creation.',
    icon: Users,
    color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
  },
  {
    title: 'Role-Based Access',
    desc: 'Principal, Vice-Principal, HOD, Teacher, and Student roles each see exactly what they need.',
    icon: Shield,
    color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',
  },
  {
    title: 'Real-Time Notifications',
    desc: 'Get instant alerts when new notes, quizzes, or announcements are posted for your subjects.',
    icon: Bell,
    color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400',
  },
];

const roles = [
  { label: 'Students', desc: 'Browse subjects, access notes, take quizzes, and track your progress.', icon: GraduationCap, color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400' },
  { label: 'Teachers', desc: 'Upload lesson notes, create and manage quizzes, and post subject announcements.', icon: Library, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' },
  { label: 'HOD / Admin', desc: 'Oversee subject catalogs, manage teachers and students under your department.', icon: School, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' },
  { label: 'Vice-Principal', desc: 'Full school oversight — enroll staff, manage departments, and broadcast notices.', icon: Shield, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white">

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-600/30">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight">EduLink</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-400">
            <a href="#features" className="hover:text-violet-600 transition-colors">Features</a>
            <a href="#roles" className="hover:text-violet-600 transition-colors">Who it&apos;s for</a>
            <a href="#how" className="hover:text-violet-600 transition-colors">How it works</a>
          </div>

          <Link
            href="/login"
            className="px-5 py-2.5 text-sm font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition-colors shadow-lg shadow-violet-600/25"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-24 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-violet-50 via-white to-blue-50 dark:from-violet-950/30 dark:via-slate-950 dark:to-blue-950/20" />

        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-xs font-bold uppercase tracking-widest rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700/40">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse inline-block" />
            School E-Learning Management System
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            Learning Made{' '}
            <span className="text-violet-600">Simple</span>
            <br />
            for Every Student
          </h1>

          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            EduLink connects teachers, students, and administrators in one easy-to-use platform — notes, quizzes, announcements, and more.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl text-base shadow-xl shadow-violet-600/25 transition-all hover:scale-[1.02]"
            >
              Go to Portal
              <ChevronRight className="w-5 h-5" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold rounded-2xl text-base hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: 'All Grades', label: 'Form 1 — Upper Sixth' },
            { value: 'Multi-Role', label: 'Student · Teacher · Admin' },
            { value: 'PDF Notes', label: 'Downloadable Resources' },
            { value: 'Live Quizzes', label: 'Timed Assessments' },
          ].map((stat, i) => (
            <div key={i}>
              <p className="text-2xl font-black text-violet-600 mb-1">{stat.value}</p>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black tracking-tight mb-4">Everything your school needs</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              One platform for all academic activities — from uploading notes to grading tests.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-violet-200 dark:hover:border-violet-700 hover:shadow-lg hover:shadow-violet-500/5 transition-all group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color} transition-transform group-hover:scale-110`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black tracking-tight mb-4">Built for everyone at school</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Each role has a tailored experience showing exactly the tools and information they need.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((r, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center hover:shadow-md transition-all">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 mx-auto ${r.color}`}>
                  <r.icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black mb-2">{r.label}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black tracking-tight mb-4">How it works</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              Getting started takes less than a minute. Your admin creates your account and you&apos;re in.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Admin creates your account', desc: 'The Vice-Principal or HOD registers you and an email with your login credentials is sent automatically.' },
              { step: '2', title: 'Sign in and explore', desc: 'Log in with your email and temporary password. You\'ll be prompted to set a new password on first login.' },
              { step: '3', title: 'Learn and grow', desc: 'Access notes, take quizzes, check announcements, and track your academic journey — all in one place.' },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                <div className="w-14 h-14 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-black text-2xl mb-6 shadow-xl shadow-violet-600/25">
                  {step.step}
                </div>
                <h3 className="text-xl font-black mb-3">{step.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-violet-600">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Award className="w-14 h-14 text-violet-200 mx-auto mb-6" />
          <h2 className="text-4xl font-black text-white tracking-tight mb-4">Ready to get started?</h2>
          <p className="text-violet-200 text-lg mb-8">
            Your school&apos;s digital learning hub is ready. Sign in with the credentials your administrator provided.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-violet-700 font-black rounded-2xl text-lg shadow-2xl hover:bg-violet-50 transition-colors"
          >
            Sign In to EduLink
            <ChevronRight className="w-5 h-5" />
          </Link>
          <p className="text-violet-300 text-sm mt-4">Contact your school administrator if you don&apos;t have an account.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-black">EduLink</span>
          </div>
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} EduLink School E-Learning System. All rights reserved.</p>
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            System Online
          </div>
        </div>
      </footer>
    </div>
  );
}
