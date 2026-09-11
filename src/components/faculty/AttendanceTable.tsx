import { UserCheck, UserMinus, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import type { AttendanceStatus, Profile, Subject } from '../../types'
import { Button } from '../ui/button'
import { Card, CardHint, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { useToast } from '../ui/toast'
import { cn } from '../../lib/utils'

export function AttendanceTable({
  subjects,
  students,
  onSave,
}: {
  subjects: Subject[]
  students: Profile[]
  onSave: (subjectId: string, marks: Record<string, AttendanceStatus>, sessionDate?: string) => void
}) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '')
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>(() =>
    Object.fromEntries(students.map((s) => [s.id, 'present' as AttendanceStatus])),
  )
  const { toast } = useToast()

  const presentCount = useMemo(
    () => Object.values(marks).filter((s) => s === 'present').length,
    [marks],
  )
  const absentCount = useMemo(
    () => Object.values(marks).filter((s) => s === 'absent').length,
    [marks],
  )
  const lateCount = useMemo(
    () => Object.values(marks).filter((s) => s === 'late').length,
    [marks],
  )

  const setAll = (status: AttendanceStatus) => {
    if (window.confirm(`Are you sure you want to mark all students as ${status}?`)) {
      setMarks(Object.fromEntries(students.map((s) => [s.id, status])))
    }
  }

  const activeSubject = subjects.find((s) => s.id === subjectId)

  const handleSave = () => {
    onSave(subjectId, marks, sessionDate)
    toast(`Attendance saved for ${activeSubject?.code}`, 'success')
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <Card className="glass">
      <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>Quick Attendance Marking</CardTitle>
            <Badge tone="indigo">Batch Mode</Badge>
          </div>
          <CardHint>
            Spreadsheet-style interface to record Present/Absent/Late for student batches.
          </CardHint>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className="h-9 rounded-xl border border-white/10 bg-black/25 px-3 text-xs text-zinc-200 outline-none focus:border-indigo-400"
          />
          {subjects.length > 0 && (
            <select
              className="h-9 rounded-xl border border-white/10 bg-black/25 px-3 text-xs text-zinc-200 outline-none focus:border-indigo-400"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id} className="bg-zinc-900 text-zinc-200">
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </CardHeader>

      {/* Quick stats & batch action buttons */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/6 bg-white/3 p-3">
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <UserCheck size={14} /> {presentCount} Present
          </span>
          <span className="flex items-center gap-1.5 text-red-400">
            <UserMinus size={14} /> {absentCount} Absent
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <Clock size={14} /> {lateCount} Late
          </span>
          <span className="text-zinc-500">Total: {students.length} students</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-zinc-400 mr-1">Batch Actions:</span>
          <button
            type="button"
            onClick={() => setAll('present')}
            className="rounded-lg bg-emerald-500/15 px-2.5 py-1 font-medium text-emerald-300 hover:bg-emerald-500/25 transition-colors cursor-pointer"
          >
            All Present
          </button>
          <button
            type="button"
            onClick={() => setAll('absent')}
            className="rounded-lg bg-red-500/15 px-2.5 py-1 font-medium text-red-300 hover:bg-red-500/25 transition-colors cursor-pointer"
          >
            All Absent
          </button>
          <button
            type="button"
            onClick={() => setAll('late')}
            className="rounded-lg bg-amber-500/15 px-2.5 py-1 font-medium text-amber-300 hover:bg-amber-500/25 transition-colors cursor-pointer"
          >
            All Late
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/8">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-[11px] uppercase tracking-wide text-zinc-400">
            <tr>
              <th className="px-4 py-2.5">Roll No</th>
              <th className="px-4 py-2.5">Student Name</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5 text-center">Quick Toggle</th>
            </tr>
          </thead>
          <motion.tbody
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="divide-y divide-white/6"
          >
            {students.map((st, idx) => {
              const currentStatus = marks[st.id]
              return (
                <motion.tr
                  variants={itemVariants}
                  key={st.id}
                  className={cn(
                    'transition-colors',
                    idx % 2 === 0 ? 'bg-white/2' : 'bg-white/4',
                    'hover:bg-white/10'
                  )}
                >
                  <td className="px-4 py-3 font-mono text-xs text-indigo-300">{st.roll_no}</td>
                  <td className="px-4 py-3 font-medium text-zinc-200">
                    <div>{st.full_name}</div>
                    <div className="text-[11px] text-zinc-500">{st.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={
                        currentStatus === 'present'
                          ? 'emerald'
                          : currentStatus === 'absent'
                            ? 'crimson'
                            : 'amber'
                      }
                    >
                      {currentStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {(['present', 'absent', 'late'] as AttendanceStatus[]).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setMarks((m) => ({ ...m, [st.id]: status }))}
                          className={`h-7 w-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            marks[st.id] === status
                              ? status === 'absent'
                                ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                                : status === 'late'
                                  ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                                  : 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                              : 'bg-white/6 text-zinc-400 hover:bg-white/12 hover:text-zinc-200'
                          }`}
                          title={`Mark ${status}`}
                        >
                          {status[0]!.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </td>
                </motion.tr>
              )
            })}
          </motion.tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-end">
        <Button onClick={handleSave}>Save Session Records</Button>
      </div>
    </Card>
  )
}
