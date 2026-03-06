from django.db import models
from apps.academic.models import Subject, Department, Domain, SubDomain
from apps.accounts.models import User

class Note(models.Model):
    title = models.CharField(max_length=255)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='notes')
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_notes')
    file = models.FileField(upload_to='notes/pdf/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.title} - {self.subject.code}"

class Syllabus(models.Model):
    """
    A curriculum / syllabus document uploaded for a specific subject instance.
    Multiple syllabi may exist per subject; the most recently uploaded is considered 'latest'.
    """
    title = models.CharField(max_length=255)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='syllabi')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_syllabi')
    file = models.FileField(upload_to='syllabi/')
    description = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-uploaded_at']
        verbose_name_plural = 'Syllabi'
    
    def __str__(self):
        return f"{self.title} — {self.subject.name}"

class Announcement(models.Model):
    class Level(models.TextChoices):
        SCHOOL     = 'SCHOOL',      'School-wide'
        DOMAIN     = 'DOMAIN',      'Domain-level'
        SUBDOMAIN  = 'SUBDOMAIN',   'Sub-domain level'
        CLASS      = 'CLASS',       'Class / Level'
        SUBJECT    = 'SUBJECT',     'Subject-level'

    title   = models.CharField(max_length=255)
    content = models.TextField()
    level   = models.CharField(max_length=20, choices=Level.choices)

    # FK targets — only the relevant one will be set
    subject    = models.ForeignKey(Subject,    on_delete=models.CASCADE, null=True, blank=True, related_name='announcements')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, null=True, blank=True, related_name='announcements')
    domain     = models.ForeignKey(Domain,     on_delete=models.CASCADE, null=True, blank=True, related_name='announcements')
    sub_domain = models.ForeignKey(SubDomain,  on_delete=models.CASCADE, null=True, blank=True, related_name='announcements')
    target_class = models.CharField(max_length=50, null=True, blank=True,
                                    help_text="e.g. 'Form 4', 'Upper Sixth'")

    author     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='announcements')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class CurriculumTopic(models.Model):
    subject     = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='curriculum_topics')
    title       = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order       = models.PositiveIntegerField(default=0)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.subject.code} - {self.title}"

class Assignment(models.Model):
    title       = models.CharField(max_length=255)
    description = models.TextField()
    subject     = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='assignments')
    teacher     = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assignments')
    file        = models.FileField(upload_to='assignments/', null=True, blank=True)
    due_date    = models.DateTimeField()
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
