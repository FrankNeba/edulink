from django.contrib import admin
from .models import Domain, SubDomain, AcademicLevel, Department, BaseSubject, Subject

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'type', 'dean', 'created_at')
    list_filter = ('type',)
    search_fields = ('name', 'code')

@admin.register(BaseSubject)
class BaseSubjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'department', 'hod')
    list_filter = ('department',)
    search_fields = ('name',)
    autocomplete_fields = ('hod',)

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'department', 'level', 'academic_level', 'hod')
    list_filter = ('level', 'department', 'academic_level')
    search_fields = ('name', 'code')
    autocomplete_fields = ('hod', 'teachers', 'students')

@admin.register(Domain)
class DomainAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(SubDomain)
class SubDomainAdmin(admin.ModelAdmin):
    list_display = ('name', 'domain')
    list_filter = ('domain',)

@admin.register(AcademicLevel)
class AcademicLevelAdmin(admin.ModelAdmin):
    list_display = ('name', 'domain', 'sub_domain')
    list_filter = ('domain', 'sub_domain')
