"""
migrate_to_postgres.py
======================
Reads ALL data from the current SQLite database and re-creates it in the
target PostgreSQL (Supabase) database.

Usage:  DATABASE_URL="" python migrate_to_postgres.py
"""

import os, sys
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
os.environ["DATABASE_URL"] = ""   # force SQLite for the initial read
django.setup()

# ── 1. Dump ALL data from SQLite ──────────────────────────────────────────────
print("=" * 60)
print("STEP 1: Reading all data from SQLite …")
print("=" * 60)

from django.contrib.auth import get_user_model
from apps.accounts.models import StudentProfile, TeacherProfile, HODProfile
from apps.academic.models import Domain, SubDomain, Department, AcademicLevel, BaseSubject, Subject
from apps.content.models import Note, Syllabus, Announcement, Assignment, CurriculumTopic
from apps.quizzes.models import Quiz, Question, Choice, QuizAttempt, AttemptAnswer
from apps.notifications.models import Notification

User = get_user_model()
NEW_PASSWORD = "Edulink2026#"

def dump(qs):
    return list(qs.values())

users_data         = dump(User.objects.all())
students_data      = dump(StudentProfile.objects.all())
teachers_data      = dump(TeacherProfile.objects.all())
hods_data          = dump(HODProfile.objects.all())
domains_data       = dump(Domain.objects.all())
subdomains_data    = dump(SubDomain.objects.all())
departments_data   = dump(Department.objects.all())
levels_data        = dump(AcademicLevel.objects.all())
base_subjects_data = dump(BaseSubject.objects.all())
subjects_data      = dump(Subject.objects.all())

subject_teachers_m2m, subject_students_m2m = [], []
for subj in Subject.objects.prefetch_related("teachers", "students").all():
    for t in subj.teachers.all():
        subject_teachers_m2m.append({"subject_id": subj.id, "user_id": t.id})
    for s in subj.students.all():
        subject_students_m2m.append({"subject_id": subj.id, "user_id": s.id})

notes_data           = dump(Note.objects.all())
syllabuses_data      = dump(Syllabus.objects.all())
announcements_data   = dump(Announcement.objects.all())
assignments_data     = dump(Assignment.objects.all())
topics_data          = dump(CurriculumTopic.objects.all())
notifications_data   = dump(Notification.objects.all())
quizzes_data         = dump(Quiz.objects.all())
questions_data       = dump(Question.objects.all())
choices_data         = dump(Choice.objects.all())
attempts_data        = dump(QuizAttempt.objects.all())
attempt_answers_data = dump(AttemptAnswer.objects.all())

print(f"  Users:               {len(users_data)}")
print(f"  StudentProfiles:     {len(students_data)}")
print(f"  TeacherProfiles:     {len(teachers_data)}")
print(f"  HODProfiles:         {len(hods_data)}")
print(f"  Domains:             {len(domains_data)}")
print(f"  SubDomains:          {len(subdomains_data)}")
print(f"  Departments:         {len(departments_data)}")
print(f"  AcademicLevels:      {len(levels_data)}")
print(f"  BaseSubjects:        {len(base_subjects_data)}")
print(f"  Subjects:            {len(subjects_data)}")
print(f"  Subject-Teacher M2M: {len(subject_teachers_m2m)}")
print(f"  Subject-Student M2M: {len(subject_students_m2m)}")
print(f"  Notes:               {len(notes_data)}")
print(f"  Syllabuses:          {len(syllabuses_data)}")
print(f"  Announcements:       {len(announcements_data)}")
print(f"  Assignments:         {len(assignments_data)}")
print(f"  Topics:              {len(topics_data)}")
print(f"  Notifications:       {len(notifications_data)}")
print(f"  Quizzes:             {len(quizzes_data)}")
print(f"  Questions:           {len(questions_data)}")
print(f"  Choices:             {len(choices_data)}")
print(f"  QuizAttempts:        {len(attempts_data)}")
print(f"  AttemptAnswers:      {len(attempt_answers_data)}")

# ── 2. Register Supabase as a second 'pg' alias ───────────────────────────────
print()
print("=" * 60)
print("STEP 2: Connecting to Supabase PostgreSQL …")
print("=" * 60)

from django.conf import settings as dj_settings
from django.db import connections, transaction

PG = "pg"
dj_settings.DATABASES[PG] = {
    "ENGINE": "django.db.backends.postgresql",
    "NAME": "postgres",
    "USER": "postgres.fbaxoebdjpdhgrojtjyh",
    "PASSWORD": "edulinkcameroon@gmail.com",
    "HOST": "aws-0-eu-west-1.pooler.supabase.com",
    "PORT": "6543",
    "OPTIONS": {"sslmode": "require"},
}

pg_conn = connections[PG]
try:
    pg_conn.ensure_connection()
    print("  ✓ Connected successfully.")
except Exception as e:
    print(f"  ✗ Connection failed: {e}")
    sys.exit(1)

# ── 3. Run migrations ─────────────────────────────────────────────────────────
print()
print("=" * 60)
print("STEP 3: Running Django migrations on Supabase …")
print("=" * 60)

from django.core.management import call_command
call_command("migrate", "--database", PG, verbosity=1)

# ── 4. Helpers ────────────────────────────────────────────────────────────────
def pg_exec(sql):
    with connections[PG].cursor() as cur:
        cur.execute(sql)

def insert_rows(model, rows, label):
    if not rows:
        print(f"  {label}: skipped (empty)")
        return
    with transaction.atomic(using=PG):
        for row in rows:
            obj = model(**row)
            obj.save_base(raw=True, using=PG)
    print(f"  ✓ {label}: {len(rows)} rows")

# ── 5. Insert data ────────────────────────────────────────────────────────────
print()
print("=" * 60)
print("STEP 4: Inserting data into Supabase …")
print("=" * 60)

# Disable FK checks for the session so we can insert in any order
pg_exec("SET session_replication_role = 'replica';")

try:
    # Users — with password reset
    with transaction.atomic(using=PG):
        for row in users_data:
            u = User(**row)
            u.set_password(NEW_PASSWORD)
            u.save_base(raw=True, using=PG)
    print(f"  ✓ Users: {len(users_data)} rows  (password → {NEW_PASSWORD})")

    # Academic
    insert_rows(Domain,         domains_data,        "Domains")
    insert_rows(SubDomain,      subdomains_data,      "SubDomains")
    insert_rows(Department,     departments_data,     "Departments")
    insert_rows(AcademicLevel,  levels_data,          "AcademicLevels")
    insert_rows(BaseSubject,    base_subjects_data,   "BaseSubjects")
    insert_rows(Subject,        subjects_data,        "Subjects")

    # Profiles
    insert_rows(StudentProfile, students_data,        "StudentProfiles")
    insert_rows(TeacherProfile, teachers_data,        "TeacherProfiles")
    insert_rows(HODProfile,     hods_data,            "HODProfiles")

    # M2M
    TeacherThrough = Subject.teachers.through
    StudentThrough = Subject.students.through
    with transaction.atomic(using=PG):
        for row in subject_teachers_m2m:
            TeacherThrough.objects.using(PG).get_or_create(**row)
        for row in subject_students_m2m:
            StudentThrough.objects.using(PG).get_or_create(**row)
    print(f"  ✓ Subject-Teacher M2M: {len(subject_teachers_m2m)} rows")
    print(f"  ✓ Subject-Student M2M: {len(subject_students_m2m)} rows")

    # Content
    insert_rows(Note,            notes_data,           "Notes")
    insert_rows(Syllabus,        syllabuses_data,      "Syllabuses")
    insert_rows(Announcement,    announcements_data,   "Announcements")
    insert_rows(Assignment,      assignments_data,     "Assignments")
    insert_rows(CurriculumTopic, topics_data,          "CurriculumTopics")
    insert_rows(Notification,    notifications_data,   "Notifications")

    # Quizzes
    insert_rows(Quiz,            quizzes_data,         "Quizzes")
    insert_rows(Question,        questions_data,       "Questions")
    insert_rows(Choice,          choices_data,         "Choices")
    insert_rows(QuizAttempt,     attempts_data,        "QuizAttempts")
    insert_rows(AttemptAnswer,   attempt_answers_data, "AttemptAnswers")

finally:
    pg_exec("SET session_replication_role = 'origin';")

# ── 6. Reset sequences ────────────────────────────────────────────────────────
print()
print("=" * 60)
print("STEP 5: Resetting PostgreSQL auto-increment sequences …")
print("=" * 60)

from django.apps import apps as django_apps

with connections[PG].cursor() as cur:
    for app_cfg in django_apps.get_app_configs():
        for model in app_cfg.get_models():
            table  = model._meta.db_table
            pk_col = model._meta.pk.column if model._meta.pk else None
            if not pk_col:
                continue
            try:
                cur.execute(
                    f"SELECT setval("
                    f"  pg_get_serial_sequence('{table}', '{pk_col}'), "
                    f"  COALESCE((SELECT MAX(\"{pk_col}\") FROM \"{table}\"), 1)"
                    f");"
                )
                print(f"  ✓ {table}.{pk_col}")
            except Exception:
                connections[PG].rollback()

print()
print("=" * 60)
print("✅  Migration complete!")
print(f"   {len(users_data)} users — all passwords set to: {NEW_PASSWORD}")
print("=" * 60)
print()
print("Next steps:")
print("  1. Comment out DATABASE_URL= in .env to use Supabase going forward, or")
print("     leave it empty to keep using SQLite locally.")
print("  2. The Supabase DB now has all your data with passwords reset to Edulink2026#")
