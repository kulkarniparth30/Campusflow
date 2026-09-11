import type { Assignment, StudyMilestone, StudyPlan } from '../../types'
import { uid } from '../utils'

/**
 * StudyFlow Agent — Breaks assignment deadlines into milestone-based study plans.
 * Uses heuristic time-budgeting based on urgency, kind, and days remaining.
 */

const PHASE_WEIGHTS = {
  research: 0.25,
  draft: 0.40,
  review: 0.20,
  submit: 0.15,
}

const PHASE_LABELS = {
  research: 'Research & understand requirements',
  draft: 'Draft solution / implementation',
  review: 'Review, test & refine',
  submit: 'Final polish & submission',
}

function estimateTotalHours(assignment: Assignment, daysRemaining: number): number {
  const baseHours = assignment.kind === 'exam' ? 12 : 6
  const urgencyMultiplier = 0.6 + assignment.urgency * 0.15
  // Less time left = more focused hours needed
  const timePress = daysRemaining <= 1 ? 1.5 : daysRemaining <= 3 ? 1.2 : 1.0
  return Math.round(baseHours * urgencyMultiplier * timePress * 10) / 10
}

function getUrgencyLabel(urgency: number, daysRemaining: number): string {
  if (daysRemaining <= 0) return '🔴 Overdue — submit immediately'
  if (daysRemaining <= 1) return '🔴 Due tomorrow — sprint mode'
  if (daysRemaining <= 3 || urgency >= 4) return '🟠 High priority — start now'
  if (daysRemaining <= 7 || urgency >= 3) return '🟡 Moderate — plan this week'
  return '🟢 Comfortable — schedule ahead'
}

export function generateStudyPlan(assignment: Assignment): StudyPlan {
  const now = new Date()
  const due = new Date(assignment.due_at)
  const daysRemaining = Math.max(0, Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  const totalHours = estimateTotalHours(assignment, daysRemaining)
  const urgencyLabel = getUrgencyLabel(assignment.urgency, daysRemaining)

  const phases: (keyof typeof PHASE_WEIGHTS)[] = ['research', 'draft', 'review', 'submit']
  const milestones: StudyMilestone[] = []

  let cumulativeDays = 0
  for (const phase of phases) {
    const hours = Math.round(totalHours * PHASE_WEIGHTS[phase] * 10) / 10
    const dayFraction = PHASE_WEIGHTS[phase]
    cumulativeDays += dayFraction * daysRemaining

    const milestoneDate = new Date(now)
    milestoneDate.setDate(milestoneDate.getDate() + Math.floor(cumulativeDays))

    milestones.push({
      id: uid('ms'),
      label: PHASE_LABELS[phase],
      phase,
      estimated_hours: hours,
      completed: false,
      due_by: milestoneDate.toISOString(),
    })
  }

  return {
    assignment_id: assignment.id,
    milestones,
    total_hours: totalHours,
    urgency_label: urgencyLabel,
  }
}

export function generateAllStudyPlans(assignments: Assignment[]): StudyPlan[] {
  return assignments
    .filter((a) => new Date(a.due_at) > new Date()) // Only future assignments
    .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
    .map(generateStudyPlan)
}
