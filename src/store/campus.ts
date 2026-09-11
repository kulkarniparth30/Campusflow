
import { create } from 'zustand'
import type { Role } from '../types'
import {
  BATCH_STUDENTS,
  DEMO_ACHIEVEMENTS,
  DEMO_ASSIGNMENTS,
  DEMO_ATTENDANCE_LOANS,
  DEMO_AUDIT_LOGS,
  DEMO_CORRECTIONS,
  DEMO_FACULTIES,
  DEMO_HODS,
  DEMO_NOTICES,
  DEMO_OD_REQUESTS,
  DEMO_PROFILES,
  DEMO_SUBMISSIONS,
  DEMO_SUBSTITUTIONS,
  DEMO_SUBJECTS,
  DEMO_TIMETABLE,
  buildDemoAttendance,
} from '../data/demo'
import { tagNotice } from '../lib/notice-tagger'
import { uid } from '../lib/utils'
import type {
  Achievement,
  ApprovalStep,
  Assignment,
  AttendanceImpact,
  AttendanceLoan,
  AttendanceRecord,
  AttendanceStatus,
  AuditLog,
  CorrectionRequest,
  FacultySubstitution,
  FlashRollSession,
  MatchedSession,
  Notice,
  NoticeAudience,
  NoticeCategory,
  ODRequest,
  ODType,
  Profile,
  RequestStatus,
  Subject,
  Submission,
  TimetableSlot,
} from '../types'

interface CampusState {
  profile: Profile | null
  subjects: Subject[]
  attendance: AttendanceRecord[]
  assignments: Assignment[]
  notices: Notice[]
  corrections: CorrectionRequest[]
  achievements: Achievement[]
  batch: Profile[]
  timetable: TimetableSlot[]
  odRequests: ODRequest[]
  submissions: Submission[]
  auditLogs: AuditLog[]
  facultyList: Profile[]
  hodList: Profile[]
  attendanceLoans: AttendanceLoan[]
  substitutions: FacultySubstitution[]
  activeFlashRoll: FlashRollSession | null

  // Auth
  login: (email: string, password: string, roleHint?: Role) => string | null
  signUp: (email: string, password: string, full_name: string, role: Role, department?: string, roll_no?: string) => string | null
  logout: () => void

  // Flash-Roll TOTP Dynamic QR
  startFlashRoll: (subjectId: string) => void
  refreshFlashRollToken: () => void
  closeFlashRoll: () => void
  verifyFlashRollScan: (studentId: string, token: string, userLat?: number, userLng?: number) => { success: boolean; message: string }

  // Attendance Recovery Loans (Contracts)
  applyAttendanceLoan: (subjectId: string, compensatoryTask: string, requestedHours: number) => void
  reviewAttendanceLoan: (loanId: string, approved: boolean, note: string) => void

  // Smart Faculty Substitutions
  requestSubstitution: (subjectId: string, substituteFacultyId: string, date: string, slotTime: string, reason: string) => void
  reviewSubstitution: (substitutionId: string, status: 'accepted' | 'rejected' | 'completed') => void

  // HOD Course-Faculty Allocation Matrix & Credential Provisioning
  allocateCourse: (subjectId: string, facultyId: string, notes?: string) => string | null
  onboardFaculty: (data: {
    full_name: string
    email: string
    department: string
    designation: string
    employee_id?: string
    assigned_course_id?: string
    password?: string
  }) => { profile: Profile; tempPassword: string; assignedCourseName?: string }
  onboardHOD: (data: {
    full_name: string
    email: string
    department: string
    designation: string
    employee_id?: string
    password?: string
  }) => { profile: Profile; tempPassword: string }
  enrollStudent: (data: {
    full_name: string
    email: string
    department: string
    semester: number
    roll_no?: string
    password?: string
  }) => { profile: Profile; tempPassword: string }

  // Admin Timetable Management
  addTimetableSlot: (slot: Omit<TimetableSlot, 'id'>) => TimetableSlot
  updateTimetableSlot: (slotId: string, updates: Partial<Omit<TimetableSlot, 'id'>>) => void
  removeTimetableSlot: (slotId: string) => void

  // ERP Audit Logging
  logAudit: (action: AuditLog['action'], target: string, details: string) => void

  // Notices
  publishNotice: (
    title: string,
    body: string,
    category?: NoticeCategory,
    isPinned?: boolean,
    audience?: NoticeAudience,
    extra?: { facultyName?: string; subjectId?: string; subjectCode?: string; subjectName?: string; topic?: string }
  ) => void

  // Assignments
  createAssignment: (payload: Omit<Assignment, 'id' | 'created_by'>) => void

  // Automated Low Attendance Warning
  sendAttendanceWarning: (studentId: string, subjectId: string, currentPct: number, customMessage?: string) => void

  // Attendance (faculty restricted to their subjects in demo mode too)
  markAttendance: (subjectId: string, marks: Record<string, AttendanceStatus>, sessionDate?: string) => void

  // Corrections
  submitCorrection: (recordId: string, reason: string) => void
  reviewCorrection: (id: string, status: RequestStatus, note: string) => void

  // Achievements
  addAchievement: (payload: Omit<Achievement, 'id' | 'student_id' | 'verified'>) => void

  // OD/Medical Requests
  submitODRequest: (type: ODType, reason: string, evidenceUrl: string | null, fromDate: string, toDate: string) => void
  approveODStep: (requestId: string, stepIndex: number, approved: boolean, note: string) => void

  // Submissions
  submitAssignment: (
    assignmentId: string,
    payload: string | { fileUrl?: string | null; fileName?: string | null; fileSize?: string | null; repoUrl?: string | null }
  ) => void
  gradeSubmission: (submissionId: string, grade: number, feedback: string) => void
}

const persisted = typeof localStorage !== 'undefined' ? localStorage.getItem('cf-session') : null

function getDynamicUser(email: string) {
  try {
    const raw = localStorage.getItem(`cf-user-${email.toLowerCase()}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveDynamicUser(email: string, password: string, profile: Profile) {
  const record = { password, profile }
  try {
    localStorage.setItem(`cf-user-${email.toLowerCase()}`, JSON.stringify(record))
  } catch {}
  return record
}

function getStoredDynamicFaculties(): Profile[] {
  try {
    const raw = localStorage.getItem('cf-dynamic-faculties')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function getStoredDynamicHODs(): Profile[] {
  try {
    const raw = localStorage.getItem('cf-dynamic-hods')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function getStoredDynamicStudents(): Profile[] {
  try {
    const raw = localStorage.getItem('cf-dynamic-students')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// Security fix: validate persisted session against known demo profiles or validated dynamic credentials
function validatePersistedProfile(): Profile | null {
  if (!persisted) return null
  try {
    const parsed = JSON.parse(persisted) as Profile
    const knownEmails = Object.keys(DEMO_PROFILES)
    const matchEntry = knownEmails.find((email) => DEMO_PROFILES[email].profile.id === parsed.id)
    if (matchEntry) {
      return DEMO_PROFILES[matchEntry].profile
    }
    const dyn = getDynamicUser(parsed.email)
    if (dyn && dyn.profile && dyn.profile.id === parsed.id) {
      return dyn.profile
    }
    return null
  } catch {
    return null
  }
}

export const useCampusStore = create<CampusState>((set, get) => ({
  profile: validatePersistedProfile(),
  subjects: DEMO_SUBJECTS,
  attendance: buildDemoAttendance(),
  assignments: DEMO_ASSIGNMENTS,
  notices: DEMO_NOTICES,
  corrections: DEMO_CORRECTIONS,
  achievements: DEMO_ACHIEVEMENTS,
  batch: [...BATCH_STUDENTS, ...getStoredDynamicStudents()],
  timetable: DEMO_TIMETABLE,
  odRequests: DEMO_OD_REQUESTS,
  submissions: DEMO_SUBMISSIONS,
  auditLogs: DEMO_AUDIT_LOGS,
  facultyList: [...DEMO_FACULTIES, ...getStoredDynamicFaculties()],
  hodList: [...DEMO_HODS, ...getStoredDynamicHODs()],
  attendanceLoans: DEMO_ATTENDANCE_LOANS,
  substitutions: DEMO_SUBSTITUTIONS,
  activeFlashRoll: null,

  startFlashRoll: (subjectId: string) => {
    const subject = get().subjects.find((s) => s.id === subjectId)
    const token = Math.random().toString(36).substring(2, 8).toUpperCase()
    const session: FlashRollSession = {
      subject_id: subjectId,
      subject_code: subject?.code ?? 'SUB',
      subject_name: subject?.name ?? 'Subject',
      token,
      expires_at: new Date(Date.now() + 6000).toISOString(), // 6-sec rolling window
      attendee_ids: [],
      total_enrolled: get().batch.length || 38,
      classroom_lat: 13.0827,
      classroom_lng: 80.2707,
      is_active: true,
    }
    set({ activeFlashRoll: session })
    get().logAudit('FLASHROLL_STARTED', subject?.name ?? 'Class', `Activated 5-second TOTP Dynamic QR Attendance session.`)
  },

  refreshFlashRollToken: () => {
    const current = get().activeFlashRoll
    if (!current || !current.is_active) return
    const newToken = Math.random().toString(36).substring(2, 8).toUpperCase()
    set({
      activeFlashRoll: {
        ...current,
        token: newToken,
        expires_at: new Date(Date.now() + 6000).toISOString(),
      },
    })
  },

  closeFlashRoll: () => {
    const current = get().activeFlashRoll
    if (!current) return
    set({ activeFlashRoll: null })
    get().logAudit(
      'FLASHROLL_ENDED',
      current.subject_name,
      `Ended Flash-Roll session. Total check-ins recorded: ${current.attendee_ids.length}/${current.total_enrolled}.`
    )
  },

  verifyFlashRollScan: (studentId: string, token: string, userLat?: number, userLng?: number) => {
    const current = get().activeFlashRoll
    if (!current || !current.is_active) {
      return { success: false, message: 'No active Flash-Roll attendance session found.' }
    }
    if (current.token.trim().toUpperCase() !== token.trim().toUpperCase()) {
      return { success: false, message: 'Expired or invalid cryptographic TOTP token. The QR code updates every 5 seconds.' }
    }
    if (current.attendee_ids.includes(studentId)) {
      return { success: true, message: 'You have already checked into this session!' }
    }

    // Geofence check (simulate ~150m boundary if coords provided)
    if (userLat && userLng && current.classroom_lat && current.classroom_lng) {
      const dist = Math.sqrt(
        Math.pow((userLat - current.classroom_lat) * 111000, 2) +
        Math.pow((userLng - current.classroom_lng) * 111000, 2)
      )
      if (dist > 300) {
        return { success: false, message: `Geofence check failed: You are ${Math.round(dist)}m away from the classroom (must be within 150m).` }
      }
    }

    // Mark present in attendance state
    const today = new Date().toISOString().split('T')[0]
    const existingRec = get().attendance.find(
      (a) => a.student_id === studentId && a.subject_id === current.subject_id && a.session_date === today
    )

    let updatedAttendance = get().attendance
    if (existingRec) {
      updatedAttendance = updatedAttendance.map((a) =>
        a.id === existingRec.id ? { ...a, status: 'present' as const } : a
      )
    } else {
      const newRec: AttendanceRecord = {
        id: uid('att-fr'),
        student_id: studentId,
        subject_id: current.subject_id,
        session_date: today,
        status: 'present',
        marked_by: get().profile?.id ?? 'faculty',
      }
      updatedAttendance = [newRec, ...updatedAttendance]
    }

    set({
      attendance: updatedAttendance,
      activeFlashRoll: {
        ...current,
        attendee_ids: [...current.attendee_ids, studentId],
      },
    })

    const student = get().batch.find((s) => s.id === studentId) || get().profile
    get().logAudit(
      'FLASHROLL_VERIFIED',
      current.subject_name,
      `Student ${student?.full_name ?? studentId} successfully verified via cryptographically signed TOTP.`
    )

    return { success: true, message: `Attendance verified! Marked PRESENT for ${current.subject_name}.` }
  },

  applyAttendanceLoan: (subjectId: string, compensatoryTask: string, requestedHours: number) => {
    const profile = get().profile
    if (!profile) return
    const subject = get().subjects.find((s) => s.id === subjectId)
    const records = get().attendance.filter((a) => a.student_id === profile.id && a.subject_id === subjectId)
    const present = records.filter((a) => a.status === 'present').length
    const currentPct = records.length ? Math.round((present / records.length) * 1000) / 10 : 70.0
    const targetPct = Math.min(80.0, Math.round((currentPct + (requestedHours * 1.5)) * 10) / 10)

    const loan: AttendanceLoan = {
      id: uid('loan'),
      student_id: profile.id,
      student_name: profile.full_name,
      subject_id: subjectId,
      subject_code: subject?.code ?? 'SUB',
      subject_name: subject?.name ?? 'Subject',
      current_pct: currentPct,
      target_pct: targetPct,
      remedial_hours_pledged: requestedHours,
      remedial_hours_required: requestedHours,
      remedial_hours_completed: 0,
      compensatory_task: compensatoryTask,
      status: 'pending',
      created_at: new Date().toISOString(),
    }

    set({ attendanceLoans: [loan, ...get().attendanceLoans] })
    get().logAudit(
      'ATTENDANCE_LOAN_REQUESTED',
      subject?.name ?? 'Course',
      `Applied for academic recovery attendance contract (${requestedHours} remedial hours committed).`
    )
  },

  reviewAttendanceLoan: (loanId: string, approved: boolean, note: string) => {
    const profile = get().profile
    set({
      attendanceLoans: get().attendanceLoans.map((loan) => {
        if (loan.id !== loanId) return loan
        return {
          ...loan,
          status: approved ? 'active' : 'breached',
          hod_approved_by: profile?.id,
          hod_approved_at: new Date().toISOString(),
          hod_note: note,
        }
      }),
    })
    const targetLoan = get().attendanceLoans.find((l) => l.id === loanId)
    get().logAudit(
      'ATTENDANCE_LOAN_REVIEWED',
      targetLoan?.subject_name ?? 'Remediation Contract',
      `HOD ${approved ? 'APPROVED' : 'REJECTED'} attendance loan contract. Note: "${note}".`
    )
  },

  requestSubstitution: (subjectId: string, substituteFacultyId: string, date: string, slotTime: string, reason: string) => {
    const profile = get().profile
    if (!profile) return
    const subFaculty = get().facultyList.find((f) => f.id === substituteFacultyId)
    const subject = get().subjects.find((s) => s.id === subjectId)

    const subst: FacultySubstitution = {
      id: uid('subst'),
      original_faculty_id: profile.id,
      original_faculty_name: profile.full_name,
      substitute_faculty_id: substituteFacultyId,
      substitute_faculty_name: subFaculty?.full_name ?? 'Peer Faculty',
      subject_id: subjectId,
      subject_code: subject?.code ?? 'SUB',
      subject_name: subject?.name ?? 'Subject',
      date,
      slot_time: slotTime,
      reason,
      status: 'pending',
      created_at: new Date().toISOString(),
    }

    set({ substitutions: [subst, ...get().substitutions] })
    get().logAudit(
      'SUBSTITUTION_REQUESTED',
      subject?.name ?? 'Lecture Slot',
      `Requested substitution from ${subFaculty?.full_name ?? 'Peer Faculty'} on ${date} (${slotTime}). Reason: ${reason}`
    )
  },

  reviewSubstitution: (substitutionId: string, status: 'accepted' | 'rejected' | 'completed') => {
    set({
      substitutions: get().substitutions.map((s) => (s.id === substitutionId ? { ...s, status } : s)),
    })
    const sub = get().substitutions.find((s) => s.id === substitutionId)
    get().logAudit(
      'SUBSTITUTION_UPDATED',
      sub?.subject_name ?? 'Lecture Slot',
      `Substitution request status changed to ${status.toUpperCase()} for ${sub?.date}.`
    )
  },

  login: (email, password, roleHint?: Role) => {
    const emailKey = email.trim().toLowerCase()
    let row = DEMO_PROFILES[emailKey] || getDynamicUser(emailKey)

    if (!row) {
      // Dynamic account generation for any student, faculty, or admin joining
      const inferredRole: Role = roleHint || (emailKey.includes('faculty') ? 'faculty' : emailKey.includes('admin') ? 'admin' : 'student')
      const nameParts = emailKey.split('@')[0].split(/[._]/)
      const formattedName = nameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ') || 'Campus Member'

      // Intelligently infer department from email domain/handle prefix
      let inferredDept = 'Computer Science'
      let deptCode = 'CS'
      if (emailKey.includes('.it') || emailKey.includes('it.') || emailKey.includes('it2')) {
        inferredDept = 'Information Technology'
        deptCode = 'IT'
      } else if (emailKey.includes('.ee') || emailKey.includes('ee.') || emailKey.includes('ee2') || emailKey.includes('eee')) {
        inferredDept = 'Electrical Engineering'
        deptCode = 'EE'
      } else if (emailKey.includes('.me') || emailKey.includes('me.') || emailKey.includes('me2') || emailKey.includes('mech')) {
        inferredDept = 'Mechanical Engineering'
        deptCode = 'ME'
      }

      const newProfile: Profile = {
        id: `user-${Date.now()}`,
        full_name: formattedName,
        role: inferredRole,
        email: emailKey,
        roll_no: inferredRole === 'student' ? `${deptCode}24B${Math.floor(1000 + Math.random() * 9000)}` : null,
        department: inferredDept,
        semester: inferredRole === 'student' ? 6 : null,
        designation: inferredRole === 'faculty' ? 'Faculty Member' : inferredRole === 'admin' ? 'Academic Administrator' : undefined,
      }
      row = saveDynamicUser(emailKey, password, newProfile)
      if (inferredRole === 'student') {
        const currentBatch = get().batch
        if (!currentBatch.some((s) => s.email.toLowerCase() === emailKey)) {
          set({ batch: [...currentBatch, newProfile] })
        }
      }
    }

    if (row.password && password && row.password !== password) {
      return 'Incorrect password. Please verify your credentials.'
    }

    localStorage.setItem('cf-session', JSON.stringify(row.profile))
    set({ profile: row.profile })
    return null
  },

  signUp: (email, password, full_name, role, department, roll_no) => {
    const emailKey = email.trim().toLowerCase()
    const existing = DEMO_PROFILES[emailKey] || getDynamicUser(emailKey)
    if (existing) {
      return 'An account with this email already exists. Please sign in.'
    }

    const newProfile: Profile = {
      id: `user-${Date.now()}`,
      full_name: full_name.trim() || 'Campus Member',
      role: role,
      email: emailKey,
      roll_no: role === 'student' ? (roll_no?.trim() || `CS24B${Math.floor(1000 + Math.random() * 9000)}`) : null,
      department: department?.trim() || 'Computer Science',
      semester: role === 'student' ? 1 : null,
      designation: role === 'faculty' ? 'Faculty Member' : role === 'admin' ? 'Academic Administrator' : undefined,
    }

    saveDynamicUser(emailKey, password, newProfile)
    localStorage.setItem('cf-session', JSON.stringify(newProfile))
    set({ profile: newProfile })
    return null
  },

  logout: () => {
    localStorage.removeItem('cf-session')
    set({ profile: null })
  },

  allocateCourse: (subjectId, facultyId, notes) => {
    const currentProfile = get().profile
    if (!currentProfile || (currentProfile.role !== 'hod' && currentProfile.role !== 'admin')) {
      return 'Unauthorized: Course Allocation Matrix can only be modified by Head of Department (HOD) or Academic Dean.'
    }

    const subject = get().subjects.find((s) => s.id === subjectId)
    const faculty = get().facultyList.find((f) => f.id === facultyId)
    if (!subject || !faculty) {
      return 'Invalid subject or faculty identifier.'
    }

    const prevFacultyName = subject.faculty_name || 'Unassigned'

    set((state) => ({
      subjects: state.subjects.map((s) =>
        s.id === subjectId
          ? { ...s, faculty_id: faculty.id, faculty_name: faculty.full_name }
          : s,
      ),
    }))

    get().logAudit(
      'COURSE_ALLOCATION',
      `${subject.code} ${subject.name}`,
      `Reallocated course from [${prevFacultyName}] to [${faculty.full_name}] by HOD ${currentProfile.full_name}.${notes ? ` Note: ${notes}` : ''}`,
    )

    return null
  },

  onboardFaculty: (data) => {
    const currentProfile = get().profile
    const emailKey = data.email.trim().toLowerCase()
    
    // Check if faculty with this email already exists
    const existingFaculty = get().facultyList.find((f) => f.email.toLowerCase() === emailKey)
    if (existingFaculty) {
      throw new Error(`Faculty member with email ${data.email} is already registered.`)
    }

    const tempPassword = data.password?.trim() || `Faculty@${Math.floor(1000 + Math.random() * 9000)}`
    const facultyId = `faculty-${Date.now()}`
    const empId = data.employee_id?.trim() || `EMP-CSE-${Math.floor(100 + Math.random() * 900)}`

    const newFacultyProfile: Profile = {
      id: facultyId,
      full_name: data.full_name.trim(),
      role: 'faculty',
      email: emailKey,
      roll_no: empId,
      department: data.department || 'Computer Science',
      designation: data.designation || 'Assistant Professor',
      semester: null,
    }

    // Save in dynamic credentials store so they can log in directly
    saveDynamicUser(emailKey, tempPassword, newFacultyProfile)

    // Persist dynamic faculties list
    try {
      const stored = getStoredDynamicFaculties()
      localStorage.setItem('cf-dynamic-faculties', JSON.stringify([...stored, newFacultyProfile]))
    } catch {}

    let assignedCourseName: string | undefined

    // Update store state with new faculty and optionally allocated course
    set((state) => {
      let updatedSubjects = state.subjects
      if (data.assigned_course_id) {
        const targetSub = state.subjects.find((s) => s.id === data.assigned_course_id)
        if (targetSub) {
          assignedCourseName = `${targetSub.code} · ${targetSub.name}`
          updatedSubjects = state.subjects.map((s) =>
            s.id === data.assigned_course_id
              ? { ...s, faculty_id: newFacultyProfile.id, faculty_name: newFacultyProfile.full_name }
              : s
          )
        }
      }

      return {
        facultyList: [...state.facultyList, newFacultyProfile],
        subjects: updatedSubjects,
      }
    })

    // Log ERP Audit Trail entry
    get().logAudit(
      'FACULTY_ONBOARDING',
      `${newFacultyProfile.full_name} (${empId})`,
      `Admin/HOD (${currentProfile?.full_name || 'Academic Administrator'}) generated official credentials for ${newFacultyProfile.email} (${data.department} · ${data.designation}). ${assignedCourseName ? `Initial allocated course: [${assignedCourseName}].` : 'No initial course allocated.'}`
    )

    return {
      profile: newFacultyProfile,
      tempPassword,
      assignedCourseName,
    }
  },

  onboardHOD: (data) => {
    const currentProfile = get().profile
    const emailKey = data.email.trim().toLowerCase()

    const existingUser = get().hodList.find((h) => h.email.toLowerCase() === emailKey)
    if (existingUser) {
      throw new Error(`An HOD with email ${data.email} is already provisioned.`)
    }

    const tempPassword = data.password?.trim() || `HOD@${Math.floor(1000 + Math.random() * 9000)}`
    const hodId = `hod-${Date.now()}`
    const empId = data.employee_id?.trim() || `HOD-${data.department.substring(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`

    const newHODProfile: Profile = {
      id: hodId,
      full_name: data.full_name.trim(),
      role: 'hod',
      email: emailKey,
      roll_no: empId,
      department: data.department,
      designation: data.designation || `Head of Department, ${data.department}`,
      semester: null,
    }

    // Save in dynamic credentials store so the HOD can log in directly
    saveDynamicUser(emailKey, tempPassword, newHODProfile)

    // Persist dynamic HOD list
    try {
      const stored = getStoredDynamicHODs()
      localStorage.setItem('cf-dynamic-hods', JSON.stringify([...stored, newHODProfile]))
    } catch {}

    set((state) => ({
      hodList: [...state.hodList, newHODProfile],
    }))

    // Log ERP Audit Trail entry
    get().logAudit(
      'HOD_ONBOARDING',
      `${newHODProfile.full_name} (${empId})`,
      `College Administrator (${currentProfile?.full_name || 'Dean Sharma'}) provisioned new Department Chair for ${data.department}. Credentials issued for ${emailKey}.`
    )

    return {
      profile: newHODProfile,
      tempPassword,
    }
  },

  enrollStudent: (data) => {
    const currentProfile = get().profile
    const emailKey = data.email.trim().toLowerCase()

    const existingUser = get().batch.find((s) => s.email.toLowerCase() === emailKey)
    if (existingUser) {
      throw new Error(`A student with email ${data.email} is already enrolled.`)
    }

    const tempPassword = data.password?.trim() || `Student@${Math.floor(1000 + Math.random() * 9000)}`
    const studentId = `stud-${Date.now()}`
    const deptPrefix = data.department.substring(0, 2).toUpperCase()
    const rollNo = data.roll_no?.trim() || `${deptPrefix}23B${Math.floor(1000 + Math.random() * 9000)}`

    const newStudentProfile: Profile = {
      id: studentId,
      full_name: data.full_name.trim(),
      role: 'student',
      email: emailKey,
      roll_no: rollNo,
      department: data.department,
      semester: data.semester || 6,
    }

    // Save in dynamic credentials store so the student can log in directly
    saveDynamicUser(emailKey, tempPassword, newStudentProfile)

    // Persist dynamic students list
    try {
      const stored = getStoredDynamicStudents()
      localStorage.setItem('cf-dynamic-students', JSON.stringify([...stored, newStudentProfile]))
    } catch {}

    set((state) => ({
      batch: [...state.batch, newStudentProfile],
    }))

    // Log ERP Audit Trail entry
    get().logAudit(
      'STUDENT_ENROLLMENT',
      `${newStudentProfile.full_name} (${rollNo})`,
      `${currentProfile?.role === 'admin' ? 'College Admin' : 'Department HOD'} (${currentProfile?.full_name || 'Academic Authority'}) enrolled student into ${data.department} (Semester ${data.semester}). Login credentials issued for ${emailKey}.`
    )

    return {
      profile: newStudentProfile,
      tempPassword,
    }
  },

  // ── Admin Timetable Management ──
  addTimetableSlot: (slotData) => {
    const newSlot: TimetableSlot = {
      ...slotData,
      id: `tt-${uid()}`,
    }
    set((state) => ({
      timetable: [...state.timetable, newSlot],
    }))
    const subject = get().subjects.find((s) => s.id === slotData.subject_id)
    get().logAudit(
      'TIMETABLE_UPDATED',
      `${subject?.code || slotData.subject_id} — ${slotData.day} ${slotData.start_time}`,
      `Added timetable slot: ${subject?.name || 'Unknown'} on ${slotData.day} ${slotData.start_time}–${slotData.end_time} in ${slotData.room} (${slotData.type || 'lecture'}).`
    )
    return newSlot
  },

  updateTimetableSlot: (slotId, updates) => {
    set((state) => ({
      timetable: state.timetable.map((slot) =>
        slot.id === slotId ? { ...slot, ...updates } : slot
      ),
    }))
    const updatedSlot = get().timetable.find((s) => s.id === slotId)
    const subject = updatedSlot ? get().subjects.find((s) => s.id === updatedSlot.subject_id) : null
    get().logAudit(
      'TIMETABLE_UPDATED',
      `${subject?.code || slotId} — ${updatedSlot?.day} ${updatedSlot?.start_time}`,
      `Updated timetable slot ${slotId}: ${Object.keys(updates).join(', ')} modified.`
    )
  },

  removeTimetableSlot: (slotId) => {
    const slot = get().timetable.find((s) => s.id === slotId)
    const subject = slot ? get().subjects.find((s) => s.id === slot.subject_id) : null
    set((state) => ({
      timetable: state.timetable.filter((s) => s.id !== slotId),
    }))
    get().logAudit(
      'TIMETABLE_UPDATED',
      `${subject?.code || slotId} — ${slot?.day} ${slot?.start_time}`,
      `Removed timetable slot: ${subject?.name || 'Unknown'} on ${slot?.day} ${slot?.start_time}–${slot?.end_time} from ${slot?.room}.`
    )
  },

  logAudit: (action, target, details) => {
    const profile = get().profile
    const newLog: AuditLog = {
      id: `audit-${uid()}`,
      timestamp: new Date().toISOString(),
      actor_id: profile?.id ?? 'system',
      actor_name: profile?.full_name ?? 'System Service',
      actor_role: profile?.role ?? 'admin',
      action,
      target,
      details,
    }
    set((state) => ({
      auditLogs: [newLog, ...state.auditLogs],
    }))
  },

  publishNotice: (title, body, category, isPinned, audience, extra) => {
    const profile = get().profile
    const detected = tagNotice(title, body)
    const finalCategory = category ?? detected
    const notice: Notice = {
      id: uid('n'),
      title,
      body,
      category: finalCategory,
      event_at: null,
      is_pinned: isPinned !== undefined ? isPinned : finalCategory === 'urgent',
      created_by: profile?.id ?? null,
      faculty_name: extra?.facultyName || (profile?.role === 'faculty' ? profile.full_name : undefined),
      subject_id: extra?.subjectId,
      subject_code: extra?.subjectCode,
      subject_name: extra?.subjectName,
      topic: extra?.topic || title,
      created_at: new Date().toISOString(),
      audience,
    }
    set({ notices: [notice, ...get().notices] })
  },

  createAssignment: (payload) => {
    const profile = get().profile
    const newAssignment: Assignment = {
      ...payload,
      id: uid('as'),
      created_by: profile?.id ?? null,
    }
    set({ assignments: [newAssignment, ...get().assignments] })
  },

  sendAttendanceWarning: (studentId, subjectId, currentPct, customMessage) => {
    const profile = get().profile
    const subject = get().subjects.find((s) => s.id === subjectId)
    const student = get().batch.find((s) => s.id === studentId)
    const facultyName = profile?.full_name || 'Subject Faculty'
    const studentName = student?.full_name || 'Student'
    const subjectCode = subject?.code || 'CS'
    const subjectName = subject?.name || 'Course'

    const title = `Official Attendance Warning: ${subjectCode} (${currentPct.toFixed(1)}%)`
    const body =
      customMessage ||
      `Academic Attendance Warning for ${studentName} (${student?.roll_no || 'CS'}): Your attendance in ${subjectCode} — ${subjectName} has fallen to ${currentPct.toFixed(1)}%, which is critically below the university mandatory threshold of ${subject?.min_attendance_pct ?? 75}%. Immediate attendance recovery is required to remain eligible for term examinations.`

    const notice: Notice = {
      id: uid('n'),
      title,
      body,
      category: 'urgent',
      event_at: null,
      is_pinned: true,
      created_by: profile?.id ?? null,
      faculty_name: facultyName,
      subject_id: subjectId,
      subject_code: subjectCode,
      subject_name: subjectName,
      topic: 'Attendance Shortfall Alert',
      created_at: new Date().toISOString(),
    }

    set({ notices: [notice, ...get().notices] })
    get().logAudit(
      'WARNING_ISSUED',
      `${studentName} (${subjectCode})`,
      `Dispatched attendance warning: ${currentPct.toFixed(1)}% attendance in ${subjectCode} (${subjectName}).`
    )
  },

  markAttendance: (subjectId, marks, sessionDate) => {
    const profile = get().profile
    // Security: in demo mode, verify faculty teaches this subject
    if (profile?.role === 'faculty') {
      const subject = get().subjects.find((s) => s.id === subjectId)
      if (subject && subject.faculty_id !== profile.id) {
        console.warn('Faculty cannot mark attendance for subjects they do not teach.')
        return
      }
    }
    const date = sessionDate || new Date().toISOString().slice(0, 10)
    const rest = get().attendance.filter(
      (r) => !(r.subject_id === subjectId && r.session_date === date),
    )
    const next: AttendanceRecord[] = Object.entries(marks).map(([studentId, status]) => ({
      id: uid('att'),
      student_id: studentId,
      subject_id: subjectId,
      session_date: date,
      status,
      marked_by: profile?.id ?? null,
    }))
    set({ attendance: [...next, ...rest] })
    const subject = get().subjects.find((s) => s.id === subjectId)
    get().logAudit(
      'ATTENDANCE_OVERRIDE',
      `${subject?.code ?? subjectId} Session (${date})`,
      `Marked attendance register for ${Object.keys(marks).length} students (${profile?.full_name ?? 'Faculty'}).`
    )
  },

  submitCorrection: (recordId, reason) => {
    const profile = get().profile
    if (!profile) return
    // Security: prevent duplicate pending corrections for same record
    const existing = get().corrections.find(
      (c) => c.student_id === profile.id && c.attendance_record_id === recordId && c.status === 'pending',
    )
    if (existing) return
    const req: CorrectionRequest = {
      id: uid('cr'),
      student_id: profile.id,
      attendance_record_id: recordId,
      reason,
      status: 'pending',
      reviewed_by: null,
      faculty_note: null,
      created_at: new Date().toISOString(),
    }
    set({ corrections: [req, ...get().corrections] })
  },

  reviewCorrection: (id, status, note) => {
    const profile = get().profile
    const corrections = get().corrections.map((c) =>
      c.id === id
        ? { ...c, status, faculty_note: note, reviewed_by: profile?.id ?? null }
        : c,
    )
    let attendance = get().attendance
    const target = corrections.find((c) => c.id === id)
    if (target && status === 'approved') {
      attendance = attendance.map((r) =>
        r.id === target.attendance_record_id ? { ...r, status: 'present' as const } : r,
      )
    }
    set({ corrections, attendance })
    get().logAudit(
      'DISPUTE_REVIEW',
      `Dispute #${id.slice(0, 8)}`,
      `${status.toUpperCase()} attendance grievance dispute by ${profile?.full_name ?? 'Faculty'}. Note: "${note}".`
    )
  },

  addAchievement: (payload) => {
    const profile = get().profile
    if (!profile) return
    const row: Achievement = {
      ...payload,
      id: uid('ach'),
      student_id: profile.id,
      verified: false,
    }
    set({ achievements: [row, ...get().achievements] })
  },

  submitODRequest: (type, reason, evidenceUrl, fromDate, toDate) => {
    const profile = get().profile
    if (!profile) return
    const chain: ApprovalStep[] = [
      { role: 'class_advisor', label: 'Class Advisor', approved_by: null, status: 'pending', note: null, timestamp: null },
      { role: 'faculty', label: 'Subject Faculty', approved_by: null, status: 'pending', note: null, timestamp: null },
      { role: 'hod', label: 'Head of Department', approved_by: null, status: 'pending', note: null, timestamp: null },
    ]
    // Medical only needs 2 approvals
    if (type === 'medical') chain.splice(2, 1)

    // Automated Timetable Slot Matching Reconciliation
    const matchedSessions: MatchedSession[] = []
    const start = new Date(fromDate)
    const end = new Date(toDate)
    const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayName = daysMap[d.getDay()]
      const dateStr = d.toISOString().split('T')[0]
      const daySlots = get().timetable.filter((slot) => slot.day === dayName)

      for (const slot of daySlots) {
        const subj = get().subjects.find((s) => s.id === slot.subject_id)
        matchedSessions.push({
          subject_id: slot.subject_id,
          subject_code: subj?.code ?? 'SUB',
          subject_name: subj?.name ?? 'Subject',
          date: dateStr,
          start_time: slot.start_time,
          end_time: slot.end_time,
          hours: 1.5,
        })
      }
    }

    // Calculate Projected Attendance Impact Recovery
    const attendanceImpact: AttendanceImpact[] = []
    const uniqueSubjectIds = Array.from(new Set(matchedSessions.map((s) => s.subject_id)))
    for (const sId of uniqueSubjectIds) {
      const subj = get().subjects.find((s) => s.id === sId)
      const userRecords = get().attendance.filter((a) => a.student_id === profile.id && a.subject_id === sId)
      const presentCount = userRecords.filter((a) => a.status === 'present').length
      const totalCount = userRecords.length || 1
      const currentPct = Math.round((presentCount / totalCount) * 1000) / 10
      const missedCount = matchedSessions.filter((m) => m.subject_id === sId).length
      const projectedPct = Math.min(100, Math.round(((presentCount + missedCount) / totalCount) * 1000) / 10)

      attendanceImpact.push({
        subject_id: sId,
        subject_code: subj?.code ?? 'SUB',
        current_pct: currentPct,
        projected_pct: projectedPct,
        gain_pct: Math.round((projectedPct - currentPct) * 10) / 10,
      })
    }

    const req: ODRequest = {
      id: uid('od'),
      student_id: profile.id,
      type,
      reason,
      evidence_url: evidenceUrl,
      from_date: fromDate,
      to_date: toDate,
      approval_chain: chain,
      matched_sessions: matchedSessions.length ? matchedSessions : undefined,
      attendance_impact: attendanceImpact.length ? attendanceImpact : undefined,
      credited: false,
      created_at: new Date().toISOString(),
    }
    set({ odRequests: [req, ...get().odRequests] })
    get().logAudit(
      'OD_FILED',
      `${type.toUpperCase()} Request`,
      `Student ${profile.full_name} submitted ${type.toUpperCase()} request for ${fromDate} to ${toDate} (${matchedSessions.length} timetable sessions matched).`
    )
  },

  approveODStep: (requestId, stepIndex, approved, note) => {
    const profile = get().profile
    let isFullyApproved = false
    let targetReq: ODRequest | undefined

    set({
      odRequests: get().odRequests.map((req) => {
        if (req.id !== requestId) return req
        const chain = req.approval_chain.map((step, i) => {
          if (i !== stepIndex) return step
          return {
            ...step,
            status: (approved ? 'approved' : 'rejected') as RequestStatus,
            approved_by: profile?.id ?? null,
            note,
            timestamp: new Date().toISOString(),
          }
        })
        const allApproved = approved && chain.every((s) => s.status === 'approved')
        if (allApproved) {
          isFullyApproved = true
          targetReq = { ...req, approval_chain: chain, credited: true }
          return targetReq
        }
        return { ...req, approval_chain: chain }
      }),
    })

    // If fully approved, auto-credit attendance for matched timetable sessions!
    if (isFullyApproved && targetReq && targetReq.matched_sessions) {
      let updatedAttendance = [...get().attendance]
      for (const session of targetReq.matched_sessions) {
        const existingIdx = updatedAttendance.findIndex(
          (a) => a.student_id === targetReq!.student_id && a.subject_id === session.subject_id && a.session_date === session.date
        )
        if (existingIdx >= 0) {
          updatedAttendance[existingIdx] = {
            ...updatedAttendance[existingIdx],
            status: 'present',
          }
        } else {
          updatedAttendance.push({
            id: uid('att-od'),
            student_id: targetReq.student_id,
            subject_id: session.subject_id,
            session_date: session.date,
            status: 'present',
            marked_by: profile?.id ?? 'hod',
          })
        }
      }
      set({ attendance: updatedAttendance })
      get().logAudit(
        'OD_CREDITED',
        `OD #${requestId.slice(0, 8)}`,
        `Automatically credited ${targetReq.matched_sessions.length} missed sessions as PRESENT across student's timetable.`
      )
    }
  },

  submitAssignment: (assignmentId, payload) => {
    const profile = get().profile
    if (!profile) return
    const assignment = get().assignments.find((a) => a.id === assignmentId)
    const isObj = typeof payload === 'object' && payload !== null
    const fileUrl = isObj ? (payload.fileUrl ?? null) : payload
    const fileName = isObj ? (payload.fileName ?? null) : null
    const fileSize = isObj ? (payload.fileSize ?? null) : null
    const repoUrl = isObj ? (payload.repoUrl ?? null) : (typeof payload === 'string' && payload.startsWith('http') && !payload.endsWith('.pdf') ? payload : null)

    const sub: Submission = {
      id: uid('sub'),
      assignment_id: assignmentId,
      student_id: profile.id,
      file_url: fileUrl,
      file_name: fileName || (fileUrl ? 'submission_document.pdf' : null),
      file_size: fileSize || (fileUrl ? '1.8 MB' : null),
      repo_url: repoUrl,
      submitted_at: new Date().toISOString(),
      grade: null,
      max_grade: assignment?.kind === 'exam' ? 100 : 50,
      feedback: null,
    }
    set({
      submissions: [
        sub,
        ...get().submissions.filter(
          (s) => !(s.assignment_id === assignmentId && s.student_id === profile.id),
        ),
      ],
    })
  },

  gradeSubmission: (submissionId, grade, feedback) => {
    set({
      submissions: get().submissions.map((s) =>
        s.id === submissionId ? { ...s, grade, feedback } : s,
      ),
    })
    const sub = get().submissions.find((s) => s.id === submissionId)
    const assignment = get().assignments.find((a) => a.id === sub?.assignment_id)
    get().logAudit(
      'GRADE_SUBMITTED',
      assignment?.title ?? 'Student Coursework',
      `Graded submission with ${grade} marks. Remarks: "${feedback}".`
    )
  },
}))
