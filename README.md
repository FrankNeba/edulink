# E-Learning Platform

A full-featured, scalable, and modular Learning Management System built with **Next.js** and **Django REST Framework**.

## 🚀 Key Features

- **Role-Based Access Control**: specialized interfaces for Vice Principals, HODs, Teachers, and Students.
- **Academic Hierarchy**: Manage Departments, Levels, and Subjects with ease.
- **Dynamic Quiz System**: 
  - Upload PDF quizzes.
  - AI-powered extraction of MCQs (using Gemini 2.0 Flash Lite).
  - Anti-cheat mechanisms (Fullscreen enforcement, auto-submission).
- **Secure Content**: Teacher-uploaded notes protected by course registration.
- **Communication**: Tiered announcement system (School, Department, and Subject levels).
- **Automated Tracking**: Auto-generated Student IDs and registration boundaries.

## 🛠 Tech Stack

- **Frontend**: Next.js 15, TypeScript, Lucide Icons, Vanilla CSS (Variables).
- **Backend**: Django 5.x, Django REST Framework, Django Channels (ASGI), SimpleJWT.
- **AI**: Google Gemini API.
- **Database**: PostgreSQL (Production) / SQLite (Development).

## 📂 Project Structure

```text
E_learning/
├── backend/
│   ├── apps/
│   │   ├── accounts/    # Users, Profiles, RBAC
│   │   ├── academic/    # Departments, Subjects
│   │   ├── content/     # Notes, Announcements
│   │   └── quizzes/     # Quizzes, Results, AI Extraction
│   ├── core/            # Project Settings & Routing
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── app/         # Next.js App Router (Dashboard, Login, etc.)
│   │   ├── components/  # Reusable UI & Sidebar
│   │   ├── context/     # Auth State
│   │   └── lib/         # API Client & Utilities
│   └── public/
└── README.md
```

## 🏁 Getting Started

### Backend Setup
1. `cd backend`
2. Create virtual environment: `python -m venv venv`
3. Activate: `source venv/bin/activate`
4. Install: `pip install -r requirements.txt` (or install manually: django, djangorestframework, django-cors-headers, channels, daphne, djangorestframework-simplejwt, google-generativeai)
5. Set environment variables in `.env`: `GEMINI_API_KEY`, `SECRET_KEY`.
6. Migrate: `python manage.py migrate`
7. Run: `python manage.py runserver`

### Frontend Setup
1. `cd frontend`
2. Install: `npm install`
3. Set environment variable: `NEXT_PUBLIC_API_URL=http://localhost:8000/api/`
4. Run: `npm run dev`

## 🔒 Security & Performance
- **RBAC**: Every API endpoint is protected by role-specific permissions.
- **Modular Design**: Apps are isolated, allowing for horizontal scaling.
- **Premium UI**: Clean, minimal, and professional design without distractions.
