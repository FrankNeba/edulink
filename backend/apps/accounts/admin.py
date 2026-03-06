from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, StudentProfile, TeacherProfile, HODProfile

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'phone')}),
        ('Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)

@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('student_id', 'user', 'department', 'level')
    search_fields = ('student_id', 'user__email', 'user__first_name')
    list_filter = ('department', 'level')

@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'department')
    search_fields = ('user__email', 'user__first_name')
    list_filter = ('department',)

@admin.register(HODProfile)
class HODProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'department', 'subject')
    search_fields = ('user__email', 'user__first_name')
