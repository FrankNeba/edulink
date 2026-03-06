from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
import uuid

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, username=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'VICE_PRINCIPAL')
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    class Role(models.TextChoices):
        PRINCIPAL = 'PRINCIPAL', _('Principal')
        VICE_PRINCIPAL = 'VICE_PRINCIPAL', _('Vice Principal')
        HOD = 'HOD', _('Head of Department')
        TEACHER = 'TEACHER', _('Teacher')
        STUDENT = 'STUDENT', _('Student')

    email = models.EmailField(_('email address'), unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)
    phone = models.CharField(max_length=15, blank=True, null=True)
    
    first_login = models.BooleanField(default=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return f"{self.email} ({self.role})"

class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    student_id = models.CharField(max_length=50, unique=True)
    department = models.ForeignKey('academic.Department', on_delete=models.PROTECT, related_name='students', null=True, blank=True)
    domain = models.ForeignKey('academic.Domain', on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    sub_domain = models.ForeignKey('academic.SubDomain', on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    academic_level = models.ForeignKey('academic.AcademicLevel', on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    level = models.CharField(max_length=20) # Keep for compatibility
    
    def __str__(self):
        return f"{self.student_id} - {self.user.get_full_name()}"

class TeacherProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile')
    teacher_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    department = models.ForeignKey('academic.Department', on_delete=models.PROTECT, related_name='teachers')
    
    def __str__(self):
        return f"Teacher: {self.user.get_full_name()}"

class HODProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='hod_profile')
    department = models.OneToOneField('academic.Department', on_delete=models.SET_NULL, null=True, blank=True, related_name='department_hod_profile')
    subject = models.OneToOneField('academic.Subject', on_delete=models.SET_NULL, null=True, blank=True, related_name='subject_hod_profile')
    
    def __str__(self):
        assigned_to = "Unassigned"
        if self.department:
            assigned_to = f"Dept: {self.department.name}"
        elif self.subject:
            assigned_to = f"Subj: {self.subject.name}"
        return f"HOD: {self.user.get_full_name()} ({assigned_to})"
