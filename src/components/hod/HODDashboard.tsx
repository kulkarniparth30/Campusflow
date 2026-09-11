import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Users,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  ShieldAlert,
  Search,
  Sparkles,
  BarChart3,
  FileCheck2,
  UserCheck,
  FileSignature,
} from 'lucide-react'
import type { Subject, Profile, AttendanceRecord, AuditLog } from '../../types'
import { DEMO_CO_ATTAINMENT, DEMO_BLOOMS_DISTRIBUTION } from '../../data/demo'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { useCampusStore } from '../../store/campus'
import { useToast } from '../ui/toast'
import { cn } from '../../lib/utils'

interface HODDashboardProps {
  subjects: Subject[]
  students: Profile[]
  attendance: AttendanceRecord[]
  faculties: Profile[]
  auditLogs: AuditLog[]
  onAllocateCourse: (subjectId: string, facultyId: string, notes?: string) => string | null
}

type HODTab = 'allocation' | 'workload' | 'attendance' | 'obe' | 'substitutions' | 'audit'

export function HODDashboard({
  subjects,
  students,
  attendance,
  faculties,
  auditLogs,
  onAllocateCourse,
}: HODDashboardProps) {
  const [activeTab, setActiveTab] = useState<HODTab>('allocation')
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [targetFacultyId, setTargetFacultyId] = useState<string>('')
  const [allocationNotes, setAllocationNotes] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [auditSearch, setAuditSearch] = useState('')
  const [auditFilter, setAuditFilter] = useState<string>('ALL')

  const { toast } = useToast()
  const sendAttendanceWarning = useCampusStore((s) => s.sendAttendanceWarning)
  const attendanceLoans = useCampusStore((s) => s.attendanceLoans)
  const reviewAttendanceLoan = useCampusStore((s) => s.reviewAttendanceLoan)
  const substitutions = useCampusStore((s) => s.substitutions)
  const reviewSubstitution = useCampusStore((s) => s.reviewSubstitution)

  // Compute departmental high-level metrics
  const totalCourses = subjects.length
  const totalFaculties = faculties.length

  // Calculate departmental average attendance
  const avgDepartmentAttendance = useMemo(() => {
    if (attendance.length === 0) return 100
    const presentCount = attendance.filter((r) => r.status === 'present' || r.status === 'late').length
    return Math.round((presentCount / attendance.length) * 1000) / 10
  }, [attendance])

  // Identify students with <75% attendance across any subject
  const atRiskStudents = useMemo(() => {
    const list: {
      student: Profile
      subject: Subject
      pct: number
      attended: number
      total: number
    }[] = []

    students.forEach((stud) => {
      subjects.forEach((sub) => {
        const records = attendance.filter((r) => r.student_id === stud.id && r.subject_id === sub.id)
        if (records.length > 0) {
          const attended = records.filter((r) => r.status === 'present' || r.status === 'late').length
          const pct = Math.round((attended / records.length) * 1000) / 10
          if (pct < 75) {
            list.push({
              student: stud,
              subject: sub,
              pct,
              attended,
              total: records.length,
            })
          }
        }
      })
    })
    return list.sort((a, b) => a.pct - b.pct)
  }, [students, subjects, attendance])

  // Faculty workload calculation
  const facultyWorkloads = useMemo(() => {
    return faculties.map((fac) => {
      const assigned = subjects.filter((s) => s.faculty_id === fac.id)
      const totalCredits = assigned.reduce((acc, s) => acc + (s.credits ?? 3), 0)
      const totalHours = assigned.reduce((acc, s) => acc + (s.contact_hours_per_week ?? 3), 0)
      return {
        faculty: fac,
        assigned,
        totalCredits,
        totalHours,
        status: totalHours > 12 ? 'heavy' : totalHours === 0 ? 'unassigned' : 'optimal',
      }
    })
  }, [faculties, subjects])

  // Handle allocation submission
  const handleConfirmAllocation = () => {
    if (!selectedSubject || !targetFacultyId) return
    const err = onAllocateCourse(selectedSubject.id, targetFacultyId, allocationNotes)
    if (err) {
      toast(err, 'error')
      return
    }
    const chosenFaculty = faculties.find((f) => f.id === targetFacultyId)
    toast(
      `Course ${selectedSubject.code} allocated to ${chosenFaculty?.full_name || 'faculty'} successfully.`,
      'success'
    )
    setIsModalOpen(false)
    setSelectedSubject(null)
    setTargetFacultyId('')
    setAllocationNotes('')
  }

  // Filtered audit logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        log.target.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.actor_name.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.details.toLowerCase().includes(auditSearch.toLowerCase())
      const matchesFilter = auditFilter === 'ALL' || log.action === auditFilter
      return matchesSearch && matchesFilter
    })
  }, [auditLogs, auditSearch, auditFilter])

  const openAllocationModal = (subject: Subject) => {
    setSelectedSubject(subject)
    setTargetFacultyId(subject.faculty_id || faculties[0]?.id || '')
    setAllocationNotes('')
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Institutional Department Header */}
      <div className="relative overflow-hidden rounded-3xl border border-[#E2E6ED] bg-white/90 backdrop-blur-md p-6 sm:p-8 shadow-sm">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-[#B8CCF0]/30 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#DCE7F8] text-[#2563EB] border border-[#B8CCF0]">
                <Building2 size={22} />
              </span>
              <Badge tone="cyan" className="tracking-wider uppercase text-[10px] font-bold">
                ERP Academic Governance · Level 2 HOD
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1F1F1F] tracking-tight">
              Department of Computer Science & Engineering
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] flex items-center gap-2">
              <GraduationCap size={15} className="text-[#2563EB]" />
              Department Head: <strong className="text-[#1F1F1F]">Prof. Ramanathan Sharma, Ph.D.</strong>
              <span className="text-[#E2E6ED]">·</span>
              <span className="text-[#2563EB] font-mono">Academic Year 2025-2026 (Sem 6)</span>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <Badge tone="indigo" className="px-3 py-1.5 text-xs font-semibold">
              <ShieldCheck size={14} className="mr-1.5 text-indigo-600" />
              Allocation Matrix Authority Active
            </Badge>
          </div>
        </div>

        {/* Telemetry Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#E2E6ED]">
          <div className="rounded-2xl border border-[#E2E6ED] bg-[#F5F6F8] p-3.5">
            <p className="text-[11px] text-[#666666] font-medium">Department Courses</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-black text-[#1F1F1F]">{totalCourses}</p>
              <span className="text-[10px] text-emerald-700 font-medium">100% Assigned</span>
            </div>
          </div>
          <div className="rounded-2xl border border-[#B8CCF0] bg-[#DCE7F8]/40 p-3.5">
            <p className="text-[11px] text-[#2563EB] font-medium">Faculty Strength</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-black text-[#2563EB]">{totalFaculties}</p>
              <span className="text-[10px] text-[#666666] font-medium">Active Teachers</span>
            </div>
          </div>
          <div className="rounded-2xl border border-[#E2E6ED] bg-[#F5F6F8] p-3.5">
            <p className="text-[11px] text-[#666666] font-medium">Dept. Attendance Avg</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-black text-emerald-700">{avgDepartmentAttendance}%</p>
              <span className="text-[10px] text-[#666666] font-medium">Threshold: 75%</span>
            </div>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5">
            <p className="text-[11px] text-red-700 font-medium">Attendance Shortfall</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className={cn('text-2xl font-black', atRiskStudents.length > 0 ? 'text-red-700' : 'text-[#1F1F1F]')}>
                {atRiskStudents.length}
              </p>
              <span className="text-[10px] text-red-600 font-medium">Students &lt;75%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E6ED] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('allocation')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'allocation'
              ? 'bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/20'
              : 'text-[#666666] hover:text-[#1F1F1F] hover:bg-[#F5F6F8]'
          )}
        >
          <ArrowRightLeft size={15} />
          Course-Faculty Allocation Matrix
        </button>
        <button
          onClick={() => setActiveTab('workload')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'workload'
              ? 'bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/20'
              : 'text-[#666666] hover:text-[#1F1F1F] hover:bg-[#F5F6F8]'
          )}
        >
          <Clock size={15} />
          Faculty Workload & Hours
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'attendance'
              ? 'bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/20'
              : 'text-[#666666] hover:text-[#1F1F1F] hover:bg-[#F5F6F8]'
          )}
        >
          <AlertTriangle size={15} />
          Department Attendance Oversight
          {atRiskStudents.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-[10px] text-white font-black">
              {atRiskStudents.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('obe')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'obe'
              ? 'bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/20'
              : 'text-[#666666] hover:text-[#1F1F1F] hover:bg-[#F5F6F8]'
          )}
        >
          <BarChart3 size={15} />
          OBE & NAAC/NBA Accreditation Radar
        </button>
        <button
          onClick={() => setActiveTab('substitutions')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'substitutions'
              ? 'bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/20'
              : 'text-[#666666] hover:text-[#1F1F1F] hover:bg-[#F5F6F8]'
          )}
        >
          <UserCheck size={15} />
          Smart Peer Faculty Substitution
          {substitutions.filter((s) => s.status === 'pending').length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#DCE7F8] text-[10px] text-[#2563EB] font-black">
              {substitutions.filter((s) => s.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'audit'
              ? 'bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/20'
              : 'text-[#666666] hover:text-[#1F1F1F] hover:bg-[#F5F6F8]'
          )}
        >
          <ShieldAlert size={15} />
          ERP Compliance Audit Trail
        </button>
      </div>

      {/* Tab 1: Course-Faculty Allocation Matrix */}
      {activeTab === 'allocation' && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen size={18} className="text-cyan-400" />
                Curriculum Workload Allocation Matrix
              </h2>
              <p className="text-xs text-zinc-400">
                Traditional ERP Rule: Teaching faculty can only access subjects assigned by the Head of Department.
              </p>
            </div>
            <Badge tone="cyan">Semester 6 Roster</Badge>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#090d16]/80 backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/8 bg-white/3 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Course Details</th>
                    <th className="py-3 px-4">Credits & Hours</th>
                    <th className="py-3 px-4">Allocated Teaching Faculty</th>
                    <th className="py-3 px-4">Enrolled Batch</th>
                    <th className="py-3 px-4 text-right">Allocation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6">
                  {subjects.map((sub) => {
                    const assignedFaculty = faculties.find((f) => f.id === sub.faculty_id)
                    const enrolledCount = students.length

                    return (
                      <tr key={sub.id} className="hover:bg-white/2 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-mono font-bold text-xs">
                              {sub.code}
                            </span>
                            <div>
                              <p className="font-bold text-white text-sm">{sub.name}</p>
                              <p className="text-[11px] text-zinc-500">
                                {sub.department || 'Computer Science'} · Sem {sub.semester || 6}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-zinc-200">{sub.credits ?? 4} Credits</span>
                            <p className="text-[11px] text-zinc-500">
                              {sub.contact_hours_per_week ?? 4} Contact Hours / Week
                            </p>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          {assignedFaculty ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                                <GraduationCap size={14} />
                                {assignedFaculty.full_name}
                              </div>
                              <p className="text-[11px] text-zinc-500">{assignedFaculty.designation || 'Faculty'}</p>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-400">
                              <AlertTriangle size={12} />
                              Unallocated
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1.5 text-zinc-300">
                            <Users size={13} className="text-zinc-500" />
                            {enrolledCount} Enrolled Students
                          </span>
                        </td>

                        <td className="py-4 px-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAllocationModal(sub)}
                            className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 text-xs h-8"
                          >
                            <ArrowRightLeft size={13} className="mr-1.5" />
                            Reallocate Faculty
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab 2: Faculty Workload & Hours */}
      {activeTab === 'workload' && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Faculty Workload Distribution</h2>
              <p className="text-xs text-zinc-400">
                Monitors teaching hours and credit load to adhere to UGC/AICTE institutional guidelines (Max 16 hrs/week).
              </p>
            </div>
            <Badge tone="blue">Academic Standards</Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {facultyWorkloads.map((item) => (
              <div
                key={item.faculty.id}
                className="rounded-2xl border border-white/8 bg-[#090d16]/80 p-5 space-y-4 hover:border-cyan-500/30 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400 flex items-center justify-center font-bold border border-cyan-500/30">
                      {item.faculty.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{item.faculty.full_name}</p>
                      <p className="text-xs text-zinc-400">{item.faculty.designation}</p>
                    </div>
                  </div>
                  <Badge tone={item.status === 'heavy' ? 'crimson' : item.status === 'optimal' ? 'cyan' : 'zinc'}>
                    {item.status === 'heavy'
                      ? 'Overburdened'
                      : item.status === 'optimal'
                      ? 'Optimal Load'
                      : 'Under-allocated'}
                  </Badge>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/6">
                  <div className="flex items-center justify-between text-xs text-zinc-300">
                    <span>Contact Hours: {item.totalHours} / 16 hrs max</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {Math.round((item.totalHours / 16) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/6 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        item.totalHours > 12 ? 'bg-rose-400' : 'bg-gradient-to-r from-cyan-400 to-blue-500'
                      )}
                      style={{ width: `${Math.min(100, (item.totalHours / 16) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Allocated Courses ({item.assigned.length}):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.assigned.length > 0 ? (
                      item.assigned.map((sub) => (
                        <span
                          key={sub.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-950/40 px-2.5 py-1 text-[11px] font-medium text-cyan-300"
                        >
                          <BookOpen size={11} className="text-cyan-400" />
                          {sub.code}: {sub.name} ({sub.credits}C)
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-500 italic">No courses currently allocated</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tab 3: Department Attendance Oversight */}
      {activeTab === 'attendance' && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Department-Wide Attendance Shortfall Watchlist</h2>
              <p className="text-xs text-zinc-400">
                Students below the university 75% threshold in any computer science subject. HOD can dispatch escalation warnings.
              </p>
            </div>
            <Badge tone="crimson">{atRiskStudents.length} Risk Flags</Badge>
          </div>

          {atRiskStudents.length === 0 ? (
            <div className="rounded-2xl border border-white/8 bg-[#090d16] p-8 text-center space-y-2">
              <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-white">All Students in Good Academic Standing</p>
              <p className="text-xs text-zinc-400">Every student currently satisfies the mandatory 75% threshold.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#090d16]/80 backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/8 bg-white/3 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4">Current Attendance</th>
                      <th className="py-3 px-4">Assigned Faculty</th>
                      <th className="py-3 px-4 text-right">Escalation Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/6">
                    {atRiskStudents.map((item, idx) => (
                      <tr key={`${item.student.id}-${item.subject.id}-${idx}`} className="hover:bg-white/2 transition-colors">
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-bold text-white">{item.student.full_name}</p>
                            <p className="text-[11px] font-mono text-zinc-500">{item.student.roll_no}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-cyan-300 font-semibold">{item.subject.code}</span>
                          <p className="text-[11px] text-zinc-400">{item.subject.name}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 font-bold text-rose-400">
                              <AlertTriangle size={12} />
                              {item.pct}%
                            </span>
                            <p className="text-[10px] text-zinc-500">
                              {item.attended} / {item.total} sessions
                            </p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-zinc-300">{item.subject.faculty_name || 'Assigned Faculty'}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              sendAttendanceWarning(
                                item.student.id,
                                item.subject.id,
                                item.pct,
                                `HOD Formal Notice to ${item.student.full_name}: You have critically low attendance (${item.pct}%) in ${item.subject.code} (${item.subject.name}). You are summoned to meet the Head of Department before next Wednesday.`
                              )
                              toast(`HOD Warning dispatched to ${item.student.full_name}!`, 'success')
                            }}
                            className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:border-rose-400 text-xs h-8"
                          >
                            <Send size={12} className="mr-1.5" />
                            Dispatch HOD Summon
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Tab 4: ERP Compliance Audit Trail */}
      {activeTab === 'audit' && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck size={18} className="text-cyan-400" />
                ERP Institutional Compliance & Audit Trail
              </h2>
              <p className="text-xs text-zinc-400">
                Immutable chronological log of course reallocations, attendance markups, grading records, and warnings.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search audit records..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="h-9 w-48 sm:w-60 rounded-xl border border-white/10 bg-[#0c1220] pl-8 pr-3 text-xs text-zinc-200 outline-none focus:border-cyan-500"
                />
              </div>

              <select
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                className="h-9 rounded-xl border border-white/10 bg-[#0c1220] px-3 text-xs text-zinc-200 outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Actions</option>
                <option value="COURSE_ALLOCATION">Course Allocations</option>
                <option value="ATTENDANCE_OVERRIDE">Attendance Logs</option>
                <option value="GRADE_SUBMITTED">Grading</option>
                <option value="WARNING_ISSUED">Warnings</option>
                <option value="DISPUTE_REVIEW">Disputes</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#090d16]/80 backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/8 bg-white/3 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action Type</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6 font-mono text-[11px]">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-500">
                        No audit records match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => {
                      const actionTone: Record<string, 'cyan' | 'blue' | 'crimson' | 'violet' | 'amber'> = {
                        COURSE_ALLOCATION: 'cyan',
                        ATTENDANCE_OVERRIDE: 'blue',
                        WARNING_ISSUED: 'crimson',
                        GRADE_SUBMITTED: 'violet',
                        DISPUTE_REVIEW: 'amber',
                      }

                      return (
                        <tr key={log.id} className="hover:bg-white/2 transition-colors">
                          <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge tone={actionTone[log.action] || 'zinc'} className="text-[9px]">
                              {log.action.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-zinc-200 font-semibold">{log.target}</td>
                          <td className="py-3.5 px-4">
                            <span className="text-cyan-300 font-sans font-bold">{log.actor_name}</span>
                            <span className="block text-[10px] text-zinc-500 uppercase">{log.actor_role}</span>
                          </td>
                          <td className="py-3.5 px-4 text-zinc-300 font-sans text-xs">{log.details}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab 5: OBE & NAAC/NBA Accreditation Radar */}
      {activeTab === 'obe' && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="text-cyan-400" size={18} />
                Outcome-Based Education (OBE) & NAAC/NBA Accreditation Matrix
              </h3>
              <p className="text-xs text-zinc-400">
                Live computation of Course Outcome (CO) attainment thresholds and Bloom's Cognitive Taxonomy distribution.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => toast('Exported official NBA/NAAC Self-Assessment Report (SAR) Criterion 3.1 PDF bundle.', 'success')}
              className="bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold text-xs shrink-0"
            >
              <FileCheck2 size={14} className="mr-1.5" /> Export NAAC/NBA Report (PDF)
            </Button>
          </div>

          {/* Departmental CO Attainment Progress Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  Course Outcomes (CO) Attainment vs Target
                </h4>
                <span className="text-[10px] text-zinc-400">Target Threshold: 70-75%</span>
              </div>

              <div className="space-y-3">
                {DEMO_CO_ATTAINMENT.map((co) => (
                  <div key={co.co_code} className="space-y-1.5 rounded-xl bg-slate-950/60 border border-white/5 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-400">{co.co_code}</span>
                        <span className="text-zinc-300 line-clamp-1">{co.description}</span>
                      </div>
                      <Badge
                        tone={co.status === 'exceeded' ? 'cyan' : co.status === 'met' ? 'emerald' : 'crimson'}
                        className="text-[9px] uppercase font-bold shrink-0 ml-2"
                      >
                        {co.status === 'exceeded' ? 'Exceeded' : co.status === 'met' ? 'Met' : 'At Risk'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            co.status === 'at_risk'
                              ? 'bg-rose-500'
                              : co.status === 'met'
                              ? 'bg-emerald-400'
                              : 'bg-cyan-400'
                          }`}
                          style={{ width: `${Math.min(100, co.current_attainment_pct)}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-200 min-w-14 text-right">
                        {co.current_attainment_pct}%{' '}
                        <span className="text-[10px] text-zinc-500">/ {co.target_pct}%</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bloom's Cognitive Taxonomy Breakdown */}
            <div className="rounded-2xl border border-white/8 bg-slate-900/60 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  Bloom's Cognitive Taxonomy Question Weighting
                </h4>
                <span className="text-[10px] text-zinc-400">120 Total Questions</span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Aggregated distribution of cognitive rigor across all semester assignments, continuous assessments, and examinations.
              </p>

              <div className="space-y-3 pt-2">
                {DEMO_BLOOMS_DISTRIBUTION.map((item) => (
                  <div key={item.level} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300">{item.level}</span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {item.percentage}% ({item.count} items)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-950/30 p-3 text-[11px] text-cyan-200">
                <Sparkles size={14} className="inline mr-1 text-cyan-400" />
                NBA Criterion 3 Compliance: Higher-order thinking questions (Apply, Analyze, Evaluate) account for <strong>58%</strong> of total department assessment rubric.
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab 6: Smart Peer Faculty Substitution */}
      {activeTab === 'substitutions' && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="text-cyan-400" size={18} />
                Smart Peer Faculty Substitution Resolver
              </h3>
              <p className="text-xs text-zinc-400">
                Automated timetable conflict resolver recommending available peer professors to cover faculty leave slots.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-slate-900/60 overflow-hidden">
            <div className="p-4 border-b border-white/8 bg-slate-950/40">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                Active & Pending Lecture Substitution Requests
              </h4>
            </div>

            <div className="divide-y divide-white/6">
              {substitutions.map((sub) => (
                <div key={sub.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-400 text-sm">{sub.subject_code}</span>
                      <span className="text-xs text-slate-300 font-semibold">{sub.subject_name}</span>
                      <Badge
                        tone={sub.status === 'accepted' ? 'emerald' : sub.status === 'pending' ? 'amber' : 'zinc'}
                        className="text-[9px] uppercase font-bold"
                      >
                        {sub.status}
                      </Badge>
                    </div>

                    <div className="text-xs text-zinc-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>Original: <strong className="text-slate-200">{sub.original_faculty_name}</strong></span>
                      <span>Substitute: <strong className="text-cyan-300">{sub.substitute_faculty_name}</strong></span>
                      <span>Date & Slot: <strong className="text-slate-200">{sub.date} ({sub.slot_time})</strong></span>
                    </div>

                    <p className="text-xs text-zinc-400 italic">"{sub.reason}"</p>
                  </div>

                  {sub.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          reviewSubstitution(sub.id, 'rejected')
                          toast('Substitution rejected.', 'error')
                        }}
                        className="text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          reviewSubstitution(sub.id, 'accepted')
                          toast('Substitution approved and roster updated.', 'success')
                        }}
                        className="bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold text-xs"
                      >
                        Approve Roster Transfer
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Academic Attendance Recovery Loans Section */}
          <div className="rounded-2xl border border-amber-500/30 bg-slate-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSignature className="text-amber-400" size={18} />
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Academic Attendance Recovery Contracts (Debarment Prevention)
                </h4>
              </div>
              <span className="text-[10px] text-amber-400/80 font-mono">
                {attendanceLoans.filter((l) => l.status === 'pending').length} Pending HOD Approval
              </span>
            </div>

            <div className="space-y-3">
              {attendanceLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="rounded-xl border border-white/5 bg-slate-950/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{loan.student_name}</span>
                      <span className="font-mono text-cyan-400 text-xs">({loan.subject_code} - {loan.subject_name})</span>
                      <Badge
                        tone={loan.status === 'active' ? 'emerald' : loan.status === 'pending' ? 'amber' : 'crimson'}
                        className="text-[9px] uppercase font-bold"
                      >
                        {loan.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-300">
                      Current: <strong className="text-rose-400 font-mono">{loan.current_pct}%</strong> &rarr; Target: <strong className="text-emerald-400 font-mono">{loan.target_pct}%</strong> | Remedial Commitment: <strong className="text-amber-300 font-mono">{loan.remedial_hours_required} hrs</strong>
                    </p>
                    <p className="text-xs text-zinc-400">
                      Compensatory Task: "{loan.compensatory_task}"
                    </p>
                    {loan.hod_note && (
                      <p className="text-[11px] text-cyan-300 font-mono mt-1">
                        HOD Remarks: {loan.hod_note}
                      </p>
                    )}
                  </div>

                  {loan.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          reviewAttendanceLoan(loan.id, false, 'Debarment confirmed. Remedial plan inadequate.')
                          toast('Attendance contract rejected.', 'error')
                        }}
                        className="text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          reviewAttendanceLoan(loan.id, true, 'Approved by HOD. Exam hall ticket provisionally unlocked.')
                          toast('Contract approved! Student exam hall ticket unlocked.', 'success')
                        }}
                        className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs"
                      >
                        Approve Hall Ticket
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Course Reallocation Modal */}
      <AnimatePresence>
        {isModalOpen && selectedSubject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-lg rounded-3xl border border-cyan-500/30 bg-[#090d16] p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-white/8 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                    <ArrowRightLeft size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Course Workload Reallocation</h3>
                    <p className="text-xs text-zinc-400">Update faculty teaching assignment for this term</p>
                  </div>
                </div>
                <Badge tone="cyan">{selectedSubject.code}</Badge>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/3 border border-white/6 space-y-1">
                <p className="text-xs font-bold text-white">{selectedSubject.name}</p>
                <p className="text-[11px] text-zinc-400">
                  {selectedSubject.credits ?? 4} Credits · {selectedSubject.contact_hours_per_week ?? 4} Contact Hours
                  · Currently Assigned:{' '}
                  <strong className="text-cyan-300">{selectedSubject.faculty_name || 'None'}</strong>
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1.5">
                    Select New Faculty Instructor:
                  </label>
                  <select
                    value={targetFacultyId}
                    onChange={(e) => setTargetFacultyId(e.target.value)}
                    className="w-full h-10 rounded-xl border border-white/10 bg-[#0c1220] px-3 text-xs text-zinc-200 outline-none focus:border-cyan-500"
                  >
                    {faculties.map((f) => {
                      const count = subjects.filter((s) => s.faculty_id === f.id).length
                      return (
                        <option key={f.id} value={f.id}>
                          {f.full_name} ({f.designation || 'Faculty'}) — Currently teaching {count} course(s)
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1.5">
                    Allocation Administrative Memo / Rationale:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Workload rebalancing for Spring term"
                    value={allocationNotes}
                    onChange={(e) => setAllocationNotes(e.target.value)}
                    className="w-full h-10 rounded-xl border border-white/10 bg-[#0c1220] px-3 text-xs text-zinc-200 outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-cyan-950/30 border border-cyan-500/20 p-3 text-[11px] text-zinc-400 flex items-start gap-2">
                <ShieldCheck size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  This action will generate an official immutable ERP audit entry. The selected faculty member will
                  immediately gain management permissions over attendance, grading, and coursework.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleConfirmAllocation} className="text-xs">
                  Confirm Allocation
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
