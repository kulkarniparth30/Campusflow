import { motion } from 'framer-motion'
import { useState } from 'react'
import { DEMO_PASSWORD } from '../data/demo'
import { useAuth } from '../hooks/useAuth'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { GraduationCap, Table2, ShieldCheck, ArrowRight, Sparkles, Loader2, Building2 } from 'lucide-react'
import { cn } from '../lib/utils'

const DEMO_ROLES = [
  {
    role: 'hod',
    email: 'hod.cs@campusflow.edu',
    name: 'Prof. Ramanathan Sharma',
    label: 'Head of Department (HOD)',
    desc: 'Course allocation matrix, workload & dept. oversight',
    icon: Building2,
    tone: 'cyan' as const,
    shadowHover: 'hover:shadow-[0_0_25px_rgba(6,182,212,0.3)]',
    borderHover: 'hover:border-cyan-400/70',
  },
  {
    role: 'faculty',
    email: 'faculty@campusflow.edu',
    name: 'Dr. Kavya Iyer',
    label: 'Faculty 1 · DSA Lead',
    desc: 'Attendance roster, submissions & grading (CS301)',
    icon: Table2,
    tone: 'blue' as const,
    shadowHover: 'hover:shadow-[0_0_25px_rgba(59,130,246,0.3)]',
    borderHover: 'hover:border-blue-500/60',
  },
  {
    role: 'faculty',
    email: 'rajesh@campusflow.edu',
    name: 'Prof. Rajesh Kumar',
    label: 'Faculty 2 · DBMS Lead',
    desc: 'Course management & student roster (CS302)',
    icon: Table2,
    tone: 'indigo' as const,
    shadowHover: 'hover:shadow-[0_0_25px_rgba(99,102,241,0.3)]',
    borderHover: 'hover:border-indigo-500/60',
  },
  {
    role: 'student',
    email: 'student@campusflow.edu',
    name: 'Aarav Mehta',
    label: 'Student Portal',
    desc: 'Command Center, simulator & portfolio',
    icon: GraduationCap,
    tone: 'cyan' as const,
    shadowHover: 'hover:shadow-[0_0_25px_rgba(6,182,212,0.3)]',
    borderHover: 'hover:border-cyan-400/60',
  },
  {
    role: 'admin',
    email: 'admin@campusflow.edu',
    name: 'Dean Sharma',
    label: 'Academic Dean Station',
    desc: 'Smart campus notice broadcaster & audits',
    icon: ShieldCheck,
    tone: 'violet' as const,
    shadowHover: 'hover:shadow-[0_0_25px_rgba(139,92,246,0.3)]',
    borderHover: 'hover:border-purple-500/60',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

export function LoginScreen() {
  const { signIn, error } = useAuth()
  const [email, setEmail] = useState('student@campusflow.edu')
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [busy, setBusy] = useState(false)

  const quickSignIn = async (userEmail: string) => {
    setEmail(userEmail)
    setPassword(DEMO_PASSWORD)
    setBusy(true)
    try {
      await signIn(userEmail, DEMO_PASSWORD)
    } catch {
      // handled in context
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-[#090d16] relative overflow-hidden">
      {/* Animated gradient mesh background - Cyber Blue & Cyan */}
      <div className="absolute inset-0 z-0 opacity-35 pointer-events-none mix-blend-screen">
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] rounded-full bg-cyan-500/20 blur-[130px] animate-[spin_25s_linear_infinite]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[55%] h-[55%] rounded-full bg-blue-600/20 blur-[130px] animate-[spin_30s_linear_infinite_reverse]" />
      </div>

      {/* Hero Left Column */}
      <div className="relative hidden overflow-hidden lg:flex flex-col justify-between p-12 z-10">
        {/* Floating cyan particles */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400/40 rounded-full animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.6)]"
              style={{
                top: `${((i * 37) % 97)}%`,
                left: `${((i * 53) % 91)}%`,
                animationDuration: `${2 + ((i * 13) % 30) / 10}s`,
                animationDelay: `${((i * 19) % 20) / 10}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 text-base font-black text-white shadow-[0_0_28px_rgba(6,182,212,0.6)]">
            CF
          </div>
          <div>
            <span className="text-base font-bold tracking-wider text-white flex items-center gap-1.5">
              CampusFlow
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </span>
            <p className="text-[10px] uppercase tracking-[0.25em] font-semibold text-cyan-400">Student Journey Platform</p>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-300 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Sparkles size={13} className="text-cyan-400" /> Problem Statement 4 · Next-Gen Campus Suite
          </div>
          <h1 className="text-5xl font-black leading-[1.12] tracking-tight text-white drop-shadow-2xl">
            Command your campus journey with clarity.
          </h1>
          <p className="text-sm leading-relaxed text-zinc-300">
            Synthesize lecture attendance, upcoming deadline priorities, medical leaves, and verified portfolios into a unified modern platform for students and faculty.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-zinc-500 font-mono">
          <span>React 19 · Vite · Tailwind · Supabase Auth & RLS</span>
          <span className="text-cyan-400/90">v2.1 Production Ready</span>
        </div>
      </div>

      {/* Auth Card Right Column */}
      <div className="flex items-center justify-center p-6 sm:p-10 z-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass glow-border w-full max-w-md rounded-3xl p-7 sm:p-9 relative backdrop-blur-3xl bg-[#0f1626]/85 shadow-[0_30px_90px_rgba(0,0,0,0.8)] border border-white/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Access Portal</h2>
              <p className="mt-1 text-xs text-zinc-400">
                1-click role preview or credentials sign-in.
              </p>
            </div>
            <Badge tone="cyan">Demo Active</Badge>
          </div>

          {/* 1-Click Role Sandbox Switchers */}
          <div className="mt-6 space-y-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
              One-Click Role Access
            </p>
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-2.5">
              {DEMO_ROLES.map((r) => {
                const Icon = r.icon
                return (
                  <motion.button
                    variants={itemVariants}
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    key={r.email}
                    type="button"
                    disabled={busy}
                    onClick={() => void quickSignIn(r.email)}
                    className={cn(
                      "group flex w-full items-center justify-between rounded-xl border border-white/8 bg-white/3 p-3.5 text-left transition-all cursor-pointer disabled:opacity-60",
                      r.shadowHover,
                      r.borderHover
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={cn(
                        "rounded-xl bg-white/5 p-2.5 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]",
                        r.tone === 'cyan' ? 'text-cyan-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-300' :
                        r.tone === 'blue' ? 'text-blue-400 group-hover:bg-blue-500/20 group-hover:text-blue-300' :
                        r.tone === 'indigo' ? 'text-indigo-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300' :
                        'text-purple-400 group-hover:bg-purple-500/20 group-hover:text-purple-300'
                      )}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">{r.label}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">({r.name})</span>
                        </div>
                        <p className="text-[11px] text-zinc-400">{r.desc}</p>
                      </div>
                    </div>
                    <ArrowRight size={15} className="text-zinc-500 group-hover:translate-x-1 group-hover:text-cyan-400 transition-all" />
                  </motion.button>
                )
              })}
            </motion.div>
          </div>

          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/8" />
            </div>
            <span className="relative bg-[#0f1626] px-3 text-[10px] uppercase tracking-widest text-zinc-500">
              Or Custom Sign-in
            </span>
          </div>

          {/* Form */}
          <form
            className="space-y-3.5"
            onSubmit={async (e) => {
              e.preventDefault()
              setBusy(true)
              try {
                await signIn(email, password)
              } catch {
                /* caught in hook */
              } finally {
                setBusy(false)
              }
            }}
          >
            <div>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Institutional email"
                required
              />
            </div>
            <div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
            </div>

            {error && (
              <p className="rounded-xl bg-rose-500/10 p-2.5 text-xs text-rose-300 border border-rose-500/30">
                {error}
              </p>
            )}

            <Button className="w-full relative overflow-hidden mt-1" disabled={busy} type="submit">
              {busy ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Authenticating...
                </span>
              ) : 'Sign In with Password'}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
