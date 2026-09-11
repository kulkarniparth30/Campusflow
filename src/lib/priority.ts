import { differenceInCalendarDays } from 'date-fns'
import type { Assignment, AttendanceRecord, Notice, PriorityItem, Subject } from '../types'

export function attendancePct(records: AttendanceRecord[], subjectId: string) {
  const rows = records.filter((r) => r.subject_id === subjectId)
  if (!rows.length) return 100
  const present = rows.filter((r) => r.status === 'present' || r.status === 'late').length
  return (present / rows.length) * 100
}

export function simulatedPct(present: number, total: number, miss: number) {
  const nextTotal = total + miss
  if (nextTotal <= 0) return 100
  return (present / nextTotal) * 100
}

export function buildPriorityFeed(opts: {
  assignments: Assignment[]
  notices: Notice[]
  subjects: Subject[]
  attendance: AttendanceRecord[]
  studentId: string
}): PriorityItem[] {
  const items: PriorityItem[] = []
  const now = new Date()

  for (const a of opts.assignments) {
    const days = differenceInCalendarDays(new Date(a.due_at), now)
    const deadlineScore = Math.min(80, 90 / Math.max(days + 0.4, 0.4))
    const urgencyScore = a.urgency * 8
    const score = deadlineScore + urgencyScore + (a.kind === 'exam' ? 12 : 0)
    items.push({
      id: a.id,
      title: a.title,
      subtitle: a.kind === 'exam' ? 'Examination' : 'Assignment deadline',
      score,
      kind: a.kind === 'exam' ? 'exam' : 'deadline',
      dueAt: a.due_at,
      actionHint: days <= 0 ? 'Due now — submit today' : `${days} day${days === 1 ? '' : 's'} left`,
    })
  }

  for (const s of opts.subjects) {
    const pct = attendancePct(opts.attendance.filter((r) => r.student_id === opts.studentId), s.id)
    if (pct <= s.min_attendance_pct + 8) {
      const risk = Math.max(0, s.min_attendance_pct + 5 - pct)
      items.push({
        id: `att-${s.id}`,
        title: `${s.code} attendance risk`,
        subtitle: `${pct.toFixed(1)}% vs ${s.min_attendance_pct}% required`,
        score: 40 + risk * 4,
        kind: 'attendance',
        actionHint: pct < s.min_attendance_pct ? 'Below threshold — attend next lectures' : 'Near threshold — do not miss class',
      })
    }
  }

  for (const n of opts.notices) {
    if (n.category === 'urgent' || n.is_pinned) {
      items.push({
        id: n.id,
        title: n.title,
        subtitle: n.category === 'urgent' ? 'Urgent notice' : 'Pinned campus notice',
        score: n.category === 'urgent' ? 72 : 48,
        kind: 'notice',
        dueAt: n.event_at ?? undefined,
        actionHint: 'Open notice',
      })
    }
  }

  return items.sort((a, b) => b.score - a.score).slice(0, 8)
}
