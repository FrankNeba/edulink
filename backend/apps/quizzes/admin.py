from django.contrib import admin
from .models import Quiz, Question, Choice, QuizAttempt

class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 4

class QuestionInline(admin.StackedInline):
    model = Question
    extra = 1

@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('title', 'subject', 'teacher', 'start_time', 'duration')
    list_filter = ('subject', 'teacher')
    search_fields = ('title',)
    inlines = [QuestionInline]

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('text', 'quiz', 'points', 'order')
    list_filter = ('quiz',)
    inlines = [ChoiceInline]

@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ('student', 'quiz', 'score', 'is_submitted', 'end_time')
    list_filter = ('quiz', 'is_submitted')
    search_fields = ('student__email', 'quiz__title')
