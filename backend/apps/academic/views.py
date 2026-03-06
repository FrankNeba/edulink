from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models

from .models import Domain, SubDomain, Department, Subject, BaseSubject, AcademicLevel
from .serializers import (
    DomainSerializer, SubDomainSerializer, DepartmentSerializer,
    SubjectSerializer, BaseSubjectSerializer, AcademicLevelSerializer
)
from apps.accounts.views import IsVicePrincipal, IsHOD, IsTeacher, IsStudent, IsVicePrincipalOrHOD, IsStaff

class DomainViewSet(viewsets.ModelViewSet):
    queryset = Domain.objects.all()
    serializer_class = DomainSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsVicePrincipal()]
        return [permissions.IsAuthenticated()]

class SubDomainViewSet(viewsets.ModelViewSet):
    queryset = SubDomain.objects.all()
    serializer_class = SubDomainSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsVicePrincipal()]
        return [permissions.IsAuthenticated()]

class AcademicLevelViewSet(viewsets.ModelViewSet):
    queryset = AcademicLevel.objects.all()
    serializer_class = AcademicLevelSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ['PRINCIPAL', 'VICE_PRINCIPAL']:
            return AcademicLevel.objects.all()
        elif user.role == 'TEACHER':
            return AcademicLevel.objects.filter(
                models.Q(class_master=user) |
                models.Q(subjects__teachers=user)
            ).distinct()
        elif user.role == 'HOD':
            return AcademicLevel.objects.filter(
                models.Q(subjects__hod=user) | 
                models.Q(subjects__department__hod=user)
            ).distinct()
        elif user.role == 'STUDENT':
            return AcademicLevel.objects.filter(id=user.student_profile.academic_level_id)
        return AcademicLevel.objects.none()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsVicePrincipal()]
        return [permissions.IsAuthenticated()]

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsVicePrincipal()]
        return [permissions.IsAuthenticated()]

class BaseSubjectViewSet(viewsets.ModelViewSet):
    queryset = BaseSubject.objects.all()
    serializer_class = BaseSubjectSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsVicePrincipal()]
        return [permissions.IsAuthenticated()]

class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'update', 'partial_update']:
            return [IsVicePrincipalOrHOD()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'STUDENT':
            profile = user.student_profile
            lvl = getattr(profile, 'academic_level', None)
            level_str = profile.level
            
            # Build a query that covers:
            # 1. Subjects linked via academic_level FK
            # 2. Subjects linked via level string (legacy)
            # 3. Subjects the student is already registered to
            q = models.Q()
            if lvl:
                q |= models.Q(academic_level=lvl)
            if level_str:
                q |= models.Q(level=level_str)
            # Always include subjects they are registered to
            q |= models.Q(students=user)
            
            return Subject.objects.filter(q).distinct()
            
        elif user.role == 'TEACHER':
            return Subject.objects.filter(
                models.Q(teachers=user) | 
                models.Q(academic_level__class_master=user)
            ).distinct()
            
        elif user.role == 'HOD':
            return Subject.objects.filter(
                models.Q(hod=user) | 
                models.Q(department__hod=user)
            ).distinct()
            
        elif user.role in ['PRINCIPAL', 'VICE_PRINCIPAL']:
            return Subject.objects.all()
            
        return Subject.objects.none()

    @action(detail=True, methods=['post'], permission_classes=[IsStudent])
    def register(self, request, pk=None):
        subject = self.get_object()
        user = request.user
        if subject.level != user.student_profile.level:
            return Response({'error': 'You can only register for subjects in your level.'}, status=status.HTTP_400_BAD_REQUEST)
        subject.students.add(user)
        return Response({'message': 'Registered successfully.'})

    @action(detail=True, methods=['post'], permission_classes=[IsStudent])
    def unregister(self, request, pk=None):
        subject = self.get_object()
        user = request.user
        
        # Restriction: Form 1-3 cannot unregister
        if subject.level in ['Form 1', 'Form 2', 'Form 3']:
            return Response({'error': f'Unregistering is not permitted for {subject.level}. These subjects are mandatory.'}, status=status.HTTP_403_FORBIDDEN)
            
        subject.students.remove(user)
        return Response({'message': 'Unregistered successfully.'})

    @action(detail=True, methods=['get'], permission_classes=[IsStaff])
    def student_list(self, request, pk=None):
        subject = self.get_object()
        students = subject.students.all()
        from apps.accounts.serializers import UserSerializer
        serializer = UserSerializer(students, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        subject = serializer.save()
        
        # Handle teachers if provided (DRF won't auto-handle M2M in custom perform_create like this)
        teachers_ids = self.request.data.get('teachers', [])
        if teachers_ids:
            subject.teachers.set(teachers_ids)
            
        # AUTO-SYNC Students for Form 1-3
        if subject.level in ['Form 1', 'Form 2', 'Form 3']:
            from apps.accounts.models import User
            # Find all students in this level and domain
            target_students = User.objects.filter(
                role='STUDENT',
                student_profile__level=subject.level
            )
            # If subject has domain restriction, filter by it
            if subject.domain:
                target_students = target_students.filter(student_profile__domain=subject.domain)
            
            subject.students.add(*target_students)
