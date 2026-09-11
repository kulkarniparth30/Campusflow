import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useCampusStore } from '../../store/campus'
import { generateGuardianInsights } from '../../lib/agents/attendanceGuardian'
import { generateAllStudyPlans } from '../../lib/agents/studyFlow'
import { analyzeBroadcast } from '../../lib/agents/broadcastSynthesizer'
import { ShieldCheck, BookOpen, MessageSquare, ArrowRight, Zap } from 'lucide-react'
import { AnimatedCounter } from '../ui/animated-counter'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

const containerVars = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const itemVars = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

export function AIHub() {
  const profile = useCampusStore(s => s.profile)!
  const attendance = useCampusStore(s => s.attendance)
  const subjects = useCampusStore(s => s.subjects)
  const assignments = useCampusStore(s => s.assignments)
  
  const [broadcastText, setBroadcastText] = useState('')
  const [broadcastResult, setBroadcastResult] = useState<ReturnType<typeof analyzeBroadcast> | null>(null)

  const guardianInsights = useMemo(() => generateGuardianInsights(attendance, subjects, profile.id), [attendance, subjects, profile.id])
  const studyPlans = useMemo(() => generateAllStudyPlans(assignments), [assignments])

  const handleAnalyze = () => {
    if (!broadcastText.trim()) return
    setBroadcastResult(analyzeBroadcast(broadcastText))
  }

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-8 max-w-5xl">
      <motion.div variants={itemVars} className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-[#DCE7F8] text-[#2563EB] rounded-2xl border border-[#B8CCF0]">
          <Zap size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#1F1F1F]">AI Intelligence Hub</h1>
          <p className="text-sm text-[#666666]">Actionable agentic insights to optimize your student journey</p>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Agent 1: Attendance Guardian */}
        <motion.div variants={itemVars} className="glass glow-border rounded-3xl p-6 bg-white border border-[#E2E6ED]">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="text-emerald-600" size={20} />
            <h2 className="text-lg font-semibold text-[#1F1F1F]">Attendance Guardian</h2>
          </div>
          <p className="text-xs text-[#666666] mb-6">Predicts attendance trajectories and synthesizes recovery plans.</p>
          
          <div className="space-y-4">
            {guardianInsights.map(insight => (
              <div key={insight.subject_id} className="bg-[#F5F6F8] border border-[#E2E6ED] rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-[#1F1F1F]">{insight.subject_code}</span>
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", 
                    insight.risk_level === 'danger' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    insight.risk_level === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                  )}>
                    {insight.current_pct.toFixed(1)}%
                  </span>
                </div>
                <p className="text-sm text-[#1F1F1F] leading-relaxed">{insight.recovery_plan}</p>
                <div className="mt-3 text-[10px] text-[#666666] font-mono flex items-center justify-between border-t border-[#E2E6ED] pt-2">
                  <span>Projected EOD: <AnimatedCounter value={insight.projected_eod_pct} decimals={1} suffix="%" /></span>
                  {insight.classes_needed > 0 && <span>Classes needed: {insight.classes_needed}</span>}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Agent 2: StudyFlow */}
        <motion.div variants={itemVars} className="glass glow-border rounded-3xl p-6 bg-white border border-[#E2E6ED]">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="text-[#2563EB]" size={20} />
            <h2 className="text-lg font-semibold text-[#1F1F1F]">StudyFlow Synthesizer</h2>
          </div>
          <p className="text-xs text-[#666666] mb-6">Breaks down assignments into manageable milestone plans.</p>

          <div className="space-y-4">
            {studyPlans.slice(0, 3).map(plan => {
              const assignment = assignments.find(a => a.id === plan.assignment_id)
              if (!assignment) return null
              return (
                <div key={plan.assignment_id} className="bg-[#F5F6F8] border border-[#E2E6ED] rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-bold text-[#1F1F1F]">{assignment.title}</span>
                    <span className="text-[10px] text-[#2563EB] font-semibold whitespace-nowrap bg-[#DCE7F8] px-2 py-1 rounded border border-[#B8CCF0]">
                      ~<AnimatedCounter value={plan.total_hours} decimals={1} /> hrs
                    </span>
                  </div>
                  <p className="text-xs text-amber-700 font-medium mb-3">{plan.urgency_label}</p>
                  <div className="space-y-2">
                    {plan.milestones.map(m => (
                      <div key={m.id} className="flex justify-between items-center text-xs">
                        <span className="text-[#666666]">{m.label}</span>
                        <span className="text-[#1F1F1F] font-mono">{m.estimated_hours}h</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Agent 3: Broadcast Synthesizer */}
        <motion.div variants={itemVars} className="glass glow-border rounded-3xl p-6 md:col-span-2 bg-white border border-[#E2E6ED]">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="text-[#2563EB]" size={20} />
            <h2 className="text-lg font-semibold text-[#1F1F1F]">Broadcast Synthesizer</h2>
          </div>
          <p className="text-xs text-[#666666] mb-6">Paste raw circulars or notices to extract dates, action items, and audiences instantly.</p>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <textarea 
                className="w-full h-32 bg-[#F5F6F8] border border-[#E2E6ED] rounded-xl p-3 text-xs text-[#1F1F1F] placeholder:text-[#999999] focus:outline-none focus:border-[#2563EB] resize-none transition-colors"
                placeholder="Paste university circular text here..."
                value={broadcastText}
                onChange={e => setBroadcastText(e.target.value)}
              />
              <Button onClick={handleAnalyze} className="w-full mt-3 group" disabled={!broadcastText.trim()}>
                Extract Intelligence <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            <div className="bg-[#F5F6F8] rounded-xl p-4 border border-[#E2E6ED] min-h-[160px]">
              {broadcastResult ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-[#666666] uppercase tracking-wider mb-1">Summary</h4>
                    <p className="text-sm text-[#1F1F1F]">{broadcastResult.summary}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-[10px] font-semibold text-[#666666] uppercase tracking-wider mb-1">Key Dates</h4>
                      <ul className="text-xs text-[#2563EB] space-y-1">
                        {broadcastResult.extracted_dates.length ? broadcastResult.extracted_dates.map((d, i) => <li key={i}>{d}</li>) : <li className="text-[#666666]">None found</li>}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-semibold text-[#666666] uppercase tracking-wider mb-1">Locations</h4>
                      <ul className="text-xs text-emerald-700 space-y-1">
                        {broadcastResult.extracted_locations.length ? broadcastResult.extracted_locations.map((l, i) => <li key={i}>{l}</li>) : <li className="text-[#666666]">None found</li>}
                      </ul>
                    </div>
                  </div>

                  {broadcastResult.action_items.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-semibold text-[#666666] uppercase tracking-wider mb-1">Action Items</h4>
                      <ul className="text-xs text-[#1F1F1F] space-y-1 list-disc list-inside">
                        {broadcastResult.action_items.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2 border-t border-[#E2E6ED]">
                    <span className="text-[10px] bg-white border border-[#E2E6ED] px-2 py-0.5 rounded text-[#666666]">Cat: {broadcastResult.suggested_category}</span>
                    {broadcastResult.is_urgent && <span className="text-[10px] bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-rose-700">Urgent</span>}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-[#666666]">
                  Analysis results will appear here
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
