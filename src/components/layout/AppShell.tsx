import { AnimatePresence, motion } from 'framer-motion'
import {
  Bell,
  Command,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  Table2,
  X,
  Calendar,
  FileCheck,
  Upload,
  Activity,
  ListOrdered,
  Brain,
  Building2
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useCampusStore } from '../../store/campus'
import type { AppView } from '../../types'
import { Button } from '../ui/button'

const nav: { id: AppView; label: string; icon: typeof LayoutDashboard; roles: string[] }[] = [
  // HOD Academic Governance
  { id: 'hod', label: 'Department Governance', icon: Building2, roles: ['hod', 'admin'] },

  // Faculty Station
  { id: 'faculty', label: 'Faculty Station', icon: Table2, roles: ['faculty', 'admin'] },

  // Student Primary Views
  { id: 'command', label: 'Command Center', icon: LayoutDashboard, roles: ['student', 'admin'] },
  { id: 'attendance', label: 'Attendance Monitor', icon: Activity, roles: ['student'] },
  { id: 'priority', label: 'Priority Feed', icon: ListOrdered, roles: ['student'] },
  
  // Shared Academic Views
  { id: 'timetable', label: 'Timetable', icon: Calendar, roles: ['student', 'faculty', 'hod', 'admin'] },
  { id: 'submissions', label: 'Assignments & Work', icon: Upload, roles: ['student'] },
  { id: 'od-requests', label: 'Leave Requests', icon: FileCheck, roles: ['student', 'faculty', 'hod', 'admin'] },
  { id: 'portfolio', label: 'Portfolio', icon: GraduationCap, roles: ['student', 'admin'] },
  { id: 'ai-hub', label: 'AI Guardian Hub', icon: Brain, roles: ['student'] },
  
  // Institutional Broadcast
  { id: 'admin', label: 'Campus Circulars', icon: Bell, roles: ['faculty', 'hod', 'admin'] },
]

export function AppShell({
  children,
  onCommand,
}: {
  children: ReactNode
  onCommand: () => void
}) {
  const { profile, role, signOut, view, setView, live } = useAuth()
  const corrections = useCampusStore((s) => s.corrections)
  const [dark, setDark] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  const filteredNav = nav.filter((n) => role && n.roles.includes(role))

  // Calculate pending corrections to display badge
  const pendingCorrections = role === 'student'
    ? corrections.filter(c => c.student_id === profile?.id && c.status === 'pending').length
    : corrections.filter(c => c.status === 'pending').length

  return (
    <div className="min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/8 bg-[#090d16]/95 p-4 backdrop-blur-2xl lg:flex lg:flex-col shadow-[4px_0_30px_rgba(0,0,0,0.5)]">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 text-sm font-black text-white shadow-[0_0_24px_rgba(6,182,212,0.6)]">
            CF
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              CampusFlow
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)] animate-pulse" />
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-cyan-400/90">
              {role === 'hod' ? 'HOD Governance' : role === 'faculty' ? 'Faculty Portal' : role === 'admin' ? 'Admin Portal' : 'Student Platform'}
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 relative">
          {filteredNav.map((n) => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all cursor-pointer relative z-10 ${
                view === n.id
                  ? 'text-cyan-200 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/4'
              }`}
            >
              {view === n.id && (
                <motion.div
                  layoutId="activeNavDesktop"
                  className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/10 to-transparent border-l-2 border-cyan-400 rounded-xl -z-10 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className="flex items-center gap-3 group-hover:translate-x-1 transition-transform">
                <n.icon size={17} className={view === n.id ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]' : 'text-zinc-500 group-hover:text-cyan-300 transition-colors'} />
                {n.label}
              </div>
              {n.id === 'corrections' && pendingCorrections > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-black shadow-[0_0_10px_rgba(6,182,212,0.8)]">
                  {pendingCorrections}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="rounded-2xl border border-white/8 bg-white/3 p-3.5 text-xs text-zinc-400">
          <p className="font-semibold text-white">{profile?.full_name}</p>
          <p className="capitalize text-[11px] text-cyan-400 font-mono mt-0.5">{profile?.role} {profile?.department ? `· ${profile?.department}` : ''}</p>
          <div className="mt-2.5 flex items-center justify-between border-t border-white/6 pt-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-zinc-400">
              <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`} />
              {live ? 'Supabase live' : 'Demo sandbox'}
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-y-0 left-0 w-72 border-r border-white/8 bg-[#090d16] p-6 shadow-2xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-bold text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                      CF
                    </div>
                    <span className="text-sm font-bold text-white">CampusFlow</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/6 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>
                <nav className="space-y-1 relative">
                  {filteredNav.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        setView(n.id)
                        setMobileMenuOpen(false)
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium relative z-10 ${
                        view === n.id
                          ? 'text-cyan-200 font-semibold bg-cyan-500/15 border border-cyan-500/30'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <n.icon size={17} className={view === n.id ? 'text-cyan-400' : 'text-zinc-500'} />
                        {n.label}
                      </div>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="rounded-xl border border-white/8 bg-white/4 p-3 text-xs text-zinc-400">
                <p className="font-semibold text-white">{profile?.full_name}</p>
                <p className="capitalize text-[11px] text-cyan-400">{profile?.role}</p>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    void signOut()
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-white/6 py-1.5 text-xs text-zinc-300 hover:bg-white/10 cursor-pointer"
                >
                  <LogOut size={13} /> Sign out
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Top Navbar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/8 bg-[#090d16]/80 px-4 py-3 backdrop-blur-xl lg:ml-64">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden rounded-lg p-1.5 text-zinc-400 hover:bg-white/6 hover:text-white cursor-pointer"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="lg:hidden flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-bold text-white">
              CF
            </div>
            <span className="text-sm font-semibold text-white">CampusFlow</span>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-xs text-zinc-400">
            <span className="text-zinc-500">CampusFlow</span>
            <span className="text-zinc-600">/</span>
            <span className="text-cyan-400 capitalize font-medium">
              {view === 'hod'
                ? 'Department Governance & Allocations'
                : view === 'faculty'
                ? 'Faculty Command Station'
                : view === 'command'
                ? 'Student Command Deck'
                : view.replace('-', ' ')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCommand}
            className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 md:flex hover:bg-white/10 hover:border-cyan-500/30 transition-all cursor-pointer"
          >
            <Command size={14} className="text-cyan-400" /> Search campus...
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">Ctrl K</kbd>
          </button>

          <button
            onClick={onCommand}
            className="md:hidden rounded-lg p-2 text-zinc-400 hover:bg-white/6 cursor-pointer"
            title="Search"
          >
            <Command size={16} />
          </button>

          <button
            onClick={() => setView(role === 'hod' ? 'hod' : role === 'faculty' ? 'faculty' : 'corrections')}
            className="relative p-2 text-zinc-400 hover:text-white cursor-pointer hover:bg-white/5 rounded-lg transition-colors"
            title={role === 'hod' ? 'HOD Alerts' : role === 'faculty' ? 'Faculty Station Alerts' : 'Attendance Corrections'}
          >
            <Bell size={18} />
            {pendingCorrections > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-400 ring-2 ring-[#090d16]" />
            )}
          </button>

          <div className="h-4 w-px bg-white/10 mx-1" />

          <Button size="icon" variant="ghost" onClick={() => setDark((d) => !d)} aria-label="Toggle theme">
            {dark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-cyan-400" />}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => void signOut()}
            className="hidden sm:inline-flex text-xs h-8 text-zinc-300 hover:text-white hover:border-white/20"
          >
            <LogOut size={13} className="mr-1" /> Sign out
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 sm:p-6 lg:ml-64 max-w-7xl mx-auto">{children}</main>
    </div>
  )
}
