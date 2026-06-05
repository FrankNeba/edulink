# EduLink School E‑Learning System
## Software Requirements‑Style Product Document (Non‑Technical, Fully Detailed)

**Document Version:** 1.0  
**Date:** June 1, 2026  
**Audience:** School leadership, teachers, administrators, and non‑technical stakeholders

---

## 1. Purpose of This Document
This document explains *what EduLink is*, *how it works end‑to‑end*, and *what the system must do* in language that a non‑technical reader can understand. It also includes the technical depth needed for planning, implementation, and verification.

---

## 2. Product Overview
EduLink is a school learning and management platform that connects students, teachers, heads of department, and school leaders in a single system. It centralizes academic structure, learning materials, assessments, assignments, announcements, and notifications so that school operations and learning delivery are consistent, trackable, and secure.

**What EduLink replaces:** paper‑based announcements, scattered notes, manual quiz handling, and fragmented communication.

**What EduLink provides:** a single place for academic content, quizzes/exams, assignments, and school communication, with role‑based visibility.

---

## 3. User Roles and Responsibilities
| Role | Primary Responsibilities | Typical Actions |
|---|---|---|
| **Student** | Learning and participation | View subjects, download notes, take quizzes, receive announcements and notifications |
| **Teacher** | Teaching delivery | Upload notes/assignments, create and manage quizzes, post subject announcements |
| **Head of Department (HOD)** | Department oversight | Manage subjects, monitor teachers/students, approve or distribute announcements |
| **Vice Principal / Principal** | School governance | Manage academic structure, enroll users, broadcast messages, monitor overall performance |

---

## 4. Scope of the System
EduLink covers:
- **Academic structure**: domains, departments, levels (classes), and subjects
- **User management**: roles, staff/student creation, IDs, onboarding emails
- **Content management**: notes, syllabi, assignments
- **Assessment**: quizzes/exams with automated extraction and scoring
- **Communication**: announcements and notifications
- **Dashboards**: role‑specific summaries

Out of scope (current): live classes, grading of long‑form essays, payment management.

---

## 5. High‑Level System Flow (Front‑to‑Back)
1. **User logs in** through a secure sign‑in screen.  
2. **Role‑based dashboard** appears (student/teacher/admin).  
3. Users **view or create** academic items (notes, assignments, quizzes, announcements).  
4. **Backend API** processes requests, applies permissions, stores files, and updates databases.  
5. **Notifications** are sent to relevant users (e.g., new note, quiz published).  
6. Users **consume content** (download notes, take quizzes, read announcements).

---

## 6. Functional Requirements (Detailed)

### 6.1 Authentication & Access Control
**Goal:** ensure only authorized users can access the system and only see what applies to them.

**Key behaviors**
- Users log in with email and password.
- Access tokens and refresh tokens are issued and stored on the device.
- The system enforces role‑based access to every feature.

**Roles supported:** Principal, Vice Principal, HOD, Teacher, Student.

**Example access rules**
- Students can take quizzes and view their own materials only.
- Teachers can create quizzes for their subjects only.
- Vice Principal can manage departments, subjects, and users.

---

### 6.2 User Onboarding & IDs
**Goal:** automate creation of student and staff accounts with school‑friendly IDs.

**Behaviors**
- When a student or teacher is created, the system generates a unique ID:
  - Student format: `STU-<DEPT/CODE>-<LEVEL>-<YEAR>-<RUN>`
  - Teacher format: `TEA-<DEPT>-<YEAR>-<RUN>`
- Credentials are emailed to the user with a login link.
- Users are prompted to change their password on first login.

---

### 6.3 Academic Structure Management
**Goal:** model the real school structure so content and announcements reach the right learners.

**Entities**
- **Domain** → broad areas such as General or Vocational
- **Sub‑Domain** → Arts, Science, Commercial, Technical, etc.
- **Department** → Science, Arts, or specific subject groups
- **Academic Level** → Form 1, Form 2, Upper Sixth, etc.
- **Subject** → subject instances (e.g., Biology Form 4)

**Key rules**
- Subjects can be assigned to specific levels and domains.
- Students are linked to academic levels and can be auto‑registered to subjects.
- Teachers are assigned to subjects.

---

### 6.4 Notes & Syllabi (Learning Materials)
**Goal:** deliver official class notes and syllabi to students.

**Upload process**
1. Teacher uploads a PDF note or syllabus.
2. File is stored (locally or in cloud storage depending on environment).
3. All students registered to the subject receive a notification.

**Viewing process**
- Students open the Notes page and download materials for enrolled subjects.

---

### 6.5 Assignments
**Goal:** allow teachers to post structured tasks with due dates.

**Upload process**
1. Teacher creates an assignment with:
   - Title
   - Description
   - Subject
   - Optional file attachment
   - Due date
2. Assignment becomes visible to students of that subject.

**Display to students**
- Students see assignments in their subject list, with title, description, and due date.

---

### 6.6 Quizzes / Exams (Core Assessment)
**Goal:** provide secure and automated digital assessments.

**Creation options**
- **Manual question entry** by teachers.
- **Automated extraction** from a PDF/DOCX exam paper (see Section 7).

**Quiz properties**
- Start time, end time, duration, deadline
- Subject and teacher ownership
- Question set and multiple‑choice options

**Student experience**
- Students can only attempt quizzes for subjects they are registered in.
- Quizzes are only visible during the active time window.
- Once submitted, retakes require explicit permission.

---

### 6.7 Announcements
**Goal:** allow targeted communication from leadership and teachers.

**Levels supported**
- School‑wide
- Department
- Domain / Sub‑domain
- Class level
- Subject

**Access rules**
- School‑wide announcements can only be sent by Principal/Vice Principal.
- Department announcements by HOD or leadership.
- Subject announcements by teachers or above.

---

### 6.8 Notifications
**Goal:** alert users immediately when something important happens.

**Triggered by**
- New notes
- New quizzes
- Retake authorization
- New announcements

**User flow**
- Notification badge appears in the sidebar.
- Users can mark notifications as read.

---

### 6.9 Dashboards & Analytics
**Goal:** provide role‑specific summaries at a glance.

**Examples**
- Students see number of subjects, notes, quizzes, and registered subjects.
- Teachers see their subjects, students, notes, and quizzes.
- HODs see departmental totals.
- Principals see school‑wide totals.

---

## 7. Detailed Process Flows (Technical + Non‑Technical)

### 7.1 Assignment Upload & Display
**Non‑technical explanation:**
A teacher creates an assignment, attaches a document if needed, and sets a due date. Students immediately see it in their class portal.

**Technical flow**
1. Teacher submits assignment via API with subject, description, optional file, and due date.
2. Backend validates teacher permissions against subject membership.
3. File is stored in the media system (local or Supabase).
4. Assignment record is saved in the database.
5. Students query assignments by subject and receive the assignment details.

---

### 7.2 Quiz/Exam Upload, Extraction, and Display
**Non‑technical explanation:**
A teacher can upload an exam paper (PDF or Word file). The system reads it, detects questions and choices, and creates a ready‑to‑take quiz. Students then see it in their dashboard during the active period.

**Technical extraction pipeline**
1. Teacher creates a quiz and uploads a **raw file** (PDF/DOCX).
2. The system extracts text and images:
   - **PDF**: PyMuPDF reads each page, detects text blocks and images.
   - **DOCX**: python‑docx reads text and embedded images.
3. The system inserts placeholders (e.g., `[IMAGE_0]`) where images appear in the text.
4. A structured prompt is sent to the **Gemini model** with strict instructions.
5. The AI returns a JSON array of questions, choices, marks, and image references.
6. The response is cleaned, repaired if needed, and parsed into valid JSON.
7. Questions and choices are saved into the database.
8. Question images are stored in the media system and linked to each question.
9. The quiz is marked as extracted and becomes available to students.

**Display to students**
- Students open the quiz during the allowed window.
- The system returns **questions and choices only** (no correct answers).
- Students submit answers; the system scores and stores the attempt.

---

### 7.3 Quiz Attempt & Scoring
**Non‑technical explanation:**
Students choose answers and submit. The system marks the quiz instantly and stores their score.

**Technical flow**
1. Student starts a quiz; an attempt record is created.
2. Student submits answers (question ID → selected choice ID).
3. Backend checks correctness and totals points.
4. Attempt is marked as submitted with a timestamp.
5. If a retake is approved, the attempt is reset.

---

## 8. Core Data Entities (Simplified)
| Entity | Description | Key Fields |
|---|---|---|
| **User** | Account for any role | email, role, name, phone |
| **Student Profile** | Student metadata | student_id, level, department |
| **Teacher Profile** | Teacher metadata | teacher_id, department |
| **Subject** | Subject instance | code, name, level, domain |
| **Note** | Uploaded teaching material | title, file, subject |
| **Syllabus** | Curriculum document | title, file, subject |
| **Assignment** | Task with due date | title, subject, due_date |
| **Quiz** | Assessment | title, subject, timing |
| **Question** | Quiz question | text, points, image |
| **Choice** | MCQ option | text, is_correct |
| **Quiz Attempt** | Student attempt | score, submitted, answers |
| **Announcement** | Targeted message | level, title, content |
| **Notification** | User alert | title, category, read |

---

## 9. Security & Compliance
- **Role‑based access** enforced at every endpoint.
- **JWT authentication** with refresh tokens.
- **First‑login password change** encouraged.
- **Secure file storage** with optional Supabase cloud storage.
- **Auditability** through quiz attempts and timestamps.

---

## 10. System Interfaces
**Frontend**
- Web interface built for login, dashboard, content viewing, and management.

**Backend API**
- REST API endpoints for users, subjects, content, quizzes, notifications.
- Example endpoints:
  - `/api/auth/login/`
  - `/api/subjects/`
  - `/api/notes/`
  - `/api/quizzes/`
  - `/api/quizzes/{id}/extract/`

---

## 11. Non‑Functional Requirements
- **Performance**: quiz loading should remain responsive even with many questions.
- **Reliability**: quizzes must not lose attempts; uploads must be durable.
- **Scalability**: supports multiple departments and large student bodies.
- **Usability**: clear dashboards for non‑technical users.
- **Security**: protect student data and restrict access by role.

---

## 12. Assumptions & Dependencies
- Email service configured for onboarding messages.
- Gemini API key configured for exam extraction.
- Supabase configured when using cloud storage.

---

## 13. Future Enhancements (Optional)
- Essay‑type questions and manual grading workflows.
- In‑app messaging between teachers and students.
- Parent access portals.
- Offline download bundles.

---

## 14. Acceptance Checklist (High‑Level)
- Users can log in and see role‑specific dashboards.
- Teachers can upload notes and assignments.
- Students can access notes and assignments for their subjects.
- Teachers can create quizzes and extract from PDF/DOCX.
- Students can take quizzes and receive scores.
- Announcements and notifications reach correct audiences.

---

**End of Document**
