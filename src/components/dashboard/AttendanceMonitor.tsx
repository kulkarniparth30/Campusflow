import { useMemo, useState } from 'react'
import { attendancePct, simulatedPct } from '../../lib/priority'
import type { AttendanceRecord, Subject } from '../../types'
import { Badge } from '../ui/badge'
import { Card, CardHint, CardHeader, CardTitle } from '../ui/card'
import { RingMeter } from '../ui/ring-meter'
import { Calculator, ShieldAlert, ShieldCheck, Info, CalendarDays, CheckCircle2, XCircle, Clock, AlertCircle, X, ArrowUpRight, Send, Sparkles, FileSignature } from 'lucide-react'
import { AnimatedCounter } from '../ui/animated-counter'
import { Sparkline } from '../ui/sparkline'
import { generateGuardianInsights } from '../../lib/agents/attendanceGuardian'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import { format, parseISO } from 'date-fns'
import { useCampusStore } from '../../store/campus'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../ui/toast'
import { Button } from '../ui/button'

export function AttendanceMonitor({
  subjects,
  records,
  studentId,
}: {
  subjects: Subject[]
  records: AttendanceRecord[]
  studentId: string
}) {
  const [sliderValue, setSliderValue] = useState(2)
  const [mode, setMode] = useState<'miss' | 'attend'>('miss')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
  const [sessionFilter, setSessionFilter] = useState<'all' | 'present' | 'absent' | 'late'>('all')
  const [disputeRecord, setDisputeRecord] = useState<AttendanceRecord | null>(null)
  const [disputeReason, setDisputeReason] = useState('')
  const [loanSubjectId, setLoanSubjectId] = useState<string | null>(null)
  const [compensatoryTask, setCompensatoryTask] = useState('')
  const [remedialHours, setRemedialHours] = useState(4)

  const submitCorrection = useCampusStore((s) => s.submitCorrection)
  const corrections = useCampusStore((s) => s.corrections)
  const attendanceLoans = useCampusStore((s) => s.attendanceLoans)
  const applyAttendanceLoan = useCampusStore((s) => s.applyAttendanceLoan)
  const { setView } = useAuth()
  const { toast } = useToast()

  const mine = records.filter((r) => r.student_id === studentId)

  const overallStats = useMemo(() => {
    let present = 0
    let absent = 0
    let late = 0
    mine.forEach((r) => {
      if (r.status === 'present') present++
      else if (r.status === 'absent') absent++
      else if (r.status === 'late') late++
    })
    return { present, absent, late, total: mine.length }
  }, [mine])

  const insights = useMemo(() => {
    return generateGuardianInsights(records, subjects, studentId)
  }, [records, subjects, studentId])

  const rows = useMemo(() => {
    return subjects.map((s) => {
      const sub = mine.filter((r) => r.subject_id === s.id)
      const present = sub.filter((r) => r.status !== 'absent').length
      const total = sub.length
      const current = attendancePct(mine, s.id)

      let next = current
      if (mode === 'miss') {
        next = simulatedPct(present, total, sliderValue)
      } else {
        const nextTotal = total + sliderValue
        next = nextTotal > 0 ? ((present + sliderValue) / nextTotal) * 100 : 100
      }

      const diff = next - current

      // Generate sparkline data (last 7 sessions cumulative attendance %)
      const sortedSub = [...sub].sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())
      const sparkData: number[] = []
      let tempPresent = 0
      sortedSub.slice(-7).forEach((r, idx) => {
        if (r.status !== 'absent') tempPresent++
        sparkData.push(Math.round((tempPresent / (idx + 1)) * 100))
      })
      if (sparkData.length === 0) sparkData.push(100, 100)
      if (sparkData.length === 1) sparkData.push(sparkData[0])

      const insight = insights.find((i) => i.subject_id === s.id)

      return {
        s,
        current,
        next,
        diff,
        present,
        total,
        isCurrentlyAtRisk: current < s.min_attendance_pct,
        willBeAtRisk: next < s.min_attendance_pct,
        sparkData,
        insight,
        absentCount: sub.filter((r) => r.status === 'absent').length,
        lateCount: sub.filter((r) => r.status === 'late').length,
      }
    })
  }, [subjects, mine, sliderValue, mode, insights])

  const overallAvg = useMemo(() => {
    if (!rows.length) return 100
    const total = rows.reduce((acc, curr) => acc + curr.current, 0)
    return total / rows.length
  }, [rows])

  const atRiskCount = rows.filter((r) => r.isCurrentlyAtRisk).length

  const activeSubject = subjects.find((s) => s.id === selectedSubjectId)
  const activeSubjectRecords = useMemo(() => {
    if (!selectedSubjectId) return []
    return mine
      .filter((r) => r.subject_id === selectedSubjectId)
      .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())
  }, [mine, selectedSubjectId])

  const filteredSubjectRecords = useMemo(() => {
    if (sessionFilter === 'all') return activeSubjectRecords
    return activeSubjectRecords.filter((r) => r.status === sessionFilter)
  }, [activeSubjectRecords, sessionFilter])

  const handleDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!disputeRecord || !disputeReason.trim()) {
      toast('Please provide a specific justification for this session correction.', 'error')
      return
    }
    submitCorrection(disputeRecord.id, disputeReason.trim())
    toast('Dispute submitted! Faculty will review your correction request.', 'success')
    setDisputeRecord(null)
    setDisputeReason('')
  }

  return (
    <Card className="h-full flex flex-col relative">
      <CardHeader className="flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <CardTitle>Attendance Monitor & Simulator</CardTitle>
            <Badge tone={atRiskCount > 0 ? 'crimson' : 'emerald'}>
              {atRiskCount > 0 ? `${atRiskCount} at risk` : 'In safety zone'}
            </Badge>
          </div>
          <CardHint>
            Average <AnimatedCounter value={overallAvg} decimals={1} suffix="%" /> · Click any course card to inspect daily session logs & dispute absences
          </CardHint>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center rounded-xl border border-white/10 bg-black/40 p-0.5 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setMode('miss')}
            className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
              mode === 'miss'
                ? 'bg-red-500/20 font-medium text-red-300'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Miss Classes
          </button>
          <button
            type="button"
            onClick={() => setMode('attend')}
            className={`rounded-lg px-2.5 py-1 transition-all cursor-pointer ${
              mode === 'attend'
                ? 'bg-cyan-500/20 font-medium text-cyan-300'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Attend Next
          </button>
        </div>
      </CardHeader>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2 text-center">
          <div className="text-[10px] text-emerald-400 uppercase font-semibold tracking-wider mb-0.5">Present</div>
          <div className="text-emerald-400 font-semibold font-mono text-lg">
            <AnimatedCounter value={overallStats.present} />
          </div>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-2 text-center">
          <div className="text-[10px] text-red-400 uppercase font-semibold tracking-wider mb-0.5">Absent</div>
          <div className="text-red-400 font-semibold font-mono text-lg">
            <AnimatedCounter value={overallStats.absent} />
          </div>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2 text-center">
          <div className="text-[10px] text-amber-400 uppercase font-semibold tracking-wider mb-0.5">Late</div>
          <div className="text-amber-400 font-semibold font-mono text-lg">
            <AnimatedCounter value={overallStats.late} />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "mb-4 rounded-xl border p-3 transition-colors",
            mode === 'miss' ? 'border-red-500/20 bg-red-500/5' : 'border-cyan-500/20 bg-cyan-500/5'
          )}
        >
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="flex items-center gap-1.5 font-medium text-zinc-300">
              <Calculator size={13} className={mode === 'miss' ? 'text-red-400' : 'text-cyan-400'} />
              {mode === 'miss' ? 'Simulate missing' : 'Simulate attending'}:{' '}
              <strong className={mode === 'miss' ? 'text-red-400' : 'text-cyan-400'}>
                {sliderValue} class{sliderValue === 1 ? '' : 'es'}
              </strong>
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">0 to 8 classes</span>
          </div>
          <input
            type="range"
            min={0}
            max={8}
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            className={cn(
              "w-full cursor-pointer h-1.5 rounded-lg appearance-none bg-black/50",
              mode === 'miss' ? "accent-red-500" : "accent-cyan-400"
            )}
          />
        </motion.div>
      </AnimatePresence>

      {/* Course Cards Grid */}
      <div className="grid gap-3 sm:grid-cols-2 flex-1 overflow-y-auto pr-1">
        {rows.map(({ s, current, next, diff, willBeAtRisk, isCurrentlyAtRisk, sparkData, insight, present, total, absentCount, lateCount }) => (
          <div
            key={s.id}
            onClick={() => setSelectedSubjectId(s.id)}
            className={`group relative flex flex-col justify-between rounded-2xl border p-4 transition-all cursor-pointer hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] ${
              willBeAtRisk
                ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50'
                : 'border-white/10 bg-slate-900/40 hover:border-cyan-500/40'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(isCurrentlyAtRisk && 'ring-glow', isCurrentlyAtRisk ? 'shadow-red-500/20' : '')}>
                  <RingMeter
                    value={current}
                    label={s.code}
                    sub={`${s.min_attendance_pct}% target`}
                    risk={isCurrentlyAtRisk}
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1">
                    {s.name}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Faculty: <span className="text-zinc-300 font-medium">{s.faculty_name || 'Dr. Kavya Iyer'}</span>
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    {present} / {total} attended ({absentCount} missed{lateCount > 0 ? `, ${lateCount} late` : ''})
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                {willBeAtRisk ? (
                  <ShieldAlert size={16} className="text-red-400 mt-1" />
                ) : (
                  <ShieldCheck size={16} className="text-emerald-400 mt-1" />
                )}
                <div title="Last 7 sessions trend">
                  <Sparkline 
                    data={sparkData} 
                    width={40} 
                    height={20} 
                    color={isCurrentlyAtRisk ? '#f87171' : '#06b6d4'} 
                    showDot={false}
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Simulation forecast:</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className={willBeAtRisk ? 'font-semibold text-red-400' : 'text-cyan-300 font-semibold'}>
                    <AnimatedCounter value={next} decimals={1} suffix="%" />
                  </span>
                  {sliderValue > 0 && (
                    <span className={`text-[10px] ${diff < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      ({diff > 0 ? '+' : ''}
                      <AnimatedCounter value={diff} decimals={1} suffix="%" />)
                    </span>
                  )}
                </div>
              </div>

              {insight && insight.risk_level !== 'safe' && (
                <div className="mt-2 rounded-lg bg-black/30 p-2 text-[10px] flex gap-1.5 items-start">
                  <Info size={12} className={insight.risk_level === 'danger' ? 'text-red-400 shrink-0' : 'text-amber-400 shrink-0'} />
                  <span className="text-zinc-300 leading-tight">
                    {insight.recovery_plan}
                  </span>
                </div>
              )}

              <div className="mt-2.5 flex items-center justify-between text-xs pt-1.5 border-t border-white/5">
                <span className="text-[11px] text-cyan-400 font-medium flex items-center gap-1 group-hover:underline">
                  <CalendarDays size={12} /> View Daily Breakdown &rarr;
                </span>
                <div className="flex items-center gap-2">
                  {current < s.min_attendance_pct && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setLoanSubjectId(s.id)
                      }}
                      className="rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300 flex items-center gap-1 transition-all"
                    >
                      <FileSignature size={11} /> Recovery Loan
                    </button>
                  )}
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {total} records
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Academic Recovery Attendance Loan Modal */}
      <AnimatePresence>
        {loanSubjectId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg rounded-3xl border border-amber-500/40 bg-slate-950 p-6 shadow-2xl shadow-amber-950/30"
            >
              <div className="flex items-start justify-between pb-4 border-b border-amber-500/20">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
                    <FileSignature size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Academic Attendance Recovery Contract</h3>
                    <p className="text-xs text-amber-300/80">Remediate debarment risk via compensatory faculty tasks</p>
                  </div>
                </div>
                <button
                  onClick={() => setLoanSubjectId(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="py-4 space-y-4 text-xs">
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-amber-200">
                  <p className="font-medium">
                    Debarment Protection: Students below 75% can apply for an HOD-authorized Remediation Contract to unlock Exam Hall Tickets.
                  </p>
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Committed Remedial / Tutorial Hours:</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={2}
                      max={12}
                      step={2}
                      value={remedialHours}
                      onChange={(e) => setRemedialHours(Number(e.target.value))}
                      className="flex-1 accent-amber-400 bg-black/50"
                    />
                    <span className="font-mono text-amber-300 font-bold text-sm min-w-12 text-right">
                      {remedialHours} hrs
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Projects +{(remedialHours * 1.5).toFixed(1)}% attendance credit upon HOD review.
                  </p>
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">
                    Proposed Compensatory Remedial Plan:
                  </label>
                  <textarea
                    rows={3}
                    value={compensatoryTask}
                    onChange={(e) => setCompensatoryTask(e.target.value)}
                    placeholder="e.g. Complete 3 additional lab assignments, author indexing research summary, and attend 4 remedial Saturday clinic hours..."
                    className="w-full rounded-xl border border-white/10 bg-slate-900/90 p-3 text-white placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {/* Existing active loans notice */}
                {attendanceLoans.some((l) => l.subject_id === loanSubjectId) && (
                  <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3">
                    <span className="text-[11px] text-cyan-300 font-semibold flex items-center gap-1">
                      <Sparkles size={12} /> Active Contract on File for this Subject
                    </span>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      HOD Status: {attendanceLoans.find((l) => l.subject_id === loanSubjectId)?.status.toUpperCase()}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <Button variant="ghost" size="sm" onClick={() => setLoanSubjectId(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!compensatoryTask.trim()}
                  onClick={() => {
                    if (loanSubjectId && compensatoryTask.trim()) {
                      applyAttendanceLoan(loanSubjectId, compensatoryTask, remedialHours)
                      toast('Recovery Loan Submitted: Sent to HOD for review.', 'success')
                      setLoanSubjectId(null)
                      setCompensatoryTask('')
                    }
                  }}
                  className="bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold"
                >
                  Sign & Submit Recovery Contract
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detailed Session Breakdown Modal */}
      <AnimatePresence>
        {selectedSubjectId && activeSubject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-cyan-500/30 bg-slate-950 p-6 shadow-[0_0_50px_rgba(6,182,212,0.2)]"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {activeSubject.code}
                    </span>
                    <h3 className="text-lg font-bold text-white">{activeSubject.name}</h3>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Faculty Instructor: <strong className="text-zinc-200">{activeSubject.faculty_name || 'Dr. Kavya Iyer'}</strong> · Target: <span className="font-mono text-cyan-400">{activeSubject.min_attendance_pct}%</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedSubjectId(null)
                    setDisputeRecord(null)
                  }}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center justify-between my-3">
                <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/40 p-1 text-xs">
                  <button
                    onClick={() => setSessionFilter('all')}
                    className={cn(
                      "px-3 py-1 rounded-lg transition-all font-medium cursor-pointer",
                      sessionFilter === 'all' ? "bg-cyan-500 text-slate-950 font-bold" : "text-zinc-400 hover:text-white"
                    )}
                  >
                    All ({activeSubjectRecords.length})
                  </button>
                  <button
                    onClick={() => setSessionFilter('present')}
                    className={cn(
                      "px-3 py-1 rounded-lg transition-all font-medium cursor-pointer flex items-center gap-1",
                      sessionFilter === 'present' ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30" : "text-zinc-400 hover:text-emerald-300"
                    )}
                  >
                    <CheckCircle2 size={12} /> Present ({activeSubjectRecords.filter(r => r.status === 'present').length})
                  </button>
                  <button
                    onClick={() => setSessionFilter('absent')}
                    className={cn(
                      "px-3 py-1 rounded-lg transition-all font-medium cursor-pointer flex items-center gap-1",
                      sessionFilter === 'absent' ? "bg-red-500/20 text-red-300 font-bold border border-red-500/30" : "text-zinc-400 hover:text-red-300"
                    )}
                  >
                    <XCircle size={12} /> Absent ({activeSubjectRecords.filter(r => r.status === 'absent').length})
                  </button>
                  <button
                    onClick={() => setSessionFilter('late')}
                    className={cn(
                      "px-3 py-1 rounded-lg transition-all font-medium cursor-pointer flex items-center gap-1",
                      sessionFilter === 'late' ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30" : "text-zinc-400 hover:text-amber-300"
                    )}
                  >
                    <Clock size={12} /> Late ({activeSubjectRecords.filter(r => r.status === 'late').length})
                  </button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedSubjectId(null)
                    setView('corrections')
                  }}
                  className="text-xs text-cyan-300 hover:text-white"
                >
                  Go to Corrections <ArrowUpRight size={12} className="ml-1" />
                </Button>
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2">
                {filteredSubjectRecords.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-xs">
                    No sessions match the selected filter.
                  </div>
                ) : (
                  filteredSubjectRecords.map((record) => {
                    const parsed = parseISO(record.session_date)
                    const formattedDate = format(parsed, 'EEEE, dd MMM yyyy')
                    const hasPendingCorrection = corrections.some(
                      (c) => c.attendance_record_id === record.id && c.status === 'pending'
                    )

                    return (
                      <div
                        key={record.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border transition-all",
                          record.status === 'present'
                            ? "border-emerald-500/20 bg-emerald-500/5"
                            : record.status === 'absent'
                            ? "border-red-500/20 bg-red-500/5"
                            : "border-amber-500/20 bg-amber-500/5"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "p-2 rounded-xl text-white shrink-0",
                              record.status === 'present'
                                ? "bg-emerald-500/20 text-emerald-300"
                                : record.status === 'absent'
                                ? "bg-red-500/20 text-red-300"
                                : "bg-amber-500/20 text-amber-300"
                            )}
                          >
                            {record.status === 'present' && <CheckCircle2 size={16} />}
                            {record.status === 'absent' && <XCircle size={16} />}
                            {record.status === 'late' && <Clock size={16} />}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{formattedDate}</p>
                            <p className="text-[11px] text-zinc-400">
                              Marked by instructor · Session ID: <span className="font-mono text-zinc-500">{record.id}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase",
                              record.status === 'present'
                                ? "bg-emerald-500/20 text-emerald-300"
                                : record.status === 'absent'
                                ? "bg-red-500/20 text-red-300"
                                : "bg-amber-500/20 text-amber-300"
                            )}
                          >
                            {record.status}
                          </span>

                          {record.status !== 'present' && (
                            hasPendingCorrection ? (
                              <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                                <AlertCircle size={12} /> Dispute Under Review
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setDisputeRecord(record)
                                  setDisputeReason('')
                                }}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer flex items-center gap-1"
                              >
                                <AlertCircle size={12} /> Dispute
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Inline Quick Dispute Form */}
              <AnimatePresence>
                {disputeRecord && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-white/10"
                  >
                    <form onSubmit={handleDisputeSubmit} className="rounded-2xl bg-cyan-950/40 border border-cyan-500/30 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle size={16} className="text-cyan-400" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                            Dispute Session on {format(parseISO(disputeRecord.session_date), 'dd MMM yyyy')}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDisputeRecord(null)}
                          className="text-xs text-zinc-400 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>

                      <p className="text-xs text-zinc-300">
                        Explain why this absence should be corrected (e.g., attended late, verified OD, or signed physical register).
                      </p>

                      <textarea
                        rows={2}
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        placeholder="State your reason clearly for faculty review..."
                        className="w-full rounded-xl border border-white/10 bg-black/50 p-2.5 text-xs text-white placeholder:text-zinc-500 focus:border-cyan-400 focus:outline-none"
                      />

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDisputeRecord(null)}
                        >
                          Dismiss
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          className="bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold"
                        >
                          <Send size={12} className="mr-1" /> Submit Correction Request
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Card>
  )
}
