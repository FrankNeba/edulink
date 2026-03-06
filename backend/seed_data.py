import os
import django
import random
from django.utils import timezone

# Setup Django atmosphere
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.accounts.models import User, StudentProfile, TeacherProfile, HODProfile
from apps.academic.models import Department, Subject

def seed_data():
    print("Seeding Cameroon Secondary School Data (Multi-Type Departments)...")

    # 1. Core Departments (Streams)
    core_depts_data = [
        {'name': 'Sciences', 'code': 'SCI', 'desc': 'Focus on Biology, Chemistry, Physics (Science Stream)'},
        {'name': 'Arts & Humanities', 'code': 'ART', 'desc': 'Focus on Literature, History (Arts Stream)'},
        {'name': 'Technical Education', 'code': 'TEC', 'desc': 'Focus on Engineering, Building (Technical Stream)'},
        {'name': 'Commercial/Business', 'code': 'COM', 'desc': 'Focus on Management, Accounting (Business Stream)'},
    ]
    
    core_departments = {}
    for d in core_depts_data:
        obj, _ = Department.objects.get_or_create(
            code=d['code'], 
            defaults={'name': d['name'], 'description': d['desc'], 'type': 'CORE'}
        )
        core_departments[d['code']] = obj

    # 2. Subject-Specific Departments
    subj_depts_data = [
        {'name': 'Biology Department', 'code': 'BIO-DEPT', 'desc': 'Specialized Biology Faculty Unit'},
        {'name': 'Chemistry Department', 'code': 'CHM-DEPT', 'desc': 'Specialized Chemistry Faculty Unit'},
        {'name': 'Physics Department', 'code': 'PHY-DEPT', 'desc': 'Specialized Physics Faculty Unit'},
        {'name': 'History Department', 'code': 'HIS-DEPT', 'desc': 'Specialized History Faculty Unit'},
        {'name': 'Math Department', 'code': 'MAT-DEPT', 'desc': 'General Mathematics Faculty Unit'},
    ]

    subject_departments = {}
    for d in subj_depts_data:
        obj, _ = Department.objects.get_or_create(
            code=d['code'],
            defaults={'name': d['name'], 'description': d['desc'], 'type': 'SUBJECT'}
        )
        subject_departments[d['code']] = obj

    # 3. Levels
    levels = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Lower Sixth', 'Upper Sixth']
    
    # 4. Cameroon Secondary School Subjects
    subjects_config = [
        {'name': 'Biology', 'base_code': '510', 'dept': 'SCI'},
        {'name': 'Chemistry', 'base_code': '515', 'dept': 'SCI'},
        {'name': 'Physics', 'base_code': '580', 'dept': 'SCI'},
        {'name': 'Mathematics', 'base_code': '570', 'dept': 'SCI'},
        {'name': 'English Language', 'base_code': '530', 'dept': 'ART'},
        {'name': 'History', 'base_code': '550', 'dept': 'ART'},
        {'name': 'French', 'base_code': '540', 'dept': 'ART'},
        {'name': 'Economics', 'base_code': '525', 'dept': 'COM'},
        {'name': 'Computer Science', 'base_code': '595', 'dept': 'TEC'},
    ]

    all_subjects = []
    
    # Create subjects assigned to CORE streams
    for lvl in levels:
        for s in subjects_config:
            code = f"{s['base_code']}-{lvl.replace(' ', '')}"
            obj, _ = Subject.objects.get_or_create(
                code=code,
                defaults={'name': f"{s['name']} ({lvl})", 'department': core_departments[s['dept']], 'level': lvl}
            )
            all_subjects.append(obj)

    print(f"Propagated {len(all_subjects)} subjects across core streams.")

    # 5. Cleanup old users
    User.objects.exclude(email__in=['admin@edulink.edu', 'neba@gmail.com']).delete()

    # 6. Seed HODs for both types
    # 4 CORE HODs
    for i, (code, dept) in enumerate(core_departments.items()):
        email = f"core_hod_{code.lower()}@edulink.edu"
        user = User.objects.create_user(email=email, password='Admin123!', first_name=f'Dir_{dept.name}', last_name='Staff', role='HOD')
        HODProfile.objects.create(user=user, department=dept)
        dept.hod = user
        dept.save()

    # 5 SUBJECT HODs
    for i, (code, dept) in enumerate(subject_departments.items()):
        email = f"subj_hod_{code.lower()}@edulink.edu"
        user = User.objects.create_user(email=email, password='Admin123!', first_name=f'HOD_{dept.name.split()[0]}', last_name='Dept', role='HOD')
        HODProfile.objects.create(user=user, department=dept)
        dept.hod = user
        dept.save()

    # 10 Teachers
    for i in range(10):
        email = f"teacher{i+1}@edulink.edu"
        user = User.objects.create_user(email=email, password='Admin123!', first_name=f'Teacher_{i+1}', last_name='Cameroon', role='TEACHER')
        dept = random.choice(list(core_departments.values()))
        TeacherProfile.objects.create(user=user, department=dept)
        # Assign 5 random subjects
        assigned = random.sample(all_subjects, 5)
        for s in assigned:
            s.teachers.add(user)

    # 40 Students
    for i in range(40):
        email = f"student{i+1}@edulink.edu"
        user = User.objects.create_user(email=email, password='Admin123!', first_name=f'Student_{i+1}', last_name='Cameroon', role='STUDENT')
        dept = random.choice(list(core_departments.values()))
        lvl = random.choice(levels)
        sid = f"STU-{dept.code}-{lvl.replace(' ', '').upper()}-{timezone.now().year}-{i+1:03d}"
        StudentProfile.objects.create(user=user, student_id=sid, department=dept, level=lvl)
        
        # Register for subjects of their level
        level_subjs = Subject.objects.filter(level=lvl)
        if level_subjs.exists():
            regs = random.sample(list(level_subjs), min(len(level_subjs), 8))
            for s in regs:
                s.students.add(user)

    print("Dynamic seeding completed with Multi-Type Department HODs.")

if __name__ == '__main__':
    seed_data()
