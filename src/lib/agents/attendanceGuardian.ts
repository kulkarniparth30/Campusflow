import type { AttendanceInsight, AttendanceRecord, Subject } from '../../types'

/**
 * Attendance Guardian Agent — Rule-based recovery trajectory optimizer.
 * Calculates how many consecutive classes a student must attend to reach the
 * required threshold, predicts end-of-semester attendance, and generates
 * actionable recovery plans.
 */

const REMAINING_SESSIONS_ESTIMATE = 20 // Default remaining sessions per course

export function generateGuardianInsights(
  records: AttendanceRecord[],
  subjects: Subject[],
  studentId: string,
): AttendanceInsight[] {
  const myRecords = records.filter((r) => r.student_id === studentId)

  return subjects.map((subject) => {
    const subjectRecords = myRecords.filter((r) => r.subject_id === subject.id)
    const total = subjectRecords.length
    const present = subjectRecords.filter((r) => r.status !== 'absent').length
    const currentPct = total > 0 ? (present / total) * 100 : 100
    const target = subject.min_attendance_pct

    // Calculate classes needed to reach threshold
    // (present + x) / (total + x) >= target/100
    // present + x >= (target/100) * (total + x)
    // present + x >= target*total/100 + target*x/100
    // x - target*x/100 >= target*total/100 - present
    // x * (1 - target/100) >= target*total/100 - present
    // x >= (target*total/100 - present) / (1 - target/100)
    let classesNeeded = 0
    if (currentPct < target) {
      const numerator = (target * total) / 100 - present
      const denominator = 1 - target / 100
      classesNeeded = Math.max(0, Math.ceil(numerator / denominator))
    }

    // Risk level assessment
    let riskLevel: AttendanceInsight['risk_level'] = 'safe'
    if (currentPct < target) {
      riskLevel = 'danger'
    } else if (currentPct < target + 8) {
      riskLevel = 'warning'
    }

    // Project end-of-semester attendance (assuming same miss pattern continues)
    const missRate = total > 0 ? (total - present) / total : 0
    const projectedMisses = Math.round(missRate * REMAINING_SESSIONS_ESTIMATE)
    const projectedPresent = present + (REMAINING_SESSIONS_ESTIMATE - projectedMisses)
    const projectedTotal = total + REMAINING_SESSIONS_ESTIMATE
    const projectedPct = projectedTotal > 0 ? (projectedPresent / projectedTotal) * 100 : 100

    // Generate recovery plan text
    let recoveryPlan: string
    if (riskLevel === 'danger') {
      recoveryPlan = `Attend the next ${classesNeeded} consecutive ${subject.code} classes to restore attendance above ${target}%. Missing even 1 more class will require ${classesNeeded + 2} recoveries.`
    } else if (riskLevel === 'warning') {
      const buffer = Math.floor(((currentPct - target) / 100) * (total + REMAINING_SESSIONS_ESTIMATE))
      recoveryPlan = `You can afford to miss at most ${buffer} more ${subject.code} classes this semester. Recommend maintaining perfect attendance for the next 5 sessions.`
    } else {
      recoveryPlan = `${subject.code} attendance is healthy at ${currentPct.toFixed(1)}%. Continue attending regularly.`
    }

    return {
      subject_id: subject.id,
      subject_code: subject.code,
      current_pct: currentPct,
      target_pct: target,
      classes_needed: classesNeeded,
      remaining_sessions: REMAINING_SESSIONS_ESTIMATE,
      risk_level: riskLevel,
      recovery_plan: recoveryPlan,
      projected_eod_pct: projectedPct,
    }
  })
}

/**
 * Generate a smart alert message for tomorrow's schedule impact.
 */
export function generateTomorrowAlert(
  records: AttendanceRecord[],
  subjects: Subject[],
  studentId: string,
): string | null {
  const insights = generateGuardianInsights(records, subjects, studentId)
  const atRisk = insights.filter((i) => i.risk_level !== 'safe')

  if (atRisk.length === 0) return null

  const worst = atRisk.sort((a, b) => a.current_pct - b.current_pct)[0]
  const totalRecords = records.filter(
    (r) => r.student_id === studentId && r.subject_id === worst.subject_id,
  ).length
  const presentCount = records.filter(
    (r) =>
      r.student_id === studentId &&
      r.subject_id === worst.subject_id &&
      r.status !== 'absent',
  ).length

  const ifMissPct = totalRecords + 1 > 0 ? (presentCount / (totalRecords + 1)) * 100 : 0

  return `⚠️ Missing ${worst.subject_code} tomorrow drops you to ${ifMissPct.toFixed(1)}%${ifMissPct < worst.target_pct ? ' — below threshold!' : '.'} ${worst.classes_needed > 0 ? `You need ${worst.classes_needed} consecutive attendances to recover.` : ''}`
}
