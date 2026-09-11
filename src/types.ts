export type Role = 'student' | 'faculty' | 'hod' | 'admin'
export type AttendanceStatus = 'present' | 'absent' | 'late'
export type AssignmentKind = 'assignment' | 'exam'
export type NoticeCategory = 'academic' | 'exam' | 'urgent' | 'event'
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'active' | 'breached' | 'accepted' | 'completed'
export type AppView =
  | 'command'
  | 'attendance'
  | 'priority'
  | 'timeline'
  | 'corrections'
  | 'faculty'
  | 'hod'
  | 'admin'
  | 'portfolio'
  | 'timetable'
  | 'od-requests'
  | 'submissions'
  | 'ai-hub'

export interface Profile {
  id: string
  full_name: string
  role: Role
  email: string
  roll_no: string | null
  department: string | null
  semester: number | null
  designation?: string | null
}

export interface Subject {
  id: string
  code: string
  name: string
  faculty_id: string | null
  faculty_name?: string
  min_attendance_pct: number
  department?: string
  credits?: number
  contact_hours_per_week?: number
  semester?: number
  academic_year?: string
}

export interface AuditLog {
  id: string
  timestamp: string
  actor_id: string
  actor_name: string
  actor_role: Role
  action:
    | 'COURSE_ALLOCATION'
    | 'ATTENDANCE_OVERRIDE'
    | 'GRADE_SUBMITTED'
    | 'DISPUTE_REVIEW'
    | 'WARNING_ISSUED'
    | 'NOTICE_PUBLISHED'
    | 'FLASHROLL_STARTED'
    | 'FLASHROLL_ENDED'
    | 'FLASHROLL_VERIFIED'
    | 'ATTENDANCE_LOAN_REQUESTED'
    | 'ATTENDANCE_LOAN_REVIEWED'
    | 'SUBSTITUTION_REQUESTED'
    | 'SUBSTITUTION_UPDATED'
    | 'OD_FILED'
    | 'OD_CREDITED'
  target: string
  details: string
}

export interface FacultyWorkload {
  faculty_id: string
  faculty_name: string
  department: string
  assigned_courses_count: number
  total_credits: number
  total_contact_hours: number
  status: 'optimal' | 'light' | 'overburdened'
}

export interface AttendanceRecord {
  id: string
  student_id: string
  subject_id: string
  session_date: string
  status: AttendanceStatus
  marked_by: string | null
}

export interface QuestionOBE {
  id: string
  text: string
  points: number
  course_outcome: 'CO1' | 'CO2' | 'CO3' | 'CO4' | 'CO5'
  blooms_level: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate'
}

export interface Assignment {
  id: string
  subject_id: string | null
  title: string
  description: string | null
  questions?: string[]
  questions_obe?: QuestionOBE[]
  question_pdf_url?: string | null
  kind: AssignmentKind
  due_at: string
  urgency: number
  created_by: string | null
}

export interface Notice {
  id: string
  title: string
  body: string
  category: NoticeCategory
  event_at: string | null
  is_pinned: boolean
  created_by: string | null
  faculty_name?: string
  subject_id?: string
  subject_code?: string
  subject_name?: string
  topic?: string
  created_at: string
  audience?: NoticeAudience
}

export interface NoticeAudience {
  departments?: string[]
  semesters?: number[]
  batches?: string[]
}

export interface CorrectionRequest {
  id: string
  student_id: string
  attendance_record_id: string
  reason: string
  status: RequestStatus
  reviewed_by: string | null
  faculty_note: string | null
  created_at: string
}

export interface Achievement {
  id: string
  student_id: string
  title: string
  description: string | null
  category: string
  issuer: string | null
  verified: boolean
  awarded_on: string | null
  image_proof_url?: string | null
  certificate_url?: string | null
}

export interface Enrollment {
  student_id: string
  subject_id: string
}

export interface PriorityItem {
  id: string
  title: string
  subtitle: string
  score: number
  kind: 'deadline' | 'exam' | 'attendance' | 'notice'
  dueAt?: string
  actionHint: string
}

/* ---- Timetable ---- */
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'

export interface TimetableSlot {
  id: string
  subject_id: string
  day: DayOfWeek
  start_time: string // "09:00"
  end_time: string   // "10:00"
  room: string
  type?: 'lecture' | 'lab' | 'tutorial'
}

/* ---- OD / Medical Leave Reconciliation ---- */
export type ODType = 'od' | 'medical'

export interface ApprovalStep {
  role: string // 'class_advisor' | 'faculty' | 'hod'
  label: string
  approved_by: string | null
  status: RequestStatus
  note: string | null
  timestamp: string | null
}

export interface MatchedSession {
  subject_id: string
  subject_code: string
  subject_name: string
  date: string
  start_time: string
  end_time: string
  hours: number
}

export interface AttendanceImpact {
  subject_id: string
  subject_code: string
  current_pct: number
  projected_pct: number
  gain_pct: number
}

export interface ODRequest {
  id: string
  student_id: string
  type: ODType
  reason: string
  evidence_url: string | null
  from_date: string
  to_date: string
  approval_chain: ApprovalStep[]
  created_at: string
  matched_sessions?: MatchedSession[]
  attendance_impact?: AttendanceImpact[]
  credited?: boolean
}

/* ---- Academic Recovery Contract (Attendance Loan) ---- */
export interface AttendanceLoan {
  id: string
  student_id: string
  student_name: string
  student_roll?: string
  subject_id: string
  subject_code: string
  subject_name: string
  current_pct: number
  target_pct: number
  remedial_hours_pledged: number
  remedial_hours_required?: number
  remedial_hours_completed?: number
  compensatory_task: string
  status: RequestStatus
  hod_approved_by?: string
  hod_approved_at?: string
  hod_note?: string | null
  created_at: string
}

/* ---- Dynamic Rotating TOTP Attendance (Flash-Roll) ---- */
export interface FlashRollSession {
  subject_id: string
  subject_code: string
  subject_name: string
  token: string
  expires_at: string | number
  attendee_ids: string[]
  total_enrolled: number
  classroom_lat?: number
  classroom_lng?: number
  is_active: boolean
}

/* ---- Smart Peer Faculty Substitution ---- */
export interface FacultySubstitution {
  id: string
  subject_id: string
  subject_code: string
  subject_name: string
  original_faculty_id: string
  original_faculty_name: string
  substitute_faculty_id: string
  substitute_faculty_name: string
  date: string
  slot_time: string
  reason: string
  status: RequestStatus
  created_at: string
}

/* ---- OBE & Accreditation Telemetry ---- */
export interface COAttainment {
  co_code: string
  description: string
  target_pct: number
  current_attainment_pct: number
  status: 'attained' | 'in_progress' | 'critical' | 'exceeded' | 'met' | 'at_risk'
}

export interface BloomsDistribution {
  level: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate'
  percentage: number
  count: number
  color?: string
}

/* ---- Submissions & Gradebook ---- */
export interface Submission {
  id: string
  assignment_id: string
  student_id: string
  file_url: string | null
  file_name?: string | null
  file_size?: string | null
  repo_url?: string | null
  submitted_at: string
  grade: number | null
  max_grade: number
  feedback: string | null
}

/* ---- AI Agent Types ---- */
export interface AttendanceInsight {
  subject_id: string
  subject_code: string
  current_pct: number
  target_pct: number
  classes_needed: number
  remaining_sessions: number
  risk_level: 'safe' | 'warning' | 'danger'
  recovery_plan: string
  projected_eod_pct: number
}

export interface StudyMilestone {
  id: string
  label: string
  phase: 'research' | 'draft' | 'review' | 'submit'
  estimated_hours: number
  completed: boolean
  due_by: string
}

export interface StudyPlan {
  assignment_id: string
  milestones: StudyMilestone[]
  total_hours: number
  urgency_label: string
}

export interface BroadcastAnalysis {
  extracted_dates: string[]
  extracted_locations: string[]
  action_items: string[]
  suggested_category: NoticeCategory
  suggested_audience: NoticeAudience
  is_urgent: boolean
  summary: string
}
