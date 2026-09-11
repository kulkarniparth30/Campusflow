import { Pin, Sparkles, Megaphone, CalendarDays, MapPin, ListTodo, GraduationCap, BookOpen, Tag } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { useNoticesQuery } from '../../hooks/useNoticesQuery'
import { tagNotice } from '../../lib/notice-tagger'
import { supabaseConfigured } from '../../lib/supabase'
import type { Notice, NoticeCategory, BroadcastAnalysis, Subject } from '../../types'
import { analyzeBroadcast } from '../../lib/agents/broadcastSynthesizer'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardHint, CardHeader, CardTitle } from '../ui/card'
import { Input, Textarea } from '../ui/input'
import { useToast } from '../ui/toast'
import { cn } from '../../lib/utils'
import { useAuth } from '../../hooks/useAuth'
import { useCampusStore } from '../../store/campus'

const tone: Record<string, 'crimson' | 'amber' | 'violet' | 'indigo'> = {
  urgent: 'crimson',
  exam: 'amber',
  event: 'violet',
  academic: 'indigo',
}

export function NoticePublisher({
  notices,
  onPublish,
  subjects: propSubjects,
}: {
  notices: Notice[]
  onPublish: (
    title: string,
    body: string,
    category?: NoticeCategory,
    isPinned?: boolean,
    audience?: any,
    extra?: {
      facultyName?: string
      subjectId?: string
      subjectCode?: string
      subjectName?: string
      topic?: string
    }
  ) => void
  subjects?: Subject[]
}) {
  const { profile, role } = useAuth()
  const storeSubjects = useCampusStore((s) => s.subjects)
  const allSubjects = propSubjects ?? storeSubjects

  const relevantSubjects = useMemo(() => {
    if (role === 'faculty' && profile) {
      const assigned = allSubjects.filter((s) => s.faculty_id === profile.id)
      return assigned.length > 0 ? assigned : allSubjects
    }
    return allSubjects
  }, [allSubjects, role, profile])

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'auto' | NoticeCategory>('auto')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [topic, setTopic] = useState<string>('')
  const [isPinned, setIsPinned] = useState(false)
  const [departments, setDepartments] = useState<string[]>([])
  const [semesterStr, setSemesterStr] = useState('')
  const [analysis, setAnalysis] = useState<BroadcastAnalysis | null>(null)
  
  const { toast } = useToast()

  const predicted = useMemo(() => tagNotice(title, body), [title, body])
  const activeCategory: NoticeCategory = selectedCategory === 'auto' ? predicted : selectedCategory

  const remote = useNoticesQuery()
  const feed = supabaseConfigured ? (remote.data ?? notices) : notices

  const handleAIAssist = () => {
    if (!body.trim()) {
      toast('Please enter some content in the body to analyze.', 'error')
      return
    }
    const result = analyzeBroadcast(body)
    setAnalysis(result)
    
    // Auto-fill fields based on analysis
    if (!title && result.summary) setTitle(result.summary)
    setSelectedCategory(result.suggested_category)
    if (result.is_urgent) setIsPinned(true)
    if (result.suggested_audience.departments) {
      setDepartments(result.suggested_audience.departments)
    }
    if (result.suggested_audience.semesters) {
      setSemesterStr(result.suggested_audience.semesters.join(', '))
    }
    
    toast('AI synthesis complete! Form populated.', 'success')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    
    const audience = {
      departments: departments.length > 0 ? departments : undefined,
      semesters: semesterStr ? semesterStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)) : undefined,
    }

    const selectedSub = allSubjects.find((s) => s.id === selectedSubjectId)
    const extra = {
      facultyName: profile?.full_name,
      subjectId: selectedSub?.id,
      subjectCode: selectedSub?.code,
      subjectName: selectedSub?.name,
      topic: topic.trim() || undefined,
    }
    
    onPublish(title, body, activeCategory, isPinned, audience, extra)
    setTitle('')
    setBody('')
    setTopic('')
    setSelectedSubjectId('')
    setIsPinned(false)
    setSelectedCategory('auto')
    setDepartments([])
    setSemesterStr('')
    setAnalysis(null)
    toast('Notice broadcasted successfully with faculty attribution!', 'success')
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  }

  const DEPARTMENTS = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'All']

  const toggleDept = (dept: string) => {
    if (dept === 'All') {
      setDepartments(['All'])
      return
    }
    setDepartments(prev => {
      const filtered = prev.filter(p => p !== 'All')
      if (filtered.includes(dept)) return filtered.filter(p => p !== dept)
      return [...filtered, dept]
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="bg-white/90 backdrop-blur-md border-[#E2E6ED] shadow-sm h-fit">
        <CardHeader>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-[#1F1F1F]">Smart Notice Publisher</CardTitle>
              <Megaphone size={16} className="text-[#2563EB]" />
            </div>
            <CardHint className="text-[#666666]">Draft and broadcast official notices with faculty attribution and AI synthesis.</CardHint>
          </div>
          <div className="flex items-center gap-1.5">
            {selectedCategory === 'auto' && (
              <span className="flex items-center text-[10px] text-[#666666] gap-1">
                <Sparkles size={11} className="text-[#2563EB]" /> Auto:
              </span>
            )}
            <Badge tone={tone[activeCategory]}>{activeCategory}</Badge>
          </div>
        </CardHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Author Attribution Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#DCE7F8]/50 border border-[#B8CCF0] text-xs">
            <div className="flex items-center gap-2">
              <GraduationCap size={16} className="text-[#2563EB]" />
              <span className="text-[#1F1F1F]">
                Author: <strong className="text-[#2563EB]">{profile?.full_name ?? 'Faculty Member'}</strong>
              </span>
            </div>
            <Badge tone="cyan" className="text-[10px]">
              {role === 'faculty' ? 'Faculty Broadcaster' : 'Institutional Admin'}
            </Badge>
          </div>

          {/* Title */}
          <div>
            <Input
              placeholder="Notice Title (e.g. Mid-Term Lab Exam Seating Arrangement)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#F5F6F8] border-[#E2E6ED] text-[#1F1F1F]"
            />
          </div>

          {/* Subject and Topic Selectors */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[#666666] mb-1">Course / Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full h-9 rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] px-2 text-xs text-[#1F1F1F] outline-none focus:border-[#2563EB]"
              >
                <option value="">General Circular (All)</option>
                {relevantSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} · {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[#666666] mb-1">Topic / Syllabus Module</label>
              <Input
                placeholder="e.g. Graph Algorithms / Quiz 2"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="h-9 text-xs bg-[#F5F6F8] border-[#E2E6ED] text-[#1F1F1F]"
              />
            </div>
          </div>

          <div className="relative">
            <Textarea
              placeholder="Paste raw announcement text here... (Click AI Assist to synthesize)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="bg-[#F5F6F8] border-[#E2E6ED] text-[#1F1F1F]"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-white/80 border-[#E2E6ED] backdrop-blur text-xs text-[#1F1F1F]"
              onClick={handleAIAssist}
            >
              <Sparkles size={13} className="text-amber-500" /> AI Assist
            </Button>
          </div>

          {analysis && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 rounded-xl bg-[#F5F6F8] border border-[#E2E6ED] p-3 text-xs">
              <p className="font-semibold text-[#1F1F1F]">AI Extracted Details:</p>
              {analysis.extracted_dates.length > 0 && (
                <div className="flex gap-2 text-[#666666]">
                  <CalendarDays size={14} className="text-emerald-600" /> 
                  <span>Dates: {analysis.extracted_dates.join(', ')}</span>
                </div>
              )}
              {analysis.extracted_locations.length > 0 && (
                <div className="flex gap-2 text-[#666666]">
                  <MapPin size={14} className="text-indigo-600" /> 
                  <span>Locations: {analysis.extracted_locations.join(', ')}</span>
                </div>
              )}
              {analysis.action_items.length > 0 && (
                <div className="flex gap-2 text-[#666666]">
                  <ListTodo size={14} className="text-amber-600" /> 
                  <span>Actions: {analysis.action_items.join(' | ')}</span>
                </div>
              )}
            </motion.div>
          )}

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#666666] mb-1">Category Override</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as 'auto' | NoticeCategory)}
                className="w-full h-9 rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] px-2 text-xs text-[#1F1F1F] outline-none focus:border-[#2563EB]"
              >
                <option value="auto">Auto-detect ({predicted})</option>
                <option value="academic">Academic</option>
                <option value="exam">Exam</option>
                <option value="urgent">Urgent</option>
                <option value="event">Event</option>
              </select>
            </div>
            <div>
              <label className="block text-[#666666] mb-1">Semesters (Comma separated)</label>
              <Input
                placeholder="e.g. 1, 2, 3"
                value={semesterStr}
                onChange={(e) => setSemesterStr(e.target.value)}
                className="h-9 text-xs bg-[#F5F6F8] border-[#E2E6ED] text-[#1F1F1F]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#666666] mb-2 text-xs">Target Departments</label>
            <div className="flex flex-wrap gap-2">
              {DEPARTMENTS.map(dept => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => toggleDept(dept)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors border cursor-pointer",
                    departments.includes(dept) 
                      ? "bg-[#DCE7F8] border-[#B8CCF0] text-[#2563EB]" 
                      : "bg-[#F5F6F8] border-[#E2E6ED] text-[#666666] hover:bg-white"
                  )}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#E2E6ED]">
            <label className="flex items-center gap-2 text-sm text-[#1F1F1F] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="hidden"
              />
              <div className={cn("p-1.5 rounded-lg transition-colors", isPinned ? "bg-amber-100" : "bg-[#F5F6F8]")}>
                <Pin size={16} className={isPinned ? 'text-amber-600' : 'text-[#666666]'} />
              </div>
              <span className={isPinned ? 'text-amber-600 font-medium' : 'text-[#666666]'}>
                {isPinned ? 'Pinned to Feed' : 'Pin to Top'}
              </span>
            </label>
            <Button type="submit" className="bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-bold shadow-md shadow-[#2563EB]/20">Broadcast Notice</Button>
          </div>
        </form>

        {title && body && (
          <div className="mt-6 border-t border-[#E2E6ED] pt-4">
            <h4 className="text-xs font-semibold text-[#666666] mb-3 uppercase tracking-wider">Live Broadcast Preview</h4>
            <div className="rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {isPinned && (
                    <span className="flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                      <Pin size={10} /> Pinned
                    </span>
                  )}
                  <p className="text-sm font-semibold text-[#1F1F1F]">{title}</p>
                </div>
                <Badge tone={tone[activeCategory]}>{activeCategory}</Badge>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px]">
                <span className="inline-flex items-center gap-1 text-[#2563EB] font-medium bg-[#DCE7F8] border border-[#B8CCF0] px-2 py-0.5 rounded-md">
                  <GraduationCap size={11} className="text-[#2563EB]" />
                  {profile?.full_name}
                </span>
                {selectedSubjectId && (
                  <span className="inline-flex items-center gap-1 text-indigo-700 font-mono bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                    <BookOpen size={10} className="text-indigo-600" />
                    {allSubjects.find((s) => s.id === selectedSubjectId)?.code}
                  </span>
                )}
                {topic.trim() && (
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    <Tag size={10} className="text-emerald-600" />
                    Topic: {topic.trim()}
                  </span>
                )}
              </div>

              <p className="mt-2 text-xs leading-relaxed text-[#1F1F1F] whitespace-pre-wrap">{body}</p>
            </div>
          </div>
        )}
      </Card>

      <Card className="bg-white/90 backdrop-blur-md border-[#E2E6ED] shadow-sm h-fit max-h-[85vh] flex flex-col">
        <CardHeader className="shrink-0">
          <div>
            <CardTitle className="text-[#1F1F1F]">Live Campus Feed ({feed.length})</CardTitle>
            <CardHint className="text-[#666666]">Priority broadcast stream for students and faculty.</CardHint>
          </div>
        </CardHeader>
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-3 overflow-y-auto pr-2 pb-2 flex-1"
        >
          {feed.map((n) => (
            <motion.div
              variants={itemVariants}
              key={n.id}
              className="rounded-xl border border-[#E2E6ED] bg-[#F5F6F8]/60 p-4 hover:border-[#B8CCF0] transition-all space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {n.is_pinned && (
                    <span className="flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                      <Pin size={10} /> Pinned
                    </span>
                  )}
                  <p className="text-sm font-semibold text-[#1F1F1F]">{n.title}</p>
                </div>
                <Badge tone={tone[n.category]}>{n.category}</Badge>
              </div>

              {(n.faculty_name || n.subject_code || n.topic) && (
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  {n.faculty_name && (
                    <span className="inline-flex items-center gap-1 text-[#2563EB] font-medium bg-[#DCE7F8] border border-[#B8CCF0] px-2 py-0.5 rounded-md">
                      <GraduationCap size={11} className="text-[#2563EB]" />
                      {n.faculty_name}
                    </span>
                  )}
                  {n.subject_code && (
                    <span className="inline-flex items-center gap-1 text-indigo-700 font-mono bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                      <BookOpen size={10} className="text-indigo-600" />
                      {n.subject_code} {n.subject_name ? `· ${n.subject_name}` : ''}
                    </span>
                  )}
                  {n.topic && (
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      <Tag size={10} className="text-emerald-600" />
                      {n.topic}
                    </span>
                  )}
                </div>
              )}

              <p className="mt-2 text-xs leading-relaxed text-[#666666] line-clamp-3">{n.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </Card>
    </div>
  )
}
