import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  FileSpreadsheet, 
  ShieldAlert, 
  Sparkles, 
  MessageSquarePlus, 
  Plus, 
  BookOpen, 
  Clock, 
  GraduationCap,
  QrCode
} from 'lucide-react'
import type { AttendanceRecord, AttendanceStatus, CorrectionRequest, Notice, Profile, Subject, Submission, Assignment } from '../../types'
import { SubmissionPortal } from './SubmissionPortal'
import { NoticePublisher } from './NoticePublisher'
import { CorrectionPanel } from '../attendance/CorrectionPanel'
import { StudentAttendanceWatchlist } from './StudentAttendanceWatchlist'
import { CreateAssignmentModal } from './CreateAssignmentModal'
import { FlashRollModal } from '../attendance/FlashRollModal'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import { useCampusStore } from '../../store/campus'

interface FacultyWorkspaceProps {
  subjects: Subject[]
  students: Profile[]
  attendance: AttendanceRecord[]
  assignments: Assignment[]
  submissions: Submission[]
  corrections: CorrectionRequest[]
  notices: Notice[]
  onSaveAttendance: (subjectId: string, marks: Record<string, AttendanceStatus>, sessionDate?: string) => void
  onGradeSubmission: (subId: string, grade: number, feedback: string) => void
  onReviewCorrection: (id: string, status: 'approved' | 'rejected', note: string) => void
  onPublishNotice: (title: string, body: string, category?: any, isPinned?: boolean, audience?: any, extra?: any) => void
}

type FacultyTab = 'attendance' | 'grading' | 'corrections' | 'broadcast'

export function FacultyWorkspace({
  subjects,
  students,
  attendance,
  assignments,
  submissions,
  corrections,
  notices,
  onSaveAttendance,
  onGradeSubmission,
  onReviewCorrection,
  onPublishNotice,
}: FacultyWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<FacultyTab>('attendance')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [flashRollModalOpen, setFlashRollModalOpen] = useState(false)
  const profile = useCampusStore((s) => s.profile)

  // Scope to subjects assigned to this faculty member (e.g. Dr. Kavya Iyer)
  const assignedSubjects = useMemo(() => {
    const direct = subjects.filter(
      (s) => s.faculty_id === profile?.id || (profile?.full_name && s.faculty_name === profile.full_name)
    )
    return direct.length > 0 ? direct : [subjects[0]] // Fallback to CS301
  }, [subjects, profile])

  const assignedSubjectIds = useMemo(
    () => new Set(assignedSubjects.map((s) => s.id)),
    [assignedSubjects]
  )

  // Scope submissions to assigned subjects
  const assignedSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const assignment = assignments.find((a) => a.id === s.assignment_id)
      return assignment && assignment.subject_id && assignedSubjectIds.has(assignment.subject_id)
    })
  }, [submissions, assignments, assignedSubjectIds])

  // Scope assignments to assigned subjects
  const assignedAssignments = useMemo(() => {
    return assignments.filter((a) => a.subject_id && assignedSubjectIds.has(a.subject_id))
  }, [assignments, assignedSubjectIds])

  // Scope attendance corrections to assigned subjects
  const assignedCorrections = useMemo(() => {
    return corrections.filter((c) => {
      const rec = attendance.find((r) => r.id === c.attendance_record_id)
      return rec && assignedSubjectIds.has(rec.subject_id)
    })
  }, [corrections, attendance, assignedSubjectIds])

  const pendingGradingCount = assignedSubmissions.filter((s) => s.grade === null).length
  const pendingCorrectionsCount = assignedCorrections.filter((c) => c.status === 'pending').length

  const tabs = [
    {
      id: 'attendance' as FacultyTab,
      label: 'Class Attendance & Student Watchlist',
      icon: Users,
      badge: null,
      desc: 'Student attendance % roster, shortfall warnings & session registers',
    },
    {
      id: 'grading' as FacultyTab,
      label: 'Coursework & Gradebook',
      icon: FileSpreadsheet,
      badge: pendingGradingCount > 0 ? `${pendingGradingCount} to Grade` : null,
      badgeTone: 'cyan' as const,
      desc: 'Review submitted coursework, evaluate solutions & publish grades',
    },
    {
      id: 'corrections' as FacultyTab,
      label: 'Attendance Grievance Queue',
      icon: ShieldAlert,
      badge: pendingCorrectionsCount > 0 ? `${pendingCorrectionsCount} Disputes` : null,
      badgeTone: 'crimson' as const,
      desc: 'Audit student session dispute requests & medical slips',
    },
    {
      id: 'broadcast' as FacultyTab,
      label: 'Campus Circulars',
      icon: MessageSquarePlus,
      badge: null,
      desc: 'Publish departmental announcements with subject & topic attribution',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-[#E2E6ED] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#2563EB] shadow-[0_0_8px_rgba(37,99,235,0.4)] animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#2563EB]">
              Faculty Command Station
            </p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1F1F1F] mt-1">
            {profile?.full_name || 'Dr. Kavya Iyer'}’s Academic Workspace
          </h1>
          <p className="text-xs text-[#666666] mt-1">
            Department of {profile?.department || 'Computer Science & Engineering'} · Assigned Courses Scoped Control Deck
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Badge tone="cyan" className="px-3 py-1">
            <Sparkles size={11} className="mr-1" /> Term 2026-27
          </Badge>

          <Button
            size="sm"
            onClick={() => setFlashRollModalOpen(true)}
            className="bg-[#DCE7F8] text-[#2563EB] border border-[#B8CCF0] hover:bg-[#cbe0fb] font-bold"
          >
            <QrCode size={14} className="mr-1.5" /> Start Flash-Roll QR
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-bold shadow-md shadow-[#2563EB]/20"
          >
            <Plus size={14} className="mr-1.5" /> Assign New Coursework
          </Button>
        </div>
      </div>

      {/* Assigned Subjects Overview Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] flex items-center gap-1.5">
            <BookOpen size={13} /> Your Assigned Teaching Portfolio ({assignedSubjects.length})
          </span>
          <span className="text-[11px] text-[#666666] font-mono">
            {students.length} Enrolled Students per Course
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {assignedSubjects.map((sub) => {
            const subAssignments = assignedAssignments.filter((a) => a.subject_id === sub.id)
            const subPendingGrading = assignedSubmissions.filter((s) => {
              const a = assignments.find((as) => as.id === s.assignment_id)
              return a?.subject_id === sub.id && s.grade === null
            }).length

            return (
              <div
                key={sub.id}
                className="p-4 rounded-2xl border border-[#E2E6ED] bg-white hover:border-[#2563EB]/40 transition-all flex flex-col justify-between space-y-3 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-[#2563EB] px-2 py-0.5 rounded-md bg-[#DCE7F8] border border-[#B8CCF0]">
                      {sub.code}
                    </span>
                    <span className="text-[11px] font-mono text-[#666666]">
                      {sub.min_attendance_pct}% Min Target
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#1F1F1F]">{sub.name}</h4>
                </div>

                <div className="pt-2 border-t border-[#E2E6ED] flex items-center justify-between text-xs text-[#666666]">
                  <span className="flex items-center gap-1">
                    <GraduationCap size={12} className="text-[#2563EB]" /> {students.length} Students
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} className="text-[#2563EB]" /> {subAssignments.length} Coursework
                  </span>
                  {subPendingGrading > 0 && (
                    <span className="text-amber-600 font-bold">
                      {subPendingGrading} Pending
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tab Selector Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'group p-4 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer',
                isActive
                  ? 'bg-[#DCE7F8]/80 border-[#2563EB]/40 shadow-sm'
                  : 'bg-white/80 border-[#E2E6ED] hover:bg-white hover:border-[#B8CCF0]'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeFacultyTabIndicator"
                  className="absolute inset-0 border-b-2 border-[#2563EB] pointer-events-none"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <div className="flex items-center justify-between mb-2">
                <div
                  className={cn(
                    'p-2 rounded-xl transition-colors',
                    isActive
                      ? 'bg-[#2563EB] text-white font-bold shadow-md shadow-[#2563EB]/20'
                      : 'bg-[#F5F6F8] text-[#666666] group-hover:text-[#1F1F1F]'
                  )}
                >
                  <Icon size={18} />
                </div>
                {tab.badge && (
                  <Badge tone={tab.badgeTone ?? 'zinc'} className="text-[9px]">
                    {tab.badge}
                  </Badge>
                )}
              </div>
              <p
                className={cn(
                  'text-sm font-bold tracking-tight transition-colors',
                  isActive ? 'text-[#2563EB]' : 'text-[#1F1F1F] group-hover:text-[#2563EB]'
                )}
              >
                {tab.label}
              </p>
              <p className="text-[11px] text-[#666666] line-clamp-1 mt-0.5">{tab.desc}</p>
            </button>
          )
        })}
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        {activeTab === 'attendance' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <StudentAttendanceWatchlist
              subjects={assignedSubjects}
              students={students}
              attendance={attendance}
              onSaveAttendance={onSaveAttendance}
            />
          </motion.div>
        )}

        {activeTab === 'grading' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <SubmissionPortal
              assignments={assignedAssignments}
              submissions={assignedSubmissions}
              role="faculty"
              onSubmit={() => {}}
              onGrade={onGradeSubmission}
              subjects={assignedSubjects}
            />
          </motion.div>
        )}

        {activeTab === 'corrections' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <CorrectionPanel
              role="faculty"
              records={attendance}
              subjects={assignedSubjects}
              requests={assignedCorrections}
              students={students}
              onSubmit={() => {}}
              onReview={onReviewCorrection}
            />
          </motion.div>
        )}

        {activeTab === 'broadcast' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <NoticePublisher notices={notices} onPublish={onPublishNotice} subjects={assignedSubjects} />
          </motion.div>
        )}
      </div>

      {/* Create Assignment Modal */}
      <CreateAssignmentModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        subjects={assignedSubjects}
      />

      {/* Flash-Roll Dynamic TOTP QR Modal */}
      {flashRollModalOpen && (
        <FlashRollModal
          mode="faculty"
          subjectId={assignedSubjects[0]?.id}
          onClose={() => setFlashRollModalOpen(false)}
        />
      )}
    </div>
  )
}

