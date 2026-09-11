import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  AlertTriangle, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  X, 
  Calendar, 
  Check, 
  FileSpreadsheet, 
  ShieldAlert, 
  UserCheck 
} from 'lucide-react'
import type { AttendanceRecord, AttendanceStatus, Profile, Subject } from '../../types'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardHeader, CardTitle, CardHint } from '../ui/card'
import { Textarea } from '../ui/input'
import { useCampusStore } from '../../store/campus'
import { useToast } from '../ui/toast'
import { cn } from '../../lib/utils'

interface StudentAttendanceWatchlistProps {
  subjects: Subject[]
  students: Profile[]
  attendance: AttendanceRecord[]
  onSaveAttendance: (subjectId: string, marks: Record<string, AttendanceStatus>, sessionDate?: string) => void
}

export function StudentAttendanceWatchlist({
  subjects,
  students,
  attendance,
  onSaveAttendance,
}: StudentAttendanceWatchlistProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id ?? '')
  const [viewMode, setViewMode] = useState<'roster' | 'mark'>('roster')
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>(() =>
    Object.fromEntries(students.map((s) => [s.id, 'present' as AttendanceStatus])),
  )

  // Warning modal state
  const [warningStudent, setWarningStudent] = useState<{
    student: Profile
    pct: number
    attended: number
    total: number
  } | null>(null)
  const [warningMessage, setWarningMessage] = useState('')

  const sendAttendanceWarning = useCampusStore((s) => s.sendAttendanceWarning)
  const profile = useCampusStore((s) => s.profile)
  const { toast } = useToast()

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0]

  // Calculate attendance per student for the selected subject
  const studentStats = useMemo(() => {
    if (!activeSubject) return []
    return students.map((stu) => {
      const records = attendance.filter(
        (r) => r.subject_id === activeSubject.id && r.student_id === stu.id,
      )
      const total = records.length
      const attended = records.filter((r) => r.status !== 'absent').length
      const missed = records.filter((r) => r.status === 'absent').length
      const late = records.filter((r) => r.status === 'late').length
      const pct = total > 0 ? (attended / total) * 100 : 100
      const isCritical = pct < activeSubject.min_attendance_pct
      const isWarning = !isCritical && pct < activeSubject.min_attendance_pct + 5

      return {
        stu,
        total,
        attended,
        missed,
        late,
        pct,
        isCritical,
        isWarning,
      }
    })
  }, [students, attendance, activeSubject])

  const criticalCount = studentStats.filter((s) => s.isCritical).length
  const averageClassPct = useMemo(() => {
    if (!studentStats.length) return 100
    const sum = studentStats.reduce((acc, curr) => acc + curr.pct, 0)
    return sum / studentStats.length
  }, [studentStats])

  const handleOpenWarning = (item: (typeof studentStats)[0]) => {
    const defaultMsg = `Dear ${item.stu.full_name} (${item.stu.roll_no || 'Student'}),\n\nYour attendance in ${activeSubject?.code} (${activeSubject?.name}) is currently ${item.pct.toFixed(1)}%, which is critically below the university mandatory threshold of ${activeSubject?.min_attendance_pct}%. Immediate attendance recovery is required. Please meet instructor ${profile?.full_name || 'Dr. Kavya Iyer'} or submit valid medical/OD documentation immediately.`
    setWarningStudent({
      student: item.stu,
      pct: item.pct,
      attended: item.attended,
      total: item.total,
    })
    setWarningMessage(defaultMsg)
  }

  const handleDispatchWarning = (e: React.FormEvent) => {
    e.preventDefault()
    if (!warningStudent || !activeSubject) return

    sendAttendanceWarning(
      warningStudent.student.id,
      activeSubject.id,
      warningStudent.pct,
      warningMessage,
    )

    toast(
      `Attendance warning dispatched to ${warningStudent.student.full_name}!`,
      'success',
    )
    setWarningStudent(null)
  }

  const handleSaveMarks = () => {
    if (!activeSubject) return
    onSaveAttendance(activeSubject.id, marks, sessionDate)
    toast(`Session attendance recorded for ${activeSubject.code} (${sessionDate})`, 'success')
  }

  const setAllMarks = (status: AttendanceStatus) => {
    setMarks(Object.fromEntries(students.map((s) => [s.id, status])))
  }

  return (
    <Card className="glass flex flex-col space-y-5">
      <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>Class Attendance & Student Watchlist</CardTitle>
            {criticalCount > 0 ? (
              <Badge tone="crimson" className="flex items-center gap-1">
                <AlertTriangle size={11} /> {criticalCount} at Risk (&lt;75%)
              </Badge>
            ) : (
              <Badge tone="emerald">All Students Compliant</Badge>
            )}
          </div>
          <CardHint>
            Class Average: <span className="font-mono text-cyan-300 font-bold">{averageClassPct.toFixed(1)}%</span> · Monitor individual attendance shortfalls & message low-attendance students.
          </CardHint>
        </div>

        {/* Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Subject Selector */}
          {subjects.length > 1 && (
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="h-9 rounded-xl border border-white/10 bg-slate-900 px-3 text-xs text-zinc-200 outline-none focus:border-cyan-400"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          )}

          {/* Mode Switcher */}
          <div className="flex items-center rounded-xl border border-white/10 bg-black/40 p-0.5 text-xs">
            <button
              onClick={() => setViewMode('roster')}
              className={cn(
                "px-3 py-1 rounded-lg transition-all font-medium cursor-pointer flex items-center gap-1",
                viewMode === 'roster' ? "bg-cyan-500 text-slate-950 font-bold" : "text-zinc-400 hover:text-white"
              )}
            >
              <Users size={12} /> Student Roster
            </button>
            <button
              onClick={() => setViewMode('mark')}
              className={cn(
                "px-3 py-1 rounded-lg transition-all font-medium cursor-pointer flex items-center gap-1",
                viewMode === 'mark' ? "bg-cyan-500 text-slate-950 font-bold" : "text-zinc-400 hover:text-white"
              )}
            >
              <FileSpreadsheet size={12} /> Take Session
            </button>
          </div>
        </div>
      </CardHeader>

      {/* Mode 1: Student Attendance Roster & Nudge System */}
      {viewMode === 'roster' ? (
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/10 bg-black/30 p-2.5 text-center">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold">Total Students</span>
              <p className="text-lg font-bold text-white font-mono mt-0.5">{students.length}</p>
            </div>
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-2.5 text-center">
              <span className="text-[10px] text-cyan-400 uppercase font-semibold">Class Attendance</span>
              <p className="text-lg font-bold text-cyan-300 font-mono mt-0.5">{averageClassPct.toFixed(1)}%</p>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-950/20 p-2.5 text-center">
              <span className="text-[10px] text-red-400 uppercase font-semibold">Below 75% Threshold</span>
              <p className="text-lg font-bold text-red-400 font-mono mt-0.5">{criticalCount} Students</p>
            </div>
          </div>

          {/* Roster Table */}
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/40">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-slate-900/60 text-zinc-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student Name & Roll No</th>
                  <th className="py-3 px-3 text-center">Attended / Total</th>
                  <th className="py-3 px-3 text-center">Missed</th>
                  <th className="py-3 px-3 text-center">Attendance %</th>
                  <th className="py-3 px-3 text-center">Eligibility Status</th>
                  <th className="py-3 px-4 text-right">Faculty Intervention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {studentStats.map((item) => (
                  <tr key={item.stu.id} className="hover:bg-white/3 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{item.stu.full_name}</div>
                      <div className="text-zinc-400 font-mono text-[11px]">{item.stu.roll_no || 'CS21B1000'} · Semester {item.stu.semester || 6}</div>
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono text-zinc-200">
                      <span className="font-bold text-white">{item.attended}</span> / {item.total}
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono text-red-400 font-semibold">
                      {item.missed} class{item.missed === 1 ? '' : 'es'}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={cn(
                          "font-mono font-bold text-sm px-2.5 py-1 rounded-lg border",
                          item.isCritical
                            ? "bg-red-500/20 text-red-300 border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                            : item.isWarning
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        )}
                      >
                        {item.pct.toFixed(1)}%
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      {item.isCritical ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                          <XCircle size={11} /> Critical Shortfall
                        </span>
                      ) : item.isWarning ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <AlertTriangle size={11} /> Borderline Risk
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 size={11} /> Examination Eligible
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {item.isCritical ? (
                        <Button
                          size="sm"
                          onClick={() => handleOpenWarning(item)}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold"
                        >
                          <Send size={11} className="mr-1.5" /> Send Warning Nudge
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenWarning(item)}
                          className="text-zinc-400 hover:text-zinc-200 text-xs"
                        >
                          Message Student
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Mode 2: Batch Session Marker */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-2xl bg-black/40 border border-white/10">
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-cyan-400" />
              <span className="text-xs font-semibold text-zinc-300">Marking Session Date:</span>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="h-8 rounded-xl border border-white/10 bg-slate-900 px-3 text-xs text-zinc-200 outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-400 mr-1">Batch Mark:</span>
              <Button size="sm" variant="outline" onClick={() => setAllMarks('present')} className="text-xs text-emerald-400">
                All Present
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAllMarks('absent')} className="text-xs text-red-400">
                All Absent
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/40">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 bg-slate-900/60 text-zinc-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4 text-center">Session Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {students.map((s) => {
                  const curStatus = marks[s.id] || 'present'
                  return (
                    <tr key={s.id} className="hover:bg-white/3 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">{s.full_name}</td>
                      <td className="py-3 px-4 font-mono text-zinc-400">{s.roll_no || 'CS21B1000'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setMarks((prev) => ({ ...prev, [s.id]: 'present' }))}
                            className={cn(
                              "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                              curStatus === 'present'
                                ? "bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(52,211,153,0.4)]"
                                : "bg-black/30 text-zinc-400 hover:text-emerald-300"
                            )}
                          >
                            <Check size={12} /> Present
                          </button>
                          <button
                            type="button"
                            onClick={() => setMarks((prev) => ({ ...prev, [s.id]: 'absent' }))}
                            className={cn(
                              "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                              curStatus === 'absent'
                                ? "bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                                : "bg-black/30 text-zinc-400 hover:text-red-300"
                            )}
                          >
                            <XCircle size={12} /> Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => setMarks((prev) => ({ ...prev, [s.id]: 'late' }))}
                            className={cn(
                              "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1",
                              curStatus === 'late'
                                ? "bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                                : "bg-black/30 text-zinc-400 hover:text-amber-300"
                            )}
                          >
                            <Clock size={12} /> Late
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveMarks} className="bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold">
              <UserCheck size={14} className="mr-1.5" /> Save Attendance Register
            </Button>
          </div>
        </div>
      )}

      {/* Nudge / Warning Modal */}
      <AnimatePresence>
        {warningStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg rounded-3xl border border-red-500/40 bg-slate-950 p-6 shadow-[0_0_50px_rgba(239,68,68,0.25)] space-y-4"
            >
              <div className="flex items-start justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30">
                    <ShieldAlert size={18} />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white">Send Attendance Shortfall Warning</h3>
                    <p className="text-xs text-zinc-400">
                      Dispatches an official academic notice to {warningStudent.student.full_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setWarningStudent(null)}
                  className="text-zinc-400 hover:text-white p-1 rounded-xl"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs flex items-center justify-between">
                <span className="text-red-300">
                  Current Attendance: <strong className="font-mono text-sm">{warningStudent.pct.toFixed(1)}%</strong>
                </span>
                <span className="text-zinc-400 font-mono">
                  {warningStudent.attended} attended / {warningStudent.total} sessions
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">Official Notice Content</label>
                <Textarea
                  rows={5}
                  value={warningMessage}
                  onChange={(e) => setWarningMessage(e.target.value)}
                  className="text-xs bg-black/40 leading-relaxed font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <Button variant="ghost" size="sm" onClick={() => setWarningStudent(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleDispatchWarning}
                  className="bg-red-500 text-white hover:bg-red-600 font-bold"
                >
                  <Send size={13} className="mr-1.5" /> Dispatch Urgent Warning
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Card>
  )
}
