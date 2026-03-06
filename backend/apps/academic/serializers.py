from rest_framework import serializers
from apps.accounts.serializers import UserSerializer
from .models import Domain, SubDomain, Department, Subject, BaseSubject, AcademicLevel

class DomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = Domain
        fields = '__all__'

class AcademicLevelSerializer(serializers.ModelSerializer):
    domain_name = serializers.ReadOnlyField(source='domain.name')
    sub_domain_name = serializers.ReadOnlyField(source='sub_domain.name')
    class_master_data = UserSerializer(source='class_master', read_only=True)
    student_count = serializers.SerializerMethodField()
    students_data = serializers.SerializerMethodField()

    class Meta:
        model = AcademicLevel
        fields = '__all__'

    def get_student_count(self, obj):
        return obj.students.count()

    def get_students_data(self, obj):
        from apps.accounts.serializers import StudentProfileSerializer
        return StudentProfileSerializer(obj.students.all(), many=True).data

class SubDomainSerializer(serializers.ModelSerializer):
    domain_name = serializers.ReadOnlyField(source='domain.name')
    class Meta:
        model = SubDomain
        fields = '__all__'

class DepartmentSerializer(serializers.ModelSerializer):
    dean_data = UserSerializer(source='dean', read_only=True)
    class Meta:
        model = Department
        fields = '__all__'

class BaseSubjectSerializer(serializers.ModelSerializer):
    domain_data = DomainSerializer(source='domain', read_only=True)
    sub_domain_data = SubDomainSerializer(source='sub_domain', read_only=True)
    department_name = serializers.ReadOnlyField(source='department.name')
    hod_data = UserSerializer(source='hod', read_only=True)

    class Meta:
        model = BaseSubject
        fields = '__all__'

class SubjectSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')
    teachers_data = UserSerializer(source='teachers', many=True, read_only=True)
    base_subject_name = serializers.ReadOnlyField(source='base_subject.name')
    domain_data = DomainSerializer(source='domain', read_only=True)
    sub_domain_data = SubDomainSerializer(source='sub_domain', read_only=True)
    hod_data = UserSerializer(source='hod', read_only=True)
    student_count = serializers.SerializerMethodField()
    students_data = serializers.SerializerMethodField()

    class Meta:
        model = Subject
        fields = (
            'id', 'name', 'code', 'department', 'department_name', 
            'academic_level', 'level', 'domain', 'domain_data', 'sub_domain', 'sub_domain_data', 
            'teachers', 'teachers_data', 'students', 'student_count', 'students_data',
            'hod', 'hod_data', 'base_subject', 'base_subject_name'
        )
        read_only_fields = ('students',)

    def get_student_count(self, obj):
        return obj.students.count()

    def get_students_data(self, obj):
        # Only include detailed student data for staff roles to avoid large payloads for students
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.role in ['PRINCIPAL', 'VICE_PRINCIPAL', 'HOD', 'TEACHER']:
            from apps.accounts.models import StudentProfile
            result = []
            for user in obj.students.all().select_related().order_by('last_name', 'first_name'):
                profile = StudentProfile.objects.filter(user=user).first()
                result.append({
                    'id': user.id,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email,
                    'student_id': profile.student_id if profile else '',
                    'level': profile.level if profile else '',
                    'domain_name': profile.domain.name if (profile and profile.domain) else '',
                })
            return result
        return []
