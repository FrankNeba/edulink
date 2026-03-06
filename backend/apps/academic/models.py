from django.db import models

class Domain(models.Model):
    name = models.CharField(max_length=100, unique=True) # General, Vocational
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class SubDomain(models.Model):
    domain = models.ForeignKey(Domain, on_delete=models.CASCADE, related_name='sub_domains')
    name = models.CharField(max_length=100) # Arts, Science, Commercial, Technical
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('domain', 'name')

    def __str__(self):
        return f"{self.domain.name} - {self.name}"

class Department(models.Model):
    TYPE_CHOICES = [
        ('CORE', 'Core Department (Science, Arts, etc.)'),
        ('SUBJECT', 'Subject Department (Biology, Chemistry, etc.)'),
    ]
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True) # e.g., SCI, ART, TEC, COM
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='CORE')
    description = models.TextField(blank=True)
    # Section Dean / Head of Section instead of HOD
    dean = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_sections', limit_choices_to={'role': 'VICE_PRINCIPAL'})
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class AcademicLevel(models.Model):
    name = models.CharField(max_length=50) # Form 1, Form 2, etc.
    domain = models.ForeignKey(Domain, on_delete=models.CASCADE, related_name='academic_levels')
    sub_domain = models.ForeignKey(SubDomain, on_delete=models.SET_NULL, null=True, blank=True, related_name='academic_levels')
    description = models.TextField(blank=True)
    class_master = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='mentored_classes', limit_choices_to={'role': 'TEACHER'})


    class Meta:
        unique_together = ('name', 'domain', 'sub_domain')
        ordering = ['domain', 'sub_domain', 'name']

    def __str__(self):
        sd = f" - {self.sub_domain.name}" if self.sub_domain else ""
        return f"{self.name} ({self.domain.name}{sd})"

class BaseSubject(models.Model):
    name = models.CharField(max_length=200, unique=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='base_subjects')
    domain = models.ForeignKey(Domain, on_delete=models.SET_NULL, null=True, blank=True, related_name='base_subjects')
    sub_domain = models.ForeignKey(SubDomain, on_delete=models.SET_NULL, null=True, blank=True, related_name='base_subjects')
    description = models.TextField(blank=True)
    hod = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_base_subjects', limit_choices_to={'role': 'HOD'})

    def __str__(self):
        return self.name

class Subject(models.Model):
    base_subject = models.ForeignKey(BaseSubject, on_delete=models.CASCADE, related_name='instances', null=True, blank=True)
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='subjects')
    academic_level = models.ForeignKey(AcademicLevel, on_delete=models.CASCADE, related_name='subjects', null=True, blank=True)
    level = models.CharField(max_length=20) # Keep for compatibility during migration
    domain = models.ForeignKey(Domain, on_delete=models.SET_NULL, null=True, blank=True, related_name='subjects')
    sub_domain = models.ForeignKey(SubDomain, on_delete=models.SET_NULL, null=True, blank=True, related_name='subjects')
    
    hod = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_subjects_hod', limit_choices_to={'role': 'HOD'})
    teachers = models.ManyToManyField('accounts.User', related_name='assigned_subjects', blank=True, limit_choices_to={'role': 'TEACHER'})
    students = models.ManyToManyField('accounts.User', related_name='registered_subjects', blank=True, limit_choices_to={'role': 'STUDENT'})

    def __str__(self):
        return f"{self.code} - {self.name} ({self.level})"
