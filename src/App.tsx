import { useState, useMemo } from 'react'
import { CorrectionPanel } from './components/attendance/CorrectionPanel'
import { CommandPalette } from './components/command/CommandPalette'
import { DigitalPortfolio } from './components/dashboard/DigitalPortfolio'
import { AttendanceMonitor } from './components/dashboard/AttendanceMonitor'
import { PriorityFeed } from './components/dashboard/PriorityFeed'
import { AcademicTimeline } from './components/dashboard/AcademicTimeline'
import { FacultyWorkspace } from './components/faculty/FacultyWorkspace'
import { HODDashboard } from './components/hod/HODDashboard'
import { NoticePublisher } from './components/faculty/NoticePublisher'
import { AppShell } from './components/layout/AppShell'
import { LoginScreen } from './components/LoginScreen'
import { StudentCommandCenter } from './components/views/StudentCommandCenter'
import { Timetable } from './components/dashboard/Timetable'
import { TimetableManagement } from './components/admin/TimetableManagement'
import { ODRequestPanel } from './components/attendance/ODRequestPanel'
import { SubmissionPortal } from './components/faculty/SubmissionPortal'
import { AIHub } from './components/views/AIHub'
import { useAuth } from './hooks/useAuth'
import { useCampusStore } from './store/campus'
import { buildPriorityFeed } from './lib/priority'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { Button } from './components/ui/button'

export default function App() {
  const { profile } = useAuth()
  const [cmdOpen, setCmdOpen] = useState(false)
  if (!profile) return <LoginScreen />
  return <AuthenticatedApp cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />
}

function AuthenticatedApp({
  cmdOpen,
  setCmdOpen,
}: {
  cmdOpen: boolean
  setCmdOpen: (v: boolean) => void
}) {
  const { profile, role, view, setView } = useAuth()
  const subjects = useCampusStore((s) => s.subjects)
  const attendance = useCampusStore((s) => s.attendance)
  const assignments = useCampusStore((s) => s.assignments)
  const notices = useCampusStore((s) => s.notices)
  const corrections = useCampusStore((s) => s.corrections)
  const achievements = useCampusStore((s) => s.achievements)
  const batch = useCampusStore((s) => s.batch)
  const timetable = useCampusStore((s) => s.timetable)
  const odRequests = useCampusStore((s) => s.odRequests)
  const submissions = useCampusStore((s) => s.submissions)
  const auditLogs = useCampusStore((s) => s.auditLogs)
  const facultyList = useCampusStore((s) => s.facultyList)
  const hodList = useCampusStore((s) => s.hodList)

  const markAttendance = useCampusStore((s) => s.markAttendance)
  const submitCorrection = useCampusStore((s) => s.submitCorrection)
  const reviewCorrection = useCampusStore((s) => s.reviewCorrection)
  const addAchievement = useCampusStore((s) => s.addAchievement)
  const publishNotice = useCampusStore((s) => s.publishNotice)
  const submitODRequest = useCampusStore((s) => s.submitODRequest)
  const approveODStep = useCampusStore((s) => s.approveODStep)
  const submitAssignment = useCampusStore((s) => s.submitAssignment)
  const gradeSubmission = useCampusStore((s) => s.gradeSubmission)
  const allocateCourse = useCampusStore((s) => s.allocateCourse)
  const onboardFaculty = useCampusStore((s) => s.onboardFaculty)
  const onboardHOD = useCampusStore((s) => s.onboardHOD)
  const enrollStudent = useCampusStore((s) => s.enrollStudent)
  const addTimetableSlot = useCampusStore((s) => s.addTimetableSlot)
  const updateTimetableSlot = useCampusStore((s) => s.updateTimetableSlot)
  const removeTimetableSlot = useCampusStore((s) => s.removeTimetableSlot)

  // Strict Department Isolation Guard: If user is a student, ensure subjects, assignments, and timetable are strictly scoped to their department
  const effectiveSubjects = useMemo(() => {
    if (role === 'student' && profile?.department) {
      const studentDept = profile.department.toLowerCase()
      const deptSubs = subjects.filter((s) => s.department && (s.department.toLowerCase().includes(studentDept) || studentDept.includes(s.department.toLowerCase())))
      return deptSubs.length > 0 ? deptSubs : subjects
    }
    return subjects
  }, [subjects, role, profile?.department])

  const effectiveSubjectIds = useMemo(() => new Set(effectiveSubjects.map(s => s.id)), [effectiveSubjects])

  const effectiveAssignments = useMemo(() => {
    if (role === 'student') {
      return assignments.filter(a => a.subject_id && effectiveSubjectIds.has(a.subject_id))
    }
    return assignments
  }, [assignments, role, effectiveSubjectIds])

  const effectiveTimetable = useMemo(() => {
    if (role === 'student') {
      return timetable.filter(slot => effectiveSubjectIds.has(slot.subject_id))
    }
    return timetable
  }, [timetable, role, effectiveSubjectIds])

  const studentRecords = attendance.filter((r) => r.student_id === profile!.id)
  const studentCorrections =
    role === 'student' ? corrections.filter((c) => c.student_id === profile!.id) : corrections
  const studentOdRequests = 
    role === 'student' ? odRequests.filter((r) => r.student_id === profile!.id) : odRequests

  const priorityItems = useMemo(() => {
    return buildPriorityFeed({
      assignments: effectiveAssignments,
      notices,
      subjects: effectiveSubjects,
      attendance,
      studentId: profile!.id,
    })
  }, [effectiveAssignments, notices, effectiveSubjects, attendance, profile])

  // Senior Architect RBAC Guard: Protect role-specific views
  const isStudentOnlyRoute = ['attendance', 'priority', 'portfolio', 'ai-hub'].includes(view)
  const isFacultyOnlyRoute = view === 'faculty'
  const isHODOnlyRoute = view === 'hod'
  const isAdminOnlyRoute = view === 'timetable-mgmt'

  const isDeniedStudent = role === 'student' && (isFacultyOnlyRoute || isHODOnlyRoute || isAdminOnlyRoute)
  const isDeniedStaff = (role === 'faculty' || role === 'hod' || role === 'admin') && isStudentOnlyRoute
  const isDeniedFacultyOnHOD = role === 'faculty' && isHODOnlyRoute
  const isDeniedNonAdmin = role !== 'admin' && isAdminOnlyRoute
  const isDenied = isDeniedStudent || isDeniedStaff || isDeniedFacultyOnHOD || isDeniedNonAdmin

  const backDeck = role === 'hod' || role === 'admin' ? 'hod' : role === 'faculty' ? 'faculty' : 'command'

  return (
    <>
      <AppShell onCommand={() => setCmdOpen(true)}>
        {isDenied ? (
          <div className="glass glow-border rounded-3xl p-8 max-w-xl mx-auto text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <ShieldAlert size={24} />
            </div>
            <h2 className="text-xl font-bold text-[#1F1F1F]">Access Restricted</h2>
            <p className="text-sm text-[#666666] leading-relaxed">
              {isDeniedStudent ? (
                <>
                  You are signed in as a <span className="text-amber-400 font-semibold font-mono">Student</span>. The Academic Governance & Faculty Workspaces are reserved for institutional educators and department heads.
                </>
              ) : isDeniedFacultyOnHOD ? (
                <>
                  You are signed in as <span className="text-cyan-400 font-semibold font-mono">Faculty</span>. Course-Faculty Allocation Matrices and departmental governance are strictly restricted to the Head of Department (HOD) and Academic Deans.
                </>
              ) : (
                <>
                  You are signed in as <span className="text-cyan-400 font-semibold font-mono">{role?.toUpperCase()}</span>. Student personal attendance simulators and priority feeds are tailored for enrolled students. Please manage departmental curricula from your station.
                </>
              )}
            </p>
            <Button onClick={() => setView(backDeck)} className="mx-auto">
              <ArrowLeft size={14} /> {role === 'hod' ? 'Return to Department Governance' : role === 'faculty' ? 'Return to Faculty Station' : 'Return to Command Deck'}
            </Button>
          </div>
        ) : (
          <>
            {view === 'command' && (
              role === 'faculty' ? (
                <FacultyWorkspace
                  subjects={subjects}
                  students={batch}
                  attendance={attendance}
                  assignments={assignments}
                  submissions={submissions}
                  corrections={corrections}
                  notices={notices}
                  onSaveAttendance={markAttendance}
                  onGradeSubmission={gradeSubmission}
                  onReviewCorrection={reviewCorrection}
                  onPublishNotice={publishNotice}
                />
              ) : (
                <StudentCommandCenter />
              )
            )}

            {view === 'attendance' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-[#1F1F1F]">Attendance Monitor & Trajectory Simulator</h1>
                    <p className="text-xs text-[#666666]">Dedicated interactive simulator with guardian safety forecasts.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setView(backDeck)}>
                    <ArrowLeft size={14} /> Back to Deck
                  </Button>
                </div>
                <AttendanceMonitor subjects={effectiveSubjects} records={attendance} studentId={profile!.id} />
              </div>
            )}

            {view === 'priority' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-[#1F1F1F]">Dynamic Priority Intelligence Feed</h1>
                    <p className="text-xs text-[#666666]">Ranked by proximity algorithm, urgency ratings, and risk trajectories.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setView(backDeck)}>
                    <ArrowLeft size={14} /> Back to Deck
                  </Button>
                </div>
                <PriorityFeed items={priorityItems} />
              </div>
            )}

            {view === 'timeline' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-[#1F1F1F]">Academic & Examination Timeline</h1>
                    <p className="text-xs text-[#666666]">Live countdown tags, chronological milestones, and exam alerts.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setView(backDeck)}>
                    <ArrowLeft size={14} /> Back to Deck
                  </Button>
                </div>
                <AcademicTimeline assignments={effectiveAssignments} notices={notices} subjects={effectiveSubjects} />
              </div>
            )}
            
            {view === 'timetable' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-[#1F1F1F]">Weekly Lecture Timetable</h1>
                    <p className="text-xs text-[#666666]">Classroom allocations and active period indicators.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setView(backDeck)}>
                    <ArrowLeft size={14} /> Back to Deck
                  </Button>
                </div>
                <Timetable slots={effectiveTimetable} subjects={effectiveSubjects} />
              </div>
            )}

            {view === 'od-requests' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-[#1F1F1F]">Leave & On-Duty (OD) Pipeline</h1>
                    <p className="text-xs text-[#666666]">Multi-tier verified approval workflow with real-time tracking.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setView(backDeck)}>
                    <ArrowLeft size={14} /> Back to Deck
                  </Button>
                </div>
                <ODRequestPanel 
                  requests={studentOdRequests} 
                  role={role!} 
                  onSubmit={submitODRequest} 
                  onApprove={approveODStep} 
                />
              </div>
            )}

            {view === 'submissions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-[#1F1F1F]">Student Coursework & Submissions</h1>
                    <p className="text-xs text-[#666666]">Course-first assignment browser, problem statements, PDF rubrics, and coursework uploads.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setView(backDeck)}>
                    <ArrowLeft size={14} /> Back to Deck
                  </Button>
                </div>
                <SubmissionPortal 
                  assignments={effectiveAssignments} 
                  submissions={submissions} 
                  role={role!} 
                  onSubmit={submitAssignment} 
                  onGrade={gradeSubmission} 
                  subjects={effectiveSubjects}
                />
              </div>
            )}

            {view === 'ai-hub' && <AIHub subjects={effectiveSubjects} assignments={effectiveAssignments} timetable={effectiveTimetable} />}

            {view === 'corrections' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-[#1F1F1F]">Attendance Correction System</h1>
                    <p className="text-xs text-[#666666]">Formal grievance disputes, faculty reviews, and attendance register rectification.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setView(backDeck)}>
                    <ArrowLeft size={14} /> Back to Deck
                  </Button>
                </div>
                <CorrectionPanel
                  role={role!}
                  records={role === 'student' ? studentRecords : attendance}
                  subjects={subjects}
                  requests={studentCorrections}
                  students={batch}
                  onSubmit={submitCorrection}
                  onReview={reviewCorrection}
                />
              </div>
            )}
            
            {view === 'portfolio' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-[#1F1F1F]">Digital Achievement Portfolio</h1>
                    <p className="text-xs text-[#666666]">Verifiable credentials, event photo proof evidence, and official certificates.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setView(backDeck)}>
                    <ArrowLeft size={14} /> Back to Deck
                  </Button>
                </div>
                <DigitalPortfolio
                  items={achievements.filter((a) => a.student_id === profile!.id)}
                  onAdd={addAchievement}
                />
              </div>
            )}
            
            {view === 'hod' && (
              <HODDashboard
                subjects={subjects}
                students={batch}
                attendance={attendance}
                faculties={facultyList}
                hodList={hodList}
                auditLogs={auditLogs}
                role={role!}
                currentProfile={profile!}
                onAllocateCourse={allocateCourse}
                onOnboardFaculty={onboardFaculty}
                onOnboardHOD={onboardHOD}
                onEnrollStudent={enrollStudent}
              />
            )}

            {view === 'faculty' && (
              <FacultyWorkspace
                subjects={subjects}
                students={batch}
                attendance={attendance}
                assignments={assignments}
                submissions={submissions}
                corrections={corrections}
                notices={notices}
                onSaveAttendance={markAttendance}
                onGradeSubmission={gradeSubmission}
                onReviewCorrection={reviewCorrection}
                onPublishNotice={publishNotice}
              />
            )}
            
            {view === 'admin' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-[#1F1F1F]">Institutional Broadcast & Circulars</h1>
                    <p className="text-xs text-[#666666]">Official campus announcements, subject briefs, and exam notifications.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setView(backDeck)}>
                    <ArrowLeft size={14} /> Back to Deck
                  </Button>
                </div>
                <NoticePublisher notices={notices} onPublish={publishNotice} subjects={subjects} />
              </div>
            )}

            {view === 'timetable-mgmt' && (
              <TimetableManagement
                subjects={subjects}
                faculties={facultyList}
                timetable={timetable}
                onAddSlot={addTimetableSlot}
                onUpdateSlot={updateTimetableSlot}
                onRemoveSlot={removeTimetableSlot}
              />
            )}
          </>
        )}
      </AppShell>
      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        assignments={assignments}
        notices={notices}
        subjects={subjects}
        onNavigate={setView}
      />
    </>
  )
}
