import { format, parseISO, differenceInCalendarDays } from 'date-fns'
import { useMemo, useState } from 'react'
import type { Assignment, Notice, Subject } from '../../types'
import { Badge } from '../ui/badge'
import { Card, CardHint, CardHeader, CardTitle } from '../ui/card'
import { Calendar, SearchX } from 'lucide-react'
import { motion } from 'framer-motion'

type Filter = 'all' | 'exam' | 'assignment' | 'event'

export function AcademicTimeline({
  assignments,
  notices,
  subjects,
}: {
  assignments: Assignment[]
  notices: Notice[]
  subjects: Subject[]
}) {
  const [filter, setFilter] = useState<Filter>('all')

  const getCountdownText = (dateStr: string) => {
    const diff = +new Date(dateStr) - +new Date()
    if (diff <= 0) return 'Due Today'
    const d = Math.floor(diff / (1000 * 60 * 60 * 24))
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24)
    const m = Math.floor((diff / 1000 / 60) % 60)
    if (d > 0) return `${d}d ${h}h`
    if (h > 0) return `${h}h ${m}m`
    return `${m}m left`
  }

  const items = useMemo(() => {
    const subjectName = (id: string | null) => subjects.find((s) => s.id === id)?.code ?? 'Campus'
    const now = new Date()

    const rows = [
      ...assignments.map((a) => {
        const days = differenceInCalendarDays(new Date(a.due_at), now)
        return {
          id: a.id,
          at: a.due_at,
          title: a.title,
          desc: a.description,
          meta: `${subjectName(a.subject_id)}`,
          kind: a.kind as Filter,
          daysLeft: days,
          liveCountdown: getCountdownText(a.due_at),
          faculty: undefined as string | undefined,
          topic: undefined as string | undefined
        }
      }),
      ...notices
        .filter((n) => n.event_at)
        .map((n) => {
          const days = differenceInCalendarDays(new Date(n.event_at as string), now)
          return {
            id: n.id,
            at: n.event_at as string,
            title: n.title,
            desc: n.body,
            meta: n.subject_code ? `${n.subject_code} · ${n.category.toUpperCase()}` : n.category.toUpperCase(),
            kind: (n.category === 'event' ? 'event' : n.category === 'exam' ? 'exam' : 'event') as Filter,
            daysLeft: days,
            liveCountdown: getCountdownText(n.event_at as string),
            faculty: n.faculty_name,
            topic: n.topic
          }
        }),
    ].sort((a, b) => +new Date(a.at) - +new Date(b.at))

    return filter === 'all' ? rows : rows.filter((r) => r.kind === filter)
  }, [assignments, notices, filter, subjects])

  const pills: Filter[] = ['all', 'exam', 'assignment', 'event']

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>Unified Academic Timeline</CardTitle>
            <Badge tone="indigo">Timeline</Badge>
          </div>
          <CardHint>Synchronized schedule of exams, assignment submissions, and campus events.</CardHint>
        </div>
      </CardHeader>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {pills.map((p) => (
          <button
            key={p}
            onClick={() => setFilter(p)}
            className={`rounded-xl px-3 py-1 text-xs capitalize transition-all cursor-pointer ${
              filter === p
                ? 'bg-indigo-500 font-medium text-white shadow-[0_0_12px_rgba(99,102,241,0.5)]'
                : 'bg-white/6 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="relative flex-1 overflow-y-auto pl-5 ml-2 pr-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-2 opacity-60">
            <SearchX size={32} className="text-zinc-600" />
            <p className="text-sm">No upcoming {filter !== 'all' ? filter + 's' : 'events'} found.</p>
          </div>
        ) : (
          <div className="relative space-y-4">
            {/* Connecting Track Line */}
            <div className="absolute left-[3px] top-2 bottom-4 w-px bg-gradient-to-b from-indigo-500/50 via-white/10 to-transparent" />
            
            {items.map((item, i) => {
              const isExam = item.kind === 'exam'
              const isEvent = item.kind === 'event'
              const tone = isExam ? 'crimson' : isEvent ? 'violet' : 'indigo'
              
              const nodeColor = isExam
                ? 'bg-red-400 shadow-[0_0_12px_#f87171]'
                : isEvent
                  ? 'bg-violet-400 shadow-[0_0_12px_#a78bfa]'
                  : 'bg-indigo-400 shadow-[0_0_12px_#818cf8]'

              const trackColorClass = isExam ? 'bg-red-400' : isEvent ? 'bg-violet-400' : 'bg-indigo-400'
              const isUpcoming = item.daysLeft <= 3

              return (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={item.id} 
                  className="relative group"
                >
                  {/* Timeline Node */}
                  <div className="absolute -left-[23px] top-2 flex items-center justify-center h-4 w-4">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${nodeColor} transition-transform group-hover:scale-125 z-10`}
                    />
                    {isUpcoming && (
                      <span className={`absolute h-4 w-4 rounded-full ${trackColorClass} opacity-40 animate-ping`} />
                    )}
                  </div>

                  <div className="rounded-xl border border-white/6 bg-white/3 p-3 transition-all hover:border-white/12 hover:bg-white/6 ml-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                        <Calendar size={12} className="text-indigo-400" />
                        {format(parseISO(item.at), 'EEE, d MMM · h:mm a')}
                      </span>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold font-mono ${
                          item.daysLeft <= 2
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-white/8 text-zinc-400'
                        }`}
                      >
                        {item.liveCountdown}
                      </span>
                    </div>

                    <p className="mt-1 text-sm font-semibold text-zinc-100">{item.title}</p>
                    {item.desc && (
                      <p className="mt-0.5 text-xs text-zinc-400 line-clamp-1">{item.desc}</p>
                    )}

                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <Badge tone={tone}>{item.kind}</Badge>
                      <span className="text-[11px] text-zinc-500 font-mono">{item.meta}</span>
                      {item.faculty && (
                        <span className="text-[10px] text-cyan-400 font-medium">· Prof. {item.faculty}</span>
                      )}
                      {item.topic && (
                        <span className="text-[10px] text-emerald-400 font-medium">· {item.topic}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
}
