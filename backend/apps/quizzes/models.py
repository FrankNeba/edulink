from django.db import models
from apps.academic.models import Subject
from apps.accounts.models import User

class Quiz(models.Model):
    title = models.CharField(max_length=255)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='quizzes')
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_quizzes', limit_choices_to={'role': 'TEACHER'})
    
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    deadline = models.DateTimeField(null=True, blank=True, help_text="Last date/time for students to attempt")
    duration = models.IntegerField(help_text="Duration in minutes")
    
    is_extracted = models.BooleanField(default=False)
    raw_file = models.FileField(upload_to='quizzes/raw/', null=True, blank=True, help_text="PDF or DOCX source file")
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Question(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    image = models.ImageField(upload_to='quizzes/questions/', null=True, blank=True)
    points = models.IntegerField(default=1)
    order = models.IntegerField(default=0)

    def __str__(self):
        return f"Question {self.order} for {self.quiz.title}"

class Choice(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='choices')
    text = models.TextField(blank=True, default='')
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return self.text

class QuizAttempt(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_attempts', limit_choices_to={'role': 'STUDENT'})
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    score = models.IntegerField(default=0)
    
    is_submitted = models.BooleanField(default=False)
    auto_submitted = models.BooleanField(default=False) # e.g., if exited fullscreen
    can_retake = models.BooleanField(default=False) # Teacher can set this to True to allow retake

    class Meta:
        unique_together = ('student', 'quiz')

    def __str__(self):
        return f"{self.student.email} - {self.quiz.title}"

class AttemptAnswer(models.Model):
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_choice = models.ForeignKey(Choice, on_delete=models.CASCADE)
    is_correct = models.BooleanField(default=False)

    class Meta:
        unique_together = ('attempt', 'question')
