import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Bell, CalendarClock, ShieldAlert, Sparkles, HelpCircle, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import type { PriorityItem, Assignment } from '../../types'
import { Badge } from '../ui/badge'
import { Card, CardHint, CardHeader, CardTitle } from '../ui/card'
import { generateStudyPlan } from '../../lib/agents/studyFlow'
import { cn } from '../../lib/utils'

const iconMap = {
  deadline: CalendarClock,
  exam: CalendarClock,
  attendance: ShieldAlert,
  notice: Bell,
}

export function PriorityFeed({ items }: { items: PriorityItem[] }) {
  const [showFormula, setShowFormula] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const criticalCount = items.filter(
    (item) => item.kind === 'attendance' || (item.kind === 'notice' && item.score > 60) || item.score > 80
  ).length

  const warningCount = items.filter((item) => item.score > 65 && item.score <= 80).length

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  }

  const childVariant = {
    hidden: { opacity: 0, y: 12, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1 },
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="items-center">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>Smart Priority Feed</CardTitle>
            <Badge tone="violet" className="flex items-center gap-1">
              <Sparkles size={10} /> AI Ranked
            </Badge>
          </div>
          <CardHint>Ranked by Deadline Proximity + Urgency Score + Attendance Risk.</CardHint>
        </div>
        <button
          type="button"
          onClick={() => setShowFormula((s) => !s)}
          className="text-xs text-zinc-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
          title="Toggle scoring formula details"
        >
          <HelpCircle size={14} />
          <span className="hidden sm:inline">Formula</span>
        </button>
      </CardHeader>

      <div className="mb-4 flex items-center gap-3 rounded-xl border border-indigo-500/10 bg-indigo-500/5 p-3">
        <Sparkles size={16} className="text-indigo-400" />
        <div className="flex-1 text-xs text-zinc-300">
          <span className="font-semibold text-white">🧠 AI Insights:</span> You have{' '}
          <strong className="text-red-400">{criticalCount} critical</strong> and{' '}
          <strong className="text-amber-400">{warningCount} warning</strong> items needing attention.
        </div>
      </div>

      <AnimatePresence>
        {showFormula && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs text-zinc-300 space-y-1">
              <p className="font-semibold text-indigo-300 text-[11px] uppercase tracking-wide">
                Dynamic Ranking Formula:
              </p>
              <p className="text-[11px] text-zinc-400">
                • <span className="text-zinc-200">Deadline Score</span> = 90 / (Days to deadline + 0.4)
              </p>
              <p className="text-[11px] text-zinc-400">
                • <span className="text-zinc-200">Urgency Weight</span> = Urgency rating (1–5) × 8
              </p>
              <p className="text-[11px] text-zinc-400">
                • <span className="text-zinc-200">Attendance Risk</span> = 40 + (Min% - Current%) × 4
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-2.5 flex-1 overflow-y-auto pr-1"
      >
        {items.map((item) => {
          const Icon = iconMap[item.kind]
          const isCritical =
            item.kind === 'attendance' || (item.kind === 'notice' && item.score > 60) || item.score > 80

          const gradientBg = isCritical
            ? 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-500/30 text-red-300'
            : item.score > 65
              ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border-amber-500/30 text-amber-300'
              : 'bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border-indigo-500/30 text-indigo-300'

          let plan = null
          if (item.kind === 'deadline' || item.kind === 'exam') {
            const mockAssignment: Assignment = {
              id: item.id,
              title: item.title,
              description: item.subtitle,
              kind: item.kind === 'exam' ? 'exam' : 'assignment',
              due_at: item.dueAt || new Date().toISOString(),
              urgency: Math.min(5, Math.max(1, Math.ceil(item.score / 20))),
              subject_id: null,
              created_by: null,
            }
            plan = generateStudyPlan(mockAssignment)
          }

          return (
            <motion.div
              layout
              variants={childVariant}
              key={item.id}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="group relative flex flex-col gap-3 rounded-xl border border-white/6 bg-white/4 p-3 hover:border-white/12 hover:bg-white/6 transition-all"
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'mt-0.5 rounded-lg p-2 border shadow-sm',
                    isCritical ? 'bg-red-500/15 border-red-500/20 text-red-300' : 'bg-indigo-500/15 border-indigo-500/20 text-indigo-300'
                  )}
                >
                  {item.kind === 'attendance' ? <AlertTriangle size={15} /> : <Icon size={15} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">
                      {item.title}
                    </p>
                    <div
                      className={cn(
                        'flex items-center gap-1.5 shrink-0 rounded-full px-2 py-0.5 border',
                        gradientBg
                      )}
                    >
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Score</span>
                      <span className="text-xs font-black">{Math.round(item.score)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-xs">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <span className="flex items-center gap-1 rounded bg-black/30 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                        <Icon size={10} />
                        {item.kind}
                      </span>
                      <span className="truncate">{item.subtitle}</span>
                    </div>
                    <span
                      className={cn(
                        'text-[11px] font-medium shrink-0',
                        isCritical ? 'text-red-400' : 'text-indigo-300'
                      )}
                    >
                      {item.actionHint}
                    </span>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {plan && hoveredId === item.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden border-t border-white/5"
                  >
                    <div className="pt-3 pb-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1">
                          <Sparkles size={12} /> Study Plan ({plan.total_hours}h)
                        </span>
                        <span className="text-[10px] text-zinc-500">{plan.urgency_label}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {plan.milestones.slice(0, 2).map((ms) => (
                          <div key={ms.id} className="rounded-lg bg-black/20 p-2 text-[10px]">
                            <div className="flex items-center gap-1 text-zinc-300 mb-1">
                              <CheckCircle2 size={10} className="text-zinc-500" />
                              <span className="truncate font-medium">{ms.label}</span>
                            </div>
                            <div className="text-zinc-500 font-mono">{ms.estimated_hours}h est.</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </motion.div>
    </Card>
  )
}
