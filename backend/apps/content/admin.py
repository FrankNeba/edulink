from django.contrib import admin
from .models import Note, Announcement

@admin.register(Note)
class NoteAdmin(admin.ModelAdmin):
    list_display = ('title', 'subject', 'teacher', 'uploaded_at')
    list_filter = ('subject', 'teacher')
    search_fields = ('title', 'subject__name')

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'level', 'author', 'created_at')
    list_filter = ('level', 'created_at')
    search_fields = ('title', 'content')
