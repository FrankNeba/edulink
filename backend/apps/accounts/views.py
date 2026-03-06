import os
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

    id_label = 'Student ID' if user.role == 'STUDENT' else 'Staff ID'
    login_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000') + '/login'

    subject = f'Welcome to EduLink – Your Login Credentials'

    # Plain-text fallback
    plain_text = f"""
Hello {user.first_name},

Welcome to EduLink School E-Learning System!

Your account has been created. Below are your login details:

  {id_label}: {user_id}
  Email:      {user.email}
  Password:   {password}

Sign in at: {login_url}

Important: You will be asked to change your password on first login.
Please do not share your credentials with anyone.

Regards,
EduLink Administrative Office
"""

    html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to EduLink</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%);padding:40px 40px 32px;text-align:center;">
              <!-- Logo mark -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
                <tr>
                  <td style="background:rgba(255,255,255,0.15);border-radius:14px;width:56px;height:56px;text-align:center;vertical-align:middle;">
                    <span style="font-size:28px;line-height:56px;">🎓</span>
                  </td>
                </tr>
              </table>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:900;letter-spacing:-0.5px;">EduLink</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;font-weight:500;letter-spacing:0.05em;">School E-Learning Management System</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 0;">
              <h2 style="margin:0 0 8px;color:#1e293b;font-size:22px;font-weight:800;">Welcome, {user.first_name}! 👋</h2>
              <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
                Your <strong>{role_label}</strong> account on EduLink has been created. 
                You can now sign in and start using the platform.
              </p>

              <!-- Credentials Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 16px;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">Your Login Credentials</p>

                    <!-- ID Row -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                      <tr>
                        <td style="color:#64748b;font-size:13px;font-weight:600;width:40%;">{id_label}</td>
                        <td style="color:#7c3aed;font-size:13px;font-weight:800;font-family:monospace;">{user_id}</td>
                      </tr>
                    </table>
                    <hr style="border:none;border-top:1px solid #e2e8f0;margin:12px 0;" />

                    <!-- Email Row -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
                      <tr>
                        <td style="color:#64748b;font-size:13px;font-weight:600;width:40%;">Email</td>
                        <td style="color:#1e293b;font-size:13px;font-weight:700;">{user.email}</td>
                      </tr>
                    </table>
                    <hr style="border:none;border-top:1px solid #e2e8f0;margin:12px 0;" />

                    <!-- Password Row -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#64748b;font-size:13px;font-weight:600;width:40%;">Temporary Password</td>
                        <td>
                          <span style="display:inline-block;background:#fef3c7;border:1.5px solid #fde68a;color:#92400e;font-size:15px;font-weight:800;font-family:monospace;padding:4px 12px;border-radius:8px;letter-spacing:0.05em;">{password}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="{login_url}"
                       style="display:inline-block;background:linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%);color:#ffffff;font-size:15px;font-weight:800;text-decoration:none;padding:14px 36px;border-radius:12px;box-shadow:0 4px 14px rgba(124,58,237,0.35);letter-spacing:0.02em;">
                      Sign In to EduLink →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Warning Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1.5px solid #fed7aa;border-radius:10px;margin-bottom:32px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;color:#c2410c;font-size:13px;font-weight:700;">
                      ⚠️ &nbsp;Important: You will be prompted to change your password on your first login. 
                      Please do not share your credentials with anyone.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Steps -->
          <tr>
            <td style="padding:0 40px 36px;">
              <p style="margin:0 0 16px;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">Getting Started</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;height:28px;background:#7c3aed;border-radius:8px;text-align:center;vertical-align:middle;font-size:12px;font-weight:900;color:#fff;">1</td>
                        <td style="padding-left:12px;color:#334155;font-size:13px;font-weight:600;">Go to <a href="{login_url}" style="color:#7c3aed;text-decoration:none;font-weight:700;">{login_url}</a></td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;height:28px;background:#7c3aed;border-radius:8px;text-align:center;vertical-align:middle;font-size:12px;font-weight:900;color:#fff;">2</td>
                        <td style="padding-left:12px;color:#334155;font-size:13px;font-weight:600;">Enter your email and the temporary password above</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:28px;height:28px;background:#7c3aed;border-radius:8px;text-align:center;vertical-align:middle;font-size:12px;font-weight:900;color:#fff;">3</td>
                        <td style="padding-left:12px;color:#334155;font-size:13px;font-weight:600;">Set a new personal password when prompted</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 4px;color:#94a3b8;font-size:12px;">
                This email was sent by <strong style="color:#64748b;">EduLink School E-Learning System</strong>
              </p>
              <p style="margin:0;color:#cbd5e1;font-size:11px;">
                If you did not expect this email, please contact your school administrator.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

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
    except Exception as e:
        print(f"Failed to send email to {user.email}: {str(e)}")

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
                user = User.objects.create_user(
                    email=serializer.validated_data['email'],
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
                password = secrets.token_urlsafe(8)
                user = User.objects.create_user(
                    email=serializer.validated_data['email'],
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
                password = secrets.token_urlsafe(8)
                user = User.objects.create_user(
                    email=serializer.validated_data['email'],
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
