import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Subject, TimetableSlot, DayOfWeek } from '../../types'
import { cn } from '../../lib/utils'
import { Clock, MapPin, User, Calendar, BookOpen, FlaskConical, Sparkles, Compass } from 'lucide-react'
import { Badge } from '../ui/badge'

interface TimetableProps {
  slots: TimetableSlot[]
  subjects: Subject[]
}

const DAYS: { id: DayOfWeek; label: string; short: string }[] = [
  { id: 'mon', label: 'Monday', short: 'Mon' },
  { id: 'tue', label: 'Tuesday', short: 'Tue' },
  { id: 'wed', label: 'Wednesday', short: 'Wed' },
  { id: 'thu', label: 'Thursday', short: 'Thu' },
  { id: 'fri', label: 'Friday', short: 'Fri' },
  { id: 'sat', label: 'Saturday', short: 'Sat' },
]

const TIMES = [
  '09:00', '10:15', '11:30', '14:00'
]

export function Timetable({ slots, subjects }: TimetableProps) {
  const currentDayIndex = new Date().getDay() - 1 // 0 for Mon, 5 for Sat
  const todayId: DayOfWeek | null = currentDayIndex >= 0 && currentDayIndex <= 5 ? DAYS[currentDayIndex].id : null

  const [selectedDay, setSelectedDay] = useState<DayOfWeek | 'all'>(todayId || 'mon')

  // Subject lookup
  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>()
    subjects.forEach((s) => map.set(s.id, s))
    return map
  }, [subjects])

  // Filter slots for the selected day
  const daySlots = useMemo(() => {
    if (selectedDay === 'all') return slots
    return slots
      .filter((s) => s.day === selectedDay)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }, [slots, selectedDay])

  // Check if a slot is currently in session right now
  const isNowInSession = (slot: TimetableSlot) => {
    if (slot.day !== todayId) return false
    const now = new Date()
    const curHour = now.getHours()
    const curMin = now.getMinutes()
    const curTotal = curHour * 60 + curMin

    const [sHour, sMin] = slot.start_time.split(':').map(Number)
    const [eHour, eMin] = slot.end_time.split(':').map(Number)
    const startTotal = sHour * 60 + sMin
    const endTotal = eHour * 60 + eMin

    return curTotal >= startTotal && curTotal <= endTotal
  }

  const getTypeBadge = (type?: string) => {
    if (type === 'lab') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
          <FlaskConical size={10} /> Practical Lab
        </span>
      )
    }
    if (type === 'tutorial') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <BookOpen size={10} /> Tutorial
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
        <BookOpen size={10} /> Theory Lecture
      </span>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls & Day Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 glass rounded-2xl p-3 border border-white/10">
        <div className="flex items-center flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedDay('all')}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
              selectedDay === 'all'
                ? "bg-cyan-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            All Days Matrix
          </button>

          {DAYS.map((d) => {
            const isToday = d.id === todayId
            const isSelected = selectedDay === d.id
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDay(d.id)}
                className={cn(
                  "relative px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5",
                  isSelected
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                    : isToday
                    ? "text-cyan-400 border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20"
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                <span>{d.short}</span>
                {isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" title="Today" />
                )}
              </button>
            )
          })}
        </div>

        {todayId && (
          <button
            onClick={() => setSelectedDay(todayId)}
            className="flex items-center gap-1.5 text-xs text-cyan-300 font-medium px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all cursor-pointer"
          >
            <Compass size={13} />
            Jump to Today ({DAYS.find((d) => d.id === todayId)?.short})
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {selectedDay !== 'all' ? (
          /* Single Day Focus Timeline */
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  {DAYS.find((d) => d.id === selectedDay)?.label} Schedule
                </h3>
                {selectedDay === todayId && (
                  <Badge tone="cyan" className="text-[10px]">Today</Badge>
                )}
              </div>
              <span className="text-xs text-zinc-400 font-mono">
                {daySlots.length} scheduled period{daySlots.length === 1 ? '' : 's'}
              </span>
            </div>

            {daySlots.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center text-zinc-500">
                <Clock size={32} className="mx-auto mb-2 opacity-50 text-cyan-400" />
                <p className="text-sm font-medium text-zinc-300">No scheduled sessions for this day</p>
                <p className="text-xs text-zinc-500 mt-1">Enjoy your study break or project sprint.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {daySlots.map((slot) => {
                  const subject = subjectMap.get(slot.subject_id)
                  const inSession = isNowInSession(slot)

                  return (
                    <motion.div
                      key={slot.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl border transition-all",
                        inSession
                          ? "bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                          : "glass border-white/10 hover:border-cyan-500/30 hover:bg-white/5"
                      )}
                    >
                      {/* Left: Time & Subject info */}
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900 border border-white/10 shrink-0 min-w-[95px]">
                          <span className="text-xs font-mono font-bold text-cyan-300">{slot.start_time}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">to</span>
                          <span className="text-xs font-mono text-zinc-400">{slot.end_time}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="px-2 py-0.5 rounded-md text-xs font-bold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              {subject?.code || 'CS'}
                            </span>
                            <h4 className="text-sm font-bold text-white">{subject?.name || 'Class Session'}</h4>
                            {getTypeBadge(slot.type)}
                            {inSession && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500 text-slate-950 animate-pulse">
                                <Sparkles size={10} /> NOW IN SESSION
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-zinc-400 mt-2 flex-wrap">
                            <span className="flex items-center gap-1 text-zinc-300">
                              <User size={12} className="text-cyan-400" />
                              Faculty: <strong className="text-white">{subject?.faculty_name || 'Dr. Kavya Iyer'}</strong>
                            </span>
                            <span className="flex items-center gap-1 text-zinc-300">
                              <MapPin size={12} className="text-blue-400" />
                              Location: <strong className="text-white">{slot.room}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Min attendance indicator */}
                      {subject && (
                        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                          <div className="text-right">
                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Attendance Target</div>
                            <div className="text-xs font-mono font-bold text-cyan-400">
                              {subject.min_attendance_pct}% Min Required
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>
        ) : (
          /* Full Weekly Matrix View */
          <motion.div
            key="all-matrix"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass glow-border rounded-3xl p-6 overflow-x-auto"
          >
            <div className="min-w-[900px]">
              <div className="grid grid-cols-7 gap-3">
                {/* Header Row */}
                <div className="flex items-center justify-center text-xs font-bold uppercase tracking-wider text-zinc-500 pb-3 border-b border-white/10">
                  Time Slot
                </div>
                {DAYS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDay(d.id)}
                    className={cn(
                      "flex flex-col items-center justify-center pb-3 border-b border-white/10 transition-colors cursor-pointer group",
                      d.id === todayId ? "text-cyan-400 border-cyan-500" : "text-zinc-400 hover:text-white"
                    )}
                  >
                    <span className="text-sm font-bold group-hover:text-cyan-300 transition-colors">{d.label}</span>
                    {d.id === todayId && (
                      <span className="text-[10px] text-cyan-400 font-mono mt-0.5">Today</span>
                    )}
                  </button>
                ))}

                {/* Time Rows */}
                {TIMES.map((time) => (
                  <div className="col-span-7 grid grid-cols-7 gap-3 py-1.5" key={time}>
                    <div className="flex items-center justify-center text-xs font-mono font-bold text-zinc-400 bg-slate-900/50 rounded-xl border border-white/5 py-2">
                      {time}
                    </div>

                    {DAYS.map((d) => {
                      const slot = slots.find((s) => s.day === d.id && s.start_time === time)
                      const subject = slot ? subjectMap.get(slot.subject_id) : null
                      const inSession = slot ? isNowInSession(slot) : false

                      return (
                        <div key={`${d.id}-${time}`} className="min-h-[92px]">
                          {slot && subject ? (
                            <div
                              onClick={() => setSelectedDay(d.id)}
                              className={cn(
                                "h-full rounded-xl border p-2.5 flex flex-col justify-between transition-all cursor-pointer hover:scale-[1.02]",
                                inSession
                                  ? "border-cyan-500 bg-cyan-500/15 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                                  : slot.type === 'lab'
                                  ? "border-cyan-500/20 bg-cyan-950/20 hover:border-cyan-500/40"
                                  : "border-blue-500/20 bg-blue-950/20 hover:border-blue-500/40"
                              )}
                            >
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-bold text-xs text-white">{subject.code}</span>
                                  <span className={cn(
                                    "text-[9px] px-1.5 py-0.2 rounded font-bold uppercase",
                                    slot.type === 'lab' ? "bg-cyan-500/20 text-cyan-300" : "bg-blue-500/20 text-blue-300"
                                  )}>
                                    {slot.type || 'Lec'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-zinc-300 font-medium truncate" title={subject.faculty_name || 'Dr. Kavya Iyer'}>
                                  {subject.faculty_name || 'Dr. Kavya Iyer'}
                                </p>
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-white/5 font-mono">
                                <span>{slot.room}</span>
                                <span>{slot.start_time}-{slot.end_time}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full rounded-xl border border-white/5 bg-black/10 flex items-center justify-center">
                              <span className="text-zinc-700 text-[10px] font-mono">—</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

