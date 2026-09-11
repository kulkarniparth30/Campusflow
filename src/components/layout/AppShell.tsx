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

  // Admin Timetable Management
  { id: 'timetable-mgmt', label: 'Timetable Management', icon: Calendar, roles: ['admin'] },

  // Faculty Station
  { id: 'faculty', label: 'Faculty Station', icon: Table2, roles: ['faculty'] },

  // Student Primary Views
  { id: 'command', label: 'Command Center', icon: LayoutDashboard, roles: ['student'] },
  { id: 'attendance', label: 'Attendance Monitor', icon: Activity, roles: ['student'] },
  { id: 'priority', label: 'Priority Feed', icon: ListOrdered, roles: ['student'] },
  
  // Shared Academic Views
  { id: 'timetable', label: 'Timetable', icon: Calendar, roles: ['student', 'faculty', 'hod'] },
  { id: 'submissions', label: 'Assignments & Work', icon: Upload, roles: ['student'] },
  { id: 'od-requests', label: 'Leave Requests', icon: FileCheck, roles: ['student', 'faculty', 'hod'] },
  { id: 'portfolio', label: 'Portfolio', icon: GraduationCap, roles: ['student'] },
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
  const { profile, role, signOut, view, setView } = useAuth()
  const corrections = useCampusStore((s) => s.corrections)
  const [dark, setDark] = useState(false)
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
    <div className="min-h-screen bg-[#F5F6F8] text-[#1F1F1F] relative overflow-hidden">
      {/* Background Glow */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full bg-[#B8CCF0]/40 blur-[130px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[55%] h-[55%] rounded-full bg-[#DCE7F8]/60 blur-[130px]" />
      </div>
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-[#E2E6ED] bg-white p-4 lg:flex lg:flex-col shadow-sm">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] text-sm font-black text-white shadow-md">
            CF
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-[#1F1F1F] flex items-center gap-1.5">
              CampusFlow
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#4CAF50] animate-pulse" />
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#666666]">
              {role === 'admin' ? 'Admin Portal' : role === 'faculty' ? 'Faculty Portal' : 'Student Platform'}
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
                  ? 'text-[#2563EB] font-semibold bg-[#DCE7F8]'
                  : 'text-[#666666] hover:text-[#1F1F1F] hover:bg-[#F5F6F8]'
              }`}
            >
              {view === n.id && (
                <motion.div
                  layoutId="activeNavDesktop"
                  className="absolute inset-0 bg-[#DCE7F8] border-l-4 border-[#2563EB] rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className="flex items-center gap-3 group-hover:translate-x-1 transition-transform">
                <n.icon size={17} className={view === n.id ? 'text-[#2563EB]' : 'text-[#666666] group-hover:text-[#2563EB] transition-colors'} />
                {n.id === 'hod' && role === 'admin' ? 'College Governance & HODs' : n.label}
              </div>
              {n.id === 'corrections' && pendingCorrections > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2563EB] text-[10px] font-bold text-white shadow-sm">
                  {pendingCorrections}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="rounded-2xl border border-[#E2E6ED] bg-[#F5F6F8] p-3.5 text-xs text-[#666666]">
          <p className="font-semibold text-[#1F1F1F]">{profile?.full_name}</p>
          <p className="capitalize text-[11px] text-[#2563EB] font-mono mt-0.5">{profile?.role} {profile?.department ? `· ${profile?.department}` : ''}</p>
          <div className="mt-2.5 flex items-center justify-between border-t border-[#E2E6ED] pt-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[#666666]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4CAF50] animate-pulse" />
              Connected Secure ERP
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
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-y-0 left-0 w-72 border-r border-[#E2E6ED] bg-white p-6 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] text-xs font-bold text-white">
                      CF
                    </div>
                    <span className="text-sm font-bold text-[#1F1F1F]">CampusFlow</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg p-1.5 text-[#666666] hover:bg-[#F5F6F8] hover:text-[#1F1F1F]"
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
                          ? 'text-[#2563EB] font-semibold bg-[#DCE7F8] border border-[#B8CCF0]'
                          : 'text-[#666666] hover:text-[#1F1F1F]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <n.icon size={17} className={view === n.id ? 'text-[#2563EB]' : 'text-[#666666]'} />
                        {n.id === 'hod' && role === 'admin' ? 'College Governance & HODs' : n.label}
                      </div>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] p-3 text-xs text-[#666666]">
                <p className="font-semibold text-[#1F1F1F]">{profile?.full_name}</p>
                <p className="capitalize text-[11px] text-[#2563EB]">{profile?.role}</p>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    void signOut()
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-white border border-[#E2E6ED] py-1.5 text-xs text-[#1F1F1F] hover:bg-[#F5F6F8] cursor-pointer"
                >
                  <LogOut size={13} /> Sign out
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Top Navbar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#E2E6ED] bg-white/90 px-4 py-3 backdrop-blur-xl lg:ml-64 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden rounded-lg p-1.5 text-[#666666] hover:bg-[#F5F6F8] hover:text-[#1F1F1F] cursor-pointer"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="lg:hidden flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#2563EB] to-[#3B82F6] text-xs font-bold text-white">
              CF
            </div>
            <span className="text-sm font-semibold text-[#1F1F1F]">CampusFlow</span>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-xs text-[#666666]">
            <span className="text-[#666666]">CampusFlow</span>
            <span className="text-[#E2E6ED]">/</span>
            <span className="text-[#2563EB] capitalize font-medium">
              {view === 'hod'
                ? (role === 'admin' ? 'College Governance & HOD Provisioning' : 'Department Governance & Allocations')
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
            className="hidden items-center gap-2 rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] px-3 py-1.5 text-xs text-[#1F1F1F] md:flex hover:bg-[#DCE7F8] hover:border-[#B8CCF0] transition-all cursor-pointer"
          >
            <Command size={14} className="text-[#2563EB]" /> Search campus...
            <kbd className="rounded bg-white border border-[#E2E6ED] px-1.5 py-0.5 font-mono text-[10px] text-[#666666]">Ctrl K</kbd>
          </button>

          <button
            onClick={onCommand}
            className="md:hidden rounded-lg p-2 text-[#666666] hover:bg-[#F5F6F8] cursor-pointer"
            title="Search"
          >
            <Command size={16} />
          </button>

          <button
            onClick={() => setView(role === 'admin' ? 'hod' : role === 'faculty' ? 'faculty' : 'corrections')}
            className="relative p-2 text-[#666666] hover:text-[#1F1F1F] cursor-pointer hover:bg-[#F5F6F8] rounded-lg transition-colors"
            title={role === 'admin' ? 'Admin Alerts' : role === 'faculty' ? 'Faculty Station Alerts' : 'Attendance Corrections'}
          >
            <Bell size={18} />
            {pendingCorrections > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#2563EB] ring-2 ring-white" />
            )}
          </button>

          <div className="h-4 w-px bg-[#E2E6ED] mx-1" />

          <Button size="icon" variant="ghost" onClick={() => setDark((d) => !d)} aria-label="Toggle theme">
            {dark ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} className="text-[#2563EB]" />}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => void signOut()}
            className="hidden sm:inline-flex text-xs h-8 border-[#E2E6ED] text-[#1F1F1F] hover:bg-[#F5F6F8]"
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
