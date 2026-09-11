import type {
  Achievement,
  Assignment,
  AttendanceRecord,
  AuditLog,
  AttendanceLoan,
  BloomsDistribution,
  COAttainment,
  CorrectionRequest,
  Enrollment,
  FacultySubstitution,
  Notice,
  ODRequest,
  Profile,
  Subject,
  Submission,
  TimetableSlot,
} from '../types'

export const DEMO_PASSWORD = 'CampusFlow!23'

export const DEMO_FACULTIES: Profile[] = [
  // Computer Science
  {
    id: '22222222-2222-2222-2222-222222222222',
    full_name: 'Dr. Kavya Iyer',
    role: 'faculty',
    email: 'faculty@campusflow.edu',
    roll_no: null,
    department: 'Computer Science',
    semester: null,
    designation: 'Associate Professor & Course Lead',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    full_name: 'Prof. Rajesh Kumar',
    role: 'faculty',
    email: 'rajesh@campusflow.edu',
    roll_no: null,
    department: 'Computer Science',
    semester: null,
    designation: 'Assistant Professor, DBMS Lead',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    full_name: 'Dr. Anand Verma',
    role: 'faculty',
    email: 'anand.verma@campusflow.edu',
    roll_no: null,
    department: 'Computer Science',
    semester: null,
    designation: 'Associate Professor, Systems Lab',
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    full_name: 'Prof. Priya Sundaram',
    role: 'faculty',
    email: 'priya.s@campusflow.edu',
    roll_no: null,
    department: 'Computer Science',
    semester: null,
    designation: 'Assistant Professor, Networks',
  },
  // Information Technology
  {
    id: 'fac-it-1',
    full_name: 'Prof. Sameer Kulkarni',
    role: 'faculty',
    email: 'sameer.k@campusflow.edu',
    roll_no: null,
    department: 'Information Technology',
    semester: null,
    designation: 'Associate Professor, Cloud Lead',
  },
  {
    id: 'fac-it-2',
    full_name: 'Dr. Neha Deshmukh',
    role: 'faculty',
    email: 'neha.d@campusflow.edu',
    roll_no: null,
    department: 'Information Technology',
    semester: null,
    designation: 'Assistant Professor, Web Tech',
  },
  // Electrical & Electronics
  {
    id: 'fac-eee-1',
    full_name: 'Dr. Rakesh Sengupta',
    role: 'faculty',
    email: 'rakesh.s@campusflow.edu',
    roll_no: null,
    department: 'Electrical Engineering',
    semester: null,
    designation: 'Associate Professor, Control Systems',
  },
  {
    id: 'fac-eee-2',
    full_name: 'Prof. Ananya Roy',
    role: 'faculty',
    email: 'ananya.r@campusflow.edu',
    roll_no: null,
    department: 'Electrical Engineering',
    semester: null,
    designation: 'Assistant Professor, Signals & DSP',
  },
  // Mechanical Engineering
  {
    id: 'fac-me-1',
    full_name: 'Dr. Manish Patil',
    role: 'faculty',
    email: 'manish.p@campusflow.edu',
    roll_no: null,
    department: 'Mechanical Engineering',
    semester: null,
    designation: 'Professor, Thermal Systems',
  },
  {
    id: 'fac-me-2',
    full_name: 'Prof. Suresh Nair',
    role: 'faculty',
    email: 'suresh.n@campusflow.edu',
    roll_no: null,
    department: 'Mechanical Engineering',
    semester: null,
    designation: 'Associate Professor, Fluid Dynamics',
  },
]

export const DEMO_HODS: Profile[] = [
  {
    id: '77777777-7777-7777-7777-777777777777',
    full_name: 'Prof. Ramanathan Sharma',
    role: 'hod',
    email: 'hod.cs@campusflow.edu',
    roll_no: 'HOD-CSE-01',
    department: 'Computer Science',
    semester: null,
    designation: 'Head of Department & Academic Chair',
  },
  {
    id: 'hod-it-01',
    full_name: 'Dr. Sunita Rao',
    role: 'hod',
    email: 'hod.it@campusflow.edu',
    roll_no: 'HOD-IT-02',
    department: 'Information Technology',
    semester: null,
    designation: 'Head of Department, IT',
  },
  {
    id: 'hod-eee-01',
    full_name: 'Prof. Vikram Malhotra',
    role: 'hod',
    email: 'hod.eee@campusflow.edu',
    roll_no: 'HOD-EEE-03',
    department: 'Electrical Engineering',
    semester: null,
    designation: 'Head of Department, Electrical',
  },
  {
    id: 'hod-me-01',
    full_name: 'Dr. Arvind Patel',
    role: 'hod',
    email: 'hod.me@campusflow.edu',
    roll_no: 'HOD-ME-04',
    department: 'Mechanical Engineering',
    semester: null,
    designation: 'Head of Department, Mechanical',
  },
]

export const DEMO_PROFILES: Record<string, { password: string; profile: Profile }> = {
  'student@campusflow.edu': {
    password: DEMO_PASSWORD,
    profile: {
      id: '11111111-1111-1111-1111-111111111111',
      full_name: 'Aarav Mehta',
      role: 'student',
      email: 'student@campusflow.edu',
      roll_no: 'CS21B1042',
      department: 'Computer Science',
      semester: 6,
    },
  },
  'aditya.j@campusflow.edu': {
    password: DEMO_PASSWORD,
    profile: {
      id: 'stud-it-1',
      full_name: 'Aditya Joshi',
      role: 'student',
      email: 'aditya.j@campusflow.edu',
      roll_no: 'IT21B2011',
      department: 'Information Technology',
      semester: 6,
    },
  },
  'student.it@campusflow.edu': {
    password: DEMO_PASSWORD,
    profile: {
      id: 'stud-it-1',
      full_name: 'Aditya Joshi',
      role: 'student',
      email: 'student.it@campusflow.edu',
      roll_no: 'IT21B2011',
      department: 'Information Technology',
      semester: 6,
    },
  },
  'faculty@campusflow.edu': {
    password: DEMO_PASSWORD,
    profile: DEMO_FACULTIES[0],
  },
  'rajesh@campusflow.edu': {
    password: DEMO_PASSWORD,
    profile: DEMO_FACULTIES[1],
  },
  'hod.cs@campusflow.edu': {
    password: DEMO_PASSWORD,
    profile: DEMO_HODS[0],
  },
  'hod.it@campusflow.edu': {
    password: DEMO_PASSWORD,
    profile: DEMO_HODS[1],
  },
  'hod.eee@campusflow.edu': {
    password: DEMO_PASSWORD,
    profile: DEMO_HODS[2],
  },
  'hod.me@campusflow.edu': {
    password: DEMO_PASSWORD,
    profile: DEMO_HODS[3],
  },
  'admin@campusflow.edu': {
    password: DEMO_PASSWORD,
    profile: {
      id: '33333333-3333-3333-3333-333333333333',
      full_name: 'Dean Sharma',
      role: 'admin',
      email: 'admin@campusflow.edu',
      roll_no: 'ADMIN-001',
      department: 'Administration',
      semester: null,
      designation: 'Dean of Academic Affairs',
    },
  },
}

const student = DEMO_PROFILES['student@campusflow.edu'].profile.id
const faculty = DEMO_PROFILES['faculty@campusflow.edu'].profile.id
export const admin = DEMO_PROFILES['admin@campusflow.edu'].profile.id

export const DEMO_SUBJECTS: Subject[] = [
  {
    id: 'sub-dsa',
    code: 'CS301',
    name: 'Data Structures & Algorithms',
    faculty_id: '22222222-2222-2222-2222-222222222222',
    faculty_name: 'Dr. Kavya Iyer',
    min_attendance_pct: 75,
    department: 'Computer Science',
    credits: 4,
    contact_hours_per_week: 4,
    semester: 6,
    academic_year: '2025-2026',
  },
  {
    id: 'sub-dbms',
    code: 'CS302',
    name: 'Database Management Systems',
    faculty_id: '44444444-4444-4444-4444-444444444444',
    faculty_name: 'Prof. Rajesh Kumar',
    min_attendance_pct: 75,
    department: 'Computer Science',
    credits: 4,
    contact_hours_per_week: 4,
    semester: 6,
    academic_year: '2025-2026',
  },
  {
    id: 'sub-os',
    code: 'CS303',
    name: 'Operating Systems',
    faculty_id: '55555555-5555-5555-5555-555555555555',
    faculty_name: 'Dr. Anand Verma',
    min_attendance_pct: 75,
    department: 'Computer Science',
    credits: 3,
    contact_hours_per_week: 3,
    semester: 6,
    academic_year: '2025-2026',
  },
  {
    id: 'sub-cn',
    code: 'CS304',
    name: 'Computer Networks',
    faculty_id: '66666666-6666-6666-6666-666666666666',
    faculty_name: 'Prof. Priya Sundaram',
    min_attendance_pct: 80,
    department: 'Computer Science',
    credits: 3,
    contact_hours_per_week: 3,
    semester: 6,
    academic_year: '2025-2026',
  },
  // Information Technology
  {
    id: 'sub-it-cloud',
    code: 'IT301',
    name: 'Cloud Computing & DevOps',
    faculty_id: 'fac-it-1',
    faculty_name: 'Prof. Sameer Kulkarni',
    min_attendance_pct: 75,
    department: 'Information Technology',
    credits: 4,
    contact_hours_per_week: 4,
    semester: 6,
    academic_year: '2025-2026',
  },
  {
    id: 'sub-it-web',
    code: 'IT302',
    name: 'Full Stack Web Architecture',
    faculty_id: 'fac-it-2',
    faculty_name: 'Dr. Neha Deshmukh',
    min_attendance_pct: 75,
    department: 'Information Technology',
    credits: 4,
    contact_hours_per_week: 4,
    semester: 6,
    academic_year: '2025-2026',
  },
  // Electrical Engineering
  {
    id: 'sub-ee-control',
    code: 'EE301',
    name: 'Control Systems Engineering',
    faculty_id: 'fac-eee-1',
    faculty_name: 'Dr. Rakesh Sengupta',
    min_attendance_pct: 75,
    department: 'Electrical Engineering',
    credits: 4,
    contact_hours_per_week: 4,
    semester: 6,
    academic_year: '2025-2026',
  },
  {
    id: 'sub-ee-dsp',
    code: 'EE302',
    name: 'Digital Signal Processing',
    faculty_id: 'fac-eee-2',
    faculty_name: 'Prof. Ananya Roy',
    min_attendance_pct: 75,
    department: 'Electrical Engineering',
    credits: 3,
    contact_hours_per_week: 3,
    semester: 6,
    academic_year: '2025-2026',
  },
  // Mechanical Engineering
  {
    id: 'sub-me-thermo',
    code: 'ME301',
    name: 'Applied Thermodynamics',
    faculty_id: 'fac-me-1',
    faculty_name: 'Dr. Manish Patil',
    min_attendance_pct: 75,
    department: 'Mechanical Engineering',
    credits: 4,
    contact_hours_per_week: 4,
    semester: 6,
    academic_year: '2025-2026',
  },
  {
    id: 'sub-me-fluid',
    code: 'ME302',
    name: 'Fluid Mechanics & Machinery',
    faculty_id: 'fac-me-2',
    faculty_name: 'Prof. Suresh Nair',
    min_attendance_pct: 75,
    department: 'Mechanical Engineering',
    credits: 4,
    contact_hours_per_week: 4,
    semester: 6,
    academic_year: '2025-2026',
  },
]

export const DEMO_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-001',
    timestamp: '2026-09-08T09:30:00Z',
    actor_id: '77777777-7777-7777-7777-777777777777',
    actor_name: 'Prof. Ramanathan Sharma',
    actor_role: 'hod',
    action: 'COURSE_ALLOCATION',
    target: 'CS301 Data Structures & Algorithms',
    details: 'Allocated CS301 (4 Credits) to Dr. Kavya Iyer for Sem 6 CSE.',
  },
  {
    id: 'audit-002',
    timestamp: '2026-09-08T09:35:00Z',
    actor_id: '77777777-7777-7777-7777-777777777777',
    actor_name: 'Prof. Ramanathan Sharma',
    actor_role: 'hod',
    action: 'COURSE_ALLOCATION',
    target: 'CS302 Database Management Systems',
    details: 'Allocated CS302 (4 Credits) to Prof. Rajesh Kumar for Sem 6 CSE.',
  },
  {
    id: 'audit-003',
    timestamp: '2026-09-08T11:15:00Z',
    actor_id: '22222222-2222-2222-2222-222222222222',
    actor_name: 'Dr. Kavya Iyer',
    actor_role: 'faculty',
    action: 'ATTENDANCE_OVERRIDE',
    target: 'CS301 - Session 2026-09-08',
    details: 'Marked daily attendance register for 12 enrolled students.',
  },
  {
    id: 'audit-004',
    timestamp: '2026-09-09T14:20:00Z',
    actor_id: '22222222-2222-2222-2222-222222222222',
    actor_name: 'Dr. Kavya Iyer',
    actor_role: 'faculty',
    action: 'WARNING_ISSUED',
    target: 'Aarav Mehta (CS21B1042)',
    details: 'Dispatched formal low-attendance warning notice (Shortfall: 68.7%).',
  },
]

export const DEMO_ENROLLMENTS: Enrollment[] = DEMO_SUBJECTS.map((s) => ({
  student_id: student,
  subject_id: s.id,
}))

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function daysFromNow(n: number, hour = 10) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export function buildDemoAttendance(): AttendanceRecord[] {
  const rows: AttendanceRecord[] = []
  const push = (studentId: string, subjectId: string, count: number, absentEvery: number | null) => {
    for (let g = 1; g <= count; g++) {
      const absent = absentEvery !== null && g % absentEvery === 0
      rows.push({
        id: `att-${studentId}-${subjectId}-${g}`,
        student_id: studentId,
        subject_id: subjectId,
        session_date: daysAgo(g),
        status: absent ? 'absent' : 'present',
        marked_by: faculty,
      })
    }
  }
  // CS Student (Aarav Mehta - CS)
  push(student, 'sub-dsa', 16, 4)
  push(student, 'sub-dbms', 14, 7)
  push(student, 'sub-os', 12, 9)
  push(student, 'sub-cn', 10, null)
  
  // IT Student (Aditya Joshi - IT)
  const itStudentId = 'stud-it-1'
  push(itStudentId, 'sub-it-cloud', 16, 4)
  push(itStudentId, 'sub-it-web', 14, 5)

  // Other demo subject baselines
  push(student, 'sub-it-cloud', 14, 5)
  push(student, 'sub-it-web', 12, null)
  push(student, 'sub-ee-control', 15, 3)
  push(student, 'sub-ee-dsp', 12, 6)
  push(student, 'sub-me-thermo', 14, null)
  push(student, 'sub-me-fluid', 13, 4)
  return rows
}

export const DEMO_ASSIGNMENTS: Assignment[] = [
  {
    id: 'as-1',
    subject_id: 'sub-dsa',
    title: 'Graph Algorithms Lab',
    description: 'Implement Dijkstra and A* pathfinding with visual traces on grid networks.',
    questions: [
      '1. Implement Dijkstra\'s single-source shortest path algorithm using an Indexed Priority Queue with O((V+E)log V) complexity.',
      '2. Implement A* heuristic search algorithm on a 2D Euclidean grid with Euclidean & Manhattan heuristics.',
      '3. Compare runtime efficiency and total node expansions across a 50x50 grid with 20% random obstacles.',
      '4. Provide benchmark visualization plots and algorithmic optimality analysis in the report.'
    ],
    questions_obe: [
      {
        id: 'qobe-1',
        text: 'Implement Dijkstra\'s single-source shortest path algorithm using an Indexed Priority Queue with O((V+E)log V) complexity.',
        points: 15,
        course_outcome: 'CO1',
        blooms_level: 'Apply',
      },
      {
        id: 'qobe-2',
        text: 'Implement A* heuristic search algorithm on a 2D Euclidean grid with Euclidean & Manhattan heuristics.',
        points: 15,
        course_outcome: 'CO1',
        blooms_level: 'Analyze',
      },
      {
        id: 'qobe-3',
        text: 'Compare runtime efficiency and total node expansions across a 50x50 grid with 20% random obstacles.',
        points: 10,
        course_outcome: 'CO1',
        blooms_level: 'Evaluate',
      },
      {
        id: 'qobe-4',
        text: 'Provide benchmark visualization plots and algorithmic optimality analysis in the report.',
        points: 10,
        course_outcome: 'CO1',
        blooms_level: 'Understand',
      },
    ],
    question_pdf_url: 'https://campusflow.edu/materials/cs301_lab_graph_pathfinding.pdf',
    kind: 'assignment',
    due_at: daysFromNow(2, 23),
    urgency: 5,
    created_by: faculty,
  },
  {
    id: 'as-2',
    subject_id: 'sub-dbms',
    title: 'Normalization Mini-Project',
    description: 'Bring an unnormalized healthcare management schema to 3NF and analyze BCNF tradeoffs.',
    questions: [
      '1. Identify all functional dependencies (FD set) and multivalued dependencies from the provided hospital admission dataset.',
      '2. Step-by-step decompose the unnormalized schema into 1NF, 2NF, and 3NF, ensuring lossless-join and dependency preservation.',
      '3. Evaluate whether BCNF decomposition is achievable without sacrificing functional dependencies.',
      '4. Generate an interactive ER Diagram and normalized PostgreSQL DDL migration script with foreign key constraints.'
    ],
    question_pdf_url: 'https://campusflow.edu/materials/cs302_project_schema_normalization.pdf',
    kind: 'assignment',
    due_at: daysFromNow(5, 18),
    urgency: 3,
    created_by: faculty,
  },
  {
    id: 'as-3',
    subject_id: 'sub-os',
    title: 'Mid-Term Examination',
    description: 'Comprehensive evaluation covering CPU scheduling, synchronization, and memory paging.',
    questions: [
      '1. Section A (Theory): Multi-level feedback queue vs CFS scheduling with real-time process priorities (15 Marks)',
      '2. Section B (Problem): Banker\'s Algorithm deadlock avoidance analysis with 4 processes and 3 resource types (20 Marks)',
      '3. Section C (Architecture): Two-level virtual memory paging and TLB hit/miss effective access time calculation (15 Marks)'
    ],
    question_pdf_url: 'https://campusflow.edu/materials/cs303_midterm_syllabus_blueprint.pdf',
    kind: 'exam',
    due_at: daysFromNow(8, 9),
    urgency: 5,
    created_by: faculty,
  },
  {
    id: 'as-4',
    subject_id: 'sub-cn',
    title: 'Wireshark Capture & Protocol Analysis',
    description: 'Capture real-world TCP handshakes and analyze sequence numbers and flow control.',
    questions: [
      '1. Capture a complete 3-way TCP handshake (SYN, SYN-ACK, ACK) and note down initial sequence numbers (ISNs).',
      '2. Inspect TCP window scale option, MSS negotiation, and selective acknowledgment (SACK) headers.',
      '3. Induce artificial packet loss and capture TCP Fast Retransmit / Dup ACK sequences.',
      '4. Submit .pcapng file or annotated PDF report with packet stream timeline.'
    ],
    question_pdf_url: 'https://campusflow.edu/materials/cs304_wireshark_capture_guide.pdf',
    kind: 'assignment',
    due_at: daysFromNow(12, 17),
    urgency: 2,
    created_by: faculty,
  },
  {
    id: 'as-5',
    subject_id: 'sub-dsa',
    title: 'End-Semester Practical Examination',
    description: 'Live coding assessment covering balanced trees, disjoint set unions, and max-flow graphs.',
    questions: [
      '1. Practical Task 1: Red-Black Tree insertion with balance fixup rotations and recoloring logic.',
      '2. Practical Task 2: Edmonds-Karp maximum flow implementation with residual network visualization.',
      '3. Technical Viva Voce: Amortized complexity analysis using potential method.'
    ],
    question_pdf_url: 'https://campusflow.edu/materials/cs301_practical_rubric.pdf',
    kind: 'exam',
    due_at: daysFromNow(21, 10),
    urgency: 4,
    created_by: faculty,
  },
  // Information Technology Assignments
  {
    id: 'as-it-1',
    subject_id: 'sub-it-cloud',
    title: 'Kubernetes Cluster Architecture & Helm Deployments',
    description: 'Deploy a multi-tier microservices application on a local Minikube cluster using Helm charts and ingress controllers.',
    questions: [
      '1. Configure a 3-node cluster topology with persistent volume claims (PVC) backed by hostpath provisioner.',
      '2. Write Helm templates with values.yaml parameterization for production and staging environments.',
      '3. Implement horizontal pod autoscaling (HPA) targeting CPU utilization > 70% with stress testing verification.',
      '4. Submit repository URL with CI/CD GitHub Actions pipeline yaml and terminal screenshots.'
    ],
    question_pdf_url: 'https://campusflow.edu/materials/it301_kubernetes_helm_lab.pdf',
    kind: 'assignment',
    due_at: daysFromNow(4, 23),
    urgency: 4,
    created_by: 'fac-it-1',
  },
  {
    id: 'as-it-2',
    subject_id: 'sub-it-web',
    title: 'Full Stack Microservices with JWT & Redis Cache',
    description: 'Build an event-driven RESTful API gateway with token-based authentication and Redis distributed caching.',
    questions: [
      '1. Implement access token and refresh token rotation with HTTP-only secure cookie storage.',
      '2. Cache expensive database queries in Redis with a 300s TTL and cache-invalidation hooks on write operations.',
      '3. Benchmark endpoint response latency with Apache Bench (1000 requests, concurrency 50).'
    ],
    question_pdf_url: 'https://campusflow.edu/materials/it302_microservices_project.pdf',
    kind: 'assignment',
    due_at: daysFromNow(7, 18),
    urgency: 3,
    created_by: 'fac-it-2',
  },
  // Electrical Engineering Assignments
  {
    id: 'as-ee-1',
    subject_id: 'sub-ee-control',
    title: 'Bode Plot & State-Space Stability Analysis',
    description: 'Perform frequency response modeling and root-locus stability design for a fourth-order feedback system.',
    questions: [
      '1. Derive the open-loop and closed-loop transfer functions for the inverted pendulum system.',
      '2. Plot Bode gain and phase margins; determine gain crossover frequency and phase crossover frequency.',
      '3. Design a lead-lag compensator in MATLAB/Simulink to achieve a 45-degree phase margin.'
    ],
    question_pdf_url: 'https://campusflow.edu/materials/ee301_control_stability_lab.pdf',
    kind: 'assignment',
    due_at: daysFromNow(5, 17),
    urgency: 4,
    created_by: 'fac-eee-1',
  },
  {
    id: 'as-ee-2',
    subject_id: 'sub-ee-dsp',
    title: 'FIR/IIR Filter Design & FFT Spectral Analysis',
    description: 'Design digital Butterworth and Chebyshev low-pass filters with bilinear transformation.',
    questions: [
      '1. Implement a 64-point Radix-2 Decimation-in-Time FFT algorithm from mathematical definition.',
      '2. Filter high-frequency noise from a synthetic audio signal with an 8th-order IIR Butterworth filter.'
    ],
    question_pdf_url: 'https://campusflow.edu/materials/ee302_dsp_filter_design.pdf',
    kind: 'assignment',
    due_at: daysFromNow(10, 20),
    urgency: 2,
    created_by: 'fac-eee-2',
  },
  // Mechanical Engineering Assignments
  {
    id: 'as-me-1',
    subject_id: 'sub-me-thermo',
    title: 'Rankine Cycle Reheat & Regeneration Thermal Analysis',
    description: 'Compute thermal efficiency and specific steam consumption across varying reheat pressures.',
    questions: [
      '1. Draw the T-s and h-s state diagrams for an ideal reheat Rankine cycle operating between 150 bar and 0.05 bar.',
      '2. Calculate boiler heat input, turbine work output, and thermodynamic first-law efficiency.'
    ],
    question_pdf_url: 'https://campusflow.edu/materials/me301_rankine_thermal_analysis.pdf',
    kind: 'assignment',
    due_at: daysFromNow(6, 15),
    urgency: 3,
    created_by: 'fac-me-1',
  },
  {
    id: 'as-me-2',
    subject_id: 'sub-me-fluid',
    title: 'Navier-Stokes Boundary Layer Simulation',
    description: 'Analyze laminar to turbulent boundary layer transitions over flat surfaces using computational fluid dynamics.',
    questions: [
      '1. Solve the Blasius equation using Runge-Kutta 4th-order numerical method for boundary layer thickness.',
      '2. Plot velocity profile u/U versus dimensionless distance eta and calculate wall shear stress.'
    ],
    question_pdf_url: 'https://campusflow.edu/materials/me302_fluid_boundary_layer.pdf',
    kind: 'assignment',
    due_at: daysFromNow(9, 18),
    urgency: 3,
    created_by: 'fac-me-2',
  },
]

export const DEMO_NOTICES: Notice[] = [
  {
    id: 'n-1',
    title: 'Mid-term seating plan released',
    body: 'Seating for CS303 mid-term is posted on the department board. Reach hall 30 minutes early.',
    category: 'exam',
    event_at: daysFromNow(8, 9),
    is_pinned: true,
    created_by: faculty,
    created_at: daysFromNow(-1),
  },
  {
    id: 'n-2',
    title: 'Hackathon briefings this Friday',
    body: 'Campus Hackathon office hours in Innovation Lab, 4–6 PM. Bring your problem-statement notes.',
    category: 'event',
    event_at: daysFromNow(3, 16),
    is_pinned: false,
    created_by: admin,
    created_at: daysFromNow(-2),
  },
  {
    id: 'n-3',
    title: 'Library hours extended',
    body: 'Central library stays open until 11 PM through internals week.',
    category: 'academic',
    event_at: null,
    is_pinned: false,
    created_by: admin,
    created_at: daysFromNow(-3),
  },
  {
    id: 'n-4',
    title: 'Urgent: ID card re-issue desk',
    body: 'Lost ID cards must be reissued before Friday or campus access will be restricted.',
    category: 'urgent',
    event_at: daysFromNow(2, 12),
    is_pinned: true,
    created_by: admin,
    created_at: daysFromNow(0),
  },
]

export const DEMO_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ach-1',
    student_id: student,
    title: 'Smart India Hackathon Finalist',
    description: 'National finals, software edition — developed autonomous campus logistics tracking system.',
    category: 'hackathon',
    issuer: 'Ministry of Education (MoE)',
    verified: true,
    awarded_on: daysAgo(40),
    image_proof_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80',
    certificate_url: 'https://campusflow.edu/credentials/cert_sih_finalist_2025.pdf',
  },
  {
    id: 'ach-2',
    student_id: student,
    title: 'Google Developer Student Clubs Lead',
    description: 'Conducted 12 technical community bootcamps on cloud architectures and modern web apps.',
    category: 'leadership',
    issuer: 'Google Developers',
    verified: true,
    awarded_on: daysAgo(120),
    image_proof_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80',
    certificate_url: 'https://campusflow.edu/credentials/cert_gdsc_lead_aarav.pdf',
  },
  {
    id: 'ach-3',
    student_id: student,
    title: 'Open Source Sprint Contributor',
    description: 'Merged 4 pull requests into the university learning management open-source portal.',
    category: 'opensource',
    issuer: 'GitHub Community',
    verified: false,
    awarded_on: daysAgo(10),
    image_proof_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
    certificate_url: 'https://campusflow.edu/credentials/cert_github_campus_expert.pdf',
  },
]

export const DEMO_CORRECTIONS: CorrectionRequest[] = [
  {
    id: 'cr-1',
    student_id: student,
    attendance_record_id: 'att-sub-dsa-4',
    reason: 'I was present — medical slip submitted at the desk after the lecture.',
    status: 'pending',
    reviewed_by: null,
    faculty_note: null,
    created_at: daysFromNow(-1),
  },
]

export const BATCH_STUDENTS: Profile[] = [
  // Computer Science & Engineering
  DEMO_PROFILES['student@campusflow.edu'].profile,
  {
    id: '44444444-4444-4444-4444-444444444444',
    full_name: 'Ishita Rao',
    role: 'student',
    email: 'ishita@campusflow.edu',
    roll_no: 'CS21B1058',
    department: 'Computer Science',
    semester: 6,
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    full_name: 'Rohan Kapoor',
    role: 'student',
    email: 'rohan@campusflow.edu',
    roll_no: 'CS21B1071',
    department: 'Computer Science',
    semester: 6,
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    full_name: 'Meera Nair',
    role: 'student',
    email: 'meera@campusflow.edu',
    roll_no: 'CS21B1084',
    department: 'Computer Science',
    semester: 6,
  },
  {
    id: 'stud-cs-4',
    full_name: 'Vikram Sethi',
    role: 'student',
    email: 'vikram.s@campusflow.edu',
    roll_no: 'CS21B1092',
    department: 'Computer Science',
    semester: 6,
  },
  {
    id: 'stud-cs-5',
    full_name: 'Divya Nambiar',
    role: 'student',
    email: 'divya.n@campusflow.edu',
    roll_no: 'CS22B1015',
    department: 'Computer Science',
    semester: 4,
  },
  // Information Technology
  {
    id: 'stud-it-1',
    full_name: 'Aditya Joshi',
    role: 'student',
    email: 'aditya.j@campusflow.edu',
    roll_no: 'IT21B2011',
    department: 'Information Technology',
    semester: 6,
  },
  {
    id: 'stud-it-2',
    full_name: 'Pooja Hegde',
    role: 'student',
    email: 'pooja.h@campusflow.edu',
    roll_no: 'IT21B2024',
    department: 'Information Technology',
    semester: 6,
  },
  {
    id: 'stud-it-3',
    full_name: 'Nikhil Saxena',
    role: 'student',
    email: 'nikhil.s@campusflow.edu',
    roll_no: 'IT21B2035',
    department: 'Information Technology',
    semester: 6,
  },
  {
    id: 'stud-it-4',
    full_name: 'Sneha Reddy',
    role: 'student',
    email: 'sneha.r@campusflow.edu',
    roll_no: 'IT22B2008',
    department: 'Information Technology',
    semester: 4,
  },
  {
    id: 'stud-it-5',
    full_name: 'Kunal Deshmukh',
    role: 'student',
    email: 'kunal.d@campusflow.edu',
    roll_no: 'IT20B2042',
    department: 'Information Technology',
    semester: 8,
  },
  // Electrical & Electronics Engineering
  {
    id: 'stud-ee-1',
    full_name: 'Karthik Raman',
    role: 'student',
    email: 'karthik.r@campusflow.edu',
    roll_no: 'EE21B3005',
    department: 'Electrical Engineering',
    semester: 6,
  },
  {
    id: 'stud-ee-2',
    full_name: 'Ananya Bharadwaj',
    role: 'student',
    email: 'ananya.b@campusflow.edu',
    roll_no: 'EE21B3018',
    department: 'Electrical Engineering',
    semester: 6,
  },
  {
    id: 'stud-ee-3',
    full_name: 'Siddharth Menon',
    role: 'student',
    email: 'siddharth.m@campusflow.edu',
    roll_no: 'EE21B3029',
    department: 'Electrical Engineering',
    semester: 6,
  },
  {
    id: 'stud-ee-4',
    full_name: 'Deepika Iyer',
    role: 'student',
    email: 'deepika.i@campusflow.edu',
    roll_no: 'EE22B3012',
    department: 'Electrical Engineering',
    semester: 4,
  },
  // Mechanical Engineering
  {
    id: 'stud-me-1',
    full_name: 'Tanvi Kulkarni',
    role: 'student',
    email: 'tanvi.k@campusflow.edu',
    roll_no: 'ME21B4019',
    department: 'Mechanical Engineering',
    semester: 6,
  },
  {
    id: 'stud-me-2',
    full_name: 'Harsh Vardhan',
    role: 'student',
    email: 'harsh.v@campusflow.edu',
    roll_no: 'ME21B4031',
    department: 'Mechanical Engineering',
    semester: 6,
  },
  {
    id: 'stud-me-3',
    full_name: 'Gaurav Shinde',
    role: 'student',
    email: 'gaurav.s@campusflow.edu',
    roll_no: 'ME21B4044',
    department: 'Mechanical Engineering',
    semester: 6,
  },
  {
    id: 'stud-me-4',
    full_name: 'Pallavi Chawla',
    role: 'student',
    email: 'pallavi.c@campusflow.edu',
    roll_no: 'ME22B4009',
    department: 'Mechanical Engineering',
    semester: 4,
  },
]

/* ---- Phase 3: Timetable ---- */
export const DEMO_TIMETABLE: TimetableSlot[] = [
  // Monday
  { id: 'tt-1', subject_id: 'sub-dsa', day: 'mon', start_time: '09:00', end_time: '10:00', room: 'CS-201', type: 'lecture' },
  { id: 'tt-2', subject_id: 'sub-dbms', day: 'mon', start_time: '10:15', end_time: '11:15', room: 'CS-202', type: 'lecture' },
  { id: 'tt-3', subject_id: 'sub-os', day: 'mon', start_time: '11:30', end_time: '12:30', room: 'CS-201', type: 'lecture' },
  { id: 'tt-4', subject_id: 'sub-dsa', day: 'mon', start_time: '14:00', end_time: '16:00', room: 'CS-Lab 1', type: 'lab' },

  // Tuesday
  { id: 'tt-5', subject_id: 'sub-cn', day: 'tue', start_time: '09:00', end_time: '10:00', room: 'CS-301', type: 'lecture' },
  { id: 'tt-6', subject_id: 'sub-dsa', day: 'tue', start_time: '10:15', end_time: '11:15', room: 'CS-201', type: 'lecture' },
  { id: 'tt-7', subject_id: 'sub-dbms', day: 'tue', start_time: '11:30', end_time: '12:30', room: 'CS-202', type: 'lecture' },
  { id: 'tt-8', subject_id: 'sub-dbms', day: 'tue', start_time: '14:00', end_time: '16:00', room: 'CS-Lab 2', type: 'lab' },

  // Wednesday
  { id: 'tt-9', subject_id: 'sub-dbms', day: 'wed', start_time: '09:00', end_time: '10:00', room: 'CS-202', type: 'lecture' },
  { id: 'tt-10', subject_id: 'sub-os', day: 'wed', start_time: '10:15', end_time: '11:15', room: 'CS-201', type: 'lecture' },
  { id: 'tt-11', subject_id: 'sub-cn', day: 'wed', start_time: '11:30', end_time: '12:30', room: 'CS-301', type: 'lecture' },
  { id: 'tt-12', subject_id: 'sub-os', day: 'wed', start_time: '14:00', end_time: '16:00', room: 'CS-Lab 1', type: 'lab' },

  // Thursday
  { id: 'tt-13', subject_id: 'sub-cn', day: 'thu', start_time: '09:00', end_time: '10:00', room: 'CS-301', type: 'lecture' },
  { id: 'tt-14', subject_id: 'sub-dsa', day: 'thu', start_time: '10:15', end_time: '11:15', room: 'CS-201', type: 'lecture' },
  { id: 'tt-15', subject_id: 'sub-os', day: 'thu', start_time: '11:30', end_time: '12:30', room: 'CS-201', type: 'lecture' },
  { id: 'tt-16', subject_id: 'sub-dbms', day: 'thu', start_time: '14:00', end_time: '15:00', room: 'CS-202', type: 'tutorial' },

  // Friday
  { id: 'tt-17', subject_id: 'sub-os', day: 'fri', start_time: '09:00', end_time: '10:00', room: 'CS-201', type: 'lecture' },
  { id: 'tt-18', subject_id: 'sub-cn', day: 'fri', start_time: '10:15', end_time: '11:15', room: 'CS-301', type: 'lecture' },
  { id: 'tt-19', subject_id: 'sub-dsa', day: 'fri', start_time: '11:30', end_time: '12:30', room: 'CS-201', type: 'tutorial' },
  { id: 'tt-20', subject_id: 'sub-cn', day: 'fri', start_time: '14:00', end_time: '16:00', room: 'CS-Lab 3', type: 'lab' },

  // Saturday
  { id: 'tt-21', subject_id: 'sub-dsa', day: 'sat', start_time: '09:30', end_time: '11:30', room: 'Seminar-A', type: 'tutorial' },
  { id: 'tt-22', subject_id: 'sub-os', day: 'sat', start_time: '11:45', end_time: '13:00', room: 'CS-Lab 1', type: 'lab' },

  // Information Technology Slots
  { id: 'tt-it-1', subject_id: 'sub-it-cloud', day: 'mon', start_time: '09:00', end_time: '10:00', room: 'IT-101', type: 'lecture' },
  { id: 'tt-it-2', subject_id: 'sub-it-web', day: 'mon', start_time: '10:15', end_time: '11:15', room: 'IT-Lab 1', type: 'lab' },
  { id: 'tt-it-3', subject_id: 'sub-it-cloud', day: 'wed', start_time: '11:30', end_time: '12:30', room: 'IT-101', type: 'lecture' },
  { id: 'tt-it-4', subject_id: 'sub-it-web', day: 'thu', start_time: '14:00', end_time: '15:00', room: 'IT-102', type: 'lecture' },

  // Electrical Engineering Slots
  { id: 'tt-ee-1', subject_id: 'sub-ee-control', day: 'mon', start_time: '10:15', end_time: '11:15', room: 'EE-201', type: 'lecture' },
  { id: 'tt-ee-2', subject_id: 'sub-ee-dsp', day: 'tue', start_time: '09:00', end_time: '10:00', room: 'EE-DSP Lab', type: 'lab' },
  { id: 'tt-ee-3', subject_id: 'sub-ee-control', day: 'thu', start_time: '11:30', end_time: '12:30', room: 'EE-201', type: 'lecture' },
  { id: 'tt-ee-4', subject_id: 'sub-ee-dsp', day: 'fri', start_time: '14:00', end_time: '15:00', room: 'EE-202', type: 'tutorial' },

  // Mechanical Engineering Slots
  { id: 'tt-me-1', subject_id: 'sub-me-thermo', day: 'tue', start_time: '10:15', end_time: '11:15', room: 'ME-301', type: 'lecture' },
  { id: 'tt-me-2', subject_id: 'sub-me-fluid', day: 'wed', start_time: '09:00', end_time: '10:00', room: 'ME-Fluid Lab', type: 'lab' },
  { id: 'tt-me-3', subject_id: 'sub-me-thermo', day: 'fri', start_time: '11:30', end_time: '12:30', room: 'ME-301', type: 'lecture' },
  { id: 'tt-me-4', subject_id: 'sub-me-fluid', day: 'sat', start_time: '09:00', end_time: '10:00', room: 'ME-302', type: 'tutorial' },
]

/* ---- Phase 3: OD / Medical Requests ---- */
export const DEMO_OD_REQUESTS: ODRequest[] = [
  {
    id: 'od-1',
    student_id: student,
    type: 'od',
    reason: 'Representing college at Inter-University Coding Contest — IIT Madras, Chennai.',
    evidence_url: null,
    from_date: daysAgo(5),
    to_date: daysAgo(3),
    approval_chain: [
      { role: 'class_advisor', label: 'Class Advisor', approved_by: faculty, status: 'approved', note: 'Approved. Best of luck!', timestamp: daysFromNow(-6) },
      { role: 'faculty', label: 'Subject Faculty', approved_by: faculty, status: 'approved', note: null, timestamp: daysFromNow(-5) },
      { role: 'hod', label: 'Head of Department', approved_by: null, status: 'pending', note: null, timestamp: null },
    ],
    matched_sessions: [
      {
        subject_id: 'sub-dsa',
        subject_code: 'CS301',
        subject_name: 'Data Structures & Algorithms',
        date: daysAgo(5),
        start_time: '09:00',
        end_time: '10:30',
        hours: 2,
      },
      {
        subject_id: 'sub-dbms',
        subject_code: 'CS302',
        subject_name: 'Database Management Systems',
        date: daysAgo(4),
        start_time: '10:45',
        end_time: '12:15',
        hours: 2,
      },
      {
        subject_id: 'sub-os',
        subject_code: 'CS303',
        subject_name: 'Operating Systems',
        date: daysAgo(3),
        start_time: '13:30',
        end_time: '15:00',
        hours: 2,
      },
    ],
    attendance_impact: [
      {
        subject_id: 'sub-dsa',
        subject_code: 'CS301',
        current_pct: 75.0,
        projected_pct: 83.3,
        gain_pct: 8.3,
      },
      {
        subject_id: 'sub-dbms',
        subject_code: 'CS302',
        current_pct: 71.4,
        projected_pct: 78.6,
        gain_pct: 7.2,
      },
      {
        subject_id: 'sub-os',
        subject_code: 'CS303',
        current_pct: 75.0,
        projected_pct: 83.3,
        gain_pct: 8.3,
      },
    ],
    credited: false,
    created_at: daysFromNow(-7),
  },
  {
    id: 'od-2',
    student_id: student,
    type: 'medical',
    reason: 'Hospitalized due to dengue fever — attached discharge summary.',
    evidence_url: 'https://example.com/discharge-summary.pdf',
    from_date: daysAgo(15),
    to_date: daysAgo(10),
    approval_chain: [
      { role: 'class_advisor', label: 'Class Advisor', approved_by: faculty, status: 'approved', note: 'Verified medical documents.', timestamp: daysFromNow(-14) },
      { role: 'faculty', label: 'Subject Faculty', approved_by: null, status: 'pending', note: null, timestamp: null },
    ],
    credited: false,
    created_at: daysFromNow(-15),
  },
]

/* ---- Phase 3: Submissions ---- */
export const DEMO_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-1',
    assignment_id: 'as-1',
    student_id: student,
    file_url: 'https://campusflow.edu/submissions/aarav_graph_algorithms_lab.pdf',
    file_name: 'aarav_graph_algorithms_report.pdf',
    file_size: '2.4 MB',
    repo_url: 'https://github.com/aaravmehta/graph-algorithms-lab',
    submitted_at: daysFromNow(-1),
    grade: 47,
    max_grade: 50,
    feedback: 'Excellent work on Dijkstra and A* heuristics! Clean code and thorough benchmark plots.',
  },
]

/* ---- Phase 4: Attendance Recovery Loans ---- */
export const DEMO_ATTENDANCE_LOANS: AttendanceLoan[] = [
  {
    id: 'loan-1',
    student_id: student,
    student_name: 'Aarav Mehta',
    subject_id: 'sub-dbms',
    subject_code: 'CS302',
    subject_name: 'Database Management Systems',
    current_pct: 71.4,
    target_pct: 76.2,
    remedial_hours_pledged: 4,
    remedial_hours_required: 4,
    remedial_hours_completed: 2,
    compensatory_task: 'Complete PostgreSQL indexing benchmark paper and tutor 2 junior batches on BCNF decomposition.',
    status: 'active',
    hod_approved_by: '33333333-3333-3333-3333-333333333333',
    hod_approved_at: daysFromNow(-2),
    hod_note: 'Conditionally approved. Exam hall ticket granted contingent on completing remaining 2 tutorial sessions before finals.',
    created_at: daysFromNow(-4),
  },
]

/* ---- Phase 5: Smart Peer Faculty Substitutions ---- */
export const DEMO_SUBSTITUTIONS: FacultySubstitution[] = [
  {
    id: 'subst-1',
    original_faculty_id: faculty,
    original_faculty_name: 'Dr. Suresh Ranganathan',
    substitute_faculty_id: '44444444-4444-4444-4444-444444444444',
    substitute_faculty_name: 'Dr. Priya Sharma',
    subject_id: 'sub-dsa',
    subject_code: 'CS301',
    subject_name: 'Data Structures & Algorithms',
    date: daysFromNow(1),
    slot_time: '09:00 - 10:30',
    reason: 'Presenting research paper at ACM Sigmod symposium.',
    status: 'accepted',
    created_at: daysFromNow(-1),
  },
  {
    id: 'subst-2',
    original_faculty_id: faculty,
    original_faculty_name: 'Dr. Suresh Ranganathan',
    substitute_faculty_id: '55555555-5555-5555-5555-555555555555',
    substitute_faculty_name: 'Prof. Rajesh Nair',
    subject_id: 'sub-dbms',
    subject_code: 'CS302',
    subject_name: 'Database Management Systems',
    date: daysFromNow(2),
    slot_time: '11:00 - 12:30',
    reason: 'Attending University Academic Council Meeting.',
    status: 'pending',
    created_at: daysFromNow(0),
  },
]

/* ---- Phase 6: OBE & Bloom's Taxonomy Attainment Demo ---- */
export const DEMO_CO_ATTAINMENT: COAttainment[] = [
  {
    co_code: 'CO1',
    description: 'Understand and analyze asymptotic complexity of graph algorithms and non-linear data structures.',
    target_pct: 70,
    current_attainment_pct: 82.4,
    status: 'exceeded',
  },
  {
    co_code: 'CO2',
    description: 'Design and implement advanced indexing, B-Trees, and relational normalization schemas.',
    target_pct: 75,
    current_attainment_pct: 77.8,
    status: 'met',
  },
  {
    co_code: 'CO3',
    description: 'Evaluate concurrency control algorithms, deadlock avoidance, and TLB paging architectures.',
    target_pct: 75,
    current_attainment_pct: 68.5,
    status: 'at_risk',
  },
  {
    co_code: 'CO4',
    description: 'Formulate packet inspection strategies and transport layer congestion control heuristics.',
    target_pct: 70,
    current_attainment_pct: 74.2,
    status: 'met',
  },
  {
    co_code: 'CO5',
    description: 'Synthesize full-stack distributed transaction models and fault-tolerant cloud services.',
    target_pct: 80,
    current_attainment_pct: 81.0,
    status: 'exceeded',
  },
]

export const DEMO_BLOOMS_DISTRIBUTION: BloomsDistribution[] = [
  { level: 'Remember', count: 18, percentage: 15 },
  { level: 'Understand', count: 32, percentage: 27 },
  { level: 'Apply', count: 42, percentage: 35 },
  { level: 'Analyze', count: 20, percentage: 17 },
  { level: 'Evaluate', count: 8, percentage: 6 },
]

