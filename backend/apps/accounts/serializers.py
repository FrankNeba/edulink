from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import StudentProfile, TeacherProfile, HODProfile
from apps.academic.models import Department

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role', 'phone', 'first_login')
        read_only_fields = ('role', 'first_login')

class StudentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    department_name = serializers.ReadOnlyField(source='department.name')
    domain_name = serializers.ReadOnlyField(source='domain.name')
    sub_domain_name = serializers.ReadOnlyField(source='sub_domain.name')
    registered_subjects = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = ('id', 'user', 'student_id', 'department', 'department_name', 'domain', 'domain_name', 'sub_domain', 'sub_domain_name', 'level', 'registered_subjects')
    
    def get_registered_subjects(self, obj):
        from apps.academic.serializers import SubjectSerializer
        return SubjectSerializer(obj.user.registered_subjects.all(), many=True).data

class TeacherProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    department_name = serializers.ReadOnlyField(source='department.name')

    class Meta:
        model = TeacherProfile
        fields = ('id', 'user', 'department', 'department_name')

class HODProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    department_name = serializers.ReadOnlyField(source='department.name')
    subject_name = serializers.ReadOnlyField(source='subject.name')

    class Meta:
        model = HODProfile
        fields = ('id', 'user', 'department', 'department_name', 'subject', 'subject_name')

class StudentCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    department_id = serializers.IntegerField(required=False, allow_null=True)
    domain_id = serializers.IntegerField(required=False, allow_null=True)
    sub_domain_id = serializers.IntegerField(required=False, allow_null=True)
    academic_level_id = serializers.IntegerField(required=False, allow_null=True)
    level = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    phone = serializers.CharField(max_length=15, required=False, allow_blank=True)

class TeacherCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    department_id = serializers.IntegerField()
    phone = serializers.CharField(max_length=15, required=False)

class HODCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    department_id = serializers.IntegerField(required=False, allow_null=True)
    subject_id = serializers.IntegerField(required=False, allow_null=True)
    phone = serializers.CharField(max_length=15, required=False)
