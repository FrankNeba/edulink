from rest_framework import serializers
from .models import Note, Announcement, Syllabus, Assignment

class NoteSerializer(serializers.ModelSerializer):
    teacher_name = serializers.ReadOnlyField(source='teacher.get_full_name')
    subject_name = serializers.ReadOnlyField(source='subject.name')
    subject_code = serializers.ReadOnlyField(source='subject.code')
    subject_level = serializers.ReadOnlyField(source='subject.level')

    class Meta:
        model = Note
        fields = ('id', 'title', 'subject', 'subject_name', 'subject_code', 'subject_level',
                  'teacher', 'teacher_name', 'file', 'uploaded_at')
        read_only_fields = ('teacher',)

class SyllabusSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.ReadOnlyField(source='uploaded_by.get_full_name')
    subject_name = serializers.ReadOnlyField(source='subject.name')
    subject_code = serializers.ReadOnlyField(source='subject.code')
    subject_level = serializers.ReadOnlyField(source='subject.level')
    is_latest = serializers.SerializerMethodField()

    class Meta:
        model = Syllabus
        fields = ('id', 'title', 'subject', 'subject_name', 'subject_code', 'subject_level',
                  'uploaded_by', 'uploaded_by_name', 'file', 'description', 'uploaded_at', 'is_latest')
        read_only_fields = ('uploaded_by',)

    def get_is_latest(self, obj):
        # True if this is the most recently uploaded syllabus for this subject
        latest = Syllabus.objects.filter(subject=obj.subject).order_by('-uploaded_at').first()
        return latest is not None and latest.id == obj.id

class AnnouncementSerializer(serializers.ModelSerializer):
    author_name     = serializers.ReadOnlyField(source='author.get_full_name')
    subject_name    = serializers.ReadOnlyField(source='subject.name')
    department_name = serializers.ReadOnlyField(source='department.name')
    domain_name     = serializers.ReadOnlyField(source='domain.name')
    sub_domain_name = serializers.ReadOnlyField(source='sub_domain.name')

    class Meta:
        model = Announcement
        fields = (
            'id', 'title', 'content', 'level',
            'subject',    'subject_name',
            'department', 'department_name',
            'domain',     'domain_name',
            'sub_domain', 'sub_domain_name',
            'target_class',
            'author', 'author_name', 'created_at',
        )
        read_only_fields = ('author',)
class AssignmentSerializer(serializers.ModelSerializer):
    teacher_name = serializers.ReadOnlyField(source='teacher.get_full_name')
    subject_name = serializers.ReadOnlyField(source='subject.name')
    
    class Meta:
        model = Assignment
        fields = ('id', 'title', 'description', 'subject', 'subject_name', 'teacher', 'teacher_name', 'file', 'due_date', 'created_at')
        read_only_fields = ('teacher',)
