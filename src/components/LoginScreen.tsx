import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { DEMO_PASSWORD } from '../data/demo'
import { useAuth } from '../hooks/useAuth'
import type { Role } from '../types'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import {
  GraduationCap,
  Table2,
  Building2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Loader2,
  Lock,
  Mail,
  UserCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '../lib/utils'

interface RoleCategory {
  role: Role
  label: string
  title: string
  desc: string
  icon: typeof GraduationCap
  badge: string
  tone: 'cyan' | 'blue' | 'purple'
  accentBorder: string
  accentBg: string
  accentText: string
  emailPlaceholder: string
  features: string[]
  demoEmail: string
}

export const ROLE_CATEGORIES: RoleCategory[] = [
  {
    role: 'student',
    label: 'Student',
    title: 'Student Portal',
    desc: 'Access attendance health forecasts, 75% threshold safeguards, assignments feed, leave applications & portfolio.',
    icon: GraduationCap,
    badge: 'Student Portal',
    tone: 'cyan',
    accentBorder: 'border-[#B8CCF0] shadow-[0_4px_16px_rgba(184,204,240,0.4)]',
    accentBg: 'bg-[#DCE7F8]',
    accentText: 'text-[#2563EB]',
    emailPlaceholder: 'student@campusflow.edu',
    demoEmail: 'student@campusflow.edu',
    features: [
      '75% Attendance Safeguard & Trajectory Simulator',
      'Coursework Submissions & Problem Statements',
      'Medical & On-Duty (OD) Leave Applications',
      'AI Guardian Academic Diagnostics & Portfolio',
    ],
  },
  {
    role: 'faculty',
    label: 'Faculty',
    title: 'Faculty Station',
    desc: 'Manage lecture roll calls, interactive attendance rosters, assignment rubrics, student grading & circulars.',
    icon: Table2,
    badge: 'Faculty Station',
    tone: 'blue',
    accentBorder: 'border-[#B8CCF0] shadow-[0_4px_16px_rgba(184,204,240,0.4)]',
    accentBg: 'bg-[#DCE7F8]',
    accentText: 'text-[#2563EB]',
    emailPlaceholder: 'faculty@campusflow.edu',
    demoEmail: 'faculty@campusflow.edu',
    features: [
      'Interactive Lecture Roster & Attendance Register',
      'Assignment Rubric Designer & Student Grading',
      'Attendance Dispute Reviews & Leave Approvals',
      'Targeted Circulars & Student Watchlist',
    ],
  },
  {
    role: 'hod',
    label: 'HOD',
    title: 'Department Head Console',
    desc: 'Department-specific academic governance: faculty curriculum allocation, student attendance oversight & OBE attainment radar.',
    icon: Building2,
    badge: 'HOD Station',
    tone: 'cyan',
    accentBorder: 'border-[#B8CCF0] shadow-[0_4px_16px_rgba(184,204,240,0.4)]',
    accentBg: 'bg-[#DCE7F8]',
    accentText: 'text-[#2563EB]',
    emailPlaceholder: 'hod.cs@campusflow.edu',
    demoEmail: 'hod.cs@campusflow.edu',
    features: [
      'Department Course Allocation & Faculty Workload',
      'Student Attendance Oversight & Risk Warnings',
      'Accreditation OBE & Blooms Attainment Telemetry',
      'Department Faculty Provisioning & Substitutions',
    ],
  },
  {
    role: 'admin',
    label: 'Admin',
    title: 'College Admin Console',
    desc: 'College-wide governance: provision department HOD credentials, cross-department analytics, institutional audit & master timetable.',
    icon: ShieldCheck,
    badge: 'College Admin',
    tone: 'purple',
    accentBorder: 'border-[#B8CCF0] shadow-[0_4px_16px_rgba(184,204,240,0.4)]',
    accentBg: 'bg-[#DCE7F8]',
    accentText: 'text-[#2563EB]',
    emailPlaceholder: 'admin@campusflow.edu',
    demoEmail: 'admin@campusflow.edu',
    features: [
      'Multi-Department Switcher & Institutional Oversight',
      'Onboard Department HODs & Generate Credentials',
      'Master Timetable Management Across Departments',
      'Campus-Wide Circulars & Official ERP Audit Trail',
    ],
  },
]

export function LoginScreen() {
  const { signIn, error } = useAuth()
  const [selectedRole, setSelectedRole] = useState<Role>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [showDemoHelp, setShowDemoHelp] = useState(false)

  const activeRoleConfig = ROLE_CATEGORIES.find((r) => r.role === selectedRole) || ROLE_CATEGORIES[0]

  const handleRoleChange = (role: Role) => {
    setSelectedRole(role)
    if (!email || email.includes('@campusflow.edu')) {
      setEmail('')
    }
  }

  const fillDemoCredentials = (r: RoleCategory) => {
    setSelectedRole(r.role)
    setEmail(r.demoEmail)
    setPassword(DEMO_PASSWORD)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await signIn(email.trim(), password, selectedRole)
    } catch {
      // handled in context error state
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-[#F5F6F8] relative overflow-hidden text-[#1F1F1F]">
      {/* Background Glow */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full bg-[#B8CCF0]/40 blur-[130px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[55%] h-[55%] rounded-full bg-[#DCE7F8]/60 blur-[130px]" />
      </div>

      {/* Left Column: Platform Branding */}
      <div className="relative hidden overflow-hidden lg:flex flex-col justify-between p-12 z-10 border-r border-[#E2E6ED]">
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#3B82F6] text-base font-black text-white shadow-md">
            CF
          </div>
          <div>
            <span className="text-base font-bold tracking-wider text-[#1F1F1F] flex items-center gap-1.5">
              CampusFlow
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            </span>
            <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#666666]">Institutional ERP Platform</p>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#B8CCF0] bg-[#DCE7F8] px-3.5 py-1 text-xs font-semibold text-[#2563EB]">
            <Sparkles size={13} className="text-[#2563EB]" /> Role-Based Institutional Access
          </div>
          <h1 className="text-5xl font-black leading-[1.12] tracking-tight text-[#1F1F1F]">
            Empowering students, faculty, and institutional leaders.
          </h1>
          <p className="text-sm leading-relaxed text-[#666666]">
            A secure campus management suite. Credentials are provided by your institution&apos;s administrator.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3 rounded-2xl border border-[#E2E6ED] bg-white p-3.5 shadow-sm">
              <div className="rounded-xl bg-[#DCE7F8] p-2.5 text-[#2563EB]">
                <GraduationCap size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1F1F1F]">For Enrolled Students</p>
                <p className="text-[11px] text-[#666666]">Track attendance safety, calculate recovery targets, submit coursework & track leaves.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-[#E2E6ED] bg-white p-3.5 shadow-sm">
              <div className="rounded-xl bg-[#DCE7F8] p-2.5 text-[#2563EB]">
                <Table2 size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1F1F1F]">For Faculty Educators</p>
                <p className="text-[11px] text-[#666666]">Mark classroom attendance, grade student submissions, publish notices & resolve grievances.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-[#E2E6ED] bg-white p-3.5 shadow-sm">
              <div className="rounded-xl bg-[#DCE7F8] p-2.5 text-[#2563EB]">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#1F1F1F]">For Institutional Administrators</p>
                <p className="text-[11px] text-[#666666]">Manage course allocation matrix, audit logs, recovery contracts & campus broadcasts.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-[#E2E6ED] pt-6 text-xs text-[#666666] font-mono">
          <span>Enterprise Campus Management & ERP System</span>
          <span className="text-[#2563EB]">v2.2 Academic ERP</span>
        </div>
      </div>

      {/* Right Column: Sign-In Card */}
      <div className="flex items-center justify-center p-4 sm:p-8 lg:p-10 z-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg rounded-3xl p-6 sm:p-8 relative bg-white shadow-xl border border-[#E2E6ED] space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#1F1F1F]">
                Campus Sign In
              </h2>
              <p className="mt-1 text-xs text-[#666666]">
                Enter the email & password provided by your administrator.
              </p>
            </div>
            <Badge tone="blue">Institutional Login</Badge>
          </div>

          {/* Role Selection Tabs */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-[#666666] block mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-[#F5F6F8] border border-[#E2E6ED]">
              {ROLE_CATEGORIES.map((r) => {
                const Icon = r.icon
                const isSelected = selectedRole === r.role
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => handleRoleChange(r.role)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                      isSelected
                        ? 'bg-[#DCE7F8] text-[#2563EB] border border-[#B8CCF0] shadow-sm'
                        : 'text-[#666666] hover:text-[#1F1F1F] hover:bg-white border border-transparent'
                    )}
                  >
                    <Icon size={18} />
                    <span>{r.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sign-In Form */}
          <form className="space-y-3.5" onSubmit={handleSubmit}>
            <div>
              <label className="text-[11px] text-[#666666] font-medium block mb-1">Institutional Email</label>
              <div className="relative">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={activeRoleConfig.emailPlaceholder}
                  required
                  className="pl-9 text-xs bg-[#F5F6F8] border-[#E2E6ED] text-[#1F1F1F] placeholder:text-[#999999]"
                />
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-[#666666] font-medium block mb-1">Password</label>
              <div className="relative">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="pl-9 text-xs bg-[#F5F6F8] border-[#E2E6ED] text-[#1F1F1F] placeholder:text-[#999999]"
                />
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666] pointer-events-none" />
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-rose-500/10 p-2.5 text-xs text-rose-600 border border-rose-200">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 text-xs font-bold py-2.5 shadow-md transition-all mt-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
            >
              {busy ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  <UserCheck size={15} />
                  Sign In to Portal
                  <ArrowRight size={14} className="ml-1" />
                </>
              )}
            </Button>
          </form>

          {/* Info Note */}
          <div className="rounded-xl bg-[#DCE7F8] border border-[#B8CCF0] p-3 text-[11px] text-[#1F1F1F] leading-relaxed">
            <span className="font-bold text-[#2563EB]">Note:</span> Account registration is managed by your institution&apos;s administrator. Contact your admin if you need credentials.
          </div>

          {/* Expandable Demo Helper section for quick testing */}
          <div className="pt-2 border-t border-[#E2E6ED] space-y-2">
            <button
              type="button"
              onClick={() => setShowDemoHelp(!showDemoHelp)}
              className="flex items-center justify-between w-full text-[11px] text-[#666666] hover:text-[#1F1F1F] transition-colors cursor-pointer"
            >
              <span className="font-semibold uppercase tracking-wider text-[10px] text-[#666666]">
                Quick Demo Fill Options
              </span>
              {showDemoHelp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            <AnimatePresence>
              {showDemoHelp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 overflow-hidden"
                >
                  {ROLE_CATEGORIES.map((r) => {
                    const Icon = r.icon
                    return (
                      <button
                        key={r.role}
                        type="button"
                        onClick={() => fillDemoCredentials(r)}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] hover:bg-[#DCE7F8] transition-all text-center group cursor-pointer"
                      >
                        <Icon size={15} className="text-[#2563EB]" />
                        <span className="text-[10px] font-bold text-[#1F1F1F] group-hover:text-[#2563EB]">Fill {r.label}</span>
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
