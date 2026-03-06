from rest_framework import viewsets, permissions
from rest_framework.response import Response
from django.db import models as db_models
from .models import Note, Announcement, Syllabus, Assignment
from .serializers import NoteSerializer, AnnouncementSerializer, SyllabusSerializer, AssignmentSerializer
from apps.accounts.views import IsVicePrincipal, IsHOD, IsTeacher, IsStudent, IsVicePrincipalOrHOD, IsStaff
from apps.notifications.models import Notification
from apps.academic.models import AcademicLevel


class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.all().order_by('-uploaded_at')
    serializer_class = NoteSerializer

    def get_queryset(self):
        user = self.request.user

        if user.role in ['PRINCIPAL', 'VICE_PRINCIPAL']:
            qs = Note.objects.all()
        elif user.role == 'HOD':
            hod_base_subjects = user.managed_base_subjects.all()
            qs = Note.objects.filter(subject__base_subject__in=hod_base_subjects)
        elif user.role == 'TEACHER':
            qs = Note.objects.filter(
                db_models.Q(subject__teachers=user) |
                db_models.Q(subject__academic_level__class_master=user)
            )
        elif user.role == 'STUDENT':
            qs = Note.objects.filter(subject__students=user)
        else:
            qs = Note.objects.none()

        subject_id = self.request.query_params.get('subject')
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
            
        return qs.distinct().order_by('-uploaded_at')

    def _notify_students(self, instance, title_prefix, category):
        # Notify all students in the subject
        subject = instance.subject
        students = subject.students.all()
        for student in students:
            Notification.objects.create(
                recipient=student,
                title=f"{title_prefix}: {instance.title}",
                message=f"New {category} uploaded for {subject.name} by {instance.teacher.get_full_name() if hasattr(instance, 'teacher') else instance.uploaded_by.get_full_name()}",
                category=category,
                link='/dashboard/notes'
            )

    def perform_create(self, serializer):
        user = self.request.user
        subject = serializer.validated_data.get('subject')

        instance = None
        if user.role == 'VICE_PRINCIPAL':
            instance = serializer.save(teacher=user)
        elif user.role == 'HOD':
            if subject and subject.base_subject and subject.base_subject.hod == user:
                instance = serializer.save(teacher=user)
            else:
                raise permissions.PermissionDenied("You can only upload notes for subjects you are HOD of.")
        elif user.role == 'TEACHER':
            if subject and subject.teachers.filter(id=user.id).exists():
                instance = serializer.save(teacher=user)
            else:
                raise permissions.PermissionDenied("You can only upload notes for subjects you are assigned to.")
        
        if instance:
            self._notify_students(instance, "New Note", "notes")

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsStaff()]
        return [permissions.IsAuthenticated()]


class SyllabusViewSet(viewsets.ModelViewSet):
    queryset = Syllabus.objects.all()
    serializer_class = SyllabusSerializer

    def get_queryset(self):
        user = self.request.user

        if user.role in ['PRINCIPAL', 'VICE_PRINCIPAL']:
            qs = Syllabus.objects.all()
        elif user.role == 'HOD':
            hod_base_subjects = user.managed_base_subjects.all()
            qs = Syllabus.objects.filter(subject__base_subject__in=hod_base_subjects)
        elif user.role == 'TEACHER':
            qs = Syllabus.objects.filter(
                db_models.Q(subject__teachers=user) |
                db_models.Q(subject__academic_level__class_master=user)
            )
        elif user.role == 'STUDENT':
            qs = Syllabus.objects.filter(subject__students=user)
        else:
            qs = Syllabus.objects.none()

        subject_id = self.request.query_params.get('subject')
        if subject_id:
            qs = qs.filter(subject_id=subject_id)

        return qs.distinct().order_by('-uploaded_at')

    def perform_create(self, serializer):
        user = self.request.user
        subject = serializer.validated_data.get('subject')

        instance = None
        if user.role == 'VICE_PRINCIPAL':
            instance = serializer.save(uploaded_by=user)
        elif user.role == 'HOD':
            if subject and subject.base_subject and subject.base_subject.hod == user:
                instance = serializer.save(uploaded_by=user)
            else:
                raise permissions.PermissionDenied("You can only upload syllabi for subjects you are HOD of.")
        else:
            raise permissions.PermissionDenied("Only VP or HOD can upload syllabi.")

        if instance:
            # Reusing the notify logic or similar
            students = subject.students.all()
            for student in students:
                Notification.objects.create(
                    recipient=student,
                    title=f"Syllabus Update: {subject.name}",
                    message=f"A new curriculum/syllabus has been uploaded for {subject.name}.",
                    category="notes",
                    link='/dashboard/notes'
                )

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsVicePrincipalOrHOD()]
        return [permissions.IsAuthenticated()]


class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role not in ['PRINCIPAL', 'VICE_PRINCIPAL', 'HOD', 'TEACHER', 'STUDENT']:
            return Announcement.objects.none()
            
        qs = Announcement.objects.all()
        
        if user.role == 'STUDENT':
            student_level = getattr(getattr(user, 'student_profile', None), 'level', None)
            student_dept  = getattr(getattr(user, 'student_profile', None), 'department', None)
            q = (
                db_models.Q(level='SCHOOL') |
                db_models.Q(level='SUBJECT',   subject__students=user) |
                db_models.Q(level='CLASS',     target_class=student_level) |
                db_models.Q(level='DOMAIN',    domain__subjects__students=user) |
                db_models.Q(level='SUBDOMAIN', sub_domain__subjects__students=user)
            )
            if student_dept:
                q |= db_models.Q(level='DEPARTMENT', department=student_dept)
            qs = Announcement.objects.filter(q).distinct()
        elif user.role == 'TEACHER':
            qs = Announcement.objects.filter(
                db_models.Q(level='SCHOOL') |
                db_models.Q(level='SUBJECT', subject__teachers=user) |
                db_models.Q(level__in=['CLASS', 'DOMAIN', 'SUBDOMAIN'])
            ).distinct()
        else:
            qs = Announcement.objects.all()

        subject_id = self.request.query_params.get('subject')
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
            
        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        level = serializer.validated_data.get('level')
        user  = self.request.user

        if level == 'SCHOOL' and user.role not in ['PRINCIPAL', 'VICE_PRINCIPAL']:
            raise permissions.PermissionDenied("Only Principal/Vice Principal can send school-wide announcements.")
        if level == 'DEPARTMENT' and user.role not in ['HOD', 'PRINCIPAL', 'VICE_PRINCIPAL']:
            raise permissions.PermissionDenied("Only HOD or Principal/VP can send departmental announcements.")
        if level in ['CLASS', 'DOMAIN', 'SUBDOMAIN']:
            # Allow Class Master to send announcements to their class
            if level == 'CLASS':
                target_level_name = serializer.validated_data.get('target_class')
                is_cm = AcademicLevel.objects.filter(name=target_level_name, class_master=user).exists()
                if not (user.role in ['HOD', 'PRINCIPAL', 'VICE_PRINCIPAL'] or is_cm):
                     raise permissions.PermissionDenied("Only Class Master, HOD or Principal/VP can send class announcements.")
            elif user.role not in ['HOD', 'PRINCIPAL', 'VICE_PRINCIPAL']:
                raise permissions.PermissionDenied("Only HOD or Principal/VP can send domain announcements.")
        if level == 'SUBJECT' and user.role not in ['TEACHER', 'HOD', 'PRINCIPAL', 'VICE_PRINCIPAL']:
            raise permissions.PermissionDenied("Only faculty can send subject announcements.")

        serializer.save(author=user)

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all().order_by('-created_at')
    serializer_class = AssignmentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'STUDENT':
            qs = Assignment.objects.filter(subject__students=user)
        elif user.role == 'TEACHER':
            qs = Assignment.objects.filter(
                db_models.Q(subject__teachers=user) |
                db_models.Q(subject__academic_level__class_master=user)
            ).distinct()
        elif user.role in ['PRINCIPAL', 'VICE_PRINCIPAL', 'HOD']:
            qs = Assignment.objects.all()
        else:
            qs = Assignment.objects.none()

        subject_id = self.request.query_params.get('subject')
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
            
        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacher()] # Or IsStaff
        return [permissions.IsAuthenticated()]
