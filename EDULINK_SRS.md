# EduLink — Software Requirements Specification (SRS)

> This document describes EduLink in clear, non‑technical language while also detailing how the system works under the hood. It is written for school leaders, product owners, and implementation teams.

## 1. Product Summary
EduLink is a school learning and academic management platform. It connects students, teachers, Heads of Department (HODs), and school leadership in a single portal for:
- Learning materials (notes and syllabi)
- Quizzes and assessments
- Announcements and notifications
- Academic organization (departments, class levels, subjects)

The system provides role‑based access, meaning each person only sees the features and information relevant to their responsibilities.

## 2. Goals and Objectives
- **Centralize learning resources** so students always find the right materials.
- **Standardize assessments** with secure, timed quizzes and structured results.
- **Improve communication** via targeted announcements and notifications.
- **Organize academics** by domains, departments, class levels, and subjects.
- **Ensure accountability** by tracking uploads, attempts, and activity.

## 3. Users and Roles
### 3.1 Student
- Access assigned subjects, notes, syllabi, quizzes, and announcements.
- Take quizzes and view results.
- Receive notifications for new materials and updates.

### 3.2 Teacher
- Upload notes and assignments.
- Create quizzes and manage quiz content.
- Post subject announcements.
- View student attempts and results (for their quizzes).

### 3.3 Head of Department (HOD)
- Oversee subjects within their department.
- Upload notes or syllabi for subjects under their authority.
- Send department or subject‑level announcements.

### 3.4 Vice Principal / Principal
- Oversee the entire school structure and all academic content.
- Enroll and manage staff and students.
- Send school‑wide announcements.

## 4. System Scope
### 4.1 In Scope
- User authentication and role‑based access
- Academic structure management
- Learning content distribution
- Quiz creation, extraction, and delivery
- Assignment creation and delivery
- Announcements and notifications

### 4.2 Out of Scope
- Live video classes
- Payment processing
- Parent/guardian portals

## 5. High‑Level Architecture (Plain Language)
EduLink is split into two parts:
- **Frontend (User Interface)**: the web portal students and staff use.
- **Backend (Core Engine)**: stores data, applies rules, and delivers content securely.

The frontend sends requests to the backend. The backend checks permissions, processes content, and returns only the data the user is allowed to see.

## 6. Core Modules and How They Work

### 6.1 Academic Structure
**Purpose**: define how the school is organized.

**What it includes**:
- **Domains** (e.g., General, Vocational)
- **Sub‑domains** (e.g., Science, Arts, Commercial)
- **Departments** (e.g., Biology, Chemistry)
- **Academic Levels** (e.g., Form 1, Upper Sixth)
- **Subjects** mapped to departments and levels

**How it works**:
- Leadership sets up domains, departments, class levels, and subjects.
- Teachers and students are linked to subjects.
- All learning content is filtered by these links.

---

### 6.2 Notes & Syllabi (Learning Materials)
**Purpose**: allow teachers and leadership to upload learning documents.

**Upload flow**:
1. Teacher (or HOD/VP where permitted) uploads a PDF note or syllabus.
2. The file is stored securely in the server’s media storage.
3. Students enrolled in that subject receive a notification.

**Display flow**:
- Students open their dashboard, select a subject, and see all available notes.
- Each note is shown with title, subject, teacher name, and upload date.

**Access rules**:
- Students only see notes for subjects they are enrolled in.
- Teachers only see notes for subjects they teach.
- HODs and leadership can view broader content based on role.

---

### 6.3 Assignments
**Purpose**: distribute tasks and collect deadlines.

**Upload flow**:
1. Teacher creates an assignment with a title, description, and due date.
2. A file attachment is optional (PDF, DOCX, etc.).
3. The assignment is stored and tied to the subject.

**Display flow**:
- Students see assignments for their subjects.
- Each assignment shows due date, description, and any attached file.

**Access rules**:
- Students only see assignments for enrolled subjects.
- Teachers only create assignments for subjects they teach.

---

### 6.4 Quizzes and Exams
**Purpose**: provide timed, structured assessments.

**Quiz creation flow**:
1. Teacher creates a quiz with a title, subject, start time, end time, duration, and optional deadline.
2. The quiz can be built in two ways:
   - **Manual entry**: create questions and multiple‑choice answers directly.
   - **Document extraction**: upload a PDF or DOCX question paper.

**Extraction flow (PDF/DOCX)**:
1. Teacher uploads the raw file (PDF or DOCX).
2. The system reads text and extracts images from the document.
3. The extracted text is sent to an AI extractor (Gemini model) with strict rules:
   - Only use content that appears in the document.
   - Preserve question order and instructions.
   - Convert all math into LaTeX notation.
   - Assign any diagram/image to the correct question.
4. The system converts the extracted data into structured quiz questions and choices.
5. Questions are saved and linked to the quiz.

**Display flow to students**:
- Students open a quiz during its active time window.
- Questions are shown in order with choices.
- Images extracted from the paper appear alongside the relevant question.
- On submission, the system calculates the score instantly.

**Attempts and retakes**:
- Each student gets one attempt by default.
- Teachers can authorize a retake for a specific student.

**Integrity controls**:
- Quizzes are only available between start and end time.
- Attempts are tracked with start time, end time, and submission status.
- Auto‑submission is supported for certain conditions (e.g., leaving fullscreen).

---

### 6.5 Announcements
**Purpose**: send targeted messages across the school.

**Levels supported**:
- School‑wide
- Department
- Domain/Sub‑domain
- Class level
- Subject

**How it works**:
- Announcements are created by staff based on their allowed scope.
- Students and staff receive only announcements relevant to them.
- Announcements appear on the dashboard and can trigger notifications.

---

### 6.6 Notifications
**Purpose**: alert users when new content is available.

**How it works**:
- When a note, syllabus, or quiz is published, a notification is created.
- Users see an unread count in the sidebar.
- Notifications link directly to the related content.

---

## 7. Functional Requirements
### 7.1 User Access
- Users must sign in to access the system.
- Access is controlled by role (Student, Teacher, HOD, VP/Principal).

### 7.2 Content Management
- Teachers must be able to upload notes and assignments.
- HODs and VPs must be able to upload syllabi.
- Notes/assignments must be restricted to the correct subject.

### 7.3 Quizzes
- Teachers must be able to create and schedule quizzes.
- Quizzes must support manual question entry and document extraction.
- Students must be able to take quizzes during scheduled windows.
- The system must score quizzes automatically.

### 7.4 Announcements
- School leadership must be able to post school‑wide notices.
- HODs must be able to post department notices.
- Teachers must be able to post subject notices.

### 7.5 Notifications
- Users must receive alerts for new quizzes and learning materials.
- Notifications must be visible and tracked as read/unread.

## 8. Data and Storage (Plain Summary)
Key data stored by the system includes:
- **Users and profiles** (students, teachers, HODs, leadership)
- **Academic structure** (domains, departments, subjects, levels)
- **Notes, syllabi, and assignments** (uploaded files)
- **Quizzes, questions, choices, and attempts**
- **Announcements and notifications**

Files are stored in media locations such as:
- `notes/pdf/`
- `syllabi/`
- `assignments/`
- `quizzes/raw/` (original exam/quiz documents)
- `quizzes/questions/` (question images)

## 9. User Experience (UX) Overview
- **Homepage** presents EduLink’s purpose and role‑based benefits.
- **Login** provides secure access.
- **Dashboard** shows quick stats and latest announcements.
- **Sidebar navigation** adapts to each role, showing only permitted pages.

## 10. Security & Access Rules (Non‑Technical Summary)
- Every request is checked against a user’s role.
- Students can only see what they are enrolled in.
- Teachers can only upload and edit content for their assigned subjects.
- HODs can manage content within their department.
- School leadership can access everything.

## 11. Reliability & Performance Expectations
- Fast dashboard loading for daily use.
- Consistent file access and download speeds.
- Stable handling of concurrent quiz attempts.

## 12. Future Extensions (Optional)
- Parent access portal
- Automated grading analytics
- Offline access to notes
- Report cards and transcripts

## 13. Glossary
- **Domain/Sub‑domain**: top‑level academic grouping (e.g., Science, Arts).
- **Department**: subject area management unit (e.g., Biology Department).
- **Academic Level**: class or form level (e.g., Form 4).
- **Quiz Attempt**: a student’s recorded quiz session and results.
- **Extraction**: automatic conversion of uploaded documents into quiz questions.

---
If you want, I can also create a shorter executive summary or a school policy‑style version.
