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
    <Card className="bg-white/90 backdrop-blur-md border-[#E2E6ED] shadow-sm">
      <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-[#1F1F1F]">Quick Attendance Marking</CardTitle>
            <Badge tone="indigo">Batch Mode</Badge>
          </div>
          <CardHint className="text-[#666666]">
            Spreadsheet-style interface to record Present/Absent/Late for student batches.
          </CardHint>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className="h-9 rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] px-3 text-xs text-[#1F1F1F] outline-none focus:border-[#2563EB]"
          />
          {subjects.length > 0 && (
            <select
              className="h-9 rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] px-3 text-xs text-[#1F1F1F] outline-none focus:border-[#2563EB]"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id} className="bg-white text-[#1F1F1F]">
                  {s.code} — {s.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </CardHeader>

      {/* Quick stats & batch action buttons */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] p-3">
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <UserCheck size={14} /> {presentCount} Present
          </span>
          <span className="flex items-center gap-1.5 text-red-700 font-semibold">
            <UserMinus size={14} /> {absentCount} Absent
          </span>
          <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
            <Clock size={14} /> {lateCount} Late
          </span>
          <span className="text-[#666666]">Total: {students.length} students</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[#666666] mr-1">Batch Actions:</span>
          <button
            type="button"
            onClick={() => setAll('present')}
            className="rounded-lg bg-emerald-100 px-2.5 py-1 font-medium text-emerald-800 hover:bg-emerald-200 transition-colors cursor-pointer"
          >
            All Present
          </button>
          <button
            type="button"
            onClick={() => setAll('absent')}
            className="rounded-lg bg-red-100 px-2.5 py-1 font-medium text-red-800 hover:bg-red-200 transition-colors cursor-pointer"
          >
            All Absent
          </button>
          <button
            type="button"
            onClick={() => setAll('late')}
            className="rounded-lg bg-amber-100 px-2.5 py-1 font-medium text-amber-800 hover:bg-amber-200 transition-colors cursor-pointer"
          >
            All Late
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#E2E6ED] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F5F6F8] text-[11px] uppercase tracking-wide text-[#666666]">
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
            className="divide-y divide-[#E2E6ED]"
          >
            {students.map((st, idx) => {
              const currentStatus = marks[st.id]
              return (
                <motion.tr
                  variants={itemVariants}
                  key={st.id}
                  className={cn(
                    'transition-colors',
                    idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F6F8]/50',
                    'hover:bg-[#F5F6F8]'
                  )}
                >
                  <td className="px-4 py-3 font-mono text-xs text-[#2563EB] font-bold">{st.roll_no}</td>
                  <td className="px-4 py-3 font-medium text-[#1F1F1F]">
                    <div>{st.full_name}</div>
                    <div className="text-[11px] text-[#666666]">{st.email}</div>
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
                                ? 'bg-red-600 text-white shadow-sm'
                                : status === 'late'
                                  ? 'bg-amber-500 text-white shadow-sm'
                                  : 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-[#F5F6F8] text-[#666666] border border-[#E2E6ED] hover:text-[#1F1F1F]'
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
        <Button onClick={handleSave} className="bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-bold shadow-md shadow-[#2563EB]/20">Save Session Records</Button>
      </div>
    </Card>
  )
}
