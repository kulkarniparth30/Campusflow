import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { buildPriorityFeed, attendancePct } from '../../lib/priority'
import { useCampusStore } from '../../store/campus'
import { useAuth } from '../../hooks/useAuth'
import {
  AlertTriangle,
  ArrowRight,
  Activity,
  ListOrdered,
  Calendar,
  Sparkles,
  FileCheck,
  ChevronRight,
  Clock,
  QrCode,
} from 'lucide-react'
import { AnimatedCounter } from '../ui/animated-counter'
import { Badge } from '../ui/badge'
import { generateTomorrowAlert } from '../../lib/agents/attendanceGuardian'
import { FlashRollModal } from '../attendance/FlashRollModal'

const containerVars = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVars = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

export function StudentCommandCenter() {
  const { setView } = useAuth()
  const profile = useCampusStore((s) => s.profile)!
  const allSubjects = useCampusStore((s) => s.subjects)
  const allAssignments = useCampusStore((s) => s.assignments)
  const attendance = useCampusStore((s) => s.attendance)
  const notices = useCampusStore((s) => s.notices)
  const [scannerOpen, setScannerOpen] = useState(false)

  // Strict Department Isolation for Student Command Center
  const subjects = useMemo(() => {
    if (profile?.department) {
      const studentDept = profile.department.toLowerCase()
      const deptSubs = allSubjects.filter(s => s.department && (s.department.toLowerCase().includes(studentDept) || studentDept.includes(s.department.toLowerCase())))
      return deptSubs.length > 0 ? deptSubs : allSubjects
    }
    return allSubjects
  }, [allSubjects, profile?.department])

  const subjectIdSet = useMemo(() => new Set(subjects.map(s => s.id)), [subjects])

  const assignments = useMemo(() => {
    return allAssignments.filter(a => a.subject_id && subjectIdSet.has(a.subject_id))
  }, [allAssignments, subjectIdSet])

  const items = buildPriorityFeed({
    assignments,
    notices,
    subjects,
    attendance,
    studentId: profile.id,
  })

  const hour = new Date().getHours()
  const hello = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const myAttendance = useMemo(
    () => attendance.filter((r) => r.student_id === profile.id),
    [attendance, profile.id],
  )

  const overallPct = useMemo(() => {
    let sum = 0
    for (const s of subjects) {
      sum += attendancePct(myAttendance, s.id)
    }
    return subjects.length ? sum / subjects.length : 100
  }, [subjects, myAttendance])

  const tomorrowAlert = useMemo(
    () => generateTomorrowAlert(attendance, subjects, profile.id),
    [attendance, subjects, profile.id],
  )

  const upcomingDeadlines = useMemo(() => {
    return assignments
      .slice(0, 3)
      .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
  }, [assignments])

  const recentNotices = useMemo(() => {
    return notices.slice(0, 3)
  }, [notices])

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-6">
      {/* Smart Proactive Risk Alert */}
      {tomorrowAlert && (
        <motion.div
          variants={itemVars}
          className="flex items-center justify-between gap-4 rounded-2xl bg-[#DCE7F8] border border-[#B8CCF0] p-4 text-[#1F1F1F] shadow-sm backdrop-blur-xl"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white text-[#2563EB] shrink-0 shadow-xs">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#2563EB]">AI Guardian Alert</p>
              <p className="text-sm font-medium text-[#1F1F1F]">{tomorrowAlert}</p>
            </div>
          </div>
          <button
            onClick={() => setView('attendance')}
            className="shrink-0 flex items-center gap-1 text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] px-3 py-1.5 rounded-xl bg-white hover:bg-[#F5F6F8] border border-[#B8CCF0] transition-all cursor-pointer shadow-xs"
          >
            Launch Simulator <ChevronRight size={14} />
          </button>
        </motion.div>
      )}

      {/* Greeting Header */}
      <motion.div variants={itemVars} className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#2563EB]" />
            <p className="text-xs uppercase tracking-[0.25em] font-bold text-[#2563EB]">
              Personalized Dashboard
            </p>
          </div>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-[#1F1F1F]">
            {hello}, {profile.full_name.split(' ')[0]}
          </h1>
          <p className="text-sm text-[#666666]">
            {profile.roll_no} · Semester {profile.semester} · {profile.department}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setScannerOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
          >
            <QrCode size={14} /> Scan Flash-Roll QR
          </button>
          <div className="text-xs text-[#666666] font-mono bg-white border border-[#E2E6ED] rounded-xl px-3.5 py-1.5 shadow-xs">
            Academic Term 2026–27
          </div>
        </div>
      </motion.div>

      {/* 4 Interactive Feature Launchers */}
      <motion.div variants={itemVars} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hub 1: Attendance */}
        <div
          onClick={() => setView('attendance')}
          className="glass rounded-3xl p-5 border border-[#E2E6ED] bg-white hover:border-[#B8CCF0] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-[#DCE7F8] text-[#2563EB] group-hover:scale-110 transition-transform">
              <Activity size={20} />
            </div>
            <Badge tone="cyan">{overallPct >= 75 ? 'Safe' : 'Action Needed'}</Badge>
          </div>
          <div className="mt-4">
            <p className="text-xs text-[#666666]">Attendance Status</p>
            <div className="flex items-baseline gap-2 mt-1">
              <AnimatedCounter value={overallPct} decimals={1} suffix="%" className="text-3xl font-black text-[#1F1F1F]" />
              <span className="text-xs text-[#666666]">avg</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-[#2563EB] font-semibold group-hover:translate-x-1 transition-transform">
              <span>Open Simulator</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>

        {/* Hub 2: Priority Tasks */}
        <div
          onClick={() => setView('priority')}
          className="glass rounded-3xl p-5 border border-[#E2E6ED] bg-white hover:border-[#B8CCF0] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-[#DCE7F8] text-[#2563EB] group-hover:scale-110 transition-transform">
              <ListOrdered size={20} />
            </div>
            <Badge tone="blue">{items.length} Pending</Badge>
          </div>
          <div className="mt-4">
            <p className="text-xs text-[#666666]">Priority Engine</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-3xl font-black text-[#1F1F1F]">{items.length}</p>
              <span className="text-xs text-[#666666]">smart-ranked</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-[#2563EB] font-semibold group-hover:translate-x-1 transition-transform">
              <span>View Priority Feed</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>

        {/* Hub 3: Timetable & Routine */}
        <div
          onClick={() => setView('timetable')}
          className="glass rounded-3xl p-5 border border-[#E2E6ED] bg-white hover:border-[#B8CCF0] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-[#DCE7F8] text-[#2563EB] group-hover:scale-110 transition-transform">
              <Calendar size={20} />
            </div>
            <Badge tone="violet">6 Days</Badge>
          </div>
          <div className="mt-4">
            <p className="text-xs text-[#666666]">Class Routine</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-3xl font-black text-[#1F1F1F]">{subjects.length}</p>
              <span className="text-xs text-[#666666]">active courses</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-[#2563EB] font-semibold group-hover:translate-x-1 transition-transform">
              <span>Open Timetable</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>

        {/* Hub 4: AI Guardian */}
        <div
          onClick={() => setView('ai-hub')}
          className="glass rounded-3xl p-5 border border-[#B8CCF0] bg-[#DCE7F8] hover:border-[#2563EB] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-[#2563EB] text-white font-black shadow-sm group-hover:scale-110 transition-transform">
              <Sparkles size={20} />
            </div>
            <Badge tone="cyan">3 Agents</Badge>
          </div>
          <div className="mt-4">
            <p className="text-xs text-[#666666]">Autonomous AI</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-3xl font-black text-[#2563EB]">Guardian</p>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-[#2563EB] font-semibold group-hover:translate-x-1 transition-transform">
              <span>Enter AI Hub</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Two Clean High-Level Overview Panes */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column: Urgent Deadlines & Assignments Snapshot */}
        <motion.div variants={itemVars} className="glass rounded-3xl p-6 border border-[#E2E6ED] bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#DCE7F8] text-[#2563EB]">
                <Clock size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1F1F1F]">Upcoming Deadlines</h3>
                <p className="text-xs text-[#666666]">Directly from academic calendar</p>
              </div>
            </div>
            <button
              onClick={() => setView('submissions')}
              className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
            >
              All Assignments <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {upcomingDeadlines.map((a) => (
              <div
                key={a.id}
                onClick={() => setView('submissions')}
                className="p-3.5 rounded-2xl border border-[#E2E6ED] bg-[#F5F6F8] hover:bg-[#DCE7F8] hover:border-[#B8CCF0] transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-[#1F1F1F]">{a.title}</p>
                  <p className="text-xs text-[#666666] mt-0.5">{a.description}</p>
                </div>
                <Badge tone={a.kind === 'exam' ? 'crimson' : 'blue'} className="shrink-0 ml-3">
                  {a.kind === 'exam' ? 'Exam' : 'Assignment'}
                </Badge>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Column: Campus Bulletins & Announcements Snapshot */}
        <motion.div variants={itemVars} className="glass rounded-3xl p-6 border border-[#E2E6ED] bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#DCE7F8] text-[#2563EB]">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1F1F1F]">Campus Highlights</h3>
                <p className="text-xs text-[#666666]">Synthesized circulars & updates</p>
              </div>
            </div>
            <button
              onClick={() => setView('timeline')}
              className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
            >
              View Timeline <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {recentNotices.map((n) => (
              <div
                key={n.id}
                onClick={() => setView('timeline')}
                className="p-3.5 rounded-2xl border border-[#E2E6ED] bg-[#F5F6F8] hover:bg-[#DCE7F8] hover:border-[#B8CCF0] transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-[#1F1F1F]">{n.title}</p>
                  <p className="text-xs text-[#666666] line-clamp-1 mt-0.5">{n.body}</p>
                  {(n.faculty_name || n.subject_code || n.topic) && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-[#2563EB] font-medium">
                      {n.faculty_name && <span>By {n.faculty_name}</span>}
                      {n.subject_code && <span>· {n.subject_code}</span>}
                      {n.topic && <span className="text-emerald-600">· {n.topic}</span>}
                    </div>
                  )}
                </div>
                <Badge tone={n.category === 'urgent' ? 'crimson' : 'violet'} className="shrink-0 ml-3">
                  {n.category}
                </Badge>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick Action Footer Strip */}
      <motion.div variants={itemVars} className="glass rounded-2xl p-4 border border-[#E2E6ED] bg-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <FileCheck size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-[#1F1F1F]">Need an On-Duty or Medical Exemption?</p>
            <p className="text-[11px] text-[#666666]">Submit requests directly through the multi-tier approval chain.</p>
          </div>
        </div>
        <button
          onClick={() => setView('od-requests')}
          className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          Submit OD Request
        </button>
      </motion.div>

      {/* Student Flash-Roll Scanner Modal */}
      {scannerOpen && (
        <FlashRollModal
          mode="student"
          onClose={() => setScannerOpen(false)}
        />
      )}
    </motion.div>
  )
}
