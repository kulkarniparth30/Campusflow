import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Users,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  ShieldAlert,
  Search,
  Sparkles,
  BarChart3,
  FileCheck2,
  UserCheck,
  FileSignature,
  UserPlus,
  KeyRound,
  Copy,
  RefreshCw,
  Check,
  Lock,
  Filter,
  UserCog,
  X,
} from 'lucide-react'
import type { Subject, Profile, AttendanceRecord, AuditLog, Role } from '../../types'
import { DEMO_CO_ATTAINMENT, DEMO_BLOOMS_DISTRIBUTION } from '../../data/demo'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { useCampusStore } from '../../store/campus'
import { useToast } from '../ui/toast'
import { cn } from '../../lib/utils'

interface HODDashboardProps {
  subjects: Subject[]
  students: Profile[]
  attendance: AttendanceRecord[]
  faculties: Profile[]
  hodList?: Profile[]
  auditLogs: AuditLog[]
  role?: Role
  currentProfile?: Profile
  onAllocateCourse: (subjectId: string, facultyId: string, notes?: string) => string | null
  onOnboardFaculty?: (data: {
    full_name: string
    email: string
    department: string
    designation: string
    employee_id?: string
    assigned_course_id?: string
    password?: string
  }) => { profile: Profile; tempPassword: string; assignedCourseName?: string }
  onOnboardHOD?: (data: {
    full_name: string
    email: string
    department: string
    designation: string
    employee_id?: string
    password?: string
  }) => { profile: Profile; tempPassword: string }
  onEnrollStudent?: (data: {
    full_name: string
    email: string
    department: string
    semester: number
    roll_no?: string
    password?: string
  }) => { profile: Profile; tempPassword: string }
}

type HODTab = 'allocation' | 'workload' | 'attendance' | 'obe' | 'substitutions' | 'audit' | 'hod-roster' | 'student-registry'

export function HODDashboard({
  subjects,
  students,
  attendance,
  faculties,
  hodList = [],
  auditLogs,
  role = 'hod',
  currentProfile,
  onAllocateCourse,
  onOnboardFaculty,
  onOnboardHOD,
  onEnrollStudent,
}: HODDashboardProps) {
  const isAdmin = role === 'admin'

  // Extract all distinct departments across the college
  const departments = useMemo(() => {
    const depts = new Set<string>()
    subjects.forEach((s) => {
      if (s.department) depts.add(s.department)
    })
    faculties.forEach((f) => {
      if (f.department) depts.add(f.department)
    })
    hodList.forEach((h) => {
      if (h.department) depts.add(h.department)
    })
    return Array.from(depts)
  }, [subjects, faculties, hodList])

  // Department state:
  // For Admin: user can switch between 'All' or individual departments
  // For HOD: locked to HOD's own department
  const [selectedDept, setSelectedDept] = useState<string>(() => {
    if (isAdmin) return 'All'
    return currentProfile?.department || 'Computer Science'
  })

  // Scoped lists based on selected department
  const scopedSubjects = useMemo(() => {
    if (selectedDept === 'All') return subjects
    return subjects.filter((s) => s.department === selectedDept)
  }, [subjects, selectedDept])

  const scopedFaculties = useMemo(() => {
    if (selectedDept === 'All') return faculties
    return faculties.filter((f) => f.department === selectedDept)
  }, [faculties, selectedDept])

  const scopedStudents = useMemo(() => {
    if (selectedDept === 'All') return students
    return students.filter((st) => !st.department || st.department === selectedDept)
  }, [students, selectedDept])

  const scopedAttendance = useMemo(() => {
    if (selectedDept === 'All') return attendance
    const subjectIdSet = new Set(scopedSubjects.map((s) => s.id))
    return attendance.filter((a) => subjectIdSet.has(a.subject_id))
  }, [attendance, scopedSubjects, selectedDept])

  // Find active HOD for the chosen department
  const activeHODForDept = useMemo(() => {
    if (selectedDept === 'All') return null
    return hodList.find((h) => h.department === selectedDept)
  }, [hodList, selectedDept])

  const [activeTab, setActiveTab] = useState<HODTab>('allocation')
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [targetFacultyId, setTargetFacultyId] = useState<string>('')
  const [allocationNotes, setAllocationNotes] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [auditSearch, setAuditSearch] = useState('')
  const [auditFilter, setAuditFilter] = useState<string>('ALL')

  // Faculty Onboarding & Credential Generation states
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false)
  const [facultyForm, setFacultyForm] = useState({
    fullName: '',
    email: '',
    department: selectedDept === 'All' ? 'Computer Science' : selectedDept,
    designation: 'Assistant Professor',
    employeeId: '',
    assignedCourseId: '',
    password: '',
  })
  const [generatedSlip, setGeneratedSlip] = useState<{
    profile: Profile
    tempPassword: string
    assignedCourseName?: string
  } | null>(null)

  // HOD Onboarding & Credential Generation states (College Admin exclusive)
  const [isHODModalOpen, setIsHODModalOpen] = useState(false)
  const [hodForm, setHODForm] = useState({
    fullName: '',
    email: '',
    department: 'Information Technology',
    designation: 'Head of Department & Academic Chair',
    employeeId: '',
    password: '',
  })
  const [generatedHODSlip, setGeneratedHODSlip] = useState<{
    profile: Profile
    tempPassword: string
  } | null>(null)

  // Student Enrollment & Registry states
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false)
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    email: '',
    department: selectedDept === 'All' ? 'Computer Science' : selectedDept,
    semester: 6,
    rollNo: '',
    password: '',
  })
  const [generatedStudentSlip, setGeneratedStudentSlip] = useState<{
    profile: Profile
    tempPassword: string
  } | null>(null)
  const [studentSearch, setStudentSearch] = useState('')
  const [studentSemesterFilter, setStudentSemesterFilter] = useState<string>('ALL')

  const [copied, setCopied] = useState(false)

  const { toast } = useToast()
  const sendAttendanceWarning = useCampusStore((s) => s.sendAttendanceWarning)
  const attendanceLoans = useCampusStore((s) => s.attendanceLoans)
  const reviewAttendanceLoan = useCampusStore((s) => s.reviewAttendanceLoan)
  const substitutions = useCampusStore((s) => s.substitutions)
  const reviewSubstitution = useCampusStore((s) => s.reviewSubstitution)

  // Compute departmental high-level metrics from scoped lists
  const totalCourses = scopedSubjects.length
  const totalFaculties = scopedFaculties.length
  const totalStudents = scopedStudents.length

  // Calculate student count by department across the institution
  const deptStudentBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    departments.forEach((d) => {
      counts[d] = students.filter((s) => s.department === d).length
    })
    return counts
  }, [departments, students])

  // Filtered student list for student directory
  const filteredStudents = useMemo(() => {
    return scopedStudents.filter((stud) => {
      const matchesSearch =
        stud.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        stud.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
        (stud.roll_no && stud.roll_no.toLowerCase().includes(studentSearch.toLowerCase()))
      const matchesSem =
        studentSemesterFilter === 'ALL' || String(stud.semester) === studentSemesterFilter
      return matchesSearch && matchesSem
    })
  }, [scopedStudents, studentSearch, studentSemesterFilter])

  // Calculate departmental average attendance
  const avgDepartmentAttendance = useMemo(() => {
    if (scopedAttendance.length === 0) return 100
    const presentCount = scopedAttendance.filter((r) => r.status === 'present' || r.status === 'late').length
    return Math.round((presentCount / scopedAttendance.length) * 1000) / 10
  }, [scopedAttendance])

  // Identify students with <75% attendance across scoped subjects
  const atRiskStudents = useMemo(() => {
    const list: {
      student: Profile
      subject: Subject
      pct: number
      attended: number
      total: number
    }[] = []

    scopedStudents.forEach((stud) => {
      scopedSubjects.forEach((sub) => {
        const records = scopedAttendance.filter((r) => r.student_id === stud.id && r.subject_id === sub.id)
        if (records.length > 0) {
          const attended = records.filter((r) => r.status === 'present' || r.status === 'late').length
          const pct = Math.round((attended / records.length) * 1000) / 10
          if (pct < 75) {
            list.push({
              student: stud,
              subject: sub,
              pct,
              attended,
              total: records.length,
            })
          }
        }
      })
    })
    return list.sort((a, b) => a.pct - b.pct)
  }, [scopedStudents, scopedSubjects, scopedAttendance])

  // Faculty workload calculation
  const facultyWorkloads = useMemo(() => {
    return scopedFaculties.map((fac) => {
      const assigned = scopedSubjects.filter((s) => s.faculty_id === fac.id)
      const totalCredits = assigned.reduce((acc, s) => acc + (s.credits ?? 3), 0)
      const totalHours = assigned.reduce((acc, s) => acc + (s.contact_hours_per_week ?? 3), 0)
      return {
        faculty: fac,
        assigned,
        totalCredits,
        totalHours,
        status: totalHours > 12 ? 'heavy' : totalHours === 0 ? 'unassigned' : 'optimal',
      }
    })
  }, [scopedFaculties, scopedSubjects])

  // Handle allocation submission
  const handleConfirmAllocation = () => {
    if (!selectedSubject || !targetFacultyId) return
    const err = onAllocateCourse(selectedSubject.id, targetFacultyId, allocationNotes)
    if (err) {
      toast(err, 'error')
      return
    }
    const chosenFaculty = faculties.find((f) => f.id === targetFacultyId)
    toast(
      `Course ${selectedSubject.code} allocated to ${chosenFaculty?.full_name || 'faculty'} successfully.`,
      'success'
    )
    setIsModalOpen(false)
    setSelectedSubject(null)
    setTargetFacultyId('')
    setAllocationNotes('')
  }

  // Filtered audit logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        log.target.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.actor_name.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.details.toLowerCase().includes(auditSearch.toLowerCase())
      const matchesFilter = auditFilter === 'ALL' || log.action === auditFilter
      return matchesSearch && matchesFilter
    })
  }, [auditLogs, auditSearch, auditFilter])

  const openAllocationModal = (subject: Subject) => {
    setSelectedSubject(subject)
    setTargetFacultyId(subject.faculty_id || scopedFaculties[0]?.id || faculties[0]?.id || '')
    setAllocationNotes('')
    setIsModalOpen(true)
  }

  const generateNewPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let token = ''
    for (let i = 0; i < 4; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return `Faculty@${token}23`
  }

  const generateNewHODPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let token = ''
    for (let i = 0; i < 4; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return `Chair@${token}2026`
  }

  const openOnboardModal = (preselectedCourseId?: string) => {
    const activeDept = selectedDept === 'All' ? 'Computer Science' : selectedDept
    const deptPrefix = activeDept.substring(0, 3).toUpperCase()
    const randomEmp = `EMP-${deptPrefix}-${Math.floor(100 + Math.random() * 900)}`
    setFacultyForm({
      fullName: '',
      email: '',
      department: activeDept,
      designation: 'Assistant Professor',
      employeeId: randomEmp,
      assignedCourseId: preselectedCourseId || '',
      password: generateNewPassword(),
    })
    setGeneratedSlip(null)
    setCopied(false)
    setIsOnboardModalOpen(true)
  }

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!facultyForm.fullName.trim()) {
      toast('Please enter the faculty full name.', 'error')
      return
    }
    if (!facultyForm.email.trim() || !facultyForm.email.includes('@')) {
      toast('Please provide a valid institutional email address.', 'error')
      return
    }

    if (!onOnboardFaculty) {
      toast('Faculty onboarding service unavailable.', 'error')
      return
    }

    try {
      const result = onOnboardFaculty({
        full_name: facultyForm.fullName,
        email: facultyForm.email,
        department: facultyForm.department,
        designation: facultyForm.designation,
        employee_id: facultyForm.employeeId,
        assigned_course_id: facultyForm.assignedCourseId || undefined,
        password: facultyForm.password,
      })
      setGeneratedSlip(result)
      toast(`Official credentials generated for ${result.profile.full_name}!`, 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate credentials'
      toast(msg, 'error')
    }
  }

  const copyCredentials = () => {
    if (!generatedSlip) return
    const text = `CampusFlow Official Faculty Credentials\n--------------------------------------\nFaculty Name: ${generatedSlip.profile.full_name}\nEmployee ID: ${generatedSlip.profile.roll_no}\nDepartment: ${generatedSlip.profile.department}\nDesignation: ${generatedSlip.profile.designation}\nPortal Login Email: ${generatedSlip.profile.email}\nTemporary Password: ${generatedSlip.tempPassword}${generatedSlip.assignedCourseName ? `\nAssigned Curriculum: ${generatedSlip.assignedCourseName}` : ''}\nLogin URL: ${window.location.origin}\nNote: Please sign in and change your password on first login.`
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast('Credentials copied to clipboard!', 'success')
    setTimeout(() => setCopied(false), 2500)
  }

  // HOD Onboarding handlers (College Admin)
  const openOnboardHODModal = (targetDept?: string) => {
    const dept = targetDept || (selectedDept === 'All' ? 'Information Technology' : selectedDept)
    const deptPrefix = dept.substring(0, 3).toUpperCase()
    const randomEmp = `HOD-${deptPrefix}-001`
    setHODForm({
      fullName: '',
      email: '',
      department: dept,
      designation: 'Head of Department & Academic Chair',
      employeeId: randomEmp,
      password: generateNewHODPassword(),
    })
    setGeneratedHODSlip(null)
    setCopied(false)
    setIsHODModalOpen(true)
  }

  const handleOnboardHODSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!hodForm.fullName.trim()) {
      toast('Please enter the HOD full name.', 'error')
      return
    }
    if (!hodForm.email.trim() || !hodForm.email.includes('@')) {
      toast('Please provide a valid institutional email address.', 'error')
      return
    }

    if (!onOnboardHOD) {
      toast('HOD provisioning service unavailable.', 'error')
      return
    }

    try {
      const result = onOnboardHOD({
        full_name: hodForm.fullName,
        email: hodForm.email,
        department: hodForm.department,
        designation: hodForm.designation,
        employee_id: hodForm.employeeId,
        password: hodForm.password,
      })
      setGeneratedHODSlip(result)
      toast(`Official HOD credentials provisioned for ${result.profile.full_name}!`, 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to provision HOD'
      toast(msg, 'error')
    }
  }

  const copyHODCredentials = () => {
    if (!generatedHODSlip) return
    const text = `CampusFlow Official HOD Provisioning Credentials\n-------------------------------------------------\nDepartment Chair: ${generatedHODSlip.profile.full_name}\nEmployee / Chair ID: ${generatedHODSlip.profile.roll_no}\nDepartment: ${generatedHODSlip.profile.department}\nRole: Head of Department (Level 2 Governance)\nLogin Email: ${generatedHODSlip.profile.email}\nTemporary Password: ${generatedHODSlip.tempPassword}\nLogin URL: ${window.location.origin}\nNote: Use this credential at the HOD Portal to monitor departmental attendance, curriculum and faculty.`
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast('HOD Credentials copied to clipboard!', 'success')
    setTimeout(() => setCopied(false), 2500)
  }

  // Student Enrollment handlers
  const generateNewStudentPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let token = ''
    for (let i = 0; i < 4; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return `Student@${token}26`
  }

  const openEnrollStudentModal = (targetDept?: string) => {
    const dept = targetDept || (selectedDept === 'All' ? 'Computer Science' : selectedDept)
    const deptPrefix = dept.substring(0, 2).toUpperCase()
    const randomRoll = `${deptPrefix}23B${Math.floor(1000 + Math.random() * 9000)}`
    setStudentForm({
      fullName: '',
      email: '',
      department: dept,
      semester: 6,
      rollNo: randomRoll,
      password: generateNewStudentPassword(),
    })
    setGeneratedStudentSlip(null)
    setCopied(false)
    setIsStudentModalOpen(true)
  }

  const handleEnrollStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentForm.fullName.trim()) {
      toast('Please enter the student full name.', 'error')
      return
    }
    if (!studentForm.email.trim() || !studentForm.email.includes('@')) {
      toast('Please provide a valid student email address.', 'error')
      return
    }

    if (!onEnrollStudent) {
      toast('Student enrollment service unavailable.', 'error')
      return
    }

    try {
      const result = onEnrollStudent({
        full_name: studentForm.fullName,
        email: studentForm.email,
        department: studentForm.department,
        semester: Number(studentForm.semester) || 6,
        roll_no: studentForm.rollNo,
        password: studentForm.password,
      })
      setGeneratedStudentSlip(result)
      toast(`Official student credentials enrolled for ${result.profile.full_name}!`, 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to enroll student'
      toast(msg, 'error')
    }
  }

  const copyStudentCredentials = () => {
    if (!generatedStudentSlip) return
    const text = `CampusFlow Official Student Enrollment Credentials\n-------------------------------------------------\nStudent Name: ${generatedStudentSlip.profile.full_name}\nRoll / Registration No: ${generatedStudentSlip.profile.roll_no}\nDepartment: ${generatedStudentSlip.profile.department}\nSemester: Semester ${generatedStudentSlip.profile.semester || 6}\nStudent Portal Login: ${generatedStudentSlip.profile.email}\nTemporary Password: ${generatedStudentSlip.tempPassword}\nLogin URL: ${window.location.origin}\nNote: Log in to view your timetable, attendance monitor, and submit coursework.`
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast('Student Credentials copied to clipboard!', 'success')
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="space-y-6">
      {/* Institutional College Admin / Department Header */}
      <div className="relative overflow-hidden rounded-3xl border border-[#E2E6ED] bg-white/90 backdrop-blur-md p-6 sm:p-8 shadow-sm">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-[#B8CCF0]/30 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#DCE7F8] text-[#2563EB] border border-[#B8CCF0]">
                <Building2 size={22} />
              </span>
              <Badge tone={isAdmin ? 'indigo' : 'cyan'} className="tracking-wider uppercase text-[10px] font-bold">
                {isAdmin ? 'CampusFlow Central ERP · College Academic Administration' : 'ERP Academic Governance · Department HOD'}
              </Badge>
              {selectedDept !== 'All' && (
                <Badge tone="blue" className="text-[10px] font-bold">
                  {selectedDept}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1F1F1F] tracking-tight">
              {isAdmin
                ? selectedDept === 'All'
                  ? 'College Academic Administration & Institutional Governance'
                  : `Department of ${selectedDept}`
                : `Department of ${currentProfile?.department || 'Computer Science & Engineering'}`}
            </h1>
            <p className="text-xs sm:text-sm text-[#666666] flex flex-wrap items-center gap-2">
              <GraduationCap size={15} className="text-[#2563EB]" />
              {isAdmin ? (
                <>
                  Institutional Dean: <strong className="text-[#1F1F1F]">Dean Sharma, Ph.D.</strong>
                  <span className="text-[#E2E6ED]">·</span>
                  <span className="text-[#666666]">Admin ID: <strong className="font-mono text-[#1F1F1F]">ADMIN-001</strong></span>
                  {selectedDept !== 'All' && activeHODForDept && (
                    <>
                      <span className="text-[#E2E6ED]">·</span>
                      <span>Department Chair: <strong className="text-[#2563EB]">{activeHODForDept.full_name}</strong></span>
                    </>
                  )}
                </>
              ) : (
                <>
                  Department Head: <strong className="text-[#1F1F1F]">{currentProfile?.full_name || 'Prof. Ramanathan Sharma, Ph.D.'}</strong>
                  <span className="text-[#E2E6ED]">·</span>
                  <span className="text-[#2563EB] font-mono">Academic Year 2025-2026 (Sem 6)</span>
                </>
              )}
            </p>
          </div>

          {/* Department Selector & Quick Actions */}
          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
            {isAdmin && (
              <div className="flex items-center gap-2 bg-[#F5F6F8] p-1.5 rounded-2xl border border-[#E2E6ED]">
                <Filter size={14} className="text-[#666666] ml-2" />
                <span className="text-xs font-semibold text-[#666666] hidden sm:inline">Scope:</span>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="text-xs font-bold bg-white text-[#1F1F1F] border border-[#E2E6ED] rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 cursor-pointer shadow-sm"
                >
                  <option value="All">All Departments ({departments.length})</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isAdmin && (
              <Button
                size="sm"
                onClick={() => openOnboardHODModal()}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs h-9 shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <UserCog size={14} />
                Provision Department HOD
              </Button>
            )}

            <Badge tone="indigo" className="px-3 py-1.5 text-xs font-semibold">
              <ShieldCheck size={14} className="mr-1.5 text-indigo-600" />
              {isAdmin ? 'Institutional College Authority' : 'Allocation Matrix Authority Active'}
            </Badge>
          </div>
        </div>

        {/* Telemetry Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-[#E2E6ED]">
          <div className="rounded-2xl border border-[#E2E6ED] bg-[#F5F6F8] p-3.5">
            <p className="text-[11px] text-[#666666] font-medium">
              {selectedDept === 'All' ? 'Total College Courses' : 'Department Courses'}
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-black text-[#1F1F1F]">{totalCourses}</p>
              <span className="text-[10px] text-emerald-700 font-medium">100% Assigned</span>
            </div>
          </div>
          <div className="rounded-2xl border border-[#B8CCF0] bg-[#DCE7F8]/40 p-3.5">
            <p className="text-[11px] text-[#2563EB] font-medium">
              {selectedDept === 'All' ? 'Total Faculty Strength' : 'Faculty Strength'}
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-black text-[#2563EB]">{totalFaculties}</p>
              <span className="text-[10px] text-[#666666] font-medium">Active Teachers</span>
            </div>
          </div>
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-3.5">
            <p className="text-[11px] text-indigo-700 font-medium">
              {selectedDept === 'All' ? 'Total Enrolled Students' : 'Department Students'}
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-black text-indigo-900">{totalStudents}</p>
              <span className="text-[10px] text-indigo-600 font-medium">Active Batch</span>
            </div>
          </div>
          <div className="rounded-2xl border border-[#E2E6ED] bg-[#F5F6F8] p-3.5">
            <p className="text-[11px] text-[#666666] font-medium">
              {selectedDept === 'All' ? 'Campus Attendance Avg' : 'Dept. Attendance Avg'}
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-black text-emerald-700">{avgDepartmentAttendance}%</p>
              <span className="text-[10px] text-[#666666] font-medium">Threshold: 75%</span>
            </div>
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5">
            <p className="text-[11px] text-red-700 font-medium">Attendance Shortfall</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className={cn('text-2xl font-black', atRiskStudents.length > 0 ? 'text-red-700' : 'text-[#1F1F1F]')}>
                {atRiskStudents.length}
              </p>
              <span className="text-[10px] text-red-600 font-medium">Students &lt;75%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E2E6ED] pb-3 overflow-x-auto">
        {isAdmin && (
          <button
            onClick={() => setActiveTab('hod-roster')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'hod-roster'
                ? 'bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/20'
                : 'text-[#666666] hover:text-[#1F1F1F] hover:bg-[#F5F6F8]'
            )}
          >
            <Building2 size={15} />
            Department HOD Directory ({hodList.length})
          </button>
        )}
        <button
          onClick={() => setActiveTab('student-registry')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'student-registry'
              ? 'bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/20'
              : 'text-[#666666] hover:text-[#1F1F1F] hover:bg-[#F5F6F8]'
          )}
        >
          <Users size={15} />
          {isAdmin ? 'College Students Registry' : 'Department Students'} ({totalStudents})
        </button>
        <button
          onClick={() => setActiveTab('allocation')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'allocation'
              ? 'bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/20'
              : 'text-[#666666] hover:text-[#1F1F1F] hover:bg-[#F5F6F8]'
          )}
        >
          <ArrowRightLeft size={15} />
          Course-Faculty Allocation Matrix
        </button>
        <button
          onClick={() => setActiveTab('workload')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'workload'
              ? 'bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/20'
              : 'text-[#666666] hover:text-[#1F1F1F] hover:bg-[#F5F6F8]'
          )}
        >
          <Clock size={15} />
          Faculty Workload & Hours
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'attendance'
              ? 'bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/20'
              : 'text-[#666666] hover:text-[#1F1F1F] hover:bg-[#F5F6F8]'
          )}
        >
          <AlertTriangle size={15} />
          {isAdmin && selectedDept === 'All' ? 'College Attendance Oversight' : 'Department Attendance Oversight'}
          {atRiskStudents.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-[10px] text-white font-black">
              {atRiskStudents.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('obe')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'obe'
              ? 'bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/20'
              : 'text-[#666666] hover:text-[#1F1F1F] hover:bg-[#F5F6F8]'
          )}
        >
          <BarChart3 size={15} />
          OBE & NAAC/NBA Accreditation Radar
        </button>
        <button
          onClick={() => setActiveTab('substitutions')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'substitutions'
              ? 'bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/20'
              : 'text-[#666666] hover:text-[#1F1F1F] hover:bg-[#F5F6F8]'
          )}
        >
          <UserCheck size={15} />
          Smart Peer Faculty Substitution
          {substitutions.filter((s) => s.status === 'pending').length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#DCE7F8] text-[10px] text-[#2563EB] font-black">
              {substitutions.filter((s) => s.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'audit'
              ? 'bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/20'
              : 'text-[#666666] hover:text-[#1F1F1F] hover:bg-[#F5F6F8]'
          )}
        >
          <ShieldAlert size={15} />
          ERP Compliance Audit Trail
        </button>
      </div>

      {/* Tab 0: Department HOD Directory (Admin Console Exclusive) */}
      {isAdmin && activeTab === 'hod-roster' && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#1F1F1F] flex items-center gap-2">
                <Building2 size={18} className="text-[#2563EB]" />
                Institutional Heads of Department (HOD) Governance Roster
              </h2>
              <p className="text-xs text-[#666666]">
                Decentralized College Structure: The College Admin issues unique credentials to Department Chairs to monitor their faculty, student attendance, and curricula.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => openOnboardHODModal()}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs h-9 shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <UserCog size={14} />
              Provision New Department Chair
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hodList.map((hod) => {
              const deptSubjects = subjects.filter((s) => s.department === hod.department)
              const deptFaculties = faculties.filter((f) => f.department === hod.department)
              const deptAttendance = attendance.filter((a) => {
                const sub = subjects.find((s) => s.id === a.subject_id)
                return sub?.department === hod.department
              })
              const deptAvg = deptAttendance.length > 0
                ? Math.round((deptAttendance.filter((r) => r.status === 'present' || r.status === 'late').length / deptAttendance.length) * 1000) / 10
                : 100

              return (
                <div
                  key={hod.id}
                  className="rounded-2xl border border-[#E2E6ED] bg-white p-5 shadow-sm hover:border-[#B8CCF0] transition-all space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-[#DCE7F8] border border-[#B8CCF0] text-[#2563EB] font-bold flex items-center justify-center text-base">
                        {hod.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-[#1F1F1F] text-sm">{hod.full_name}</h3>
                          <Badge tone="cyan" className="text-[10px]">Active Chair</Badge>
                        </div>
                        <p className="text-xs text-[#666666] font-medium">{hod.department}</p>
                        <p className="text-[11px] text-[#2563EB] font-mono mt-0.5">{hod.email}</p>
                      </div>
                    </div>
                    <Badge tone="blue" className="font-mono text-[10px]">{hod.roll_no || 'HOD-CHAIR'}</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#E2E6ED]">
                    <div className="bg-[#F5F6F8] rounded-xl p-2.5 text-center">
                      <span className="text-[10px] text-[#666666] block font-medium">Courses</span>
                      <span className="text-base font-black text-[#1F1F1F]">{deptSubjects.length}</span>
                    </div>
                    <div className="bg-[#F5F6F8] rounded-xl p-2.5 text-center">
                      <span className="text-[10px] text-[#666666] block font-medium">Faculty</span>
                      <span className="text-base font-black text-[#2563EB]">{deptFaculties.length}</span>
                    </div>
                    <div className="bg-[#F5F6F8] rounded-xl p-2.5 text-center">
                      <span className="text-[10px] text-[#666666] block font-medium">Avg Attendance</span>
                      <span className="text-base font-black text-emerald-700">{deptAvg}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedDept(hod.department || 'All')
                        setActiveTab('allocation')
                      }}
                      className="text-xs border-[#E2E6ED] text-[#1F1F1F] hover:bg-[#F5F6F8] cursor-pointer"
                    >
                      <ArrowRightLeft size={13} className="mr-1.5" />
                      View Department Matrix
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedDept(hod.department || 'All')
                        setActiveTab('attendance')
                      }}
                      className="text-xs border-[#E2E6ED] text-[#2563EB] hover:bg-[#DCE7F8]/40 cursor-pointer"
                    >
                      <AlertTriangle size={13} className="mr-1.5 text-[#2563EB]" />
                      Audit Department Attendance
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Tab: Department Student Registry & Strength Breakdown */}
      {activeTab === 'student-registry' && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Header & Quick Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#1F1F1F] flex items-center gap-2">
                <Users size={18} className="text-[#2563EB]" />
                {isAdmin ? 'College-Wide Student Registry & Department Distribution' : `Department of ${selectedDept} · Enrolled Students`}
              </h2>
              <p className="text-xs text-[#666666]">
                Institutional Student Census: Real-time cohort strength across all engineering departments, roll numbers, and attendance records.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => openEnrollStudentModal()}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs h-9 shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus size={14} />
              Enroll New Student
            </Button>
          </div>

          {/* Department Breakdown Cards (Admin View) */}
          {isAdmin && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {departments.map((dept) => {
                const count = deptStudentBreakdown[dept] || 0
                const isCurrent = selectedDept === dept
                const deptSubs = subjects.filter((s) => s.department === dept)
                const deptAttendanceList = attendance.filter((a) => {
                  const s = subjects.find((sub) => sub.id === a.subject_id)
                  return s?.department === dept
                })
                const deptAvgAtt = deptAttendanceList.length > 0
                  ? Math.round((deptAttendanceList.filter((r) => r.status === 'present' || r.status === 'late').length / deptAttendanceList.length) * 1000) / 10
                  : 100

                return (
                  <div
                    key={dept}
                    onClick={() => setSelectedDept(dept === selectedDept ? 'All' : dept)}
                    className={cn(
                      'rounded-2xl border p-4 cursor-pointer transition-all space-y-2',
                      isCurrent
                        ? 'border-[#2563EB] bg-[#DCE7F8]/40 ring-2 ring-[#2563EB]/20 shadow-sm'
                        : 'border-[#E2E6ED] bg-white hover:border-[#B8CCF0] shadow-sm'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1F1F1F] truncate">{dept}</span>
                      <Badge tone={isCurrent ? 'blue' : 'gray'} className="text-[10px] font-mono">
                        {count} Students
                      </Badge>
                    </div>
                    <div className="flex items-baseline justify-between pt-1 text-[11px] text-[#666666]">
                      <span>{deptSubs.length} Courses</span>
                      <span className="font-semibold text-emerald-700">{deptAvgAtt}% Att.</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Search, Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E2E6ED]">
            <div className="relative w-full sm:w-80">
              <Search size={14} className="absolute left-3 top-3 text-[#666666]" />
              <input
                type="text"
                placeholder="Search by student name, roll number, or email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E2E6ED] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Filter size={13} className="text-[#666666]" />
              <span className="text-xs text-[#666666] font-medium">Semester:</span>
              <select
                value={studentSemesterFilter}
                onChange={(e) => setStudentSemesterFilter(e.target.value)}
                className="text-xs bg-[#F5F6F8] border border-[#E2E6ED] rounded-xl px-2.5 py-1.5 font-medium cursor-pointer"
              >
                <option value="ALL">All Semesters</option>
                <option value="4">Semester 4</option>
                <option value="6">Semester 6</option>
                <option value="8">Semester 8</option>
              </select>

              <Badge tone="cyan" className="font-mono text-xs">
                {filteredStudents.length} Match{filteredStudents.length === 1 ? '' : 'es'}
              </Badge>
            </div>
          </div>

          {/* Student Table */}
          <div className="overflow-hidden rounded-2xl border border-[#E2E6ED] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E2E6ED] bg-[#F5F6F8] text-[#666666] font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Student Profile</th>
                    <th className="py-3.5 px-4">Department & Semester</th>
                    <th className="py-3.5 px-4">Roll Number</th>
                    <th className="py-3.5 px-4">Enrolled Subjects</th>
                    <th className="py-3.5 px-4">Avg Attendance</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E6ED]">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#666666]">
                        No students found matching the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((stud) => {
                      const studentRecords = attendance.filter((a) => a.student_id === stud.id)
                      const presentCount = studentRecords.filter((r) => r.status === 'present' || r.status === 'late').length
                      const avgPct = studentRecords.length > 0
                        ? Math.round((presentCount / studentRecords.length) * 1000) / 10
                        : 88.5

                      const enrolledSubs = subjects.filter((s) => s.department === stud.department)

                      return (
                        <tr key={stud.id} className="hover:bg-[#F5F6F8]/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-[#DCE7F8] border border-[#B8CCF0] text-[#2563EB] font-bold flex items-center justify-center text-xs">
                                {stud.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                              </div>
                              <div>
                                <p className="font-bold text-[#1F1F1F] text-xs">{stud.full_name}</p>
                                <p className="text-[11px] text-[#666666] font-mono">{stud.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div>
                              <p className="font-semibold text-[#1F1F1F]">{stud.department || 'Computer Science'}</p>
                              <p className="text-[11px] text-[#666666]">Semester {stud.semester || 6}</p>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-xs text-[#2563EB] bg-[#DCE7F8]/40 px-2 py-1 rounded-lg border border-[#B8CCF0]/50">
                              {stud.roll_no || 'N/A'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="text-[#1F1F1F] font-medium">
                              {enrolledSubs.length} Department Courses
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'font-black text-xs',
                                  avgPct < 75 ? 'text-rose-600' : avgPct < 85 ? 'text-amber-600' : 'text-emerald-700'
                                )}
                              >
                                {avgPct}%
                              </span>
                              {avgPct < 75 && (
                                <Badge tone="amber" className="text-[9px] px-1 py-0 font-bold">
                                  Shortfall
                                </Badge>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedDept(stud.department || 'All')
                                setActiveTab('attendance')
                              }}
                              className="text-xs border-[#E2E6ED] text-[#1F1F1F] hover:bg-[#F5F6F8] cursor-pointer"
                            >
                              Inspect Attendance
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab 1: Course-Faculty Allocation Matrix */}
      {activeTab === 'allocation' && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#1F1F1F] flex items-center gap-2">
                <BookOpen size={18} className="text-[#2563EB]" />
                Curriculum Workload Allocation Matrix
              </h2>
              <p className="text-xs text-[#666666]">
                Traditional ERP Rule: Teaching faculty can only access subjects assigned by the Head of Department.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => openOnboardModal()}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs h-9 shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus size={14} />
                Onboard Faculty & Generate Credentials
              </Button>
              <Badge tone="cyan">Semester 6 Roster</Badge>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#E2E6ED] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E2E6ED] bg-[#F5F6F8] text-[#666666] font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Course Details</th>
                    <th className="py-3.5 px-4">Credits & Hours</th>
                    <th className="py-3.5 px-4">Allocated Teaching Faculty</th>
                    <th className="py-3.5 px-4">Enrolled Batch</th>
                    <th className="py-3.5 px-4 text-right">Allocation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E6ED]">
                  {scopedSubjects.map((sub) => {
                    const assignedFaculty = faculties.find((f) => f.id === sub.faculty_id)
                    const enrolledCount = scopedStudents.length

                    return (
                      <tr key={sub.id} className="hover:bg-[#F5F6F8]/60 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#DCE7F8] border border-[#B8CCF0] text-[#2563EB] font-mono font-bold text-xs">
                              {sub.code}
                            </span>
                            <div>
                              <p className="font-bold text-[#1F1F1F] text-sm">{sub.name}</p>
                              <p className="text-[11px] text-[#666666]">
                                {sub.department || 'Computer Science'} · Sem {sub.semester || 6}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-[#1F1F1F]">{sub.credits ?? 4} Credits</span>
                            <p className="text-[11px] text-[#666666]">
                              {sub.contact_hours_per_week ?? 4} Contact Hours / Week
                            </p>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          {assignedFaculty ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 font-bold text-[#2563EB]">
                                <GraduationCap size={14} />
                                {assignedFaculty.full_name}
                              </div>
                              <p className="text-[11px] text-[#666666]">{assignedFaculty.designation || 'Faculty'}</p>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                              <AlertTriangle size={12} />
                              Unallocated
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1.5 text-[#1F1F1F]">
                            <Users size={13} className="text-[#666666]" />
                            {enrolledCount} Enrolled Students
                          </span>
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {!assignedFaculty && (
                              <Button
                                size="sm"
                                onClick={() => openOnboardModal(sub.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 cursor-pointer shadow-sm"
                              >
                                <UserPlus size={13} className="mr-1" />
                                Onboard & Assign
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant={assignedFaculty ? 'outline' : 'default'}
                              onClick={() => openAllocationModal(sub)}
                              className={cn(
                                "text-xs h-8 cursor-pointer",
                                assignedFaculty
                                  ? "border-[#E2E6ED] text-[#1F1F1F] hover:bg-[#F5F6F8]"
                                  : "bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold"
                              )}
                            >
                              <ArrowRightLeft size={13} className="mr-1.5" />
                              {assignedFaculty ? 'Reallocate' : 'Assign Existing'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab 2: Faculty Workload & Hours */}
      {activeTab === 'workload' && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#1F1F1F]">Faculty Workload Distribution</h2>
              <p className="text-xs text-[#666666]">
                Monitors teaching hours and credit load to adhere to UGC/AICTE institutional guidelines (Max 16 hrs/week).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => openOnboardModal()}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs h-9 shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus size={14} />
                Onboard New Faculty
              </Button>
              <Badge tone="blue">Academic Standards</Badge>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {facultyWorkloads.map((item) => (
              <div
                key={item.faculty.id}
                className="rounded-2xl border border-[#E2E6ED] bg-white p-5 space-y-4 hover:border-[#B8CCF0] shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-[#DCE7F8] text-[#2563EB] flex items-center justify-center font-bold border border-[#B8CCF0]">
                      {item.faculty.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1F1F1F]">{item.faculty.full_name}</p>
                      <p className="text-xs text-[#666666]">{item.faculty.designation || 'Faculty Member'}</p>
                    </div>
                  </div>
                  <Badge tone={item.status === 'heavy' ? 'crimson' : item.status === 'optimal' ? 'cyan' : 'zinc'}>
                    {item.status === 'heavy'
                      ? 'Overburdened'
                      : item.status === 'optimal'
                      ? 'Optimal Load'
                      : 'Under-allocated'}
                  </Badge>
                </div>

                <div className="space-y-2 pt-2 border-t border-[#E2E6ED]">
                  <div className="flex items-center justify-between text-xs text-[#666666]">
                    <span>Contact Hours: {item.totalHours} / 16 hrs max</span>
                    <span className="font-mono font-bold text-[#2563EB]">
                      {Math.round((item.totalHours / 16) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#E2E6ED] overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        item.totalHours > 12 ? 'bg-rose-500' : 'bg-gradient-to-r from-[#2563EB] to-[#3B82F6]'
                      )}
                      style={{ width: `${Math.min(100, (item.totalHours / 16) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
                    Allocated Courses ({item.assigned.length}):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.assigned.length > 0 ? (
                      item.assigned.map((sub) => (
                        <span
                          key={sub.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#B8CCF0] bg-[#DCE7F8]/40 px-2.5 py-1 text-[11px] font-medium text-[#2563EB]"
                        >
                          <BookOpen size={11} className="text-[#2563EB]" />
                          {sub.code}: {sub.name} ({sub.credits}C)
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[#666666] italic">No courses currently allocated</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tab 3: Department Attendance Oversight */}
      {activeTab === 'attendance' && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#1F1F1F]">Department-Wide Attendance Shortfall Watchlist</h2>
              <p className="text-xs text-[#666666]">
                Students below the university 75% threshold in any computer science subject. HOD can dispatch escalation warnings.
              </p>
            </div>
            <Badge tone="crimson">{atRiskStudents.length} Risk Flags</Badge>
          </div>

          {atRiskStudents.length === 0 ? (
            <div className="rounded-2xl border border-[#E2E6ED] bg-white p-8 text-center space-y-2 shadow-sm">
              <CheckCircle2 size={32} className="text-emerald-600 mx-auto" />
              <p className="text-sm font-bold text-[#1F1F1F]">All Students in Good Academic Standing</p>
              <p className="text-xs text-[#666666]">Every student currently satisfies the mandatory 75% threshold.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#E2E6ED] bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E2E6ED] bg-[#F5F6F8] text-[#666666] font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Student</th>
                      <th className="py-3.5 px-4">Subject</th>
                      <th className="py-3.5 px-4">Current Attendance</th>
                      <th className="py-3.5 px-4">Assigned Faculty</th>
                      <th className="py-3.5 px-4 text-right">Escalation Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E6ED]">
                    {atRiskStudents.map((item, idx) => (
                      <tr key={`${item.student.id}-${item.subject.id}-${idx}`} className="hover:bg-[#F5F6F8]/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-bold text-[#1F1F1F]">{item.student.full_name}</p>
                            <p className="text-[11px] font-mono text-[#666666]">{item.student.roll_no}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-[#2563EB] font-semibold">{item.subject.code}</span>
                          <p className="text-[11px] text-[#666666]">{item.subject.name}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 font-bold text-rose-700">
                              <AlertTriangle size={12} />
                              {item.pct}%
                            </span>
                            <p className="text-[10px] text-[#666666]">
                              {item.attended} / {item.total} sessions
                            </p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[#1F1F1F]">{item.subject.faculty_name || 'Assigned Faculty'}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              sendAttendanceWarning(
                                item.student.id,
                                item.subject.id,
                                item.pct,
                                `HOD Formal Notice to ${item.student.full_name}: You have critically low attendance (${item.pct}%) in ${item.subject.code} (${item.subject.name}). You are summoned to meet the Head of Department before next Wednesday.`
                              )
                              toast(`HOD Warning dispatched to ${item.student.full_name}!`, 'success')
                            }}
                            className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 text-xs h-8 cursor-pointer"
                          >
                            <Send size={12} className="mr-1.5" />
                            Dispatch HOD Summon
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Tab 4: ERP Compliance Audit Trail */}
      {activeTab === 'audit' && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#1F1F1F] flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#2563EB]" />
                ERP Institutional Compliance & Audit Trail
              </h2>
              <p className="text-xs text-[#666666]">
                Immutable chronological log of course reallocations, attendance markups, grading records, and warnings.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-[#666666]" />
                <input
                  type="text"
                  placeholder="Search audit records..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="h-9 w-48 sm:w-60 rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] pl-8 pr-3 text-xs text-[#1F1F1F] outline-none focus:border-[#2563EB]"
                />
              </div>

              <select
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                className="h-9 rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] px-3 text-xs text-[#1F1F1F] outline-none focus:border-[#2563EB]"
              >
                <option value="ALL">All Actions</option>
                <option value="FACULTY_ONBOARDING">Faculty Onboarding</option>
                <option value="COURSE_ALLOCATION">Course Allocations</option>
                <option value="ATTENDANCE_OVERRIDE">Attendance Logs</option>
                <option value="GRADE_SUBMITTED">Grading</option>
                <option value="WARNING_ISSUED">Warnings</option>
                <option value="DISPUTE_REVIEW">Disputes</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#E2E6ED] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E2E6ED] bg-[#F5F6F8] text-[#666666] font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Action Type</th>
                    <th className="py-3.5 px-4">Target Entity</th>
                    <th className="py-3.5 px-4">Actor</th>
                    <th className="py-3.5 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E6ED] font-mono text-[11px]">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#666666]">
                        No audit records match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => {
                      const actionTone: Record<string, 'cyan' | 'blue' | 'crimson' | 'violet' | 'amber' | 'emerald'> = {
                        FACULTY_ONBOARDING: 'emerald',
                        COURSE_ALLOCATION: 'cyan',
                        ATTENDANCE_OVERRIDE: 'blue',
                        WARNING_ISSUED: 'crimson',
                        GRADE_SUBMITTED: 'violet',
                        DISPUTE_REVIEW: 'amber',
                      }

                      return (
                        <tr key={log.id} className="hover:bg-[#F5F6F8]/60 transition-colors">
                          <td className="py-3.5 px-4 text-[#666666] whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge tone={actionTone[log.action] || 'zinc'} className="text-[9px]">
                              {log.action.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-[#1F1F1F] font-semibold">{log.target}</td>
                          <td className="py-3.5 px-4">
                            <span className="text-[#2563EB] font-sans font-bold">{log.actor_name}</span>
                            <span className="block text-[10px] text-[#666666] uppercase">{log.actor_role}</span>
                          </td>
                          <td className="py-3.5 px-4 text-[#1F1F1F] font-sans text-xs">{log.details}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab 5: OBE & NAAC/NBA Accreditation Radar */}
      {activeTab === 'obe' && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#1F1F1F] flex items-center gap-2">
                <BarChart3 className="text-[#2563EB]" size={18} />
                Outcome-Based Education (OBE) & NAAC/NBA Accreditation Matrix
              </h3>
              <p className="text-xs text-[#666666]">
                Live computation of Course Outcome (CO) attainment thresholds and Bloom's Cognitive Taxonomy distribution.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => toast('Exported official NBA/NAAC Self-Assessment Report (SAR) Criterion 3.1 PDF bundle.', 'success')}
              className="bg-[#2563EB] text-white hover:bg-[#1D4ED8] font-bold text-xs shrink-0 cursor-pointer shadow-sm"
            >
              <FileCheck2 size={14} className="mr-1.5" /> Export NAAC/NBA Report (PDF)
            </Button>
          </div>

          {/* Departmental CO Attainment Progress Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-[#E2E6ED] bg-white p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                  Course Outcomes (CO) Attainment vs Target
                </h4>
                <span className="text-[10px] text-[#666666]">Target Threshold: 70-75%</span>
              </div>

              <div className="space-y-3">
                {DEMO_CO_ATTAINMENT.map((co) => (
                  <div key={co.co_code} className="space-y-1.5 rounded-xl bg-[#F5F6F8] border border-[#E2E6ED] p-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#2563EB]">{co.co_code}</span>
                        <span className="text-[#1F1F1F] line-clamp-1">{co.description}</span>
                      </div>
                      <Badge
                        tone={co.status === 'exceeded' ? 'cyan' : co.status === 'met' ? 'emerald' : 'crimson'}
                        className="text-[9px] uppercase font-bold shrink-0 ml-2"
                      >
                        {co.status === 'exceeded' ? 'Exceeded' : co.status === 'met' ? 'Met' : 'At Risk'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 rounded-full bg-[#E2E6ED] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            co.status === 'at_risk'
                              ? 'bg-rose-500'
                              : co.status === 'met'
                              ? 'bg-emerald-500'
                              : 'bg-[#2563EB]'
                          }`}
                          style={{ width: `${Math.min(100, co.current_attainment_pct)}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs font-bold text-[#1F1F1F] min-w-14 text-right">
                        {co.current_attainment_pct}%{' '}
                        <span className="text-[10px] text-[#666666]">/ {co.target_pct}%</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bloom's Cognitive Taxonomy Breakdown */}
            <div className="rounded-2xl border border-[#E2E6ED] bg-white p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                  Bloom's Cognitive Taxonomy Question Weighting
                </h4>
                <span className="text-[10px] text-[#666666]">120 Total Questions</span>
              </div>

              <p className="text-xs text-[#666666] leading-relaxed">
                Aggregated distribution of cognitive rigor across all semester assignments, continuous assessments, and examinations.
              </p>

              <div className="space-y-3 pt-2">
                {DEMO_BLOOMS_DISTRIBUTION.map((item) => (
                  <div key={item.level} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#1F1F1F]">{item.level}</span>
                      <span className="font-mono text-[#2563EB] font-bold">
                        {item.percentage}% ({item.count} items)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#E2E6ED] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#2563EB] to-[#3B82F6] rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-[#B8CCF0] bg-[#DCE7F8]/40 p-3 text-[11px] text-[#1F1F1F]">
                <Sparkles size={14} className="inline mr-1 text-[#2563EB]" />
                NBA Criterion 3 Compliance: Higher-order thinking questions (Apply, Analyze, Evaluate) account for <strong>58%</strong> of total department assessment rubric.
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab 6: Smart Peer Faculty Substitution */}
      {activeTab === 'substitutions' && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#1F1F1F] flex items-center gap-2">
                <UserCheck className="text-[#2563EB]" size={18} />
                Smart Peer Faculty Substitution Resolver
              </h3>
              <p className="text-xs text-[#666666]">
                Automated timetable conflict resolver recommending available peer professors to cover faculty leave slots.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E2E6ED] bg-white overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#E2E6ED] bg-[#F5F6F8]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                Active & Pending Lecture Substitution Requests
              </h4>
            </div>

            <div className="divide-y divide-[#E2E6ED]">
              {substitutions.map((sub) => (
                <div key={sub.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F5F6F8]/40 transition-colors">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#2563EB] text-sm">{sub.subject_code}</span>
                      <span className="text-xs text-[#1F1F1F] font-semibold">{sub.subject_name}</span>
                      <Badge
                        tone={sub.status === 'accepted' ? 'emerald' : sub.status === 'pending' ? 'amber' : 'zinc'}
                        className="text-[9px] uppercase font-bold"
                      >
                        {sub.status}
                      </Badge>
                    </div>

                    <div className="text-xs text-[#666666] flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>Original: <strong className="text-[#1F1F1F]">{sub.original_faculty_name}</strong></span>
                      <span>Substitute: <strong className="text-[#2563EB]">{sub.substitute_faculty_name}</strong></span>
                      <span>Date & Slot: <strong className="text-[#1F1F1F]">{sub.date} ({sub.slot_time})</strong></span>
                    </div>

                    <p className="text-xs text-[#666666] italic">"{sub.reason}"</p>
                  </div>

                  {sub.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          reviewSubstitution(sub.id, 'rejected')
                          toast('Substitution rejected.', 'error')
                        }}
                        className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50 cursor-pointer"
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          reviewSubstitution(sub.id, 'accepted')
                          toast('Substitution approved and roster updated.', 'success')
                        }}
                        className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs cursor-pointer shadow-sm"
                      >
                        Approve Roster Transfer
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Academic Attendance Recovery Loans Section */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSignature className="text-amber-700" size={18} />
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Academic Attendance Recovery Contracts (Debarment Prevention)
                </h4>
              </div>
              <span className="text-[10px] text-amber-800 font-mono">
                {attendanceLoans.filter((l) => l.status === 'pending').length} Pending HOD Approval
              </span>
            </div>

            <div className="space-y-3">
              {attendanceLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="rounded-xl border border-amber-200 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1F1F1F] text-xs">{loan.student_name}</span>
                      <span className="font-mono text-[#2563EB] text-xs">({loan.subject_code} - {loan.subject_name})</span>
                      <Badge
                        tone={loan.status === 'active' ? 'emerald' : loan.status === 'pending' ? 'amber' : 'crimson'}
                        className="text-[9px] uppercase font-bold"
                      >
                        {loan.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#1F1F1F]">
                      Current: <strong className="text-rose-700 font-mono">{loan.current_pct}%</strong> &rarr; Target: <strong className="text-emerald-700 font-mono">{loan.target_pct}%</strong> | Remedial Commitment: <strong className="text-amber-900 font-mono">{loan.remedial_hours_required} hrs</strong>
                    </p>
                    <p className="text-xs text-[#666666]">
                      Compensatory Task: "{loan.compensatory_task}"
                    </p>
                    {loan.hod_note && (
                      <p className="text-[11px] text-[#2563EB] font-mono mt-1">
                        HOD Remarks: {loan.hod_note}
                      </p>
                    )}
                  </div>

                  {loan.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          reviewAttendanceLoan(loan.id, false, 'Debarment confirmed. Remedial plan inadequate.')
                          toast('Attendance contract rejected.', 'error')
                        }}
                        className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50 cursor-pointer"
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          reviewAttendanceLoan(loan.id, true, 'Approved by HOD. Exam hall ticket provisionally unlocked.')
                          toast('Contract approved! Student exam hall ticket unlocked.', 'success')
                        }}
                        className="bg-amber-600 text-white hover:bg-amber-700 font-bold text-xs cursor-pointer shadow-sm"
                      >
                        Approve Hall Ticket
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Course Reallocation Modal */}
      <AnimatePresence>
        {isModalOpen && selectedSubject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-lg rounded-3xl border border-[#E2E6ED] bg-white p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#E2E6ED] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#DCE7F8] text-[#2563EB]">
                    <ArrowRightLeft size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1F1F1F]">Course Workload Reallocation</h3>
                    <p className="text-xs text-[#666666]">Update faculty teaching assignment for this term</p>
                  </div>
                </div>
                <Badge tone="cyan">{selectedSubject.code}</Badge>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F5F6F8] border border-[#E2E6ED] space-y-1">
                <p className="text-xs font-bold text-[#1F1F1F]">{selectedSubject.name}</p>
                <p className="text-[11px] text-[#666666]">
                  {selectedSubject.credits ?? 4} Credits · {selectedSubject.contact_hours_per_week ?? 4} Contact Hours
                  · Currently Assigned:{' '}
                  <strong className="text-[#2563EB]">{selectedSubject.faculty_name || 'Unassigned'}</strong>
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[#1F1F1F] font-semibold">
                      Select Faculty Instructor:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false)
                        openOnboardModal(selectedSubject.id)
                      }}
                      className="text-[11px] text-[#2563EB] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus size={12} />
                      + Onboard New Faculty
                    </button>
                  </div>
                  <select
                    value={targetFacultyId}
                    onChange={(e) => setTargetFacultyId(e.target.value)}
                    className="w-full h-10 rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] px-3 text-xs text-[#1F1F1F] outline-none focus:border-[#2563EB]"
                  >
                    {faculties.map((f) => {
                      const count = subjects.filter((s) => s.faculty_id === f.id).length
                      return (
                        <option key={f.id} value={f.id}>
                          {f.full_name} ({f.designation || 'Faculty'}) — Currently teaching {count} course(s)
                        </option>
                      )
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-[#1F1F1F] font-semibold mb-1.5">
                    Allocation Administrative Memo / Rationale:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Workload rebalancing for Spring term"
                    value={allocationNotes}
                    onChange={(e) => setAllocationNotes(e.target.value)}
                    className="w-full h-10 rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] px-3 text-xs text-[#1F1F1F] outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-[#DCE7F8]/40 border border-[#B8CCF0] p-3 text-[11px] text-[#1F1F1F] flex items-start gap-2">
                <ShieldCheck size={16} className="text-[#2563EB] shrink-0 mt-0.5" />
                <span>
                  This action generates an immutable ERP audit log entry. The chosen professor will
                  immediately gain authoritative access to mark attendance, post assignments, and evaluate coursework.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)} className="text-xs cursor-pointer">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleConfirmAllocation} className="text-xs bg-[#2563EB] hover:bg-[#1D4ED8] text-white cursor-pointer shadow-sm">
                  Confirm Allocation
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Faculty Onboarding & Credential Generation Modal */}
      <AnimatePresence>
        {isOnboardModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!generatedSlip) setIsOnboardModalOpen(false)
              }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-xl rounded-3xl border border-[#E2E6ED] bg-white p-6 sm:p-7 shadow-2xl space-y-5"
            >
              {!generatedSlip ? (
                <>
                  <div className="flex items-center justify-between border-b border-[#E2E6ED] pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-[#DCE7F8] text-[#2563EB]">
                        <UserPlus size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#1F1F1F]">
                          Faculty Onboarding & Credential Generation
                        </h3>
                        <p className="text-xs text-[#666666]">
                          Provision ERP faculty login credentials and assign departmental curriculum
                        </p>
                      </div>
                    </div>
                    <Badge tone="emerald">Admin / HOD Console</Badge>
                  </div>

                  <form onSubmit={handleOnboardSubmit} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[#1F1F1F] font-semibold mb-1">
                          Faculty Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Dr. Priyadarshini Sen"
                          value={facultyForm.fullName}
                          onChange={(e) => setFacultyForm({ ...facultyForm, fullName: e.target.value })}
                          className="w-full h-9 rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] px-3 text-xs text-[#1F1F1F] outline-none focus:border-[#2563EB]"
                        />
                      </div>

                      <div>
                        <label className="block text-[#1F1F1F] font-semibold mb-1">
                          Official Institutional Email *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. p.sen@campusflow.edu"
                          value={facultyForm.email}
                          onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })}
                          className="w-full h-9 rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] px-3 text-xs text-[#1F1F1F] outline-none focus:border-[#2563EB]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[#1F1F1F] font-semibold mb-1">
                          Academic Department
                        </label>
                        <select
                          value={facultyForm.department}
                          onChange={(e) => setFacultyForm({ ...facultyForm, department: e.target.value })}
                          className="w-full h-9 rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] px-3 text-xs text-[#1F1F1F] outline-none focus:border-[#2563EB]"
                        >
                          <option value="Computer Science">Computer Science & Engineering</option>
                          <option value="Information Technology">Information Technology</option>
                          <option value="Data Science & AI">Data Science & AI</option>
                          <option value="Electronics & Communication">Electronics & Communication</option>
                          <option value="Mechanical Engineering">Mechanical Engineering</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[#1F1F1F] font-semibold mb-1">
                          Designation / Post
                        </label>
                        <select
                          value={facultyForm.designation}
                          onChange={(e) => setFacultyForm({ ...facultyForm, designation: e.target.value })}
                          className="w-full h-9 rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] px-3 text-xs text-[#1F1F1F] outline-none focus:border-[#2563EB]"
                        >
                          <option value="Assistant Professor">Assistant Professor</option>
                          <option value="Associate Professor">Associate Professor</option>
                          <option value="Professor & Course Lead">Professor & Course Lead</option>
                          <option value="Adjunct Professor">Adjunct Professor</option>
                          <option value="Senior Lecturer">Senior Lecturer</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-[#1F1F1F] font-semibold mb-1">
                          Employee ID / Faculty Code
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. EMP-CSE-401"
                          value={facultyForm.employeeId}
                          onChange={(e) => setFacultyForm({ ...facultyForm, employeeId: e.target.value })}
                          className="w-full h-9 rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] px-3 text-xs font-mono text-[#1F1F1F] outline-none focus:border-[#2563EB]"
                        />
                      </div>

                      <div>
                        <label className="block text-[#1F1F1F] font-semibold mb-1">
                          Assign Initial Course (Optional)
                        </label>
                        <select
                          value={facultyForm.assignedCourseId}
                          onChange={(e) => setFacultyForm({ ...facultyForm, assignedCourseId: e.target.value })}
                          className="w-full h-9 rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] px-3 text-xs text-[#1F1F1F] outline-none focus:border-[#2563EB]"
                        >
                          <option value="">None (Assign Later)</option>
                          {subjects.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.code} — {s.name} ({s.faculty_name ? `Curr: ${s.faculty_name}` : 'Unallocated'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[#1F1F1F] font-semibold">
                          Generated Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setFacultyForm({ ...facultyForm, password: generateNewPassword() })}
                          className="text-[11px] text-[#2563EB] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw size={11} />
                          Regenerate Password
                        </button>
                      </div>
                      <div className="relative">
                        <Lock size={14} className="absolute left-3 top-2.5 text-[#666666]" />
                        <input
                          type="text"
                          required
                          value={facultyForm.password}
                          onChange={(e) => setFacultyForm({ ...facultyForm, password: e.target.value })}
                          className="w-full h-9 rounded-xl border border-[#E2E6ED] bg-[#F5F6F8] pl-9 pr-3 text-xs font-mono font-bold text-[#1F1F1F] outline-none focus:border-[#2563EB]"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#F5F6F8] border border-[#E2E6ED] p-3 text-[11px] text-[#666666] flex items-start gap-2">
                      <KeyRound size={16} className="text-[#2563EB] shrink-0 mt-0.5" />
                      <span>
                        <strong>Production Credentials Workflow:</strong> Submitting creates an official faculty profile and sets up immediate login access. The new faculty member can use this email and password to log in directly on the CampusFlow portal.
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsOnboardModalOpen(false)}
                        className="text-xs cursor-pointer"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        className="text-xs bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold cursor-pointer shadow-sm"
                      >
                        Generate Credentials & Register Faculty
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                /* Generated Credentials Slip View */
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#1F1F1F]">
                        Faculty Credentials Successfully Generated
                      </h3>
                      <p className="text-xs text-[#666666]">
                        Official login credentials created and registered in the institutional access matrix.
                      </p>
                    </div>
                  </div>

                  {/* Physical Credentials Slip */}
                  <div className="rounded-2xl border-2 border-[#B8CCF0] bg-[#F5F6F8] p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E2E6ED] pb-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2563EB] text-white font-black text-xs">
                          CF
                        </span>
                        <span className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider">
                          CampusFlow Institutional Access Slip
                        </span>
                      </div>
                      <Badge tone="emerald" className="text-[10px]">Active & Verified</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5 text-xs">
                      <div>
                        <span className="text-[10px] text-[#666666] uppercase tracking-wider font-medium">Faculty Member</span>
                        <p className="font-bold text-[#1F1F1F] mt-0.5">{generatedSlip.profile.full_name}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#666666] uppercase tracking-wider font-medium">Employee / Faculty ID</span>
                        <p className="font-mono font-bold text-[#2563EB] mt-0.5">{generatedSlip.profile.roll_no}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#666666] uppercase tracking-wider font-medium">Department</span>
                        <p className="text-[#1F1F1F] mt-0.5 font-medium">{generatedSlip.profile.department}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#666666] uppercase tracking-wider font-medium">Designation</span>
                        <p className="text-[#1F1F1F] mt-0.5 font-medium">{generatedSlip.profile.designation}</p>
                      </div>
                    </div>

                    <div className="border-t border-[#E2E6ED] pt-3 space-y-2">
                      <div className="flex items-center justify-between bg-white rounded-xl p-2.5 border border-[#E2E6ED]">
                        <div>
                          <span className="text-[10px] text-[#666666] uppercase tracking-wider block">Login Email</span>
                          <span className="text-xs font-mono font-bold text-[#1F1F1F]">{generatedSlip.profile.email}</span>
                        </div>
                        <Badge tone="blue">Portal Username</Badge>
                      </div>

                      <div className="flex items-center justify-between bg-white rounded-xl p-2.5 border border-[#E2E6ED]">
                        <div>
                          <span className="text-[10px] text-[#666666] uppercase tracking-wider block">Temporary Password</span>
                          <span className="text-sm font-mono font-bold text-[#2563EB]">{generatedSlip.tempPassword}</span>
                        </div>
                        <Badge tone="amber">One-time Password</Badge>
                      </div>

                      {generatedSlip.assignedCourseName && (
                        <div className="flex items-center justify-between bg-[#DCE7F8]/50 rounded-xl p-2.5 border border-[#B8CCF0]">
                          <div>
                            <span className="text-[10px] text-[#2563EB] uppercase tracking-wider block font-semibold">Assigned Teaching Subject</span>
                            <span className="text-xs font-bold text-[#1F1F1F]">{generatedSlip.assignedCourseName}</span>
                          </div>
                          <Badge tone="cyan">Allocated</Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyCredentials}
                      className="w-full sm:w-auto text-xs border-[#E2E6ED] text-[#1F1F1F] hover:bg-[#F5F6F8] cursor-pointer flex items-center gap-1.5"
                    >
                      {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      {copied ? 'Credentials Copied!' : 'Copy Credentials to Clipboard'}
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setGeneratedSlip(null)
                        setIsOnboardModalOpen(false)
                      }}
                      className="w-full sm:w-auto text-xs bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold cursor-pointer shadow-sm"
                    >
                      Done & Close
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* College Admin Modal: Provision Department Head of Department (HOD) & Generate Credentials */}
      <AnimatePresence>
        {isHODModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg rounded-3xl border border-[#E2E6ED] bg-white p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#E2E6ED] pb-4">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-[#DCE7F8] text-[#2563EB] border border-[#B8CCF0]">
                    <UserCog size={20} />
                  </span>
                  <div>
                    <h3 className="font-bold text-[#1F1F1F] text-base">
                      {generatedHODSlip ? 'Official HOD Credentials Generated' : 'Provision Department Chair (HOD)'}
                    </h3>
                    <p className="text-xs text-[#666666]">
                      {generatedHODSlip
                        ? 'Department Chair provisioned with delegated academic authority'
                        : 'College Admin: Issue credentials to delegate department monitoring'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsHODModalOpen(false)
                    setGeneratedHODSlip(null)
                  }}
                  className="rounded-lg p-1.5 text-[#666666] hover:bg-[#F5F6F8] hover:text-[#1F1F1F] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {!generatedHODSlip ? (
                <form onSubmit={handleOnboardHODSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#1F1F1F]">
                      Chair Full Name & Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Prof. Ananya Sengupta, Ph.D."
                      value={hodForm.fullName}
                      onChange={(e) => setHODForm((prev) => ({ ...prev, fullName: e.target.value }))}
                      className="w-full text-xs rounded-xl border border-[#E2E6ED] px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#1F1F1F]">
                      Institutional Portal Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. hod.it@campusflow.edu"
                      value={hodForm.email}
                      onChange={(e) => setHODForm((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full text-xs font-mono rounded-xl border border-[#E2E6ED] px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1F1F1F]">Department</label>
                      <select
                        value={hodForm.department}
                        onChange={(e) => setHODForm((prev) => ({ ...prev, department: e.target.value }))}
                        className="w-full text-xs rounded-xl border border-[#E2E6ED] px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                      >
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1F1F1F]">Employee / Chair ID</label>
                      <input
                        type="text"
                        value={hodForm.employeeId}
                        onChange={(e) => setHODForm((prev) => ({ ...prev, employeeId: e.target.value }))}
                        className="w-full text-xs font-mono rounded-xl border border-[#E2E6ED] px-3 py-2.5 bg-[#F5F6F8]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#1F1F1F]">Assigned Initial Password</label>
                      <button
                        type="button"
                        onClick={() => setHODForm((prev) => ({ ...prev, password: generateNewHODPassword() }))}
                        className="text-[11px] text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw size={11} />
                        Regenerate
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={hodForm.password}
                        onChange={(e) => setHODForm((prev) => ({ ...prev, password: e.target.value }))}
                        className="w-full text-xs font-mono rounded-xl border border-[#E2E6ED] px-3.5 py-2.5 bg-[#F5F6F8] text-[#1F1F1F]"
                      />
                      <Lock size={13} className="absolute right-3 top-3 text-[#666666]" />
                    </div>
                    <p className="text-[10px] text-[#666666]">
                      The Department Chair will use this password to sign into the HOD Console for their department.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E6ED]">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsHODModalOpen(false)}
                      className="text-xs border-[#E2E6ED] text-[#666666] hover:bg-[#F5F6F8] cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-sm cursor-pointer"
                    >
                      <KeyRound size={13} className="mr-1.5" />
                      Provision Chair & Issue Credentials
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <Check size={18} className="text-emerald-600" />
                      Official Department Chair Provisioned!
                    </div>
                    <p className="text-xs text-emerald-900 leading-relaxed">
                      Department Chair account has been generated in the college directory. The HOD can now log in to oversee faculty allocations and student attendance.
                    </p>

                    <div className="border-t border-emerald-200 pt-3 space-y-2">
                      <div className="flex items-center justify-between bg-white rounded-xl p-2.5 border border-emerald-100">
                        <div>
                          <span className="text-[10px] text-[#666666] uppercase tracking-wider block">Chair Name & Dept</span>
                          <span className="text-xs font-bold text-[#1F1F1F]">{generatedHODSlip.profile.full_name} ({generatedHODSlip.profile.department})</span>
                        </div>
                        <Badge tone="cyan">Level 2 HOD</Badge>
                      </div>

                      <div className="flex items-center justify-between bg-white rounded-xl p-2.5 border border-emerald-100">
                        <div>
                          <span className="text-[10px] text-[#666666] uppercase tracking-wider block">Login Portal Email</span>
                          <span className="text-xs font-mono font-bold text-[#1F1F1F]">{generatedHODSlip.profile.email}</span>
                        </div>
                        <Badge tone="blue">Login ID</Badge>
                      </div>

                      <div className="flex items-center justify-between bg-white rounded-xl p-2.5 border border-emerald-100">
                        <div>
                          <span className="text-[10px] text-[#666666] uppercase tracking-wider block">One-time Password</span>
                          <span className="text-sm font-mono font-bold text-[#2563EB]">{generatedHODSlip.tempPassword}</span>
                        </div>
                        <Badge tone="amber">Active</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyHODCredentials}
                      className="w-full sm:w-auto text-xs border-[#E2E6ED] text-[#1F1F1F] hover:bg-[#F5F6F8] cursor-pointer flex items-center gap-1.5"
                    >
                      {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      {copied ? 'Credentials Copied!' : 'Copy HOD Credentials'}
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setGeneratedHODSlip(null)
                        setIsHODModalOpen(false)
                      }}
                      className="w-full sm:w-auto text-xs bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold cursor-pointer shadow-sm"
                    >
                      Done & Close
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Student Enrollment & Credential Generation Modal */}
      <AnimatePresence>
        {isStudentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg rounded-3xl border border-[#E2E6ED] bg-white p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#E2E6ED] pb-4">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-[#DCE7F8] text-[#2563EB] border border-[#B8CCF0]">
                    <Users size={20} />
                  </span>
                  <div>
                    <h3 className="font-bold text-[#1F1F1F] text-base">
                      {generatedStudentSlip ? 'Student Enrollment Credentials' : 'Enroll New Student into Department'}
                    </h3>
                    <p className="text-xs text-[#666666]">
                      {generatedStudentSlip
                        ? 'Official student portal credentials generated successfully'
                        : 'Register student into department cohort and issue portal access'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsStudentModalOpen(false)
                    setGeneratedStudentSlip(null)
                  }}
                  className="rounded-lg p-1.5 text-[#666666] hover:bg-[#F5F6F8] hover:text-[#1F1F1F] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {!generatedStudentSlip ? (
                <form onSubmit={handleEnrollStudentSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#1F1F1F]">
                      Student Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Siddharth Verma"
                      value={studentForm.fullName}
                      onChange={(e) => setStudentForm((prev) => ({ ...prev, fullName: e.target.value }))}
                      className="w-full text-xs rounded-xl border border-[#E2E6ED] px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#1F1F1F]">
                      Institutional Student Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. siddharth.v@campusflow.edu"
                      value={studentForm.email}
                      onChange={(e) => setStudentForm((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full text-xs font-mono rounded-xl border border-[#E2E6ED] px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1F1F1F]">Department</label>
                      <select
                        value={studentForm.department}
                        onChange={(e) => setStudentForm((prev) => ({ ...prev, department: e.target.value }))}
                        className="w-full text-xs rounded-xl border border-[#E2E6ED] px-2.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                      >
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1F1F1F]">Semester</label>
                      <select
                        value={studentForm.semester}
                        onChange={(e) => setStudentForm((prev) => ({ ...prev, semester: Number(e.target.value) }))}
                        className="w-full text-xs rounded-xl border border-[#E2E6ED] px-2.5 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                      >
                        <option value={4}>Semester 4</option>
                        <option value={6}>Semester 6</option>
                        <option value={8}>Semester 8</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1F1F1F]">Roll Number</label>
                      <input
                        type="text"
                        value={studentForm.rollNo}
                        onChange={(e) => setStudentForm((prev) => ({ ...prev, rollNo: e.target.value }))}
                        className="w-full text-xs font-mono rounded-xl border border-[#E2E6ED] px-2.5 py-2.5 bg-[#F5F6F8]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#1F1F1F]">Initial Temporary Password</label>
                      <button
                        type="button"
                        onClick={() => setStudentForm((prev) => ({ ...prev, password: generateNewStudentPassword() }))}
                        className="text-[11px] text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw size={11} />
                        Regenerate
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={studentForm.password}
                        onChange={(e) => setStudentForm((prev) => ({ ...prev, password: e.target.value }))}
                        className="w-full text-xs font-mono rounded-xl border border-[#E2E6ED] px-3.5 py-2.5 bg-[#F5F6F8] text-[#1F1F1F]"
                      />
                      <Lock size={13} className="absolute right-3 top-3 text-[#666666]" />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E6ED]">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsStudentModalOpen(false)}
                      className="text-xs border-[#E2E6ED] text-[#666666] hover:bg-[#F5F6F8] cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-sm cursor-pointer"
                    >
                      <KeyRound size={13} className="mr-1.5" />
                      Enroll Student & Issue Passcode
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <Check size={18} className="text-emerald-600" />
                      Student Enrolled Successfully!
                    </div>
                    <p className="text-xs text-emerald-900 leading-relaxed">
                      Student record added to institutional database. The student can now sign in using these credentials to access attendance trajectories and courses.
                    </p>

                    <div className="border-t border-emerald-200 pt-3 space-y-2">
                      <div className="flex items-center justify-between bg-white rounded-xl p-2.5 border border-emerald-100">
                        <div>
                          <span className="text-[10px] text-[#666666] uppercase tracking-wider block">Student Name & Dept</span>
                          <span className="text-xs font-bold text-[#1F1F1F]">{generatedStudentSlip.profile.full_name} ({generatedStudentSlip.profile.department} · Sem {generatedStudentSlip.profile.semester})</span>
                        </div>
                        <Badge tone="cyan">Student</Badge>
                      </div>

                      <div className="flex items-center justify-between bg-white rounded-xl p-2.5 border border-emerald-100">
                        <div>
                          <span className="text-[10px] text-[#666666] uppercase tracking-wider block">Login Portal Email</span>
                          <span className="text-xs font-mono font-bold text-[#1F1F1F]">{generatedStudentSlip.profile.email}</span>
                        </div>
                        <Badge tone="blue">Roll No: {generatedStudentSlip.profile.roll_no}</Badge>
                      </div>

                      <div className="flex items-center justify-between bg-white rounded-xl p-2.5 border border-emerald-100">
                        <div>
                          <span className="text-[10px] text-[#666666] uppercase tracking-wider block">Temporary Password</span>
                          <span className="text-sm font-mono font-bold text-[#2563EB]">{generatedStudentSlip.tempPassword}</span>
                        </div>
                        <Badge tone="amber">Active</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyStudentCredentials}
                      className="w-full sm:w-auto text-xs border-[#E2E6ED] text-[#1F1F1F] hover:bg-[#F5F6F8] cursor-pointer flex items-center gap-1.5"
                    >
                      {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      {copied ? 'Credentials Copied!' : 'Copy Student Credentials'}
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setGeneratedStudentSlip(null)
                        setIsStudentModalOpen(false)
                      }}
                      className="w-full sm:w-auto text-xs bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold cursor-pointer shadow-sm"
                    >
                      Done & Close
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
