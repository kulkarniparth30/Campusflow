# CampusFlow — AI-Native Academic Operating System & Campus ERP

> **Next-Generation Autonomous Campus Management System** bridging administrative governance, cryptographic proxy-proof attendance, master timetable scheduling, and domain-isolated AI agents.

[![React](https://img.shields.io/badge/Frontend-React%2019-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Bundler-Vite-646CFF)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E)](https://supabase.com/)
[![Groq](https://img.shields.io/badge/AI%20Inference-Groq%20LLaMA--3.3-F05A28)](https://groq.com/)
[![Docker](https://img.shields.io/badge/Container-Docker-2496ED)](https://www.docker.com/)

---

## 🏛️ System Architecture

CampusFlow utilizes a high-performance modern decoupled architecture designed for high concurrency, ultra-low latency inference, and strict multi-tenant institutional data boundaries.

`mermaid
graph TD
    subgraph Client Layer [Client & Edge Layer]
        A[Admin Desktop Web]
        B[HOD Department Dashboard]
        C[Faculty Mobile/Desktop Web]
        D[Student Command Center]
    end

    subgraph CDN & Gateway [Reverse Proxy / CDN]
        E[Render / Nginx Web Server]
    end

    subgraph State & Logic Layer [Client State & Core Business Logic]
        F[Zustand ERP Store]
        G[FlashRoll TOTP Cryptographic Engine]
        H[Attendance Recovery Contract Manager]
        I[Dynamic Course Allocation Matrix]
    end

    subgraph AI Intelligence Core [Groq LPU Acceleration]
        J[Academic Guardian AI Assistant]
        K[Broadcast Circular Synthesizer]
        L[StudyFlow Milestone Engine]
    end

    subgraph Data & Persistence [Cloud Database & Storage]
        M[(Supabase PostgreSQL)]
        N[PostgreSQL Row-Level Security RLS]
        O[Realtime Publication Channels]
    end

    A --> E
    B --> E
    C --> E
    D --> E
    E --> F
    F --> G
    F --> H
    F --> I
    F <-->|REST API + RLS| M
    M --- N
    M --- O
    F <-->|Ultra-Low Latency Inference| J
    F <-->|Circular Parsing| K
    F <-->|Syllabus Breakdown| L
`

---

## 🚀 Key Innovation Highlights

### 1. 🛡️ FlashRoll™ 5-Second Cryptographic Dynamic QR Attendance
- Eliminates proxy attendance and proxy scanning completely.
- Uses rolling Time-based One-Time Password (TOTP) tokens with a 5–6 second lifespan.
- Includes optional client-side GPS geofencing to verify physical presence inside lecture halls.

### 2. 🏢 Multi-Tier Hierarchical Governance with Strict Department Isolation
- **College Admin**: Creates department HODs, manages institution-wide master timetables, balances faculty weekly hours, and reviews institution audit logs.
- **Department HOD**: Provisions faculty & student credentials, allocates department courses, monitors subject-wise attendance, and approves substitutions.
- **Faculty Station**: Real-time roll call, attendance warning broadcaster, substitution requests, and assignment evaluation.
- **Student Portal**: Attendance trajectory simulator, assignment submission portal, and department-filtered schedules.

### 3. 🤖 Domain-Constrained AI Intelligence Hub
- Powered by **Groq LLaMA-3.3 70B** on specialized LPU chips delivering responses in < 800ms.
- **Academic Guardian**: Strictly bound to the student's department coursework, timetable, and attendance recovery calculations. Off-topic queries are rejected to maintain focus.
- **Broadcast Synthesizer**: Parses unstructured university circulars to extract deadlines, locations, action items, and target audiences.
- **StudyFlow**: Automatically decomposes multi-week assignments into actionable daily milestone sprints.

---

## 🗄️ Database Schema & Security

The backend operates on **PostgreSQL** hosted on **Supabase** with granular **Row-Level Security (RLS)**:

- profiles: Multi-role user entities (dmin, hod, aculty, student).
- subjects: Department course registry with minimum attendance thresholds (e.g. 75%, 80%).
- enrollments: Relational mapping of students to course cohorts.
- ttendance_records: Immutable timestamped session records (present, bsent, late).
- 	imetable_slots: Master lecture and lab assignments with rooms and weekly slots.
- ssignments & submissions: Coursework tracking with grading rubrics.
- 
otices: University announcements with category tagging (cademic, urgent, event).
- correction_requests: Student attendance dispute and resolution chain.

---

## 🐳 Docker Deployment

### Run with Docker Compose
`ash
# Set your environment variables in .env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GROQ_API_KEY=your-groq-api-key

# Build and start container
docker compose up --build -d
`
The application will be live at http://localhost.

### Run with Docker CLI
`ash
# Build image
docker build \
  --build-arg VITE_SUPABASE_URL="https://vaefjfqojrqysdsnqcwi.supabase.co" \
  --build-arg VITE_SUPABASE_ANON_KEY="your-anon-key" \
  --build-arg VITE_GROQ_API_KEY="your-groq-key" \
  -t campusflow:latest .

# Run container
docker run -d -p 80:80 --name campusflow-app campusflow:latest
`

---

## 🌐 Deploy on Render (Step-by-Step)

### Option A: Deploy as a Static Site (Recommended — 100% Free & Fastest)
1. Push your repository to **GitHub**.
2. Go to your [Render Dashboard](https://dashboard.render.com/) and click **New +** → **Static Site**.
3. Connect your GitHub repository.
4. Fill in the build settings:
   - **Name**: campusflow
   - **Root Directory**: campusflow (or leave empty if root of repo)
   - **Build Command**: 
pm install && npm run build
   - **Publish Directory**: dist
5. Click **Advanced** and add **Environment Variables**:
   - VITE_SUPABASE_URL: https://vaefjfqojrqysdsnqcwi.supabase.co
   - VITE_SUPABASE_ANON_KEY: your_supabase_anon_key
   - VITE_GROQ_API_KEY: your_groq_api_key
6. Add a **Rewrite / Redirect Rule** (for Single Page App routing):
   - **Type**: Rewrite
   - **Source**: /*
   - **Destination**: /index.html
7. Click **Create Static Site**. Your site will deploy in ~2 minutes with a live https://campusflow.onrender.com URL.

---

### Option B: Deploy using Docker on Render (Web Service)
1. Go to [Render Dashboard](https://dashboard.render.com/) → **New +** → **Web Service**.
2. Select **Build and deploy from a Git repository**.
3. Choose **Docker** as the Environment.
4. Set Dockerfile Path to ./Dockerfile (or campusflow/Dockerfile).
5. In **Environment Variables**, add:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   - VITE_GROQ_API_KEY
6. Click **Deploy Web Service**.

---

## 💻 Local Development Setup

`ash
# 1. Clone repository
git clone https://github.com/your-username/campusflow.git
cd campusflow

# 2. Install dependencies
npm install

# 3. Create .env file
VITE_SUPABASE_URL=https://vaefjfqojrqysdsnqcwi.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GROQ_API_KEY=your-groq-api-key

# 4. Run local dev server
npm run dev
`

---

## 👥 Demo Accounts for Judges

| Role | Email | Password | Access Highlights |
| :--- | :--- | :--- | :--- |
| **Admin** | dmin@campusflow.edu | CampusFlow!23 | Institutional Master Timetable, HOD Provisioning, Workload Analysis |
| **HOD (IT Dept)** | hod.it@campusflow.edu | CampusFlow!23 | Course Allocation Matrix, Faculty Onboarding, Student Enrollment |
| **Faculty** | aculty@campusflow.edu | CampusFlow!23 | FlashRoll Dynamic QR, Attendance Grid, Substitution Management |
| **Student (IT)** | ditya.j@campusflow.edu | CampusFlow!23 | Attendance Guardian, StudyFlow, Timetable, FlashRoll Scanner |

---

## 📄 License
Released under the **MIT License**.
