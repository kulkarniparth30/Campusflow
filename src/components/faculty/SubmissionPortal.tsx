import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Assignment, Submission, Role, Subject } from '../../types'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useToast } from '../ui/toast'
import { 
  FileUp, 
  Check, 
  Clock, 
  Edit3, 
  PieChart, 
  FileText, 
  Download, 
  ExternalLink, 
  GitBranch, 
  UploadCloud, 
  CheckCircle2, 
  BookOpen, 
  User, 
  RotateCcw,
  Paperclip,
  GraduationCap
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { AnimatedCounter } from '../ui/animated-counter'
import { Badge } from '../ui/badge'
import { useCampusStore } from '../../store/campus'
import { format, parseISO } from 'date-fns'

interface SubmissionPortalProps {
  assignments: Assignment[]
  submissions: Submission[]
  role: Role
  onSubmit: (
    assignmentId: string,
    payload: string | { fileUrl?: string | null; fileName?: string | null; fileSize?: string | null; repoUrl?: string | null }
  ) => void
  onGrade: (submissionId: string, grade: number, feedback: string) => void
  subjects?: Subject[]
}

export function SubmissionPortal({ 
  assignments, 
  submissions, 
  role, 
  onSubmit, 
  onGrade,
  subjects: propSubjects 
}: SubmissionPortalProps) {
  const storeSubjects = useCampusStore((s) => s.subjects)
  const subjects = propSubjects || storeSubjects

  const { toast } = useToast()
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | 'all'>('all')
  const [resubmittingId, setResubmittingId] = useState<string | null>(null)

  // Per-assignment submission form states
  const [submissionType, setSubmissionType] = useState<Record<string, 'file' | 'repo'>>({})
  const [repoUrls, setRepoUrls] = useState<Record<string, string>>({})
  const [attachedFiles, setAttachedFiles] = useState<Record<string, { name: string; size: string }>>({})

  // Faculty grading states
  const [grades, setGrades] = useState<Record<string, { grade: string; feedback: string }>>({})

  // Subject lookup map
  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>()
    subjects.forEach((s) => map.set(s.id, s))
    return map
  }, [subjects])

  // Filter assignments based on subject selection
  const filteredAssignments = useMemo(() => {
    if (selectedSubjectId === 'all') return assignments
    return assignments.filter((a) => a.subject_id === selectedSubjectId)
  }, [assignments, selectedSubjectId])

  // Quick stats
  const stats = useMemo(() => {
    const total = assignments.length
    const submittedCount = submissions.length
    const gradedCount = submissions.filter((s) => s.grade !== null).length
    return { total, submittedCount, gradedCount }
  }, [assignments, submissions])

  const handleSimulatedFileUpload = (aId: string, sampleName?: string) => {
    const defaultName = sampleName || `${aId}_coursework_submission.pdf`
    setAttachedFiles((prev) => ({
      ...prev,
      [aId]: { name: defaultName, size: '2.4 MB' },
    }))
    toast(`Attached ${defaultName} (2.4 MB)`, 'success')
  }

  const handleStudentSubmit = (aId: string) => {
    const file = attachedFiles[aId]
    const repo = repoUrls[aId]?.trim()

    if (!file && !repo) {
      toast('Please upload a submission document (PDF) or provide a repository URL.', 'error')
      return
    }

    const payload = {
      fileUrl: file ? `https://campusflow.edu/uploads/${file.name}` : null,
      fileName: file ? file.name : null,
      fileSize: file ? file.size : null,
      repoUrl: repo || null,
    }

    onSubmit(aId, payload)
    toast('Coursework submitted successfully to faculty!', 'success')
    setResubmittingId(null)
    setAttachedFiles((prev) => {
      const next = { ...prev }
      delete next[aId]
      return next
    })
  }

  const handleGrade = (subId: string) => {
    const data = grades[subId]
    if (!data || !data.grade) return
    onGrade(subId, parseFloat(data.grade), data.feedback || 'Evaluated and marked.')
    toast('Grade saved successfully.', 'success')
  }

  return (
    <div className="space-y-6">
      {/* Faculty Summary Banner */}
      {role === 'faculty' && (
        <div className="glass glow-border rounded-3xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-2xl border border-cyan-500/30">
              <PieChart size={24} />
            </div>
            <div>
              <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Total Submissions Received</p>
              <p className="text-2xl font-bold text-white">
                <AnimatedCounter value={submissions.length} />
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 border-l border-white/10 pl-6">
            <div>
              <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Awaiting Evaluation</p>
              <p className="text-2xl font-bold text-amber-400">
                <AnimatedCounter value={submissions.filter((s) => s.grade === null).length} />
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Student Course / Subject Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Select Subject / Course
            </h3>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            {filteredAssignments.length} Assignment{filteredAssignments.length === 1 ? '' : 's'} Visible
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {/* All Courses Option */}
          <button
            onClick={() => setSelectedSubjectId('all')}
            className={cn(
              "p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between",
              selectedSubjectId === 'all'
                ? "border-cyan-500 bg-cyan-500/15 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                : "border-white/10 bg-slate-900/40 hover:border-cyan-500/30 hover:bg-white/5"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-cyan-300 font-mono">ALL</span>
              <Badge tone="cyan" className="text-[10px]">{stats.total}</Badge>
            </div>
            <p className="text-xs font-bold text-white">All Courses</p>
            <p className="text-[10px] text-zinc-400 mt-1">Full curriculum view</p>
          </button>

          {/* Enrolled Subjects */}
          {subjects.map((sub) => {
            const isSelected = selectedSubjectId === sub.id
            const subjectAssignments = assignments.filter((a) => a.subject_id === sub.id)
            const submittedForSub = subjectAssignments.filter((a) =>
              submissions.some((s) => s.assignment_id === a.id)
            ).length

            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubjectId(sub.id)}
                className={cn(
                  "p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between group",
                  isSelected
                    ? "border-cyan-500 bg-cyan-500/15 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                    : "border-white/10 bg-slate-900/40 hover:border-cyan-500/30 hover:bg-white/5"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cyan-400 font-mono">{sub.code}</span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {submittedForSub}/{subjectAssignments.length} done
                  </span>
                </div>
                <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate" title={sub.name}>
                  {sub.name}
                </p>
                <p className="text-[10px] text-zinc-400 mt-1 truncate" title={sub.faculty_name || 'Dr. Kavya Iyer'}>
                  {sub.faculty_name || 'Dr. Kavya Iyer'}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Assignments List */}
      <div className="grid gap-6 md:grid-cols-2 items-start">
        {filteredAssignments.map((a) => {
          const subject = subjectMap.get(a.subject_id || '')
          const mySub = role === 'student' ? submissions.find((s) => s.assignment_id === a.id) : null
          const relatedSubs = role === 'faculty' ? submissions.filter((s) => s.assignment_id === a.id) : []
          const isResubmitting = resubmittingId === a.id
          const currentMode = submissionType[a.id] || 'file'
          const attached = attachedFiles[a.id]

          const parsedDue = parseISO(a.due_at)
          const formattedDue = format(parsedDue, 'dd MMM yyyy, hh:mm a')

          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-3xl p-6 border border-white/10 flex flex-col justify-between space-y-5 hover:border-cyan-500/30 transition-all shadow-lg"
            >
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {subject?.code || 'CS'}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full uppercase font-bold",
                        a.kind === 'exam'
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      )}
                    >
                      {a.kind}
                    </span>
                    {a.urgency >= 4 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full uppercase font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                        Priority {a.urgency}/5
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-zinc-400 flex items-center gap-1 shrink-0 font-mono">
                    <Clock size={12} className="text-cyan-400" /> Due: {formattedDue}
                  </span>
                </div>

                <h4 className="text-lg font-bold text-white mt-1">{a.title}</h4>
                <p className="text-xs text-zinc-300 mt-1">{a.description}</p>

                <div className="flex items-center gap-3 text-xs text-zinc-400 mt-2">
                  <span className="flex items-center gap-1 text-zinc-300">
                    <User size={12} className="text-cyan-400" />
                    Instructor: <strong className="text-white">{subject?.faculty_name || 'Dr. Kavya Iyer'}</strong>
                  </span>
                </div>
              </div>

              {/* Faculty Problem Statement & Question Brief */}
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                    <FileText size={13} /> Official Assignment Questions
                  </span>

                  {a.question_pdf_url && (
                    <a
                      href={a.question_pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                    >
                      <Download size={12} /> Download PDF Brief
                    </a>
                  )}
                </div>

                {a.questions && a.questions.length > 0 ? (
                  <div className="space-y-1.5">
                    {a.questions.map((q, qIdx) => (
                      <div
                        key={qIdx}
                        className="text-xs text-zinc-200 bg-black/40 p-2 rounded-xl border border-white/5 flex items-start gap-2"
                      >
                        <span className="text-cyan-400 font-bold shrink-0">Q{qIdx + 1}.</span>
                        <span className="leading-relaxed">{q.replace(/^\d+\.\s*/, '')}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">No specific questions attached. Refer to course notes.</p>
                )}
              </div>

              {/* Student Submission Flow */}
              {role === 'student' ? (
                mySub && !isResubmitting ? (
                  /* Already Submitted View */
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                        <CheckCircle2 size={18} />
                        <span>Submitted Successfully</span>
                      </div>
                      <button
                        onClick={() => setResubmittingId(a.id)}
                        className="text-xs text-cyan-300 hover:text-white flex items-center gap-1 font-medium transition-colors"
                      >
                        <RotateCcw size={12} /> Replace Submission
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20 text-xs space-y-2">
                      <div className="flex items-center justify-between text-zinc-300">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Paperclip size={13} className="text-emerald-400" />
                          {mySub.file_name || 'submission_document.pdf'}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-500">{mySub.file_size || '2.4 MB'}</span>
                      </div>

                      {mySub.file_url && (
                        <a
                          href={mySub.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                        >
                          <Download size={11} /> View Uploaded Document
                        </a>
                      )}

                      {mySub.repo_url && (
                        <div className="pt-1.5 border-t border-white/5 flex items-center gap-1.5 text-zinc-300">
                          <GitBranch size={12} className="text-blue-400" />
                          <a
                            href={mySub.repo_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-400 hover:underline truncate"
                          >
                            {mySub.repo_url}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Grade & Feedback Box */}
                    {mySub.grade !== null ? (
                      <div className="pt-2 border-t border-emerald-500/20">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-400">Evaluation Grade:</span>
                          <span className="text-sm font-bold font-mono text-emerald-300">
                            {mySub.grade} / {mySub.max_grade} Marks ({Math.round((mySub.grade / mySub.max_grade) * 100)}%)
                          </span>
                        </div>
                        {mySub.feedback && (
                          <div className="mt-2 rounded-xl bg-black/40 p-2.5 text-xs text-zinc-300 border border-white/5">
                            <span className="font-semibold text-cyan-300">Faculty Feedback: </span>
                            "{mySub.feedback}"
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-amber-300/80">
                        <Clock size={12} /> Awaiting faculty evaluation & gradebook release.
                      </div>
                    )}
                  </div>
                ) : (
                  /* New / Resubmission Form */
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                        <UploadCloud size={14} className="text-cyan-400" />
                        {isResubmitting ? 'Replace Your Work' : 'Submit Coursework'}
                      </h5>
                      <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
                        <button
                          type="button"
                          onClick={() =>
                            setSubmissionType((prev) => ({ ...prev, [a.id]: 'file' }))
                          }
                          className={cn(
                            "px-2.5 py-0.5 rounded-lg transition-all font-medium cursor-pointer",
                            currentMode === 'file' ? "bg-cyan-500 text-slate-950 font-bold" : "text-zinc-400 hover:text-white"
                          )}
                        >
                          Document PDF
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSubmissionType((prev) => ({ ...prev, [a.id]: 'repo' }))
                          }
                          className={cn(
                            "px-2.5 py-0.5 rounded-lg transition-all font-medium cursor-pointer",
                            currentMode === 'repo' ? "bg-cyan-500 text-slate-950 font-bold" : "text-zinc-400 hover:text-white"
                          )}
                        >
                          Repo / Drive URL
                        </button>
                      </div>
                    </div>

                    {currentMode === 'file' ? (
                      <div className="space-y-2">
                        {attached ? (
                          <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs">
                            <span className="flex items-center gap-2 text-cyan-200 font-medium">
                              <FileText size={14} className="text-cyan-400" />
                              {attached.name} ({attached.size})
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setAttachedFiles((prev) => {
                                  const next = { ...prev }
                                  delete next[a.id]
                                  return next
                                })
                              }
                              className="text-red-400 hover:text-red-300 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => handleSimulatedFileUpload(a.id, `${a.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_solution.pdf`)}
                            className="border-2 border-dashed border-cyan-500/30 hover:border-cyan-400 bg-cyan-950/10 hover:bg-cyan-950/20 rounded-2xl p-4 text-center cursor-pointer transition-all"
                          >
                            <FileUp size={20} className="mx-auto mb-1.5 text-cyan-400" />
                            <p className="text-xs font-bold text-white">Click to Upload Solution PDF / DOCX</p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">Supports PDF, DOCX, ZIP up to 25MB</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Input
                          placeholder="https://github.com/username/project or Drive URL"
                          className="bg-black/40 text-xs h-9"
                          value={repoUrls[a.id] || ''}
                          onChange={(e) =>
                            setRepoUrls((prev) => ({ ...prev, [a.id]: e.target.value }))
                          }
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      {isResubmitting && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setResubmittingId(null)}
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleStudentSubmit(a.id)}
                        className="bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold text-xs"
                      >
                        <FileUp size={13} className="mr-1.5" /> Submit Work
                      </Button>
                    </div>
                  </div>
                )
              ) : (
                /* Faculty Grading Queue */
                <div className="space-y-3 mt-4 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-cyan-400" /> Submissions ({relatedSubs.length})
                    </p>
                  </div>

                  {relatedSubs.length === 0 && (
                    <p className="text-xs text-zinc-500 italic py-2">No student submissions submitted yet.</p>
                  )}

                  {relatedSubs.map((sub) => (
                    <div key={sub.id} className="bg-slate-900/60 rounded-2xl p-3 text-xs border border-white/5 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-300 font-mono font-medium">Student: {sub.student_id.slice(0, 13)}...</span>
                        <span className="text-zinc-500 font-mono text-[11px]">{format(parseISO(sub.submitted_at), 'dd MMM, hh:mm a')}</span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px]">
                        {sub.file_name && (
                          <span className="text-cyan-300 flex items-center gap-1">
                            <FileText size={12} /> {sub.file_name} ({sub.file_size || '2 MB'})
                          </span>
                        )}
                        {sub.file_url && (
                          <a href={sub.file_url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1">
                            <Download size={10} /> View Document
                          </a>
                        )}
                        {sub.repo_url && (
                          <a href={sub.repo_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                            <ExternalLink size={10} /> Repo Link
                          </a>
                        )}
                      </div>

                      {sub.grade !== null ? (
                        <div className="text-xs text-emerald-400 flex items-center justify-between pt-1 border-t border-white/5 font-mono">
                          <span className="flex items-center gap-1"><Check size={12} /> Graded: {sub.grade}/{sub.max_grade}</span>
                          <span className="text-zinc-400 text-[11px] italic font-sans truncate max-w-[200px]">"{sub.feedback}"</span>
                        </div>
                      ) : (
                        <div className="flex gap-2 pt-1 border-t border-white/5">
                          <Input
                            type="number"
                            placeholder="Grade"
                            className="w-20 h-7 text-xs bg-black/40"
                            value={grades[sub.id]?.grade || ''}
                            onChange={(e) =>
                              setGrades((prev) => ({
                                ...prev,
                                [sub.id]: { ...prev[sub.id], grade: e.target.value, feedback: prev[sub.id]?.feedback || '' },
                              }))
                            }
                          />
                          <Input
                            placeholder="Faculty feedback note..."
                            className="flex-1 h-7 text-xs bg-black/40"
                            value={grades[sub.id]?.feedback || ''}
                            onChange={(e) =>
                              setGrades((prev) => ({
                                ...prev,
                                [sub.id]: { ...prev[sub.id], feedback: e.target.value, grade: prev[sub.id]?.grade || '' },
                              }))
                            }
                          />
                          <Button size="sm" className="h-7 px-2.5 text-xs bg-cyan-500 text-slate-950 font-bold" onClick={() => handleGrade(sub.id)}>
                            <Edit3 size={11} className="mr-1" /> Save
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

