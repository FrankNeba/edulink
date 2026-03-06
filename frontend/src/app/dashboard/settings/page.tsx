'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import {
    User, Mail, Phone, Lock, Eye, EyeOff,
    Sun, Moon, Globe, Settings,
    ShieldCheck, Bell, Sliders,
    CircleCheck, CircleAlert, Loader2, Save,
    UserCircle, AlertTriangle, KeyRound
} from 'lucide-react'
import { useTheme } from 'next-themes'

export default function SettingsPage() {
    const { user, login } = useAuth()
    const { theme, setTheme } = useTheme()

    const [firstName, setFirstName] = useState(user?.first_name || '')
    const [lastName, setLastName] = useState(user?.last_name || '')
    const [phone, setPhone] = useState(user?.phone || '')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        if (user) {
            setFirstName(user.first_name || '')
            setLastName(user.last_name || '')
            setPhone(user.phone || '')
        }
    }, [user])

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)
        try {
            await api.patch('/users/update_me/', {
                first_name: firstName,
                last_name: lastName,
                phone: phone
            })
            setMessage({ type: 'success', text: 'Profile updated successfully!' })
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update profile' })
        } finally {
            setLoading(false)
        }
    }

    const cardCls = "card-base p-6 md:p-8"
    const labelCls = "text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block"

    const navItems = [
        { label: 'Profile Information', icon: User },
        { label: 'Security & Privacy', icon: ShieldCheck },
        { label: 'Preferences', icon: Sliders },
        { label: 'Notifications', icon: Bell },
    ]

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-violet-600/10 rounded-2xl">
                    <Settings className="w-7 h-7 text-violet-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Account Settings</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-0.5">Manage your profile and account preferences.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Navigation Sidebar */}
                <div className="space-y-2">
                    {navItems.map(({ label, icon: Icon }) => (
                        <button
                            key={label}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${
                                label === 'Profile Information'
                                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Icon className="w-4 h-4 shrink-0" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="md:col-span-2 space-y-8">
                    {/* Profile Section */}
                    <section className="space-y-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Identity Details</h3>
                        <div className={cardCls}>
                            <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-slate-100 dark:border-slate-800 mb-8">
                                <div className="w-20 h-20 rounded-3xl bg-violet-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-violet-600/20 shrink-0">
                                    {user?.first_name?.charAt(0)
                                        ? user.first_name.charAt(0).toUpperCase()
                                        : <UserCircle className="w-10 h-10" />}
                                </div>
                                <div className="text-center sm:text-left">
                                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">{user?.first_name} {user?.last_name}</h4>
                                    <p className="text-xs font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        {user?.role?.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium flex items-center justify-center sm:justify-start gap-1.5">
                                        <Mail className="w-3.5 h-3.5" />
                                        {user?.email}
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className={labelCls}>First Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                className="input-modern !pl-10"
                                                value={firstName}
                                                onChange={e => setFirstName(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={labelCls}>Last Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                className="input-modern !pl-10"
                                                value={lastName}
                                                onChange={e => setLastName(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className={labelCls}>Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                className="input-modern !pl-10"
                                                placeholder="+237 ..."
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1 opacity-60">
                                        <label className={labelCls}>Email (Primary)</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input className="input-modern !pl-10 bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed" value={user?.email || ''} readOnly />
                                        </div>
                                    </div>
                                </div>

                                {message && (
                                    <div className={`flex items-center gap-3 p-4 rounded-xl text-sm font-bold ${message.type === 'success'
                                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 dark:border-emerald-800'
                                            : 'bg-red-50 dark:bg-red-950/20 text-red-600 border border-red-100 dark:border-red-800'
                                        }`}>
                                        {message.type === 'success' ? <CircleCheck size={18} /> : <CircleAlert size={18} />}
                                        {message.text}
                                    </div>
                                )}

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-primary"
                                    >
                                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </section>

                    {/* Preferences Section */}
                    <section className="space-y-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Appearance</h3>
                        <div className={cardCls}>
                            <div className="space-y-8">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-amber-500/10 rounded-2xl">
                                            <Sun className="w-5 h-5 text-amber-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">Interface Theme</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium italic">Adjust the visual mode of the platform.</p>
                                        </div>
                                    </div>
                                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <button
                                            onClick={() => setTheme('light')}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${theme === 'light' ? 'bg-white text-black shadow-sm' : 'text-slate-500'}`}
                                        >
                                            <Sun className="w-3.5 h-3.5" /> Light
                                        </button>
                                        <button
                                            onClick={() => setTheme('dark')}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${theme === 'dark' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500'}`}
                                        >
                                            <Moon className="w-3.5 h-3.5" /> Dark
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between opacity-50 cursor-not-allowed pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-500/10 rounded-2xl">
                                            <Globe className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">System Language</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium italic">English (Cameroon)</p>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Locked</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Danger Zone */}
                    <section className="pt-10">
                        <div className="p-6 border-2 border-red-500/20 bg-red-500/5 dark:bg-red-500/10 rounded-3xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-500/10 rounded-2xl">
                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <p className="font-black text-red-500 uppercase tracking-widest text-sm">Danger Zone</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Request account deactivation or data removal.</p>
                                </div>
                            </div>
                            <button className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors">
                                <KeyRound className="w-3.5 h-3.5" />
                                Contact IT Admin
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
