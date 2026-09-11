import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useCampusStore } from '../../store/campus'
import { generateGuardianInsights } from '../../lib/agents/attendanceGuardian'
import { generateAllStudyPlans } from '../../lib/agents/studyFlow'
import { analyzeBroadcast } from '../../lib/agents/broadcastSynthesizer'
import { ShieldCheck, BookOpen, MessageSquare, ArrowRight, Zap, Bot, Send, Sparkles, RefreshCw } from 'lucide-react'
import { AnimatedCounter } from '../ui/animated-counter'
import { Button } from '../ui/button'
import { cn, getGroqApiKey, queryGroq } from '../../lib/utils'
import { useToast } from '../ui/toast'
import type { Subject, Assignment, TimetableSlot } from '../../types'

const containerVars = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const itemVars = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

interface AIHubProps {
  subjects?: Subject[]
  assignments?: Assignment[]
  timetable?: TimetableSlot[]
}

export function AIHub({ subjects: propSubjects, assignments: propAssignments, timetable: propTimetable }: AIHubProps) {
  const profile = useCampusStore(s => s.profile)!
  const attendance = useCampusStore(s => s.attendance)
  const storeSubjects = useCampusStore(s => s.subjects)
  const storeAssignments = useCampusStore(s => s.assignments)
  const storeTimetable = useCampusStore(s => s.timetable)
  const { toast } = useToast()

  // Department-scoped data
  const subjects = useMemo(() => {
    if (propSubjects) return propSubjects
    if (profile?.department) {
      const studentDept = profile.department.toLowerCase()
      const deptSubs = storeSubjects.filter(s => s.department && (s.department.toLowerCase().includes(studentDept) || studentDept.includes(s.department.toLowerCase())))
      return deptSubs.length > 0 ? deptSubs : storeSubjects
    }
    return storeSubjects
  }, [propSubjects, storeSubjects, profile?.department])

  const subjectIdSet = useMemo(() => new Set(subjects.map(s => s.id)), [subjects])

  const assignments = useMemo(() => {
    if (propAssignments) return propAssignments
    return storeAssignments.filter(a => a.subject_id && subjectIdSet.has(a.subject_id))
  }, [propAssignments, storeAssignments, subjectIdSet])

  const timetable = useMemo(() => {
    if (propTimetable) return propTimetable
    return storeTimetable.filter(slot => subjectIdSet.has(slot.subject_id))
  }, [propTimetable, storeTimetable, subjectIdSet])
  
  const [broadcastText, setBroadcastText] = useState('')
  const [broadcastResult, setBroadcastResult] = useState<ReturnType<typeof analyzeBroadcast> | null>(null)

  // AI Chat State
  const [chatInput, setChatInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: `Hello ${profile.full_name.split(' ')[0]}! I am your Department Academic Guardian for ${profile.department || 'your department'}. Ask me anything about your coursework, assignments, timetable schedule, or attendance recovery.`,
    },
  ])

  const handleSendChatMessage = async (preset?: string) => {
    const textToSend = preset || chatInput
    if (!textToSend.trim() || isGenerating) return

    const key = getGroqApiKey()
    if (!key) {
      toast('AI service key is not configured in environment.', 'error')
      return
    }

    const newMessages = [...chatMessages, { role: 'user' as const, text: textToSend }]
    setChatMessages(newMessages)
    setChatInput('')
    setIsGenerating(true)

    try {
      const formattedCourses = subjects.map(s => `${s.code}: ${s.name} (${s.credits} Credits, Faculty: ${s.faculty_name || 'Assigned'})`).join('; ')
      const formattedSchedule = timetable.map(t => {
        const sub = subjects.find(s => s.id === t.subject_id)
        return `${t.day.toUpperCase()} ${t.start_time}-${t.end_time} [${sub?.code || 'Class'} in Room ${t.room} (${t.type})]`
      }).join('; ')
      const formattedAssignments = assignments.map(a => `${a.title} (Due: ${a.due_at})`).join('; ')

      const systemPrompt = `You are the CampusFlow Department Academic Guardian AI Assistant.
CRITICAL ENFORCEMENT RULES:
1. You ONLY serve students belonging strictly to the "${profile.department || 'Enrolled'}" department.
2. You must ONLY answer questions directly related to:
   - The student's department coursework & subjects
   - The student's official weekly timetable & schedule
   - The student's assignments & lab submissions
   - The student's attendance records & mathematical recovery plans
3. Under NO circumstances should you discuss topics outside this department curriculum (e.g., other college departments, politics, general web trivia, casual non-academic queries). If the user asks anything unrelated or outside their department coursework/timetable, politely reply:
   "I am restricted to providing guidance exclusively for your ${profile.department} department coursework, assignments, timetable, and attendance recovery."

STUDENT CONTEXT:
- Full Name: ${profile.full_name}
- Department: ${profile.department}
- Semester: Semester ${profile.semester || 6}
- Roll Number: ${profile.roll_no || 'N/A'}
- Department Courses: ${formattedCourses || 'None listed'}
- Department Weekly Timetable: ${formattedSchedule || 'Standard timetable'}
- Active Assignments: ${formattedAssignments || 'No pending coursework'}

Provide concise, encouraging, mathematically accurate advice formatted cleanly in markdown.`

      const groqPayload = [
        { role: 'system' as const, content: systemPrompt },
        ...newMessages.slice(-6).map(m => ({ role: m.role, content: m.text })),
      ]

      const reply = await queryGroq(groqPayload)
      setChatMessages(prev => [...prev, { role: 'assistant', text: reply }])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reach AI service'
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', text: `⚠️ **AI Service Notice**: ${msg}` },
      ] as Array<{ role: 'user' | 'assistant'; text: string }>)
      toast(msg, 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const guardianInsights = useMemo(() => generateGuardianInsights(attendance, subjects, profile.id), [attendance, subjects, profile.id])
  const studyPlans = useMemo(() => generateAllStudyPlans(assignments), [assignments])

  const handleAnalyze = () => {
    if (!broadcastText.trim()) return
    setBroadcastResult(analyzeBroadcast(broadcastText))
  }

  return (
    <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-6 max-w-6xl">
      <motion.div variants={itemVars} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#DCE7F8] text-[#2563EB] rounded-2xl border border-[#B8CCF0]">
            <Zap size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1F1F1F]">AI Intelligence Hub</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                <Sparkles size={11} /> AI Active
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-[#DCE7F8] text-[#2563EB] rounded-full border border-[#B8CCF0]">
                {profile.department}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#666666]">Actionable departmental agentic insights & Academic Guardian</p>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Row: Academic Guardian AI Assistant & Broadcast Synthesizer */}
        {/* Agent 1: Academic Guardian AI Assistant (Chatbot placed above) */}
        <motion.div variants={itemVars} className="glass glow-border rounded-3xl p-6 bg-white border border-[#E2E6ED] flex flex-col h-[560px]">
          <div className="flex items-center justify-between gap-3 border-b border-[#E2E6ED] pb-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#2563EB] to-indigo-600 text-white shadow-sm">
                <Bot size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#1F1F1F]">Academic Guardian AI Assistant</h2>
                  <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-[#666666]">{profile.department} Coursework & Timetable Advisor</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setChatMessages([{
                role: 'assistant',
                text: `Welcome! I am your ${profile.department} Academic Guardian. How can I assist you with your coursework, syllabus, timetable, or attendance calculations today?`
              }])}
              className="text-xs text-[#666666] hover:bg-[#F5F6F8] cursor-pointer h-7 px-2.5"
            >
              <RefreshCw size={11} className="mr-1" /> Clear
            </Button>
          </div>

          {/* Quick Preset Prompts */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-2 shrink-0">
            <button
              onClick={() => handleSendChatMessage('How many consecutive classes do I need to attend to reach 75% in all my subjects?')}
              className="text-[10px] font-medium bg-[#F5F6F8] hover:bg-[#DCE7F8] hover:text-[#2563EB] text-[#1F1F1F] px-2.5 py-1 rounded-lg border border-[#E2E6ED] transition-colors cursor-pointer whitespace-nowrap"
            >
              📊 Attendance Math
            </button>
            <button
              onClick={() => handleSendChatMessage('What is my scheduled timetable and classes for today and tomorrow?')}
              className="text-[10px] font-medium bg-[#F5F6F8] hover:bg-[#DCE7F8] hover:text-[#2563EB] text-[#1F1F1F] px-2.5 py-1 rounded-lg border border-[#E2E6ED] transition-colors cursor-pointer whitespace-nowrap"
            >
              📅 Department Timetable
            </button>
            <button
              onClick={() => handleSendChatMessage('Help me break down and study for my upcoming assignments in my department.')}
              className="text-[10px] font-medium bg-[#F5F6F8] hover:bg-[#DCE7F8] hover:text-[#2563EB] text-[#1F1F1F] px-2.5 py-1 rounded-lg border border-[#E2E6ED] transition-colors cursor-pointer whitespace-nowrap"
            >
              📚 Coursework Plan
            </button>
          </div>

          {/* Chat Messages Container - Scrollable */}
          <div className="space-y-3 overflow-y-auto flex-1 p-3.5 bg-[#F5F6F8] rounded-2xl border border-[#E2E6ED]">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'flex gap-2.5 text-xs leading-relaxed max-w-[90%]',
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                )}
              >
                <div
                  className={cn(
                    'h-6 w-6 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0',
                    msg.role === 'user'
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-white border border-[#E2E6ED] text-[#2563EB]'
                  )}
                >
                  {msg.role === 'user' ? 'ME' : <Bot size={12} />}
                </div>
                <div
                  className={cn(
                    'p-3 rounded-xl whitespace-pre-wrap text-xs',
                    msg.role === 'user'
                      ? 'bg-[#2563EB] text-white rounded-tr-none'
                      : 'bg-white text-[#1F1F1F] border border-[#E2E6ED] rounded-tl-none shadow-xs'
                  )}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isGenerating && (
              <div className="flex items-center gap-2 text-xs text-[#666666] bg-white border border-[#E2E6ED] p-2.5 rounded-xl w-fit">
                <Sparkles size={12} className="text-[#2563EB] animate-spin" />
                <span>Assistant is analyzing your department data...</span>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendChatMessage()
            }}
            className="flex gap-2 pt-3 shrink-0"
          >
            <input
              type="text"
              placeholder={`Ask about ${profile.department} courses, timetable, or attendance...`}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isGenerating}
              className="flex-1 text-xs rounded-xl border border-[#E2E6ED] px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 disabled:opacity-60"
            />
            <Button
              type="submit"
              disabled={!chatInput.trim() || isGenerating}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold px-3.5 h-9 rounded-xl cursor-pointer flex items-center gap-1"
            >
              <Send size={12} />
              Ask
            </Button>
          </form>
        </motion.div>

        {/* Agent 2: Broadcast Synthesizer */}
        <motion.div variants={itemVars} className="glass glow-border rounded-3xl p-6 bg-white border border-[#E2E6ED] flex flex-col justify-between h-[560px]">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="text-[#2563EB]" size={20} />
              <h2 className="text-lg font-semibold text-[#1F1F1F]">Broadcast Synthesizer</h2>
            </div>
            <p className="text-xs text-[#666666] mb-4">Paste raw circulars or notices to extract dates, action items, and audiences instantly.</p>

            <div className="space-y-3">
              <textarea 
                className="w-full h-28 bg-[#F5F6F8] border border-[#E2E6ED] rounded-xl p-3 text-xs text-[#1F1F1F] placeholder:text-[#999999] focus:outline-none focus:border-[#2563EB] resize-none transition-colors"
                placeholder="Paste university circular text here..."
                value={broadcastText}
                onChange={e => setBroadcastText(e.target.value)}
              />
              <Button onClick={handleAnalyze} className="w-full group" disabled={!broadcastText.trim()}>
                Extract Intelligence <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          <div className="bg-[#F5F6F8] rounded-xl p-3.5 border border-[#E2E6ED] mt-3 flex-1 overflow-y-auto">
            {broadcastResult ? (
              <div className="space-y-2.5">
                <div>
                  <h4 className="text-[10px] font-semibold text-[#666666] uppercase tracking-wider mb-0.5">Summary</h4>
                  <p className="text-xs text-[#1F1F1F]">{broadcastResult.summary}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold text-[#666666] uppercase">Key Dates:</span>
                    <p className="text-xs text-[#2563EB] font-medium truncate">
                      {broadcastResult.extracted_dates.join(', ') || 'None found'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#666666] uppercase">Locations:</span>
                    <p className="text-xs text-emerald-700 font-medium truncate">
                      {broadcastResult.extracted_locations.join(', ') || 'None found'}
                    </p>
                  </div>
                </div>

                {broadcastResult.action_items.length > 0 && (
                  <div>
                    <span className="text-[10px] font-semibold text-[#666666] uppercase">Action Items:</span>
                    <ul className="text-xs text-[#1F1F1F] space-y-0.5 list-disc list-inside">
                      {broadcastResult.action_items.slice(0, 2).map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                )}
                
                <div className="flex gap-2 pt-2 border-t border-[#E2E6ED]">
                  <span className="text-[10px] bg-white border border-[#E2E6ED] px-2 py-0.5 rounded text-[#666666]">Cat: {broadcastResult.suggested_category}</span>
                  {broadcastResult.is_urgent && <span className="text-[10px] bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-rose-700">Urgent</span>}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#666666]">
                Analysis results will appear here
              </div>
            )}
          </div>
        </motion.div>

        {/* Bottom Row: StudyFlow Synthesizer and Attendance Guardian */}
        {/* Agent 3: StudyFlow Synthesizer */}
        <motion.div variants={itemVars} className="glass glow-border rounded-3xl p-6 bg-white border border-[#E2E6ED] flex flex-col h-[560px]">
          <div className="flex items-center gap-3 mb-2 shrink-0">
            <BookOpen className="text-[#2563EB]" size={20} />
            <h2 className="text-lg font-semibold text-[#1F1F1F]">StudyFlow Synthesizer</h2>
          </div>
          <p className="text-xs text-[#666666] mb-4 shrink-0">Breaks down {profile.department} assignments into manageable milestone plans.</p>

          <div className="space-y-3 overflow-y-auto flex-1 pr-1">
            {studyPlans.length > 0 ? (
              studyPlans.map(plan => {
                const assignment = assignments.find(a => a.id === plan.assignment_id)
                if (!assignment) return null
                return (
                  <div key={plan.assignment_id} className="bg-[#F5F6F8] border border-[#E2E6ED] rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-[#1F1F1F] text-sm">{assignment.title}</span>
                      <span className="text-[10px] text-[#2563EB] font-semibold whitespace-nowrap bg-[#DCE7F8] px-2 py-0.5 rounded border border-[#B8CCF0]">
                        ~<AnimatedCounter value={plan.total_hours} decimals={1} /> hrs
                      </span>
                    </div>
                    <p className="text-xs text-amber-700 font-medium mb-2">{plan.urgency_label}</p>
                    <div className="space-y-1.5 border-t border-[#E2E6ED] pt-2">
                      {plan.milestones.map(m => (
                        <div key={m.id} className="flex justify-between items-center text-xs">
                          <span className="text-[#666666] truncate pr-2">{m.label}</span>
                          <span className="text-[#1F1F1F] font-mono shrink-0">{m.estimated_hours}h</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#666666]">
                No pending assignments found for {profile.department}.
              </div>
            )}
          </div>
        </motion.div>

        {/* Agent 4: Attendance Guardian (now replaced into bottom position) */}
        <motion.div variants={itemVars} className="glass glow-border rounded-3xl p-6 bg-white border border-[#E2E6ED] flex flex-col h-[560px]">
          <div className="flex items-center gap-3 mb-2 shrink-0">
            <ShieldCheck className="text-emerald-600" size={20} />
            <h2 className="text-lg font-semibold text-[#1F1F1F]">Attendance Guardian</h2>
          </div>
          <p className="text-xs text-[#666666] mb-4 shrink-0">Predicts attendance trajectories and synthesizes recovery plans for your enrolled subjects.</p>
          
          <div className="space-y-3 overflow-y-auto flex-1 pr-1">
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
      </div>
    </motion.div>
  )
}
