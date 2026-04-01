import os
import logging
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.db import models, transaction
from django.utils import timezone
from .models import StudentProfile, TeacherProfile, HODProfile
from .serializers import (
    UserSerializer, StudentProfileSerializer, TeacherProfileSerializer, 
    HODProfileSerializer, StudentCreateSerializer, TeacherCreateSerializer,
    HODCreateSerializer
)
from apps.academic.models import Subject, Department, Domain, SubDomain, AcademicLevel
from apps.content.models import Note
from apps.quizzes.models import Quiz
import string
import random
import secrets
import requests
import threading

User = get_user_model()

class IsPrincipal(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'PRINCIPAL'

class IsVicePrincipal(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['PRINCIPAL', 'VICE_PRINCIPAL']

class IsHOD(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'HOD'

class IsTeacher(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['PRINCIPAL', 'VICE_PRINCIPAL', 'HOD', 'TEACHER']

class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'STUDENT'

class IsVicePrincipalOrHOD(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['PRINCIPAL', 'VICE_PRINCIPAL', 'HOD']

class IsStaff(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['PRINCIPAL', 'VICE_PRINCIPAL', 'HOD', 'TEACHER']

def generate_student_id(code, level):
    year = timezone.now().year
    lvl_slug = level.replace(' ', '').upper()
    base_qs = StudentProfile.objects.filter(
        models.Q(department__code=code) | models.Q(domain__name=code),
        level=level,
    )
    count = base_qs.count() + 1
    candidate = f"STU-{code}-{lvl_slug}-{year}-{count:04d}"
    # Keep incrementing until we find one that doesn't exist
    while StudentProfile.objects.filter(student_id=candidate).exists():
        count += 1
        candidate = f"STU-{code}-{lvl_slug}-{year}-{count:04d}"
    return candidate

def generate_teacher_id(dept_code):
    year = timezone.now().year
    count = TeacherProfile.objects.filter(department__code=dept_code).count() + 1
    candidate = f"TEA-{dept_code}-{year}-{count:03d}"
    while TeacherProfile.objects.filter(teacher_id=candidate).exists():
        count += 1
        candidate = f"TEA-{dept_code}-{year}-{count:03d}"
    return candidate

logger = logging.getLogger(__name__)


def send_credentials_email(user, password, user_id):
    from django.core.mail import EmailMultiAlternatives
    from django.conf import settings

    role_label = {
        'STUDENT': 'Student',
        'TEACHER': 'Teacher',
        'HOD': 'Head of Department',
        'VICE_PRINCIPAL': 'Vice-Principal',
        'PRINCIPAL': 'Principal',
    }.get(user.role, 'Member')

    def _do_send():
        id_label = 'Student ID' if user.role == 'STUDENT' else 'Staff ID'
        login_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000') + '/login'
        subject = f'Welcome to EduLink – Your Login Credentials'

        # Plain-text fallback
        plain_text = f"Hello {user.first_name},\n\nWelcome to EduLink! Your account has been created.\n\n" \
                     f"Email: {user.email}\n" \
                     f"Password: {password}\n" \
                     f"Login URL: {login_url}\n\n" \
                     f"Please change your password on first login."

        html_content = f"""
<!DOCTYPE html>
<html>
<body>
  <h2>Welcome, {user.first_name}! 👋</h2>
  <p>Your <strong>{role_label}</strong> account has been created.</p>
  <p><strong>Email:</strong> {user.email}</p>
  <p><strong>Temporary Password:</strong> {password}</p>
  <a href="{login_url}">Sign In to EduLink →</a>
</body>
</html>
"""
        try:
            msg = EmailMultiAlternatives(
                subject=subject,
                body=plain_text,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[user.email],
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()
            logger.info(f"[EMAIL] Django SMTP Success: {user.email}")
            
            # Frontend API bridge
            try:
                frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
                requests.post(f"{frontend_url}/api/send-email", json={
                    "to": user.email, "subject": subject, "html": html_content
                }, timeout=15)
            except Exception: pass
        except Exception as e:
            logger.error(f"[EMAIL] Error: {str(e)}")

    threading.Thread(target=_do_send).start()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        return self._get_user_with_profile(request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        return self._get_user_with_profile(instance)

    def _get_user_with_profile(self, user):
        serializer = self.get_serializer(user)
        data = serializer.data
        try:
            if user.role == 'STUDENT':
                profile = StudentProfile.objects.get(user=user)
                data['profile'] = StudentProfileSerializer(profile).data
            elif user.role == 'TEACHER':
                profile = TeacherProfile.objects.get(user=user)
                data['profile'] = TeacherProfileSerializer(profile).data
            elif user.role == 'HOD':
                profile = HODProfile.objects.get(user=user)
                data['profile'] = HODProfileSerializer(profile).data
        except (StudentProfile.DoesNotExist, TeacherProfile.DoesNotExist, HODProfile.DoesNotExist):
            data['profile'] = None
            
        return Response(data)

    @action(detail=False, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def update_me(self, request):
        user = request.user
        # Only allow updating first_name, last_name, phone
        allowed_fields = ['first_name', 'last_name', 'phone']
        data = {k: v for k, v in request.data.items() if k in allowed_fields}
        
        serializer = self.get_serializer(user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def by_role(self, request):
        role = request.query_params.get('role')
        if not role:
            return Response({'error': 'Role parameter required'}, status=400)
        users = User.objects.filter(role=role)
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def analytics(self, request):
        user = request.user
        data = {}
        
        if user.role == 'STUDENT':
            profile = user.student_profile
            # AUTO-SYNC for Form 1-3
            if profile.level in ['Form 1', 'Form 2', 'Form 3']:
                from django.db.models import Q
                # Subjects matching level AND (common or matching domain)
                all_lvl_subs = Subject.objects.filter(
                    Q(level=profile.level) & 
                    (Q(domain__isnull=True) | Q(domain=profile.domain))
                )
                for s in all_lvl_subs:
                    if user not in s.students.all():
                        s.students.add(user)
                        
            data['subjects'] = Subject.objects.filter(level=profile.level).count()
            data['registered_subjects'] = user.registered_subjects.count()
            data['notes'] = Note.objects.filter(subject__in=user.registered_subjects.all()).count()
            data['quizzes'] = Quiz.objects.filter(subject__in=user.registered_subjects.all()).count()
        elif user.role == 'TEACHER':
            data['subjects'] = user.assigned_subjects.count()
            data['notes'] = Note.objects.filter(teacher=user).count()
            data['quizzes'] = Quiz.objects.filter(teacher=user).count()
            # Count students across all assigned subjects
            data['students'] = User.objects.filter(registered_subjects__in=user.assigned_subjects.all()).distinct().count()
        elif user.role == 'HOD':
            profile = getattr(user, 'hod_profile', None)
            if profile and profile.department:
                dept = profile.department
                data['subjects'] = dept.subjects.count()
                data['students'] = User.objects.filter(student_profile__department=dept).count()
                data['teachers'] = User.objects.filter(teacher_profile__department=dept).count()
                data['quizzes'] = Quiz.objects.filter(subject__department=dept).count()
            elif profile and profile.subject:
                subject = profile.subject
                data['subjects'] = 1
                data['students'] = subject.students.count()
                data['teachers'] = subject.teachers.count()
                data['quizzes'] = Quiz.objects.filter(subject=subject).count()
            else:
                data['subjects'] = 0
                data['students'] = 0
                data['teachers'] = 0
                data['quizzes'] = 0
        elif user.role in ['PRINCIPAL', 'VICE_PRINCIPAL']:
            data['subjects'] = Subject.objects.count()
            data['students'] = User.objects.filter(role='STUDENT').count()
            data['teachers'] = User.objects.filter(role='TEACHER').count()
            data['departments'] = Department.objects.count()
            data['classes'] = AcademicLevel.objects.count()

        return Response(data)

    @action(detail=False, methods=['post'], permission_classes=[IsVicePrincipalOrHOD])
    def create_student(self, request):
        serializer = StudentCreateSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                dept = None
                if serializer.validated_data.get('department_id'):
                    dept = Department.objects.get(id=serializer.validated_data['department_id'])
                
                domain = None
                if serializer.validated_data.get('domain_id'):
                    domain = Domain.objects.get(id=serializer.validated_data['domain_id'])
                
                sub_domain = None
                if serializer.validated_data.get('sub_domain_id'):
                    sub_domain = SubDomain.objects.get(id=serializer.validated_data['sub_domain_id'])

                academic_level = None
                if serializer.validated_data.get('academic_level_id'):
                    academic_level = AcademicLevel.objects.get(id=serializer.validated_data['academic_level_id'])

                password = secrets.token_urlsafe(8)
                
                # Check if user already exists
                email = serializer.validated_data['email']
                if User.objects.filter(email=email).exists():
                    return Response(
                        {"error": f"A user with email {email} already exists."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Use a simpler password format for easier first-time login
                password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))

                user = User.objects.create_user(
                    email=email,
                    password=password,
                    first_name=serializer.validated_data['first_name'],
                    last_name=serializer.validated_data['last_name'],
                    role='STUDENT',
                    phone=serializer.validated_data.get('phone', '')
                )
                
                if academic_level:
                    # Auto-fix: derive level name from the academic level if not set
                    level = serializer.validated_data.get('level') or academic_level.name
                else:
                    level = serializer.validated_data['level']

                code = (dept.code if dept else domain.name[:3].upper()) if (dept or domain) else 'GEN'
                student_id = generate_student_id(code, level)
                
                profile = StudentProfile.objects.create(
                    user=user,
                    student_id=student_id,
                    department=dept,
                    domain=domain,
                    sub_domain=sub_domain,
                    academic_level=academic_level,
                    level=level
                )
                
                # Email is now OUTSIDE the atomic block so the DB releases instantly
                send_credentials_email(user, password, student_id)
                
                # AUTO REGISTRATION for Form 1-3
                effective_level = level or (academic_level.name if academic_level else '')
                if effective_level in ['Form 1', 'Form 2', 'Form 3']:
                    from django.db.models import Q
                    # Subjects matching level AND (common or matching domain)
                    subjects = Subject.objects.filter(
                        Q(level=effective_level) & 
                        (Q(domain__isnull=True) | Q(domain=domain))
                    )
                    for sub in subjects:
                        sub.students.add(user)
                
                return Response({
                    'message': 'Student created successfully. Credentials sent to email.',
                    'student_id': student_id,
                    'default_password': password
                }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[IsVicePrincipal | IsHOD])
    def bulk_create_students(self, request):
        file = request.FILES.get('file')
        level_id = request.data.get('academic_level_id')
        
        if not file or not level_id:
            return Response({'error': 'File and level selection required'}, status=400)
            
        try:
            import pandas as pd
            import io
            
            academic_level = AcademicLevel.objects.get(id=level_id)
            df = pd.read_excel(file)
            
            created_count = 0
            errors = []
            
            for index, row in df.iterrows():
                try:
                    email = row.get('email')
                    first_name = row.get('first_name')
                    last_name = row.get('last_name')
                    phone = row.get('phone', '')
                    
                    if not email or not first_name:
                        continue
                        
                    if User.objects.filter(email=email).exists():
                        errors.append(f"Row {index+2}: Email {email} already exists")
                        continue

                    with transaction.atomic():
                        password = secrets.token_urlsafe(8)
                        user = User.objects.create_user(
                            email=email,
                            password=password,
                            first_name=first_name,
                            last_name=last_name,
                            role='STUDENT',
                            phone=str(phone)
                        )
                        
                        code = academic_level.domain.name[:3].upper()
                        student_id = generate_student_id(code, academic_level.name)
                        
                        StudentProfile.objects.create(
                            user=user,
                            student_id=student_id,
                            domain=academic_level.domain,
                            sub_domain=academic_level.sub_domain,
                            academic_level=academic_level,
                            level=academic_level.name
                        )
                        
                        send_credentials_email(user, password, student_id)
                        
                        # Auto-sync subjects for Form 1-3
                        if academic_level.name in ['Form 1', 'Form 2', 'Form 3']:
                            from django.db.models import Q
                            subs = Subject.objects.filter(
                                Q(level=academic_level.name) & 
                                (Q(domain__isnull=True) | Q(domain=academic_level.domain))
                            )
                            for s in subs:
                                s.students.add(user)
                                
                        created_count += 1
                except Exception as e:
                    errors.append(f"Row {index+2}: {str(e)}")
            
            return Response({
                'created': created_count,
                'errors': errors
            })
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    @action(detail=True, methods=['post'], permission_classes=[IsVicePrincipalOrHOD])
    def de_enroll(self, request, pk=None):
        user = self.get_object()
        if user.role != 'STUDENT':
            return Response({'error': 'User is not a student'}, status=400)
            
        profile = user.student_profile
        profile.academic_level = None
        profile.save()
        
        user.registered_subjects.clear()
        return Response({'message': 'Student de-enrolled successfully'})

    @action(detail=False, methods=['post'], permission_classes=[IsVicePrincipalOrHOD])
    def create_teacher(self, request):
        serializer = TeacherCreateSerializer(data=request.data)
        if serializer.is_valid():
            dept = Department.objects.get(id=serializer.validated_data['department_id'])
            
            with transaction.atomic():
                email = serializer.validated_data['email']
                if User.objects.filter(email=email).exists():
                    return Response({"error": "Email already exists"}, status=status.HTTP_400_BAD_REQUEST)
                
                password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
                user = User.objects.create_user(
                    email=email,
                    password=password,
                    first_name=serializer.validated_data['first_name'],
                    last_name=serializer.validated_data['last_name'],
                    role='TEACHER',
                    phone=serializer.validated_data.get('phone', '')
                )
                
                teacher_id = generate_teacher_id(dept.code)
                TeacherProfile.objects.create(
                    user=user,
                    teacher_id=teacher_id,
                    department=dept
                )
                
                send_credentials_email(user, password, teacher_id)
                
                return Response({
                    'message': 'Teacher created successfully. Credentials sent to email.',
                    'teacher_id': teacher_id,
                    'default_password': password
                }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[IsVicePrincipal])
    def create_hod(self, request):
        serializer = HODCreateSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                email = serializer.validated_data['email']
                if User.objects.filter(email=email).exists():
                    return Response({"error": "Email already exists"}, status=status.HTTP_400_BAD_REQUEST)

                password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
                user = User.objects.create_user(
                    email=email,
                    password=password,
                    first_name=serializer.validated_data['first_name'],
                    last_name=serializer.validated_data['last_name'],
                    role='HOD',
                    phone=serializer.validated_data.get('phone', '')
                )
                
                profile_data = {'user': user}
                
                if serializer.validated_data.get('department_id'):
                    dept = Department.objects.get(id=serializer.validated_data['department_id'])
                    profile_data['department'] = dept
                    dept.hod = user
                    dept.save()
                elif serializer.validated_data.get('subject_id'):
                    subj = Subject.objects.get(id=serializer.validated_data['subject_id'])
                    profile_data['subject'] = subj
                    subj.hod = user
                    subj.save()
                
                HODProfile.objects.create(**profile_data)
                
                return Response({
                    'message': 'HOD created successfully.',
                    'default_password': password
                }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def change_password(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        if not old_password or not new_password:
            return Response({'error': 'old_password and new_password are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not user.check_password(old_password):
            return Response({'error': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 8:
            return Response({'error': 'New password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.first_login = False
        user.save()
        return Response({'message': 'Password changed successfully.'})

    @action(detail=True, methods=['patch'], permission_classes=[IsPrincipal])
    def set_role(self, request, pk=None):
        user_to_change = self.get_object()
        new_role = request.data.get('role')
        if not new_role:
             return Response({'error': 'Role parameter required'}, status=400)
             
        if new_role not in [r[0] for r in User.Role.choices]:
            return Response({'error': 'Invalid role'}, status=400)
        
        user_to_change.role = new_role
        user_to_change.save()
        return Response({'message': f'Role updated to {new_role}'})
