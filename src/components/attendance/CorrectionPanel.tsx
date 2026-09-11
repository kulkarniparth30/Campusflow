import { format, parseISO } from 'date-fns'
import { useState } from 'react'
import type { AttendanceRecord, CorrectionRequest, Profile, Role, Subject } from '../../types'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardHint, CardHeader, CardTitle } from '../ui/card'
import { Textarea } from '../ui/input'
import { FileQuestion, MessageSquareCheck, User, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../ui/toast'
import { cn } from '../../lib/utils'

export function CorrectionPanel({
  role,
  records,
  requests,
  subjects,
  students = [],
  onSubmit,
  onReview,
}: {
  role: Role
  records: AttendanceRecord[]
  requests: CorrectionRequest[]
  subjects: Subject[]
  students?: Profile[]
  onSubmit: (recordId: string, reason: string) => void
  onReview: (id: string, status: 'approved' | 'rejected', note: string) => void
}) {
  const absences = records.filter((r) => r.status === 'absent')
  const [selectedRecordId, setSelectedRecordId] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  
  const { toast } = useToast()

  const activeRecordId = selectedRecordId || absences[0]?.id || ''

  const subjectOf = (id: string) => {
    const rec = records.find((r) => r.id === id)
    return subjects.find((s) => s.id === rec?.subject_id)
  }

  const studentOf = (studentId: string) => {
    return students.find((s) => s.id === studentId)
  }

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeRecordId || !reason.trim()) {
      toast('Please provide a reason for correction.', 'error')
      return
    }
    onSubmit(activeRecordId, reason)
    setReason('')
    toast('Correction request submitted to faculty!', 'success')
  }

  const handleReviewAction = (requestId: string, status: 'approved' | 'rejected') => {
    const note = notes[requestId] || ''
    onReview(requestId, status, note)
    setNotes((prev) => {
      const next = { ...prev }
      delete next[requestId]
      return next
    })
    toast(`Request ${status} successfully.`, status === 'approved' ? 'success' : 'error')
    setExpandedId(null)
  }

  const filteredRequests = requests.filter(r => activeTab === 'all' || r.status === activeTab)

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95 }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 items-start">
      {role === 'student' && (
        <Card className="bg-white/90 backdrop-blur-md border-[#E2E6ED] shadow-sm sticky top-4">
          <CardHeader>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-[#1F1F1F]">Request Attendance Correction</CardTitle>
                <FileQuestion size={18} className="text-[#2563EB]" />
              </div>
              <CardHint className="text-[#666666]">Submit medical proof or official reason to your course faculty.</CardHint>
            </div>
          </CardHeader>

          {absences.length === 0 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <CheckCircle2 size={32} className="mx-auto mb-3 text-emerald-600 opacity-50" />
              <p className="text-sm text-emerald-700 font-medium">No pending corrections — all clear!</p>
              <p className="text-xs text-emerald-600 mt-1">Your attendance records are looking great.</p>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleStudentSubmit}>
              <div>
                <label className="block text-xs font-medium text-[#666666] mb-2">Select Absent Session</label>
                <select
                  className="h-10 w-full rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] px-3 text-sm text-[#1F1F1F] outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                  value={activeRecordId}
                  onChange={(e) => setSelectedRecordId(e.target.value)}
                >
                  {absences.map((r) => (
                    <option key={r.id} value={r.id} className="bg-white text-[#1F1F1F]">
                      {subjectOf(r.id)?.code} ({subjectOf(r.id)?.name}) · {r.session_date}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#666666] mb-2">Reason / Explanation</label>
                <Textarea
                  placeholder="e.g. Attended Hackathon Finals with Dean permission / Medical leave slip submitted to HOD."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="bg-[#F5F6F8] border-[#E2E6ED] text-[#1F1F1F] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-[#666666]">Updates attendance upon faculty approval</span>
                <Button type="submit" className="bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-bold shadow-md shadow-[#2563EB]/20">Submit Request</Button>
              </div>
            </form>
          )}
        </Card>
      )}

      <Card className={cn("bg-white/90 backdrop-blur-md border-[#E2E6ED] shadow-sm", role === 'student' ? '' : 'lg:col-span-2')}>
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-[#1F1F1F]">{role === 'student' ? 'Your Correction Requests' : 'Faculty Verification Queue'}</CardTitle>
                <MessageSquareCheck size={18} className="text-[#2563EB]" />
              </div>
              <CardHint className="text-[#666666]">
                {role === 'student'
                  ? 'Track status of your submitted review requests.'
                  : 'Review, comment on, and approve or reject student correction requests.'}
              </CardHint>
            </div>
            
            <div className="flex bg-[#F5F6F8] border border-[#E2E6ED] rounded-lg p-1 shrink-0 self-start">
              {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors cursor-pointer",
                    activeTab === tab 
                      ? "bg-[#2563EB] text-white shadow-sm" 
                      : "text-[#666666] hover:text-[#1F1F1F] hover:bg-white"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        {filteredRequests.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center">
             <CheckCircle2 size={32} className="mb-3 text-[#666666] opacity-50" />
            <p className="text-sm font-medium text-[#666666]">No {activeTab !== 'all' ? activeTab : ''} requests found.</p>
            <p className="text-xs text-[#666666] mt-1">The queue is currently empty.</p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4 mt-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredRequests.map((c) => {
                const rec = records.find((r) => r.id === c.attendance_record_id)
                const student = studentOf(c.student_id)
                const currentNote = notes[c.id] || ''
                const isExpanded = expandedId === c.id

                return (
                  <motion.div
                    layout
                    variants={itemVariants}
                    key={c.id}
                    className={cn(
                      "rounded-xl border p-4 transition-all overflow-hidden",
                      c.status === 'pending' ? 'bg-[#F5F6F8] border-[#E2E6ED] hover:border-[#B8CCF0]' :
                      c.status === 'approved' ? 'bg-emerald-50 border-emerald-200' :
                      'bg-red-50 border-red-200'
                    )}
                  >
                    <div 
                      className="flex items-start justify-between gap-4 cursor-pointer"
                      onClick={() => toggleExpand(c.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-sm font-semibold text-[#1F1F1F]">
                            {subjectOf(c.attendance_record_id)?.code}
                          </p>
                          <span className="text-[#666666] text-xs px-1.5 py-0.5 rounded bg-white border border-[#E2E6ED]">
                            {rec?.session_date}
                          </span>
                          {student && (
                            <span className="flex items-center gap-1 rounded bg-[#DCE7F8] px-2 py-0.5 text-[11px] text-[#2563EB] font-mono">
                              <User size={11} /> {student.full_name} ({student.roll_no})
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#666666]">
                          {subjectOf(c.attendance_record_id)?.name}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Badge
                          tone={
                            c.status === 'approved'
                              ? 'emerald'
                              : c.status === 'rejected'
                                ? 'crimson'
                                : 'amber'
                          }
                        >
                          {c.status}
                        </Badge>
                        <button className="text-[#666666] hover:text-[#1F1F1F] p-1 rounded-md hover:bg-white transition-colors">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pt-4 mt-4 border-t border-[#E2E6ED] space-y-4"
                        >
                          <div className="rounded-lg bg-white p-3 text-sm text-[#1F1F1F] border border-[#E2E6ED]">
                            <span className="text-[#666666] font-semibold block mb-1.5 text-[10px] uppercase tracking-wider">
                              Student Reason
                            </span>
                            <p className="leading-relaxed">{c.reason}</p>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-[#666666]">
                            <span>Requested: {format(parseISO(c.created_at), 'd MMM yyyy, h:mm a')}</span>
                          </div>

                          {role !== 'student' && c.status === 'pending' && (
                            <div className="flex flex-col gap-3 pt-2">
                              <Textarea
                                className="h-20 w-full rounded-xl border border-[#E2E6ED] bg-white px-3 py-2 text-sm text-[#1F1F1F] outline-none focus:border-[#2563EB] transition-all"
                                placeholder="Add faculty verification remark (e.g. Verified with medical center)..."
                                value={currentNote}
                                onChange={(e) =>
                                  setNotes((prev) => ({ ...prev, [c.id]: e.target.value }))
                                }
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="danger"
                                  onClick={(e) => { e.stopPropagation(); handleReviewAction(c.id, 'rejected') }}
                                >
                                  Reject
                                </Button>
                                <Button
                                  variant="success"
                                  onClick={(e) => { e.stopPropagation(); handleReviewAction(c.id, 'approved') }}
                                >
                                  Approve & Mark Present
                                </Button>
                              </div>
                            </div>
                          )}

                          {c.faculty_note && (
                            <div className="rounded-lg bg-[#DCE7F8]/50 border border-[#B8CCF0] p-3">
                              <span className="text-[#2563EB] font-semibold block mb-1 text-[10px] uppercase tracking-wider">
                                Faculty Remark
                              </span>
                              <p className="text-sm text-[#1F1F1F]">{c.faculty_note}</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </Card>
    </div>
  )
}
