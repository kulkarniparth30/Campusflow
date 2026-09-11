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

  const studentRecords = attendance.filter((r) => r.student_id === profile!.id)
  const studentCorrections =
    role === 'student' ? corrections.filter((c) => c.student_id === profile!.id) : corrections
  const studentOdRequests = 
    role === 'student' ? odRequests.filter((r) => r.student_id === profile!.id) : odRequests

  const priorityItems = useMemo(() => {
    return buildPriorityFeed({
      assignments,
      notices,
      subjects,
      attendance,
      studentId: profile!.id,
    })
  }, [assignments, notices, subjects, attendance, profile])

  // Senior Architect RBAC Guard: Protect role-specific views
  const isStudentOnlyRoute = ['attendance', 'priority', 'portfolio', 'ai-hub'].includes(view)
  const isFacultyOnlyRoute = view === 'faculty'
  const isHODOnlyRoute = view === 'hod'

  const isDeniedStudent = role === 'student' && (isFacultyOnlyRoute || isHODOnlyRoute)
  const isDeniedStaff = (role === 'faculty' || role === 'hod') && isStudentOnlyRoute
  const isDeniedFacultyOnHOD = role === 'faculty' && isHODOnlyRoute
  const isDenied = isDeniedStudent || isDeniedStaff || isDeniedFacultyOnHOD

  const backDeck = role === 'hod' ? 'hod' : role === 'faculty' ? 'faculty' : 'command'

  return (
    <>
      <AppShell onCommand={() => setCmdOpen(true)}>
        {isDenied ? (
          <div className="glass glow-border rounded-3xl p-8 max-w-xl mx-auto text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <ShieldAlert size={24} />
            </div>
            <h2 className="text-xl font-bold text-stone-100">Access Restricted</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
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
              role === 'admin' ? (
                <HODDashboard
                  subjects={subjects}
                  students={batch}
                  attendance={attendance}
                  faculties={facultyList}
                  auditLogs={auditLogs}
                  onAllocateCourse={allocateCourse}
                />
              ) : role === 'faculty' ? (
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
                    <h1 className="text-2xl font-bold text-stone-100">Attendance Monitor & Trajectory Simulator</h1>
                    <p className="text-xs text-zinc-400">Dedicated interactive simulator with guardian safety forecasts.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setView(backDeck)}>
                    <ArrowLeft size={14} /> Back to Deck
                  </Button>
                </div>
                <AttendanceMonitor subjects={subjects} records={attendance} studentId={profile!.id} />
              </div>
            )}

            {view === 'priority' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-stone-100">Dynamic Priority Intelligence Feed</h1>
                    <p className="text-xs text-zinc-400">Ranked by proximity algorithm, urgency ratings, and risk trajectories.</p>
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
                    <h1 className="text-2xl font-bold text-stone-100">Academic & Examination Timeline</h1>
                    <p className="text-xs text-zinc-400">Live countdown tags, chronological milestones, and exam alerts.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setView(backDeck)}>
                    <ArrowLeft size={14} /> Back to Deck
                  </Button>
                </div>
                <AcademicTimeline assignments={assignments} notices={notices} subjects={subjects} />
              </div>
            )}
            
            {view === 'timetable' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-stone-100">Weekly Lecture Timetable</h1>
                    <p className="text-xs text-zinc-400">Classroom allocations and active period indicators.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setView(backDeck)}>
                    <ArrowLeft size={14} /> Back to Deck
                  </Button>
                </div>
                <Timetable slots={timetable} subjects={subjects} />
              </div>
            )}

            {view === 'od-requests' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-stone-100">Leave & On-Duty (OD) Pipeline</h1>
                    <p className="text-xs text-zinc-400">Multi-tier verified approval workflow with real-time tracking.</p>
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
                    <h1 className="text-2xl font-bold text-stone-100">Student Coursework & Submissions</h1>
                    <p className="text-xs text-zinc-400">Course-first assignment browser, problem statements, PDF rubrics, and coursework uploads.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setView(backDeck)}>
                    <ArrowLeft size={14} /> Back to Deck
                  </Button>
                </div>
                <SubmissionPortal 
                  assignments={assignments} 
                  submissions={submissions} 
                  role={role!} 
                  onSubmit={submitAssignment} 
                  onGrade={gradeSubmission} 
                  subjects={subjects}
                />
              </div>
            )}

            {view === 'ai-hub' && <AIHub />}

            {view === 'corrections' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-stone-100">Attendance Correction System</h1>
                    <p className="text-xs text-zinc-400">Formal grievance disputes, faculty reviews, and attendance register rectification.</p>
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
                    <h1 className="text-2xl font-bold text-stone-100">Digital Achievement Portfolio</h1>
                    <p className="text-xs text-zinc-400">Verifiable credentials, event photo proof evidence, and official certificates.</p>
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
                auditLogs={auditLogs}
                onAllocateCourse={allocateCourse}
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
                    <h1 className="text-2xl font-bold text-stone-100">Institutional Broadcast & Circulars</h1>
                    <p className="text-xs text-zinc-400">Official campus announcements, subject briefs, and exam notifications.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setView(backDeck)}>
                    <ArrowLeft size={14} /> Back to Deck
                  </Button>
                </div>
                <NoticePublisher notices={notices} onPublish={publishNotice} subjects={subjects} />
              </div>
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
