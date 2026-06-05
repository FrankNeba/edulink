# EduLink — Final Year Defense: Questions & Answers

---

## PART 1 — PROJECT OVERVIEW & MOTIVATION

**Q1. What is EduLink and what problem does it solve?**

EduLink is a school learning management and academic administration platform built to digitize and centralize the academic experience in a secondary school setting. It addresses the fragmentation problem in school management: notes are shared via WhatsApp, quizzes are paper-based, and there is no unified view of academic structure. EduLink brings students, teachers, HODs, Vice Principals, and the Principal into a single platform with role-appropriate dashboards, structured quiz delivery, AI-powered document extraction, and real-time notifications.

---

**Q2. Why did you choose this as your final year project?**

Secondary schools in Cameroon still rely heavily on paper-based and informal digital communication for learning materials and assessments. This creates inefficiencies: students miss announcements, teachers cannot track quiz participation, and principals have no centralized oversight. EduLink targets this gap by providing a production-ready, role-based school management system. It also gave an opportunity to apply full-stack web development, relational database design, REST API architecture, AI integration, and cloud deployment — all in one meaningful project.

---

**Q3. What are the main modules of the system?**

| Module | Description |
|---|---|
| **Accounts** | Custom user model with 5 roles, JWT authentication, OTP-based first login |
| **Academic** | Domains, sub-domains, departments, academic levels, subjects |
| **Content** | Notes, syllabi, assignments upload and delivery |
| **Quizzes** | Quiz creation, AI document extraction, timed delivery, auto-scoring |
| **Notifications** | In-app alerts for new content, quizzes, announcements |

---

## PART 2 — ARCHITECTURE & TECHNOLOGY CHOICES

**Q4. Describe the overall system architecture.**

EduLink follows a **client-server architecture** with a clear separation of concerns:

- **Frontend**: Next.js 14 (App Router) deployed on Vercel. Communicates with the backend exclusively via HTTP REST API calls using Axios (`/lib/api`).
- **Backend**: Django 5 + Django REST Framework, deployed on Railway. Handles all business logic, permission enforcement, and data persistence.
- **Database**: PostgreSQL (local and Railway-hosted). Chosen for relational integrity, foreign key constraints, and support for complex queries across the academic hierarchy.
- **File Storage**: Supabase Storage in production (an S3-compatible object store). Locally, Django's `FileSystemStorage` is used.
- **AI Layer**: Google Gemini (`gemini-2.5-flash-lite`) for quiz document extraction. Called server-side only, never exposed to the frontend.

---

**Q5. Why Django REST Framework instead of FastAPI or Node.js/Express?**

Django REST Framework (DRF) was chosen because:
1. **Django ORM** provides a powerful, Pythonic way to define and query the complex relational academic structure.
2. **Built-in admin panel** allows rapid data management and debugging.
3. **`AbstractUser` extension** simplifies building a custom user model with role-based fields.
4. **ViewSets and Routers** reduce boilerplate for CRUD APIs.
5. The team's existing Python competency made Django the pragmatic choice.

FastAPI would offer better raw performance, but DRF's ecosystem (serializers, permissions, signals) better fits the data-heavy nature of this project.

---

**Q6. Why Next.js for the frontend?**

Next.js was chosen for:
- **App Router** with server and client component separation — critical for SEO on public pages and fast interactivity on dashboards.
- **File-based routing** — each dashboard page maps directly to a route segment (e.g., `/dashboard/quizzes/[id]/edit`).
- **Vercel deployment** — zero-configuration CI/CD with automatic previews.
- **TypeScript support** — catches type errors at compile time, crucial for a complex multi-role interface.

---

**Q7. How does JWT authentication work in this system?**

1. The user submits their email and password to `POST /api/auth/login/`.
2. The backend validates credentials and returns an `access` token (1-day lifetime) and a `refresh` token (7-day lifetime).
3. The frontend stores both tokens in `localStorage` via `AuthContext`.
4. Every subsequent API request includes `Authorization: Bearer <access_token>` in the header.
5. `rest_framework_simplejwt` validates the token on the backend for every protected endpoint.
6. When the access token expires, the frontend silently calls `POST /api/auth/refresh/` with the refresh token to obtain a new access token.
7. `ROTATE_REFRESH_TOKENS = True` and `BLACKLIST_AFTER_ROTATION = True` ensure each refresh token is single-use.

---

**Q8. How is role-based access control (RBAC) implemented?**

RBAC is enforced at **two layers**:

**Backend (authoritative):**
- Each ViewSet defines `get_permissions()` returning custom permission classes like `IsVicePrincipal`, `IsTeacher`, `IsStudent`.
- `get_queryset()` on each ViewSet filters results based on `request.user.role` — a student can never receive another student's data.

**Frontend (UX layer):**
- `AuthContext` exposes `user.role`.
- Components conditionally render controls (e.g., "New Quiz" button only appears for `TEACHER`, `HOD`, `VICE_PRINCIPAL`).
- Sidebar navigation items carry a `roles` array; entries not matching the logged-in user's role are never rendered.

The backend RBAC is the security boundary. The frontend RBAC is purely for user experience.

---

## PART 3 — DATABASE DESIGN

**Q9. Describe the database schema for the academic structure.**

The academic structure uses a hierarchical relational model:

```
Domain → SubDomain → Department → BaseSubject
                  ↓
            AcademicLevel → Subject (deployed instance)
```

- `Domain`: top-level grouping (e.g., General Education).
- `SubDomain`: specialization within a domain (e.g., Science, Arts).
- `Department`: faculty unit that owns subjects (e.g., Biology Department).
- `BaseSubject`: the *template* for a subject (name, code, domain, HOD assignment).
- `AcademicLevel`: a class level (e.g., Form 4, Upper Sixth) with an assigned `class_master`.
- `Subject`: the *deployed instance* — a `BaseSubject` linked to a specific `AcademicLevel`, with enrolled `students` (M2M) and assigned `teachers` (M2M).

This two-tier subject design (Base + Instance) avoids duplicating subject metadata while allowing level-specific teacher and student assignments.

---

**Q10. Why use a custom `User` model rather than Django's default?**

Django's default user model uses `username` as the primary identifier. In EduLink, users are identified by `email`. Changing the `USERNAME_FIELD` to `email` after the project starts is a destructive operation requiring database migrations and data migrations. By extending `AbstractUser` from the start:
- `email` is the login field.
- A `role` field (`CharField` with `TextChoices`) cleanly encodes the five roles.
- Profile tables (`StudentProfile`, `TeacherProfile`, `HODProfile`) extend the core user via `OneToOneField`, keeping the main user table lean.

---

**Q11. How do you prevent students from seeing other students' quiz attempts?**

In `QuizViewSet.get_queryset()`:
```python
if user.role == 'STUDENT':
    qs = Quiz.objects.filter(subject__students=user)
```
Students only see quizzes for subjects they are enrolled in. For attempt data, `results` and `submissions` endpoints return only the requesting student's own attempt — or, for staff, all attempts. This is enforced server-side; the frontend cannot override it.

---

**Q12. Explain the Many-to-Many relationships in the system.**

| Relationship | Through Table | Purpose |
|---|---|---|
| `Subject.students` | implicit | tracks which students are enrolled in a subject |
| `Subject.teachers` | implicit | tracks which teachers teach a subject |
| Quiz attempts link a student to a quiz | `QuizAttempt` (explicit model) | stores score, submission status, retake flag |
| `AttemptAnswer` | explicit | records per-question choice for each attempt |

The `QuizAttempt` and `AttemptAnswer` models use explicit through-tables because they carry extra fields (score, is_correct, auto_submitted).

---

## PART 4 — QUIZ & AI EXTRACTION MODULE

**Q13. Explain the AI quiz extraction pipeline end-to-end.**

1. **Upload**: Teacher uploads a PDF or DOCX to `POST /api/quizzes/` via multipart form data. The file is stored to `quizzes/raw/`.
2. **Trigger**: `POST /api/quizzes/{id}/extract/` calls `QuizExtractionService.extract_from_file()`.
3. **Parsing**: 
   - PDF → PyMuPDF (`fitz`) extracts text blocks and images (by xref), sorted by vertical position.
   - DOCX → `python-docx` walks the XML body, extracting paragraphs and embedded images.
   - Images are extracted as base64 data URIs and tagged with `[IMAGE_N]` placeholders inline with the text.
4. **AI Prompt**: The assembled text + prompt is sent to `gemini-2.5-flash-lite`. The prompt instructs the model to output a strict JSON array — no external knowledge, preserve order, convert math to LaTeX, assign image placeholders to questions.
5. **JSON Parsing**: The response is cleaned (markdown code fences stripped), and parsed with a custom `_repair_json()` fallback that re-escapes malformed LaTeX backslashes.
6. **Persistence**: `save_extracted_quiz()` creates `Question` and `Choice` records. If a question has an `image_index`, the base64 image is decoded and saved as a Django `ImageField`.
7. **Result**: `quiz.is_extracted = True` is set, and the teacher is redirected to the quiz editor.

---

**Q14. What happens if the AI extraction fails?**

The failure is handled gracefully:
- The quiz record is **already saved** before extraction is attempted.
- If `extract()` raises an exception, a `500` response with the error message is returned to the frontend.
- The frontend catches this and shows: *"Quiz saved, but AI extraction failed. You can retry from the list."*
- The `raw_file` remains on the record, and an "AI Extract" button appears on the quiz card so the teacher can retry at any time.
- The teacher can also manually add questions and choices through the quiz editor.

---

**Q15. How is quiz integrity maintained during student attempts?**

- **Time window**: `QuizViewSet.take()` checks `now < quiz.start_time` or `now > quiz.end_time` and rejects the request.
- **Fullscreen lock**: The frontend forces fullscreen via the browser `requestFullscreen()` API before the timer starts.
- **Tab-switch detection**: A `visibilitychange` event listener auto-submits the quiz if the user switches tabs while in fullscreen.
- **Single attempt**: `QuizAttempt` has `unique_together = ('student', 'quiz')`. A second attempt is blocked unless the teacher explicitly sets `can_retake = True` via the `allow_retake` action.
- **Auto-submission**: The timer triggers `submitQuiz(auto=true)` when it reaches zero.

---

**Q16. How does the scoring algorithm work?**

```python
score = 0
for ans in answers:
    question = Question.objects.get(id=ans['question_id'], quiz=quiz)
    choice   = Choice.objects.get(id=ans['choice_id'], question=question)
    is_correct = choice.is_correct
    if is_correct:
        score += question.points  # each question has a configurable `points` field
    AttemptAnswer.objects.create(attempt=attempt, question=question,
                                  selected_choice=choice, is_correct=is_correct)
attempt.score = score
attempt.is_submitted = True
attempt.save()
```

Points are per-question (defaulting to 1). The total score is the sum of points for all correctly answered questions.

---

## PART 5 — SECURITY

**Q17. How do you prevent unauthorized API access?**

Three layers:
1. **Authentication**: `JWTAuthentication` is the default for all endpoints via `REST_FRAMEWORK.DEFAULT_AUTHENTICATION_CLASSES`. Unauthenticated requests receive `401`.
2. **Permission classes**: `get_permissions()` on each ViewSet returns role-specific permission classes (e.g., `IsTeacher`) that check `request.user.role`.
3. **Queryset filtering**: `get_queryset()` always scopes data to the requesting user's role — a student cannot request another student's attempt even by guessing its ID, because the queryset would not contain it.

---

**Q18. How is CORS handled?**

`django-cors-headers` middleware is installed. `CORS_ALLOWED_ORIGINS` explicitly lists the Vercel frontend domain and `localhost:3000`. `CORS_ALLOW_ALL_ORIGINS = False`. This prevents browsers from making cross-origin requests from any domain other than the approved list.

---

**Q19. What protects the file storage from unauthorized access?**

- In **local development**: files are served from `MEDIA_ROOT` by Django's development server.
- In **production**: Supabase Storage is used. Files in the `files` bucket are either public (notes, syllabi — by design) or protected behind signed URLs. The Django backend acts as the only entity with the `SUPABASE_SERVICE_KEY`, meaning clients cannot directly manipulate bucket contents. Upload operations go through the API, not directly to Supabase.

---

## PART 6 — FRONTEND & UX

**Q20. How does the role-based sidebar work?**

The sidebar reads `user.role` from `AuthContext`. Navigation items are defined as an array of objects:
```ts
{ name: 'Quizzes', href: '/dashboard/quizzes', roles: ['TEACHER', 'STUDENT', ...] }
```
Items are filtered with `.filter(item => item.roles.includes(user.role))` before rendering. This means a student never sees the "Recruitment" or "Departments" links. The backend still enforces the true restriction — the sidebar is a UX affordance only.

---

**Q21. Explain how the SearchableSelect component works.**

`SearchableSelect` is a custom dropdown built without any third-party library. It maintains three pieces of state:
- `isOpen` — controls dropdown visibility.
- `search` — the text typed by the user to filter options.
- A `ref` on the container to detect click-outside and close.

The `filteredOptions` list is a `useMemo` that filters the `options` prop by the `search` string against each option's `label` and `sublabel`. When an option is selected, `onChange(value)` is called and the dropdown closes. This was built to replace native `<select>` elements in HOD and Class Master assignment, where staff lists can be large.

---

**Q22. Why use Next.js App Router instead of Pages Router?**

The App Router allows:
- **Server Components** (default) — fetched data is never shipped to the client as JavaScript, reducing bundle size.
- **Client Components** — only components that require interactivity (state, event handlers) are marked `'use client'`.
- **Nested layouts** — the dashboard layout wraps all dashboard pages without re-mounting the sidebar and header on navigation.
- **Dynamic segments** — `[id]`, `[level]` segments enable typed, file-system-driven routing for detail pages.

---

## PART 7 — DEPLOYMENT & SCALABILITY

**Q23. How is the system deployed?**

| Layer | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Auto-deploys on git push to `main` |
| Backend | Railway | Django app + Gunicorn, auto-deploys via Railway git integration |
| Database | Railway PostgreSQL plugin | Persistent Postgres instance, `DATABASE_URL` injected automatically |
| File Storage | Supabase Storage | S3-compatible bucket, credentials in Railway environment variables |

The backend detects the environment: if `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set and `DEBUG=False`, it switches `STORAGES['default']` to `SupabaseStorage`. Otherwise it uses the local filesystem.

---

**Q24. What are the known limitations of the current system?**

1. **No real-time features**: WebSocket support exists (`django-channels` is installed with `InMemoryChannelLayer`) but is not production-ready — in-memory layers don't scale across workers.
2. **File storage persistence**: Railway has ephemeral disk; production file uploads must go to Supabase. If Supabase credentials are not set, files are lost on redeploy.
3. **AI extraction cost**: Each extraction makes a Gemini API call. Under high concurrency, this could hit rate limits or incur significant cost.
4. **Single attempt per quiz**: The retake mechanism exists but requires manual teacher approval per student.
5. **No offline support**: Learning materials require an internet connection; there is no service worker or caching layer.

---

**Q25. How would you scale EduLink to a multi-school environment?**

The current architecture is single-tenant (one school per deployment). To support multiple schools:
- Add a `School` or `Tenant` model as a top-level FK on all academic models.
- Implement middleware that resolves the tenant from the subdomain (e.g., `school1.edulink.io`).
- Use `django-tenants` for schema-level isolation (each school gets its own PostgreSQL schema) — this eliminates the risk of data cross-contamination.
- Migrate file storage paths to include a tenant prefix (e.g., `{tenant_id}/notes/`).
- Scale the backend horizontally behind a load balancer; replace `InMemoryChannelLayer` with `RedisChannelLayer`.

---

## PART 8 — LOGICAL & CONCEPTUAL QUESTIONS

**Q26. What is the difference between a BaseSubject and a Subject?**

- `BaseSubject` is the **catalogue entry** — it defines the subject's name, code, domain, sub-domain, and which teacher is the HOD for that subject. It exists independently of any class level.
- `Subject` is the **deployed instance** — it links a `BaseSubject` to a specific `AcademicLevel`, has an assigned list of teachers and enrolled students, and is the entity through which quizzes, notes, and assignments are delivered.

This pattern separates subject definition from subject delivery, allowing "Biology" to exist once in the catalogue but be deployed separately to Form 4 Science and Form 5 Science with different teachers.

---

**Q27. How does student auto-enrollment work for junior levels?**

For Form 1–3, subjects are mandatory. When a teacher deploys a `Subject` for one of these levels, `perform_create()` in `SubjectViewSet` automatically queries all students at that level:
```python
if subject.level in ['Form 1', 'Form 2', 'Form 3']:
    target_students = User.objects.filter(role='STUDENT',
                                          student_profile__level=subject.level)
    if subject.domain:
        target_students = target_students.filter(student_profile__domain=subject.domain)
    subject.students.add(*target_students)
```
This prevents juniors from having to manually register for their compulsory subjects.

---

**Q28. Why store `level` as both a CharField and a ForeignKey on StudentProfile?**

`StudentProfile.level` (CharField) was the original field used for matching students to subjects by string comparison (e.g., `"Form 4"`). `StudentProfile.academic_level` (ForeignKey to `AcademicLevel`) was added later for richer queries. Both are kept for **backward compatibility** — subject queries filter by both:
```python
q |= models.Q(academic_level=lvl)
q |= models.Q(level=level_str)
```
This prevents regression for existing records while new records use the FK.

---

**Q29. What happens to quiz data if a subject is deleted?**

`Quiz.subject` is a `ForeignKey` with `on_delete=models.CASCADE`. Deleting a `Subject` cascades to delete all linked quizzes, which in turn cascade to delete all questions, choices, and student attempts. This is intentional — the academic structure is the anchor for all content. Before the VP deletes a subject, they are expected to export or archive results. A future improvement would be to use `on_delete=models.PROTECT` and require explicit quiz archiving first.

---

**Q30. How does the notification system work?**

When significant events occur, the backend creates `Notification` records:
- After a quiz is created: all students enrolled in the subject receive a notification.
- After a note is uploaded: subject students are notified.
- After a retake is authorized: the specific student is notified.

The `Notification` model has fields: `recipient` (FK to User), `title`, `message`, `category`, `link`, `is_read`. The frontend polls for unread notifications and displays an unread count badge in the sidebar. Clicking a notification marks it as read and navigates to the `link`.

---

*Prepared for the EduLink Final Year Project Defense — June 2026*
