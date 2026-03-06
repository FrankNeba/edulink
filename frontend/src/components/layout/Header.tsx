"use client"

import * as Icons from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"

const routeNames: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/dashboard/subjects': 'Subjects',
    '/dashboard/levels': 'Class Levels',
    '/dashboard/departments': 'Departments',
    '/dashboard/users': 'User Management',
    '/dashboard/notes': 'Notes & Resources',
    '/dashboard/quizzes': 'Quizzes & Assessments',
    '/dashboard/notifications': 'Notifications',
    '/dashboard/announcements': 'Announcements',
    '/dashboard/settings': 'Account Settings',
    '/dashboard/recruitment/students': 'Student Records',
    '/dashboard/recruitment/teachers': 'Teacher Records',
}

export function Header({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
    const { user } = useAuth()
    const { theme, setTheme } = useTheme()
    const pathname = usePathname()

    const pageName = routeNames[pathname] ?? 'Dashboard'
    const initials = `${user?.first_name?.charAt(0) ?? ''}${user?.last_name?.charAt(0) ?? ''}`.toUpperCase()

    return (
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 md:px-8 backdrop-blur-xl
            bg-white/80 dark:bg-[#0d1117]/80
            border-b border-slate-100 dark:border-white/[0.05]">

            <div className="flex items-center gap-4">
                {/* Mobile Toggle */}
                <button
                    onClick={onToggleSidebar}
                    className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    <Icons.Menu className="w-5 h-5" />
                </button>

                {/* Left: Breadcrumbs / Title */}
                <div className="flex flex-col">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">{pageName}</h2>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">
                        <span>EDULINK</span>
                        <Icons.ChevronRight size={10} className="text-slate-300 dark:text-slate-800" />
                        <span className="text-violet-600 dark:text-violet-400 font-black">{pageName}</span>
                    </div>
                </div>
            </div>

            {/* Right: Operations */}
            <div className="flex items-center gap-2">
                {/* Search - Terminal Style */}
                <div className="relative hidden md:block mr-4">
                    <Icons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-600" />
                    <input
                        className="pl-12 pr-4 h-10 text-xs rounded-xl outline-none w-64 transition-all font-bold
                            bg-slate-50 dark:bg-white/[0.03]
                            border border-slate-200 dark:border-white/[0.05]
                            text-slate-800 dark:text-slate-200
                            placeholder:text-slate-400 dark:placeholder:text-slate-700
                            focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500"
                        placeholder="Search..."
                    />
                </div>

                {/* Online status */}
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 mr-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Online</span>
                </div>

                {/* Theme Mode */}
                <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="w-10 h-10 flex items-center justify-center rounded-xl transition-all
                        text-slate-400 dark:text-slate-600
                        hover:bg-slate-50 dark:hover:bg-white/[0.05]
                        hover:text-slate-900 dark:hover:text-white
                        border border-transparent hover:border-slate-200 dark:hover:border-white/[0.05]">
                    {theme === 'dark'
                        ? <Icons.Sun className="w-4 h-4" />
                        : <Icons.Moon className="w-4 h-4" />
                    }
                </button>

                {/* System Alerts */}
                <Link href="/dashboard/notifications">
                    <button className="w-10 h-10 flex items-center justify-center rounded-xl transition-all relative
                        text-slate-400 dark:text-slate-600
                        hover:bg-slate-50 dark:hover:bg-white/[0.05]
                        hover:text-slate-900 dark:hover:text-white
                        border border-transparent hover:border-slate-200 dark:hover:border-white/[0.05]">
                        <Icons.Bell className="w-4 h-4" />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#0d1117] shadow-[0_0_8px_#ef4444]" />
                    </button>
                </Link>

                {/* Profile Link */}
                <Link href="/dashboard/settings" className="flex items-center gap-3 pl-3 ml-2 group cursor-pointer border-l border-slate-100 dark:border-white/[0.05]">
                    <div className="hidden sm:block text-right">
                        <p className="text-xs font-black leading-tight text-slate-900 dark:text-white group-hover:text-violet-600 transition-colors">
                            {user?.first_name}
                        </p>
                        <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-600">
                            {user?.role}
                        </p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-violet-900/20 ring-2 ring-transparent group-hover:ring-violet-500/30 transition-all">
                        {initials || <Icons.UserCircle className="w-5 h-5" />}
                    </div>
                </Link>
            </div>
        </header>
    )
}
